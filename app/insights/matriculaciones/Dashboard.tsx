"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";
import { matriculacionesPorAño, historicoPre2020 } from "../../lib/insights/matriculaciones-data";
import type { YearData } from "../../lib/insights/matriculaciones-data";
import { provinciasPorMatriculaciones } from "../../lib/insights/provincias-data";
import { topModelos, topMarcas, topMarcasPorAño } from "../../lib/insights/marcas-data";
import { dgtPorAño, dgtPorAñoCompleto, dgtPorAñoTipos, TIPO_LABELS, dgtHistoricoPre2020, dgtUsadosAnual } from "../../lib/insights/dgt-bev-phev-data";
import { anfacPorAño, anfacHistoricoPre2020 } from "../../lib/insights/anfac-data";
import type { TipoVehiculo } from "../../lib/insights/dgt-bev-phev-data";
import { getDgtMarcas, getDgtModelos, getDgtProvincias, dgtAñosDisponibles } from "../../lib/insights/dgt-marcas-provincias-data";
import { useInsights } from "../../insights/InsightsContext";
import type { Fuente } from "../../insights/InsightsContext";

// ─────────────────────────────────────────────────────────────────────────────
// PRE-COMPUTED ANALYTICS (module level — runs once)
// ─────────────────────────────────────────────────────────────────────────────

const REAL = matriculacionesPorAño.filter(
  (y) => y.meses.some((m) => m.bev + m.phev > 0)
);

const ANNUAL = REAL.map((y) => {
  const bev  = y.meses.reduce((s, m) => s + m.bev,  0);
  const phev = y.meses.reduce((s, m) => s + m.phev, 0);
  return { año: y.año, bev, phev, total: bev + phev };
});

// Separate confirmed full years from partial
const FULL_ANNUAL = ANNUAL.filter((a) => {
  const yd = matriculacionesPorAño.find((y) => y.año === a.año);
  return !yd?.parcial;
});

const FIRST      = FULL_ANNUAL[0];                              // 2020
const LAST_FULL  = FULL_ANNUAL[FULL_ANNUAL.length - 1];         // 2025
const LAST       = ANNUAL[ANNUAL.length - 1];                   // 2026 (parcial)
const IS_LAST_PARTIAL = !!matriculacionesPorAño.find((y) => y.año === LAST.año)?.parcial;
const N_YRS      = LAST_FULL.año - FIRST.año;                   // 5

// YoY only between full years (avoids misleading partial-vs-full comparison)
const YOY = FULL_ANNUAL.slice(1).map((curr, i) => {
  const prev = FULL_ANNUAL[i];
  return {
    año:      curr.año,
    bevYoy:   +((curr.bev  - prev.bev)  / prev.bev  * 100).toFixed(1),
    phevYoy:  +((curr.phev - prev.phev) / prev.phev * 100).toFixed(1),
    totalYoy: +((curr.total - prev.total) / prev.total * 100).toFixed(1),
  };
});

const CAGR_TOTAL = +((Math.pow(LAST_FULL.total / FIRST.total, 1 / N_YRS) - 1) * 100).toFixed(1);
const CAGR_BEV   = +((Math.pow(LAST_FULL.bev   / FIRST.bev,   1 / N_YRS) - 1) * 100).toFixed(1);

const TOTAL_ACUM = ANNUAL.reduce((s, y) => s + y.total, 0); // incluye 2026 parcial

const ALL_MONTHLY = REAL.flatMap((y) =>
  y.meses.map((m) => ({ ...m, año: y.año, label: `${m.mes} ${y.año}` }))
);

const PEAK_MONTH = ALL_MONTHLY.reduce((best, m) =>
  m.bev + m.phev > best.bev + best.phev ? m : best
);

const LAST_MONTH = ALL_MONTHLY[ALL_MONTHLY.length - 1]; // last available data point


// BEV share by year (only full years — partial year skews the metric)
const BEV_SHARE = FULL_ANNUAL.map((y) => ({
  año: y.año,
  share: +((y.bev / y.total) * 100).toFixed(1),
}));

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Quarterly data
const QUARTERS = [
  { label: "Q1", months: [0, 1, 2] },
  { label: "Q2", months: [3, 4, 5] },
  { label: "Q3", months: [6, 7, 8] },
  { label: "Q4", months: [9, 10, 11] },
];

const QUARTERLY = REAL.map((y) =>
  QUARTERS.map((q) => ({
    label: `${q.label} ${y.año}`,
    total: q.months.reduce((s, mi) => {
      const m = y.meses[mi];
      return m ? s + m.bev + m.phev : s;
    }, 0),
    bev: q.months.reduce((s, mi) => {
      const m = y.meses[mi];
      return m ? s + m.bev : s;
    }, 0),
    phev: q.months.reduce((s, mi) => {
      const m = y.meses[mi];
      return m ? s + m.phev : s;
    }, 0),
    año: y.año,
    q: q.label,
  }))
);


// Projections (annual, 2027–2028) — base: último año completo 2025
const PROJ = [
  { año: 2027, conservador: Math.round(LAST_FULL.total * 1.25), base: Math.round(LAST_FULL.total * 1.32), agresivo: Math.round(LAST_FULL.total * 1.42) },
  { año: 2028, conservador: Math.round(LAST_FULL.total * 1.25 * 1.20), base: Math.round(LAST_FULL.total * 1.32 * 1.30), agresivo: Math.round(LAST_FULL.total * 1.42 * 1.40) },
];

// Province total
const PROV_TOTAL = provinciasPorMatriculaciones.reduce((s, p) => s + p.total, 0);

// ─── Corredores principales ────────────────────────────────────────────────
// Provincias a lo largo de cada corredor + datos estimados de infraestructura
// IMD: Intensidad Media Diaria (veh/día, tramo más cargado). Fuente: DGT / MITMA.
// Carg/100km: puntos de carga públicos estimados. Fuente: MITMA IDAE.

const CORREDOR_DEF: {
  nombre: string; alias: string; km: number;
  provincias: string[]; cargP100: number; imd: number;
  critico: string; color: string;
}[] = [
  { nombre: "A-2 · Madrid – Barcelona",   alias: "A-2",  km: 621,  provincias: ["Madrid","Guadalajara","Zaragoza","Lleida","Barcelona"],                 cargP100: 8.5, imd: 35000, critico: "Calatayud–Lleida",       color: "#38bdf8" },
  { nombre: "AP-7 · Mediterráneo",         alias: "AP-7", km: 1100, provincias: ["Barcelona","Tarragona","Castellón","Valencia","Alicante","Murcia","Almería","Málaga","Cádiz"], cargP100: 4.8, imd: 38000, critico: "Almería–Málaga",          color: "#a78bfa" },
  { nombre: "A-4 · Madrid – Sevilla",      alias: "A-4",  km: 636,  provincias: ["Madrid","Ciudad Real","Jaén","Córdoba","Sevilla"],                     cargP100: 5.1, imd: 25000, critico: "La Carolina–Bailén",      color: "#fb923c" },
  { nombre: "A-3 · Madrid – Valencia",     alias: "A-3",  km: 352,  provincias: ["Madrid","Cuenca","Valencia"],                                          cargP100: 7.9, imd: 22000, critico: "Minglanilla–Utiel",        color: "#34d399" },
  { nombre: "A-1 · Madrid – Bilbao",       alias: "A-1",  km: 474,  provincias: ["Madrid","Segovia","Burgos","Álava","Vizcaya"],                          cargP100: 5.6, imd: 28000, critico: "Aranda–Miranda de Ebro",  color: "#fbbf24" },
  { nombre: "A-6 · Madrid – A Coruña",     alias: "A-6",  km: 600,  provincias: ["Madrid","Salamanca","Lugo","A Coruña"],                                cargP100: 3.9, imd: 18000, critico: "Lugo–Pedrafita",           color: "#f87171" },
  { nombre: "A-8 · Cantábrico",            alias: "A-8",  km: 440,  provincias: ["Asturias","Cantabria","Vizcaya","Gipuzkoa"],                           cargP100: 4.2, imd: 15000, critico: "Llanes–San Vicente",       color: "#06b6d4" },
];

// EVs acumulados a lo largo de cada corredor (suma de provincias incluidas)
const CORREDORES = CORREDOR_DEF.map((c) => {
  const evs = c.provincias.reduce((s, prov) => {
    const found = provinciasPorMatriculaciones.find((p) => p.nombre === prov);
    return s + (found?.total ?? 0);
  }, 0);
  const coverageScore = c.cargP100 >= 7 ? "alta" : c.cargP100 >= 5 ? "media" : "baja";
  return { ...c, evs, coverageScore };
});

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  bev:    "#38bdf8",   // sky blue
  phev:   "#fb923c",   // vivid orange — high contrast vs blue
  green:  "#34d399",
  amber:  "#fbbf24",
  red:    "#f87171",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.42)",
  dim:    "rgba(241,245,249,0.20)",
  grid:   "rgba(255,255,255,0.045)",
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function hex2rgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

function linGrad(hex: string, dir: "v"|"h" = "v", a0 = 0.4, a1 = 0.04) {
  const rgb = hex2rgb(hex);
  const [x1,y1,x2,y2] = dir === "v" ? [0,0,0,1] : [1,0,0,0];
  return new echarts.graphic.LinearGradient(x1, y1, x2, y2, [
    { offset: 0, color: `rgba(${rgb},${a0})` },
    { offset: 1, color: `rgba(${rgb},${a1})` },
  ]);
}

function fmtN(n: number) {
  return n.toLocaleString("es-ES");
}

const TT = {
  backgroundColor: "rgba(5,8,16,0.97)",
  borderColor: C.border,
  textStyle: { color: C.text, fontSize: 12 },
  extraCssText: "box-shadow:0 8px 32px rgba(0,0,0,0.7);border-radius:10px;padding:10px 14px;",
};

// ─────────────────────────────────────────────────────────────────────────────
// ECHART WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function EChart({ option, style }: { option: Record<string, any>; style?: React.CSSProperties }) {
  const ref     = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = echarts.init(ref.current, "dark");
    chartRef.current.setOption(option);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chartRef.current?.dispose(); };
  }, []);

  useEffect(() => { chartRef.current?.setOption(option, { notMerge: true }); }, [option]);

  return <div ref={ref} style={{ width: "100%", height: 300, ...style }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: "linear-gradient(180deg,#38bdf8,#8b5cf6)", flexShrink: 0 }} />
        <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.01em" }}>{children}</h2>
      </div>
      {sub && <p style={{ fontSize: 11, color: C.muted, marginTop: 4, marginLeft: 13 }}>{sub}</p>}
    </div>
  );
}

function KPI({ label, value, sub, delta, color, icon, tag }: {
  label: string; value: string; sub?: string; delta?: number;
  color?: string; icon?: string; tag?: string;
}) {
  const glow = color ?? "#38bdf8";
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px 22px", flex: 1, minWidth: 160, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: "50%", background: `${glow}18`, filter: "blur(24px)", pointerEvents: "none" }} />
      <div style={{ minHeight: 72, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {icon && <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 6 }}>{icon}</div>}
        {tag && (
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: glow, textTransform: "uppercase", background: `${glow}18`, borderRadius: 4, padding: "2px 6px", marginBottom: 6, display: "inline-block", alignSelf: "flex-start" }}>
            {tag}
          </span>
        )}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: color ?? C.text, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", margin: "10px 0 8px" }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {delta !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, color: delta >= 0 ? C.green : C.red, background: delta >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", borderRadius: 5, padding: "2px 7px" }}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: C.muted }}>{sub}</span>}
      </div>
    </div>
  );
}

function Toggle({ options, value, onChange }: {
  options: { label: React.ReactNode; value: string; color?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const active = value === o.value;
        const col = o.color ?? "#38bdf8";
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            padding: "5px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
            border: active ? `1px solid ${col}44` : "1px solid transparent",
            background: active ? `${col}18` : "transparent",
            color: active ? col : C.muted, transition: "all 0.15s",
          }}>
            <span style={active ? undefined : { filter: "saturate(0)", opacity: 0.55 }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// AUTO-INSIGHTS RIBBON
// ─────────────────────────────────────────────────────────────────────────────

function InsightCard({ icon, headline, body, color }: { icon: string; headline: string; body: string; color: string }) {
  return (
    <div style={{
      background: `${color}0e`,
      border: `1px solid ${color}30`,
      borderRadius: 14,
      padding: "14px 16px",
      flex: 1,
      minWidth: 200,
    }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4, letterSpacing: "-0.01em" }}>{headline}</p>
      <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NO DATA PLACEHOLDER
// ─────────────────────────────────────────────────────────────────────────────

function NoData({ height = 200, label = "Sin datos para esta fuente" }: { height?: number; label?: string }) {
  return (
    <div style={{
      height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      border: `1px dashed rgba(255,255,255,0.1)`, borderRadius: 12, gap: 8,
    }}>
      <span style={{ fontSize: 22, opacity: 0.3 }}>—</span>
      <span style={{ fontSize: 11, color: "rgba(241,245,249,0.3)", letterSpacing: "0.04em" }}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS FACTORY — same derivations for any data source
// ─────────────────────────────────────────────────────────────────────────────

function computeAnalytics(porAño: YearData[]) {
  const REAL = porAño.filter((y) => y.meses.some((m) => m.bev + m.phev > 0));
  const ANNUAL = REAL.map((y) => {
    const bev  = y.meses.reduce((s, m) => s + m.bev,  0);
    const phev = y.meses.reduce((s, m) => s + m.phev, 0);
    return { año: y.año, bev, phev, total: bev + phev };
  });
  const FULL_ANNUAL = ANNUAL.filter((a) => !porAño.find((y) => y.año === a.año)?.parcial);
  const FIRST     = FULL_ANNUAL[0];
  const LAST_FULL = FULL_ANNUAL[FULL_ANNUAL.length - 1];
  const LAST      = ANNUAL[ANNUAL.length - 1];
  const IS_LAST_PARTIAL = !!porAño.find((y) => y.año === LAST.año)?.parcial;
  const N_YRS = LAST_FULL.año - FIRST.año;
  const YOY = FULL_ANNUAL.slice(1).map((curr, i) => {
    const prev = FULL_ANNUAL[i];
    return {
      año:      curr.año,
      bevYoy:   +((curr.bev   - prev.bev)   / prev.bev   * 100).toFixed(1),
      phevYoy:  +((curr.phev  - prev.phev)  / prev.phev  * 100).toFixed(1),
      totalYoy: +((curr.total - prev.total) / prev.total * 100).toFixed(1),
    };
  });
  const CAGR_TOTAL = +((Math.pow(LAST_FULL.total / FIRST.total, 1 / N_YRS) - 1) * 100).toFixed(1);
  const CAGR_BEV   = +((Math.pow(LAST_FULL.bev   / FIRST.bev,   1 / N_YRS) - 1) * 100).toFixed(1);
  const TOTAL_ACUM = ANNUAL.reduce((s, a) => s + a.total, 0);
  const ALL_MONTHLY = REAL.flatMap((y) =>
    y.meses.map((m) => ({ ...m, año: y.año, label: `${m.mes} ${y.año}` }))
  );
  const PEAK_MONTH = ALL_MONTHLY.reduce((b, m) => m.bev + m.phev > b.bev + b.phev ? m : b);
  const LAST_MONTH = ALL_MONTHLY[ALL_MONTHLY.length - 1];
  const BEV_SHARE  = FULL_ANNUAL.map((a) => ({ año: a.año, share: +((a.bev / a.total) * 100).toFixed(1) }));
  const QUARTERLY  = REAL.map((y) =>
    QUARTERS.map((q) => ({
      label: `${q.label} ${y.año}`,
      total: q.months.reduce((s, mi) => { const m = y.meses[mi]; return m ? s + m.bev + m.phev : s; }, 0),
      bev:   q.months.reduce((s, mi) => { const m = y.meses[mi]; return m ? s + m.bev : s; }, 0),
      phev:  q.months.reduce((s, mi) => { const m = y.meses[mi]; return m ? s + m.phev : s; }, 0),
      año: y.año, q: q.label,
    }))
  );
  const PROJ = [
    { año: 2027, conservador: Math.round(LAST_FULL.total * 1.25), base: Math.round(LAST_FULL.total * 1.32), agresivo: Math.round(LAST_FULL.total * 1.42) },
    { año: 2028, conservador: Math.round(LAST_FULL.total * 1.25 * 1.20), base: Math.round(LAST_FULL.total * 1.32 * 1.30), agresivo: Math.round(LAST_FULL.total * 1.42 * 1.40) },
  ];
  return { REAL, ANNUAL, FULL_ANNUAL, FIRST, LAST_FULL, LAST, IS_LAST_PARTIAL, N_YRS, YOY, CAGR_TOTAL, CAGR_BEV, TOTAL_ACUM, ALL_MONTHLY, PEAK_MONTH, LAST_MONTH, BEV_SHARE, QUARTERLY, PROJ };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();

// "Todos" selecciona estas categorías — "otros" excluido por defecto (tractores, quads, industriales)
const TIPOS_DEFAULT: TipoVehiculo[] = ["turismo","furgoneta","moto_scooter","microcar","camion","autobus"];

const FUENTE_META: Record<Fuente, { label: string; tag: string; color: string; desc: string }> = {
  aedive: { label: "AEDIVE",  tag: "Industria",   color: "#38bdf8", desc: "Todas las categorías · Fuente: AEDIVE Power BI" },
  dgt:    { label: "DGT",     tag: "Microdatos",  color: "#34d399", desc: "Microdatos MATRABA · Todos los vehículos" },
  anfac:  { label: "ANFAC",   tag: "Turismos",    color: "#fb923c", desc: "Solo M1 turismos nuevos · Metodología ANFAC/IDEAUTO" },
};

export function Dashboard() {
  const [filtro, setFiltro] = useState<"ambos"|"bev"|"phev">("ambos");
  const { fuente, countryName } = useInsights();
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculo[]>(TIPOS_DEFAULT);

  const analytics = useMemo(() => {
    let src;
    if (fuente === "anfac") {
      src = anfacPorAño;
    } else if (fuente === "dgt") {
      src = dgtPorAñoTipos(tiposVehiculo);
    } else {
      src = matriculacionesPorAño;
    }
    return computeAnalytics(src);
  }, [fuente, tiposVehiculo]);

  // Shadow module-level constants with source-aware values
  const { REAL, ANNUAL, FULL_ANNUAL, FIRST, LAST_FULL, LAST, IS_LAST_PARTIAL,
          N_YRS, YOY, CAGR_TOTAL, CAGR_BEV, TOTAL_ACUM, ALL_MONTHLY,
          PEAK_MONTH, LAST_MONTH, BEV_SHARE, QUARTERLY, PROJ } = analytics;

  // Pre-2020 historical: AEDIVE desde 2009, DGT/ANFAC desde 2014 (solo para acumulado)
  const historico = fuente === "aedive" ? historicoPre2020
    : fuente === "dgt"   ? dgtHistoricoPre2020
    : fuente === "anfac" ? anfacHistoricoPre2020
    : [];

  const [añoActivo, setAñoActivo] = useState<number | "todos">(LAST_FULL.año);
  const [marcaMixPage, setMarcaMixPage] = useState(0);
  const [heatPage, setHeatPage] = useState(0);
  const [marcaMixYear, setMarcaMixYear] = useState<"todos" | number>("todos");
  const [winW, setWinW] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1280);

  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Reset selected year when source changes; reset tipo filter when leaving DGT
  useEffect(() => {
    setAñoActivo(LAST_FULL.año);
    setHeatPage(0);
    if (fuente !== "dgt") setTiposVehiculo(TIPOS_DEFAULT);
  }, [fuente]);

  // For DGT, include all years from 2014 in the monthly year selector
  const allYearsForSelector: YearData[] = (fuente === "dgt" ? dgtPorAñoCompleto : REAL)
    .filter((y) => y.año >= 2015);  // 2014 excluido (datos incompletos en el dataset)
  const preYears  = allYearsForSelector.filter((y) => y.año < 2021);
  const mainYears = REAL.filter((y) => y.año >= 2021);

  const safeAñoActivo: number | "todos" =
    añoActivo === "todos" ? "todos"
    : allYearsForSelector.some((y) => y.año === añoActivo) ? (añoActivo as number)
    : LAST_FULL.año;
  const añoData = safeAñoActivo === "todos"
    ? (REAL[REAL.length - 1])  // fallback (won't be used in "todos" mode)
    : (allYearsForSelector.find((y) => y.año === safeAñoActivo) ?? REAL[REAL.length - 1]);

  const filteredVal = (row: { bev: number; phev: number; total: number }) =>
    filtro === "bev" ? row.bev : filtro === "phev" ? row.phev : row.total;

  // Color primario según filtro activo: BEV→azul, PHEV→naranja, ambos→verde
  const filtroColor = filtro === "bev" ? C.bev : filtro === "phev" ? C.phev : C.green;
  const filtroColorAlpha = (a: number) => {
    const rgb = filtro === "bev" ? "56,189,248" : filtro === "phev" ? "251,146,60" : "52,211,153";
    return `rgba(${rgb},${a})`;
  };

  // ── Filter-aware KPI calculations ────────────────────────────────────────
  // Para AEDIVE incluir el histórico pre-2020 en el acumulado
  const preAcum = historico.reduce((s, y) =>
    s + (filtro === "bev" ? y.bev : filtro === "phev" ? y.phev : y.bev + y.phev), 0);
  const totalAcum_filtered = ANNUAL.reduce((s, a) => s + filteredVal(a), 0) + preAcum;
  const cagr_filtered = +(
    (Math.pow(filteredVal(LAST_FULL) / filteredVal(FIRST), 1 / N_YRS) - 1) * 100
  ).toFixed(1);
  const peakMonth_filtered = ALL_MONTHLY.reduce((best, m) => {
    const mVal = filtro === "bev" ? m.bev : filtro === "phev" ? m.phev : m.bev + m.phev;
    const bVal = filtro === "bev" ? best.bev : filtro === "phev" ? best.phev : best.bev + best.phev;
    return mVal > bVal ? m : best;
  });
  const yoyFiltered = YOY.map((y) => ({
    año: y.año,
    val: filtro === "bev" ? y.bevYoy : filtro === "phev" ? y.phevYoy : y.totalYoy,
  }));
  const bestYoy_f  = yoyFiltered.reduce((b, y) => y.val > b.val ? y : b);
  const worstYoy_f = yoyFiltered.reduce((w, y) => y.val < w.val ? y : w);
  const lastYoyVal = yoyFiltered[yoyFiltered.length - 1].val;

  // ── DGT: nota "nuevos cayeron pero usados compensaron" ───────────────────
  const dgtUsadosCompensacion = (() => {
    if (fuente !== "dgt") return null;
    // Buscar el año donde nuevos cayeron pero total fue positivo
    const fullUsados = dgtUsadosAnual.filter(d => d.año >= 2020 && d.año < currentYear);
    for (let i = 1; i < fullUsados.length; i++) {
      const cur  = fullUsados[i];
      const prev = fullUsados[i - 1];
      const nuevosCur  = filtro === "bev" ? cur.bev_new   : filtro === "phev" ? cur.phev_new   : cur.bev_new   + cur.phev_new;
      const nuevosPrev = filtro === "bev" ? prev.bev_new  : filtro === "phev" ? prev.phev_new  : prev.bev_new  + prev.phev_new;
      const usadosCur  = filtro === "bev" ? cur.bev_used  : filtro === "phev" ? cur.phev_used  : cur.bev_used  + cur.phev_used;
      const usadosPrev = filtro === "bev" ? prev.bev_used : filtro === "phev" ? prev.phev_used : prev.bev_used + prev.phev_used;
      const totalYoy   = yoyFiltered.find(y => y.año === cur.año)?.val ?? 0;
      const nuevosYoy  = nuevosPrev > 0 ? +((nuevosCur - nuevosPrev) / nuevosPrev * 100).toFixed(1) : 0;
      const usadosYoy  = usadosPrev > 0 ? Math.round((usadosCur - usadosPrev) / usadosPrev * 100) : null;
      if (nuevosYoy < 0 && totalYoy >= 0) {
        return { año: cur.año, nuevosYoy, totalYoy, usadosYoy, usadosCur };
      }
    }
    return null;
  })();

  const GAP = 16;

  // ── Evolución anual + proyección (histórico 2009–2019 AEDIVE + mensual 2020+) ──
  // Q1 YoY: compara Q1 del año parcial vs Q1 del año anterior completo
  // YTD stats for partial year: prev = same months of prior year (for tooltip YoY)
  const ytdStats = (() => {
    if (!IS_LAST_PARTIAL) return null;
    const lastRaw = REAL.find((y) => y.año === LAST.año);
    const prevRaw = REAL.find((y) => y.año === LAST.año - 1);
    if (!lastRaw || !prevRaw) return null;
    const n = lastRaw.meses.length;
    const calc = (meses: typeof lastRaw.meses) =>
      meses.reduce((s, m) => s + (filtro === "bev" ? m.bev : filtro === "phev" ? m.phev : m.bev + m.phev), 0);
    return { prev: calc(prevRaw.meses.slice(0, n)), n, lastMes: lastRaw.meses[n - 1]?.mes ?? "" };
  })();

  const nPre      = historico.length;
  const nFullAnn  = FULL_ANNUAL.length;
  const allHistYears = [
    ...historico.map((h) => String(h.año)),
    ...FULL_ANNUAL.map((a) => String(a.año)),
    ...(IS_LAST_PARTIAL ? [String(LAST.año)] : []),
  ];
  const nPartialSlot = IS_LAST_PARTIAL ? 1 : 0;
  const preVals      = historico.map((h) =>
    filteredVal({ bev: h.bev, phev: h.phev, total: h.bev + h.phev })
  );
  const fullAnnualVals = FULL_ANNUAL.map((a) => filteredVal(a));
  const partialVal     = IS_LAST_PARTIAL ? filteredVal(LAST) : null;

  // Punto estimado 2026 = anualización por estacionalidad histórica
  // Para cada año completo: full_year / ytd_n_meses → promedio de multiplicadores → aplicar al YTD actual
  // est2026Annualized ya es filter-aware (usa filteredVal internamente)
  const est2026Annualized: number | null = (() => {
    if (!IS_LAST_PARTIAL || partialVal === null || !ytdStats) return null;
    const n = ytdStats.n;
    const val = (m: { bev: number; phev: number }) =>
      filtro === "bev" ? m.bev : filtro === "phev" ? m.phev : m.bev + m.phev;
    const multipliers = REAL
      .filter((r) => !r.parcial)
      .map((r) => {
        const ytd  = r.meses.slice(0, n).reduce((s, m) => s + val(m), 0);
        const full = r.meses.reduce((s, m) => s + val(m), 0);
        return ytd > 0 ? full / ytd : null;
      })
      .filter((m): m is number => m !== null);
    if (multipliers.length === 0) return null;
    const avgMult = multipliers.reduce((s, m) => s + m, 0) / multipliers.length;
    return Math.round(partialVal * avgMult);
  })();


  // Year → filtered value for all real data (used for YoY% in tooltip)
  const realValueByYear: Record<number, number> = {};
  historico.forEach((h, i) => { realValueByYear[h.año] = preVals[i]; });
  FULL_ANNUAL.forEach((a, i) => { realValueByYear[a.año] = fullAnnualVals[i]; });
  if (IS_LAST_PARTIAL && partialVal !== null) realValueByYear[LAST.año] = partialVal;

  const forecastOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "item",
      formatter: (p: any) => {
        if (p.value == null) return "";
        const v       = typeof p.value === "number" ? p.value : 0;
        const xIdx    = p.data?.coord != null ? p.data.coord[0] : p.dataIndex;
        const year    = parseInt(allHistYears[xIdx] ?? p.name ?? "0");
        const label   = v >= 1000 ? `${Math.round(v / 1000)}k` : fmtN(v);
        const dot     = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>`;
        // ── YTD actual point ─────────────────────────────────────────────────
        if (p.seriesName === `${LAST.año} YTD` && ytdStats) {
          const pct   = ((v - ytdStats.prev) / ytdStats.prev * 100).toFixed(0);
          const color = +pct >= 0 ? C.green : C.red;
          const sign  = +pct >= 0 ? "+" : "";
          return `<b style="color:${C.text}">${LAST.año} ${ytdStats.lastMes}</b><br/>` +
            `${dot}Actual: <b>${label}</b> <span style="color:${color};font-size:10px">(${sign}${pct}% vs ${ytdStats.lastMes} ${year - 1})</span>`;
        }

        // ── Historical / real lines ───────────────────────────────────────────
        const prev = realValueByYear[year - 1];
        let yoy = "";
        if (prev && prev > 0) {
          const pct   = ((v - prev) / prev * 100).toFixed(0);
          const color = +pct >= 0 ? C.green : C.red;
          const sign  = +pct >= 0 ? "+" : "";
          yoy = ` <span style="color:${color};font-size:10px">(${sign}${pct}% vs ${year - 1})</span>`;
        }
        return `<b style="color:${C.text}">${year}</b><br/>${dot}${p.seriesName}: <b>${label}</b>${yoy}`;
      },
    },
    grid: { top: 20, right: 16, bottom: 36, left: 72 },
    xAxis: {
      type: "category", data: allHistYears,
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted, fontSize: 10, interval: 1 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
    },
    series: [
      // For DGT: single continuous line (same source pre+post 2020).
      // For AEDIVE: keep two separate series (different sources).
      ...(fuente === "dgt" ? [{
        name: "Real",
        type: "line", smooth: true, symbol: "circle", symbolSize: 5,
        data: [...preVals, ...fullAnnualVals, ...Array(nPartialSlot + PROJ.length).fill(null)],
        lineStyle: { color: filtroColor, width: 2.5 },
        itemStyle: { color: filtroColor },
        areaStyle: { color: linGrad(filtroColor) },
        connectNulls: false,
        markPoint: {
          data: [{ type: "max", name: "Máximo" }],
          label: { color: C.text, fontSize: 10, formatter: (p: any) => `${Math.round(p.value / 1000)}k` },
          itemStyle: { color: filtroColor },
        },
      }] : [
        {
          // Historical 2009–2019 — annual totals from AEDIVE
          name: "Histórico (anual)", type: "line", smooth: true, symbol: "circle", symbolSize: 4,
          data: [...preVals, fullAnnualVals[0], ...Array(nFullAnn - 1 + nPartialSlot + PROJ.length).fill(null)],
          lineStyle: { color: "rgba(148,163,184,0.7)", width: 1.5 },
          itemStyle: { color: "rgba(148,163,184,0.7)" },
          areaStyle: { color: "rgba(148,163,184,0.05)" },
          connectNulls: false,
        },
        {
          // Confirmed full years 2020–2025
          name: "Real", type: "line", smooth: true, symbol: "circle", symbolSize: 6,
          data: [...Array(nPre).fill(null), ...fullAnnualVals, ...Array(nPartialSlot + PROJ.length).fill(null)],
          lineStyle: { color: filtroColor, width: 3 },
          itemStyle: { color: filtroColor },
          areaStyle: { color: linGrad(filtroColor) },
          connectNulls: false,
          markPoint: {
            data: [{ type: "max", name: "Máximo" }],
            label: { color: C.text, fontSize: 10, formatter: (p: any) => `${Math.round(p.value / 1000)}k` },
            itemStyle: { color: filtroColor },
          },
        },
      ]),
      // Línea punteada 2025→2026 Est. Capira
      ...(IS_LAST_PARTIAL && est2026Annualized !== null ? [{
        name: "Proyección",
        type: "line",
        smooth: false,
        symbol: "none",
        data: [
          ...Array(nPre + nFullAnn - 1).fill(null),
          fullAnnualVals[nFullAnn - 1],
          est2026Annualized,
        ],
        lineStyle: { color: filtroColor, width: 2, type: "dashed", opacity: 0.6 },
        itemStyle: { color: filtroColor },
        areaStyle: { color: "transparent" },
        tooltip: { show: false },
        silent: true,
      }] : []),
      // 2026 YTD — punto separado con crecimiento Q1 vs Q1 año anterior
      ...(IS_LAST_PARTIAL && partialVal !== null ? [{
        name: `${LAST.año} YTD`,
        type: "scatter",
        symbol: "circle",
        symbolSize: 8,
        data: [...Array(nPre + nFullAnn).fill(null), partialVal],
        itemStyle: { color: filtroColorAlpha(0.55), borderColor: filtroColor, borderWidth: 2 },
        label: { show: false },
      }] : []),
      ...(IS_LAST_PARTIAL && est2026Annualized !== null ? [{
        name: `${LAST.año} Est. Capira`,
        type: "scatter",
        symbol: "circle",
        symbolSize: 9,
        data: [...Array(nPre + nFullAnn).fill(null), est2026Annualized],
        itemStyle: { color: C.green, borderColor: C.green, borderWidth: 2, opacity: 0.85 },
        label: { show: false },
      }] : []),
    ],
  };

  // ── YoY growth bars ──────────────────────────────────────────────────────
  const yoyVals = YOY.map((y) =>
    filtro === "bev" ? y.bevYoy : filtro === "phev" ? y.phevYoy : y.totalYoy
  );

  // YTD YoY: compare partialVal vs same N months of prior year
  const ytdYoyVal = (IS_LAST_PARTIAL && ytdStats && partialVal !== null && ytdStats.prev > 0)
    ? +((partialVal - ytdStats.prev) / ytdStats.prev * 100).toFixed(1)
    : null;

  const yoyLabels = [
    ...YOY.map((y) => String(y.año)),
    ...(ytdYoyVal !== null ? [`${LAST.año} YTD`] : []),
  ];
  const yoyValsAll = [
    ...yoyVals,
    ...(ytdYoyVal !== null ? [ytdYoyVal] : []),
  ];

  const yoyOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const v = Math.round(params[0].value);
        const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params[0].color};margin-right:6px"></span>`;
        return `<b style="color:${C.text}">${params[0].axisValue}</b><br/>${dot}${params[0].seriesName}: <b>${v > 0 ? "+" : ""}${v}%</b>`;
      },
    },
    grid: { top: 32, right: 16, bottom: 36, left: 52 },
    xAxis: {
      type: "category",
      data: yoyLabels,
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => `${v > 0 ? "+" : ""}${Math.round(v)}%` },
    },
    markLine: { silent: true, lineStyle: { color: C.grid, type: "dashed" }, data: [{ yAxis: 0 }] },
    series: [{
      name: "Crecimiento YoY",
      type: "bar",
      data: yoyValsAll.map((v, i) => ({
        value: v,
        itemStyle: {
          // YTD bar: lighter/striped appearance using opacity
          opacity: i === yoyValsAll.length - 1 && ytdYoyVal !== null ? 0.65 : 1,
          color: v >= 0
            ? new echarts.graphic.LinearGradient(0,0,0,1,[
                { offset: 0, color: v > 50 ? C.green : filtroColor },
                { offset: 1, color: v > 50 ? "rgba(52,211,153,0.3)" : filtroColorAlpha(0.3) },
              ])
            : new echarts.graphic.LinearGradient(0,0,0,1,[
                { offset: 0, color: "rgba(248,113,113,0.3)" },
                { offset: 1, color: C.red },
              ]),
          borderRadius: v >= 0 ? [4,4,0,0] : [0,0,4,4],
        },
      })),
      barMaxWidth: 60,
      label: {
        show: true,
        position: "inside",
        align: "center",
        verticalAlign: "middle",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        formatter: (p: Record<string, any>) => {
          const v = Math.round(p.value);
          return `${v > 0 ? "+" : ""}${v}%`;
        },
      },
    }],
  };

  // ── Tendencia mensual ────────────────────────────────────────────────────
  // Color scale for "todos" mode: muted (oldest) → vivid (newest), palette varies by filtro
  // BEV → blues, PHEV → oranges, total → greens
  const yearColor = (i: number, total: number): string => {
    const t = total <= 1 ? 1 : i / (total - 1);
    const alpha = 0.40 + 0.60 * t;
    if (filtro === "bev") {
      // slate-400 → sky-400
      const r = Math.round(148 + (56  - 148) * t);
      const g = Math.round(163 + (189 - 163) * t);
      const b = Math.round(184 + (248 - 184) * t);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    if (filtro === "phev") {
      // stone-400 → orange-400
      const r = Math.round(168 + (251 - 168) * t);
      const g = Math.round(162 + (146 - 162) * t);
      const b = Math.round(148 + (60  - 148) * t);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    // total → emerald scale
    const r = Math.round(148 + (52  - 148) * t);
    const g = Math.round(163 + (211 - 163) * t);
    const b = Math.round(184 + (153 - 184) * t);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const trendOpt: Record<string, any> = safeAñoActivo === "todos"
    ? {
        // All years overlaid on the same Jan–Dec axis
        backgroundColor: "transparent",
        legend: { show: false },
        tooltip: {
          ...TT, trigger: "axis",
          formatter: (params: Record<string, any>[]) =>
            `<b style="color:${C.text}">${params[0].axisValue}</b><br/>` +
            params.filter(p => p.value != null)
              .sort((a, b) => b.value - a.value)
              .map((p) => `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${p.color};margin-right:5px"></span>${p.seriesName}: <b>${fmtN(p.value)}</b>`)
              .join("<br/>"),
        },
        grid: { top: 12, right: 52, bottom: 32, left: 60 },
        xAxis: {
          type: "category", data: MESES,
          axisLine: { lineStyle: { color: C.grid } },
          axisLabel: { color: C.muted, fontSize: 10 },
          axisTick: { show: false },
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
          axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
        },
        series: allYearsForSelector.map((y, i) => {
          const color = yearColor(i, allYearsForSelector.length);
          const isLast = i === allYearsForSelector.length - 1;
          return {
            name: String(y.año),
            type: "line", smooth: true, symbol: "none", symbolSize: 4,
            data: MESES.map((mes) => {
              const m = y.meses.find((mm) => mm.mes === mes);
              if (!m) return null;
              return filtro === "bev" ? m.bev : filtro === "phev" ? m.phev : m.bev + m.phev;
            }),
            lineStyle: { color, width: isLast ? 2.5 : 1.5 },
            itemStyle: { color },
            connectNulls: false,
            endLabel: {
              show: true,
              formatter: String(y.año),
              color,
              backgroundColor: "rgba(15,23,42,0.88)",
              borderColor: color,
              borderWidth: 1,
              borderRadius: 3,
              padding: [2, 5],
              fontSize: 9,
              fontWeight: isLast ? 700 : 600,
            },
            labelLayout: { moveOverlap: "shiftY" },
          };
        }),
      }
    : {
        // Single year
        backgroundColor: "transparent",
        tooltip: {
          ...TT, trigger: "axis",
          formatter: (params: Record<string, any>[]) =>
            `<b style="color:${C.text}">${params[0].axisValue}</b><br/>` +
            params.map((p) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${fmtN(p.value)}</b>`).join("<br/>"),
        },
        grid: { top: 12, right: 16, bottom: 32, left: 60 },
        xAxis: {
          type: "category",
          data: añoData.meses.map((m) => m.mes),
          axisLine: { lineStyle: { color: C.grid } },
          axisLabel: { color: C.muted, fontSize: 10 },
          axisTick: { show: false },
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
          axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
        },
        series: [
          ...(filtro !== "phev" ? [{
            name: "BEV", type: "line", smooth: true, symbol: "circle", symbolSize: 5,
            data: añoData.meses.map((m) => m.bev),
            lineStyle: { color: C.bev, width: 2.5 },
            itemStyle: { color: C.bev },
            areaStyle: { color: linGrad(C.bev) },
          }] : []),
          ...(filtro !== "bev" ? [{
            name: "PHEV", type: "line", smooth: true, symbol: "circle", symbolSize: 5,
            data: añoData.meses.map((m) => m.phev),
            lineStyle: { color: C.phev, width: 2.5 },
            itemStyle: { color: C.phev },
            areaStyle: { color: linGrad(C.phev) },
          }] : []),
        ],
      };

  // ── Mix evolution (stacked 100%) ─────────────────────────────────────────
  const mixOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const seriesColor = (name: string) => name === "BEV" ? C.bev : C.phev;
        return `<b style="color:${C.text}">${params[0].axisValue}</b><br/>` +
          params.map((p) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${seriesColor(p.seriesName)};margin-right:6px"></span>${p.seriesName}: <b>${p.value.toFixed(1)}%</b>`).join("<br/>");
      },
    },
    grid: { top: 12, right: 16, bottom: 32, left: 52 },
    xAxis: {
      type: "category",
      data: [
        ...FULL_ANNUAL.map((a) => String(a.año)),
        ...(IS_LAST_PARTIAL ? [`${LAST.año} YTD`] : []),
      ],
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted, fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value", max: 100,
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => `${v}%` },
    },
    series: [
      {
        name: "BEV", type: "bar", stack: "s",
        data: [...FULL_ANNUAL, ...(IS_LAST_PARTIAL ? [LAST] : [])].map((a) => +((a.bev / a.total) * 100).toFixed(1)),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.bev},{offset:1,color:"rgba(56,189,248,0.6)"}]) },
        barMaxWidth: 64,
        label: { show: true, position: "inside", color: "#fff", fontSize: 11, fontWeight: 700, formatter: (p: Record<string, any>) => `${p.value}%` },
      },
      {
        name: "PHEV", type: "bar", stack: "s",
        data: [...FULL_ANNUAL, ...(IS_LAST_PARTIAL ? [LAST] : [])].map((a) => +((a.phev / a.total) * 100).toFixed(1)),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.phev},{offset:1,color:"rgba(251,146,60,0.6)"}]), borderRadius: [4,4,0,0] },
        barMaxWidth: 64,
        label: { show: true, position: "inside", color: "#fff", fontSize: 11, fontWeight: 700, formatter: (p: Record<string, any>) => `${p.value}%` },
      },
    ],
  };

  // ── Monthly heatmap ──────────────────────────────────────────────────────
  // For DGT use the full dataset (2014+); for others use REAL (which is source-aware)
  const heatSource: YearData[] = fuente === "dgt" ? dgtPorAñoCompleto : REAL;
  const HEAT_PAGE_SIZE = 5;
  const heatTotalPages = Math.ceil(heatSource.length / HEAT_PAGE_SIZE);
  // page 0 = most recent years; page N = oldest years
  const heatSafeePage = Math.min(heatPage, heatTotalPages - 1);
  const heatYears = heatSource.slice(
    Math.max(0, heatSource.length - HEAT_PAGE_SIZE * (heatSafeePage + 1)),
    heatSource.length - HEAT_PAGE_SIZE * heatSafeePage || undefined,
  );
  const heatData = heatYears.flatMap((y, yi) =>
    y.meses.map((m, mi) => [mi, yi, filtro === "bev" ? m.bev : filtro === "phev" ? m.phev : m.bev + m.phev])
  );
  const heatMax = Math.max(...heatData.map((d) => d[2]));
  const heatLabelSize = winW < 480 ? 7 : winW < 768 ? 9 : winW < 1024 ? 10 : 11;

  const heatmapOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT,
      formatter: (p: Record<string, any>) =>
        `<b>${MESES[p.value[0]]} ${heatYears[p.value[1]].año}</b><br/>Matriculaciones: <b>${fmtN(p.value[2])}</b>`,
    },
    grid: { top: 12, right: 16, bottom: 32, left: 60 },
    xAxis: {
      type: "category",
      data: MESES,
      axisLabel: { color: C.muted, fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitArea: { show: true, areaStyle: { color: ["transparent","rgba(255,255,255,0.015)"] } },
    },
    yAxis: {
      type: "category",
      data: heatYears.map((y) => String(y.año)),
      axisLabel: { color: C.muted, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitArea: { show: true, areaStyle: { color: ["transparent","rgba(255,255,255,0.015)"] } },
    },
    visualMap: {
      min: 0, max: heatMax,
      calculable: false, show: false,
      inRange: { color: filtro === "phev"
        ? [filtroColorAlpha(0.06), "#9a3412", C.phev, "#fed7aa"]
        : filtro === "bev"
          ? [filtroColorAlpha(0.06), "#1e40af", C.bev, "#7dd3fc"]
          : [filtroColorAlpha(0.06), "#065f46", C.green, "#6ee7b7"] },
    },
    series: [{
      type: "heatmap",
      data: heatData.map((d) => ({
        value: d,
        label: {
          color: (() => { const t = heatMax > 0 ? d[2] / heatMax : 0; return t > 0.68 ? "rgba(15,23,42,0.85)" : C.text; })(),
        },
      })),
      label: {
        show: true,
        formatter: (p: Record<string, any>) => {
          const v = p.value[2];
          if (!v) return "";
          return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        },
        fontSize: heatLabelSize,
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: filtroColor } },
    }],
  };

  // ── YoY rolling 12 meses ────────────────────────────────────────────────
  // Últimos 12 meses disponibles vs mismo mes del año anterior
  const rolling12 = ALL_MONTHLY.slice(-12).map((m) => {
    const prevYear = REAL.find((y) => y.año === m.año - 1);
    const prevMes  = prevYear?.meses.find((pm) => pm.mes === m.mes);
    const curr = filtro === "bev" ? m.bev : filtro === "phev" ? m.phev : m.bev + m.phev;
    const prev = prevMes ? (filtro === "bev" ? prevMes.bev : filtro === "phev" ? prevMes.phev : prevMes.bev + prevMes.phev) : 0;
    return {
      label: `${m.mes} ${m.año}`,
      año: m.año,
      yoy: prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : 0,
    };
  });

  const monthlyYoyOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const v = Math.round(params[0].value);
        const label = params[0].axisValue;
        const [mes, año] = label.split(" ");
        const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params[0].color};margin-right:6px"></span>`;
        return `<b style="color:${C.text}">${label}</b><br/>${dot}vs ${mes} ${+año - 1}: <b>${v > 0 ? "+" : ""}${v}%</b>`;
      },
    },
    grid: { top: 32, right: 16, bottom: 40, left: 56 },
    xAxis: {
      type: "category",
      data: rolling12.map((m) => m.label),
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted, fontSize: 9, rotate: 30 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => `${v > 0 ? "+" : ""}${Math.round(v)}%` },
    },
    series: [{
      name: "YoY rolling 12m", type: "bar",
      data: rolling12.map((m) => ({
        value: m.yoy,
        itemStyle: {
          color: m.yoy >= 0
            ? new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:filtroColor},{offset:1,color:filtroColorAlpha(0.35)}])
              : new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:"rgba(248,113,113,0.3)"},{offset:1,color:C.red}]),
          borderRadius: m.yoy >= 0 ? [4,4,0,0] : [0,0,4,4],
        },
      })),
      barMaxWidth: 32,
      label: {
        show: true, position: "top", distance: 4,
        color: "#fff", fontSize: 10, fontWeight: 700,
        formatter: (p: Record<string, any>) => {
          const v = Math.round(p.value);
          return `${v > 0 ? "+" : ""}${v}%`;
        },
      },
    }],
  };

  // ── Momentum trimestral ──────────────────────────────────────────────────
  const qLabels = ["Q1","Q2","Q3","Q4"];
  const qColors = [C.bev, C.phev, C.green, C.amber];

  const momentumOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) =>
        `<b style="color:${C.text}">${params[0].axisValue}</b><br/>` +
        params.map((p) => {
          const c = qColors[qLabels.indexOf(p.seriesName)] ?? C.bev;
          return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:6px"></span>${p.seriesName}: <b>${fmtN(p.value)}</b>`;
        }).join("<br/>"),
    },
    legend: { show: true, top: 4, right: 8, textStyle: { color: C.muted, fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
    grid: { top: 40, right: 16, bottom: 32, left: 60 },
    xAxis: {
      type: "category",
      data: REAL.map((y) => String(y.año)),
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted, fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
    },
    series: qLabels.map((q, qi) => ({
      name: q, type: "bar",
      data: QUARTERLY.map((yearQ) => {
        const qData = yearQ[qi];
        return filtro === "bev" ? qData.bev : filtro === "phev" ? qData.phev : qData.total;
      }),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0,0,0,1,[
          { offset: 0, color: qColors[qi] },
          { offset: 1, color: `${qColors[qi]}55` },
        ]),
        borderRadius: [3,3,0,0],
      },
      barMaxWidth: 28,
    })),
  };

  // ── Top provincias ───────────────────────────────────────────────────────
  // AEDIVE: hardcoded acumulado 2019-2025
  // DGT: from annual JSON summary (2020-present)
  // ANFAC: no data
  const dgtProvs = fuente === "dgt" ? getDgtProvincias("todos") : null;
  const top10 = fuente === "dgt" && dgtProvs
    ? dgtProvs.slice(0, 10).map((p) => ({
        nombre: p.provincia,
        total: filtro === "bev" ? p.bev : filtro === "phev" ? p.phev : p.total,
      }))
    : fuente === "aedive"
    ? [...provinciasPorMatriculaciones].sort((a,b)=>b.total-a.total).slice(0,10).map((p) => ({ nombre: p.nombre, total: p.total }))
    : null;

  const provOpt: Record<string, any> | null = top10 ? {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (p: Record<string, any>[]) => {
        const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p[0].color};margin-right:6px"></span>`;
        return `<b style="color:${C.text}">${p[0].name}</b><br/>${dot}Matriculaciones: <b>${fmtN(p[0].value)}</b>`;
      },
    },
    grid: { top: 8, right: 80, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
    },
    yAxis: {
      type: "category",
      data: [...top10].reverse().map((p) => p.nombre),
      axisLabel: { color: C.muted, fontSize: 11 },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [{
      type: "bar", barMaxWidth: 18,
      data: [...top10].reverse().map((p) => ({
        value: p.total,
        itemStyle: { color: linGrad(C.bev, "h", 1, 0.2), borderRadius: [0,4,4,0] },
      })),
      label: { show: true, position: "right", color: C.muted, fontSize: 10, formatter: (p: Record<string, any>) => fmtN(p.value) },
    }],
  } : null;

  // ── Top modelos ──────────────────────────────────────────────────────────
  // AEDIVE: hardcoded top models
  // DGT: from annual JSON summary
  // ANFAC: no data
  const dgtModelos = fuente === "dgt"
    ? (filtro === "phev"
        ? getDgtModelos("todos", "phev")
        : filtro === "bev"
        ? getDgtModelos("todos", "bev")
        : [...getDgtModelos("todos", "bev").map((m) => ({ ...m, tipo: "BEV" as const })),
           ...getDgtModelos("todos", "phev").map((m) => ({ ...m, tipo: "PHEV" as const }))]
            .sort((a, b) => b.n - a.n).slice(0, 15))
    : null;

  const filteredModelos: { label: string; value: number; color: string }[] | null =
    fuente === "aedive" ? (
      filtro === "bev"  ? topModelos.filter((m) => m.tipo === "BEV") :
      filtro === "phev" ? topModelos.filter((m) => m.tipo === "PHEV") :
      topModelos
    ).map((m) => ({ label: `${m.marca} ${m.modelo}`, value: m.unidades, color: m.tipo === "BEV" ? C.bev : C.phev }))
    : fuente === "dgt" && dgtModelos
    ? (dgtModelos as (typeof dgtModelos[number] & { tipo?: "BEV"|"PHEV" })[]).map((m) => ({
        label: `${m.marca} ${m.modelo}`,
        value: m.n,
        color: (m as any).tipo === "PHEV" ? C.phev : C.bev,
      }))
    : null;

  const modelosOpt: Record<string, any> | null = filteredModelos ? {
    backgroundColor: "transparent",
    tooltip: { ...TT, trigger: "axis", formatter: (p: Record<string, any>[]) => {
      const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p[0].color};margin-right:6px"></span>`;
      return `<b style="color:${C.text}">${p[0].name}</b><br/>${dot}Unidades: <b>${fmtN(p[0].value)}</b>`;
    }},
    grid: { top: 8, right: 80, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
    },
    yAxis: {
      type: "category",
      data: [...filteredModelos].reverse().map((m) => m.label),
      axisLabel: { color: C.muted, fontSize: 10 },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [{
      type: "bar", barMaxWidth: 18,
      data: [...filteredModelos].reverse().map((m) => ({
        value: m.value,
        itemStyle: { color: linGrad(m.color, "h", 1, 0.15), borderRadius: [0,4,4,0] },
      })),
      label: { show: true, position: "right", color: C.muted, fontSize: 10, formatter: (p: Record<string, any>) => fmtN(p.value) },
    }],
  } : null;

  // ── Marcas ───────────────────────────────────────────────────────────────
  // AEDIVE: hardcoded | DGT: from summary | ANFAC: no data
  const rawMarcas = fuente === "dgt"
    ? getDgtMarcas("todos", tiposVehiculo.length > 0 ? tiposVehiculo : undefined)
    : fuente === "aedive"
    ? topMarcas
    : null;

  const marcasFiltradas = rawMarcas
    ? rawMarcas
        .map((m) => ({ ...m, total: filtro === "bev" ? m.bev : filtro === "phev" ? m.phev : m.bev + m.phev }))
        .filter((m) => m.total > 0)
        .sort((a,b) => b.total - a.total)
    : null;

  const marcasOpt: Record<string, any> | null = marcasFiltradas ? {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) =>
        `<b style="color:${C.text}">${params[0].axisValue}</b><br/>` +
        params.filter((p) => p.value).map((p) => {
          const c = p.seriesName === "BEV" ? C.bev : p.seriesName === "PHEV" ? C.phev : C.bev;
          return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:6px"></span>${p.seriesName}: <b>${fmtN(p.value)}</b>`;
        }).join("<br/>"),
    },
    grid: { top: 12, right: 16, bottom: 32, left: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: marcasFiltradas.map((m) => m.marca),
      axisLabel: { color: C.muted, fontSize: 11 },
      axisLine: { lineStyle: { color: C.grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
    },
    series: [
      ...(filtro !== "phev" ? [{
        name: "BEV", type: "bar", stack: "s",
        data: marcasFiltradas.map((m) => m.bev > 0 ? m.bev : null),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.bev},{offset:1,color:"rgba(56,189,248,0.45)"}]) },
        barMaxWidth: 44,
      }] : []),
      ...(filtro !== "bev" ? [{
        name: "PHEV", type: "bar", stack: "s",
        data: marcasFiltradas.map((m) => m.phev > 0 ? m.phev : null),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.phev},{offset:1,color:"rgba(251,146,60,0.45)"}]), borderRadius: [4,4,0,0] },
        barMaxWidth: 44,
      }] : []),
    ],
  } : null;

  // ── Mix tecnológico por marca (100% stacked horizontal) ─────────────────
  // AEDIVE: hardcoded | DGT: from summary | ANFAC: no data
  const MIX_MARCAS_PAGE_SIZE = 8;

  // Year selector: AEDIVE uses topMarcasPorAño years, DGT uses dgtAñosDisponibles
  const mixYearsAvailable: ("todos" | number)[] = fuente === "dgt"
    ? ["todos", ...dgtAñosDisponibles]
    : fuente === "aedive"
    ? ["todos", ...topMarcasPorAño.map((e) => e.año)]
    : ["todos"];

  const mixMarcasAllData = (() => {
    if (fuente === "anfac") return [];
    if (fuente === "dgt") {
      const year = marcaMixYear === "todos" ? "todos" : Number(marcaMixYear);
      return getDgtMarcas(year, tiposVehiculo.length > 0 ? tiposVehiculo : undefined).map((m) => {
        const total = m.bev + m.phev;
        return {
          marca: m.marca,
          bevPct: +((m.bev / total) * 100).toFixed(1),
          phevPct: +((m.phev / total) * 100).toFixed(1),
          bev: m.bev, phev: m.phev, total,
        };
      });
    }
    // AEDIVE
    const yearEntries = marcaMixYear === "todos"
      ? topMarcasPorAño
      : topMarcasPorAño.filter((e) => e.año === marcaMixYear);
    const agg: Record<string, { bev: number; phev: number }> = {};
    for (const entry of yearEntries) {
      for (const m of entry.marcas) {
        if (!agg[m.marca]) agg[m.marca] = { bev: 0, phev: 0 };
        agg[m.marca].bev  += m.bev;
        agg[m.marca].phev += m.phev;
      }
    }
    return Object.entries(agg)
      .filter(([, v]) => v.bev + v.phev > 0)
      .sort(([, a], [, b]) => (b.bev + b.phev) - (a.bev + a.phev))
      .map(([marca, v]) => {
        const total = v.bev + v.phev;
        return {
          marca,
          bevPct: +((v.bev / total) * 100).toFixed(1),
          phevPct: +((v.phev / total) * 100).toFixed(1),
          bev: v.bev, phev: v.phev, total,
        };
      });
  })();

  const mixMarcasTotalPages = Math.ceil(mixMarcasAllData.length / MIX_MARCAS_PAGE_SIZE);
  const mixMarcasData = mixMarcasAllData.slice(
    marcaMixPage * MIX_MARCAS_PAGE_SIZE,
    (marcaMixPage + 1) * MIX_MARCAS_PAGE_SIZE,
  );

  const mixMarcasOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const marca = params[0]?.axisValue;
        const d = mixMarcasData.find((m) => m.marca === marca);
        if (!d) return "";
        const totLabel = d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : fmtN(d.total);
        return `<b style="color:${C.text}">${marca}</b><br/>` +
          `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.bev};margin-right:6px"></span>BEV: <b>${d.bevPct}%</b> (${fmtN(d.bev)})<br/>` +
          `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.phev};margin-right:6px"></span>PHEV: <b>${d.phevPct}%</b> (${fmtN(d.phev)})<br/>` +
          `Total: <b>${totLabel}</b>`;
      },
    },
    grid: { top: 8, right: 52, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: "value", max: 100,
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => `${v}%` },
    },
    yAxis: {
      type: "category",
      data: mixMarcasData.map((m) => m.marca),
      axisLabel: { color: C.muted, fontSize: 11 },
      axisLine: { lineStyle: { color: C.grid } },
      axisTick: { show: false },
      inverse: true,
    },
    series: [
      {
        name: "BEV", type: "bar", stack: "s",
        data: mixMarcasData.map((m) => m.bevPct),
        itemStyle: { color: C.bev, borderRadius: [3, 0, 0, 3] },
        barMaxWidth: 22,
        label: { show: true, position: "inside", formatter: (p: any) => p.value >= 10 ? `${p.value}%` : "", color: "#0f172a", fontSize: 9, fontWeight: 700 },
      },
      {
        name: "PHEV", type: "bar", stack: "s",
        data: mixMarcasData.map((m) => m.phevPct),
        itemStyle: { color: C.phev, borderRadius: [0, 3, 3, 0] },
        barMaxWidth: 22,
        label: { show: true, position: "inside", formatter: (p: any) => p.value >= 10 ? `${p.value}%` : "", color: "#0f172a", fontSize: 9, fontWeight: 700 },
      },
      {
        // Dummy series at stack end — carries total label outside bar
        type: "bar", stack: "s", silent: true,
        data: mixMarcasData.map((m) => ({ value: 0, label: { formatter: () => m.total >= 1000 ? `${(m.total / 1000).toFixed(0)}k` : String(m.total) } })),
        itemStyle: { color: "transparent" },
        barMaxWidth: 22,
        label: { show: true, position: "right", color: C.muted, fontSize: 10, fontWeight: 600 },
        tooltip: { show: false },
      },
    ],
  };

  // Auto-insights
  const bevShareLast  = BEV_SHARE[BEV_SHARE.length - 1].share;
  const bevShareFirst = BEV_SHARE[0].share;
  const bevTrend = bevShareLast > bevShareFirst ? "ganando" : "perdiendo";
  const lastFullYoy   = YOY[YOY.length - 1]; // last full-year YoY (2024→2025)

  // Filter-aware insight labels
  const filtroLabel = filtro === "bev" ? "BEV" : filtro === "phev" ? "PHEV" : "EV";
  const filtroFirstVal = filteredVal(FIRST);
  const filtroLastFullVal = filteredVal(LAST_FULL);

  // Card 3 — mix insight adapts to filter
  const mixHeadline = filtro === "bev"
    ? `BEV: ${bevShareLast}% del mix en ${LAST_FULL.año}`
    : filtro === "phev"
    ? `PHEV: ${(100 - bevShareLast).toFixed(1)}% del mix en ${LAST_FULL.año}`
    : `Los PHEVs están ${bevTrend} terreno al BEV`;
  const mixBody = filtro === "bev"
    ? `El share BEV era ${bevShareFirst}% en ${FIRST.año}. En ${LAST_FULL.año} es ${bevShareLast}%. ${bevShareLast > bevShareFirst ? "Ganando cuota." : "Perdiendo cuota frente al PHEV."}`
    : filtro === "phev"
    ? `El share PHEV era ${(100 - bevShareFirst).toFixed(1)}% en ${FIRST.año}. En ${LAST_FULL.año} es ${(100 - bevShareLast).toFixed(1)}%. PHEV crece más rápido en volumen.`
    : `En ${FIRST.año} los BEV eran el ${bevShareFirst}% del mix. En ${LAST_FULL.año} son el ${bevShareLast}%. Los PHEVs crecen más rápido.`;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Título */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "18px 24px 0" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>
          Matriculaciones de vehículos en {countryName}
          <span style={{ fontSize: 16, fontWeight: 500, color: "rgba(244,244,245,0.35)", marginLeft: 10 }}>(Todas)</span>
        </h1>
      </div>

      {/* Controls */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(5,8,16,0.88)", backdropFilter: "blur(16px)", position: "sticky", top: 52, zIndex: 40 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 50, gap: 16, flexWrap: "wrap", paddingTop: 6, paddingBottom: 6 }}>
            {/* Left: Tec. — todo en un solo grupo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "rgba(241,245,249,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Tec.:</span>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, gap: 2 }}>
                {/* Total — deshabilitado */}
                <button disabled title="Próximamente" style={{
                  padding: "5px 14px", borderRadius: 7, cursor: "not-allowed", fontSize: 12, fontWeight: 700,
                  border: "1px solid transparent", background: "transparent",
                  color: "rgba(241,245,249,0.45)", transition: "all 0.15s",
                }}>
                  Total
                </button>
                {/* No Enchufable — deshabilitado */}
                <button disabled title="Próximamente" style={{
                  padding: "5px 14px", borderRadius: 7, cursor: "not-allowed", fontSize: 12, fontWeight: 700,
                  border: "1px solid transparent", background: "transparent",
                  color: "rgba(241,245,249,0.45)", transition: "all 0.15s",
                }}>
                  No Enchufable
                </button>
                {/* Separador visual */}
                <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "4px 2px" }} />
                {/* BEV+PHEV / BEV / PHEV — activos */}
                {[
                  { value: "ambos", label: <><span style={{ color: C.bev }}>BEV</span><span style={{ color: C.text }}> + </span><span style={{ color: C.phev }}>PHEV</span></> },
                  { value: "bev",   label: "BEV",  color: C.bev  },
                  { value: "phev",  label: "PHEV", color: C.phev },
                ].map((opt) => {
                  const active = filtro === opt.value;
                  const col = (opt as any).color;
                  return (
                    <button key={opt.value} onClick={() => setFiltro(opt.value as "ambos"|"bev"|"phev")} style={{
                      padding: "5px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                      border: active ? `1px solid ${col ? col + "44" : "rgba(255,255,255,0.2)"}` : "1px solid transparent",
                      background: active ? (col ? `${col}18` : "rgba(255,255,255,0.08)") : "transparent",
                      color: active ? (col ?? C.text) : "rgba(241,245,249,0.55)",
                      transition: "all 0.15s",
                    }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Tipo vehículo — solo DGT */}
            {fuente === "dgt" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "rgba(241,245,249,0.6)" }}>Tipo:</span>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {(["turismo","furgoneta","moto_scooter","microcar","camion","autobus","otros"] as TipoVehiculo[]).map((t) => {
                    const active = tiposVehiculo.includes(t);
                    const col = t === "turismo" ? "#f472b6"
                      : t === "furgoneta"    ? "#a78bfa"
                      : t === "moto_scooter" ? "#a3e635"
                      : t === "microcar"     ? "#e879f9"
                      : t === "camion"       ? "#fbbf24"
                      : t === "autobus"      ? "#f87171"
                      : "#94a3b8";
                    const isOtros = t === "otros";
                    const otrosExcluido = isOtros && !active;
                    return (
                      <button key={t}
                        title={isOtros ? "Incluye: tractores (T*), quads/ATV (*02, *03), carretillas industriales (MAA), y cualquier categoría EU no clasificada en los grupos anteriores" : undefined}
                        onClick={() => setTiposVehiculo((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}
                        style={{
                          padding: "3px 11px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700,
                          border: active ? `1px solid ${col}55` : "1px solid transparent",
                          background: active ? `${col}18` : "rgba(255,255,255,0.04)",
                          color: active ? col : "rgba(241,245,249,0.25)",
                          textDecoration: otrosExcluido ? "line-through" : "none",
                          transition: "all 0.15s",
                        }}>
                        {TIPO_LABELS[t]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 56px" }}>

        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: GAP, marginBottom: GAP, flexWrap: "wrap" }}>
          <KPI
            label={IS_LAST_PARTIAL ? `Total EV ${LAST.año} (${ytdStats?.lastMes ?? LAST_MONTH.mes} YTD)` : `Total EV ${LAST.año}`}
            value={fmtN(filteredVal(LAST))}
            delta={lastYoyVal}
            color={filtroColor}
            icon="⚡"
            tag={IS_LAST_PARTIAL ? "Parcial" : undefined}
          />
          <KPI label="Acumulado histórico" value={fmtN(totalAcum_filtered)} color={C.text} icon="📦" sub={`→ ${LAST_MONTH.mes}/${LAST_MONTH.año}`} />
          <KPI label={`CAGR ${FIRST.año}–${LAST_FULL.año}`} value={`${cagr_filtered}%`} color={C.green} icon="📈" sub="tasa anual compuesta" />
          <KPI label="Mayor crecimiento" value={`+${bestYoy_f.val}%`} color={C.green} icon="🚀" tag="Récord" sub={`año ${bestYoy_f.año}`} />
          <KPI
            label="Pico mensual"
            value={fmtN(filtro === "bev" ? peakMonth_filtered.bev : filtro === "phev" ? peakMonth_filtered.phev : peakMonth_filtered.bev + peakMonth_filtered.phev)}
            color={C.amber} icon="🏆"
            sub={peakMonth_filtered.label}
          />
        </div>

        {/* ── Auto-insights ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: GAP, marginBottom: GAP, flexWrap: "wrap" }}>
          <InsightCard
            icon="🚀"
            headline={`+${lastYoyVal}% ${filtroLabel} en ${LAST_FULL.año}: ${bestYoy_f.año === LAST_FULL.año ? "el mayor salto histórico" : `mejor año: ${bestYoy_f.año} (+${bestYoy_f.val}%)`}`}
            body={`Peor año: ${worstYoy_f.año} (${worstYoy_f.val}%). ${filtro === "ambos" ? `BEV +${lastFullYoy.bevYoy}% y PHEV +${lastFullYoy.phevYoy}% en ${LAST_FULL.año}.` : `${filtroLabel} creció ${lastYoyVal}% vs ${LAST_FULL.año - 1}.`}`}
            color={C.green}
          />
          <InsightCard
            icon="📐"
            headline={`CAGR ${cagr_filtered}% ${filtroLabel}: ${N_YRS} años de crecimiento`}
            body={`De ${fmtN(filtroFirstVal)} uds en ${FIRST.año} a ${fmtN(filtroLastFullVal)} en ${LAST_FULL.año}. ${filtro === "ambos" ? `CAGR BEV: ${CAGR_BEV}%.` : `x${(filtroLastFullVal / filtroFirstVal).toFixed(1)} en ${N_YRS} años.`}`}
            color={filtroColor}
          />
          {fuente === "dgt" ? (() => {
            const uv = (e: typeof dgtUsadosAnual[0]) =>
              filtro === "bev" ? e.bev_used : filtro === "phev" ? e.phev_used : e.bev_used + e.phev_used;
            const ut = (e: typeof dgtUsadosAnual[0]) =>
              filtro === "bev" ? e.bev_new + e.bev_used : filtro === "phev" ? e.phev_new + e.phev_used : e.bev_new + e.phev_new + e.bev_used + e.phev_used;
            const fullYears = dgtUsadosAnual.filter(d => d.año < currentYear);
            const last  = fullYears[fullYears.length - 1];
            const prev  = fullYears[fullYears.length - 2];
            const ref22 = fullYears.find(d => d.año === 2022);
            if (!last || !prev) return null;
            const lastUsados = uv(last);
            const prevUsados = uv(prev);
            const yoy = prevUsados > 0 ? Math.round((lastUsados - prevUsados) / prevUsados * 100) : 0;
            const pct = ut(last) > 0 ? ((lastUsados / ut(last)) * 100).toFixed(1) : "0";
            const ref22val = ref22 ? uv(ref22) : null;
            const since22 = ref22val && ref22val > 0 ? Math.round((lastUsados - ref22val) / ref22val * 100) : null;
            const filtroLabel = filtro === "bev" ? "BEV" : filtro === "phev" ? "PHEV" : "EV";
            return (
              <InsightCard
                icon="🚢"
                headline={`Usados importados ${filtroLabel}: +${yoy}% en ${last.año} — ${fmtN(lastUsados)} vehículos`}
                body={`${ref22val && since22 ? `De ${fmtN(ref22val)} en 2022 a ${fmtN(lastUsados)} en ${last.año} (+${since22}% en 3 años). ` : ""}Representan el ${pct}% del total DGT ${last.año}. El mercado de segunda mano importada se acelera.`}
                color={C.amber}
              />
            );
          })() : (
            <InsightCard
              icon="⚖️"
              headline={mixHeadline}
              body={mixBody}
              color={filtroColor}
            />
          )}
          {(() => {
            const provs = fuente === "dgt" && dgtProvs
              ? dgtProvs.map((p) => ({ nombre: p.provincia, total: filtro === "bev" ? p.bev : filtro === "phev" ? p.phev : p.total }))
              : fuente === "aedive"
              ? provinciasPorMatriculaciones.map((p) => ({ nombre: p.nombre, total: p.total }))
              : null;
            if (!provs || provs.length === 0) return null;
            const total = provs.reduce((s, p) => s + p.total, 0);
            const top   = [...provs].sort((a, b) => b.total - a.total);
            const top1pct  = ((top[0].total / total) * 100).toFixed(0);
            const top3pct  = ((top.slice(0,3).reduce((s,p)=>s+p.total,0) / total) * 100).toFixed(0);
            return (
              <InsightCard
                icon="🗺️"
                headline={`${top[0].nombre} concentra el ${top1pct}% del mercado`}
                body={`Top: ${top.slice(0,3).map(p=>p.nombre).join(", ")}. Las 3 primeras suman el ${top3pct}% del total nacional${filtro !== "ambos" ? ` (${filtro.toUpperCase()})` : ""}.`}
                color={C.amber}
              />
            );
          })()}
        </div>

        {/* ── Evolución + proyección + YoY ────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, marginBottom: GAP }}>
          <Card>
            <SectionTitle sub="Histórico matriculaciones anuales">
              Evolución del mercado
            </SectionTitle>
            <EChart option={forecastOpt} style={{ height: 270 }} />
            <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              {(() => {
                const firstYear = fuente === "dgt"
                  ? (historico[0]?.año ?? REAL[0]?.año ?? 2014)
                  : (nPre > 0 ? historico[0]?.año : REAL[0]?.año) ?? 2014;
                const items: { label: string; color: string; circle?: boolean }[] = [
                  ...(fuente !== "dgt" && nPre > 0
                    ? [{ label: `${historico[0]?.año}–${historico[historico.length-1]?.año} (anual)`, color: "rgba(148,163,184,0.7)" }]
                    : []),
                  { label: `${firstYear}–${LAST_FULL.año}`, color: filtroColor },
                  ...(IS_LAST_PARTIAL ? [
                    { label: `${LAST.año} YTD`, color: "rgba(56,189,248,0.85)", circle: true },
                    { label: `${LAST.año} Est. Capira*`, color: C.green, circle: true },
                  ] : []),
                ];
                return items.map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {l.circle
                      ? <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, border: `2px solid ${l.color === C.green ? C.green : filtroColor}` }} />
                      : <div style={{ width: 16, height: 2, borderRadius: 1, background: l.color }} />
                    }
                    <span style={{ fontSize: 10, color: C.muted }}>{l.label}</span>
                  </div>
                ));
              })()}
            </div>
            {IS_LAST_PARTIAL && <p style={{ fontSize: 10, color: C.dim, marginTop: 6 }}>* Proyección anual basada en estacionalidad histórica (no es dato oficial)</p>}
          </Card>
          <Card>
            <SectionTitle sub="Crecimiento porcentual año a año">
              Crecimiento interanual (YoY)
            </SectionTitle>
            {ytdYoyVal !== null && (
              <p style={{ fontSize: 10, color: C.dim, marginBottom: 6, marginTop: -4 }}>
                {LAST.año} YTD: se comparan los {ytdStats!.n} meses disponibles de {LAST.año} vs el mismo período de {LAST.año - 1}
              </p>
            )}
            <EChart option={yoyOpt} style={{ height: 270 }} />
            {worstYoy_f.val < 0 && (
              <p style={{ fontSize: 11, color: C.red, marginTop: 8, marginLeft: 4 }}>
                ⚠️ {worstYoy_f.año}: único año con retroceso ({worstYoy_f.val}%) — posible efecto fin de subsidios
              </p>
            )}
            {dgtUsadosCompensacion && (
              <p style={{ fontSize: 11, color: C.amber, marginTop: 6, marginLeft: 4 }}>
                💡 {dgtUsadosCompensacion.año}: nuevas matriculaciones cayeron ({dgtUsadosCompensacion.nuevosYoy}%) pero los usados importados subieron{dgtUsadosCompensacion.usadosYoy !== null ? ` +${dgtUsadosCompensacion.usadosYoy}%` : ""} ({fmtN(dgtUsadosCompensacion.usadosCur)} vehículos), compensando y dejando el total en {dgtUsadosCompensacion.totalYoy >= 0 ? "+" : ""}{dgtUsadosCompensacion.totalYoy}%
              </p>
            )}
          </Card>
        </div>

        {/* ── Tendencia mensual + YoY mensual ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, marginBottom: GAP }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 8, flexWrap: "wrap" }}>
              <SectionTitle sub="Matriculaciones por mes">Evolución mensual</SectionTitle>
              <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, flexWrap: "wrap" }}>
                {/* "Todos" button */}
                <button onClick={() => setAñoActivo("todos")} style={{
                  padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700,
                  background: safeAñoActivo === "todos" ? "linear-gradient(135deg,#38bdf8,#8b5cf6)" : "transparent",
                  color: safeAñoActivo === "todos" ? "#fff" : C.muted, transition: "all 0.15s",
                }}>
                  Todos
                </button>
                {/* Dropdown for years < 2021 */}
                {preYears.length > 0 && (
                  <select
                    value={typeof safeAñoActivo === "number" && safeAñoActivo < 2021 ? safeAñoActivo : ""}
                    onChange={(e) => { if (e.target.value) setAñoActivo(parseInt(e.target.value)); }}
                    style={{
                      padding: "4px 6px", borderRadius: 6, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 700,
                      background: typeof safeAñoActivo === "number" && safeAñoActivo < 2021
                        ? "linear-gradient(135deg,#38bdf8,#8b5cf6)"
                        : "rgba(255,255,255,0.06)",
                      color: typeof safeAñoActivo === "number" && safeAñoActivo < 2021 ? "#fff" : C.muted,
                      outline: "none", appearance: "none", WebkitAppearance: "none",
                    }}
                  >
                    <option value="" style={{ background: "#1e293b" }}>
                      {typeof safeAñoActivo === "number" && safeAñoActivo < 2021 ? safeAñoActivo : "‹ 2021"}
                    </option>
                    {preYears.map((y) => (
                      <option key={y.año} value={y.año} style={{ background: "#1e293b" }}>{y.año}</option>
                    ))}
                  </select>
                )}
                {/* Buttons for years >= 2021 */}
                {mainYears.map((y) => {
                  const active = safeAñoActivo === y.año;
                  const partial = !!y.parcial;
                  return (
                    <button key={y.año} onClick={() => setAñoActivo(y.año)} style={{
                      padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 700,
                      background: active ? "linear-gradient(135deg,#38bdf8,#8b5cf6)" : "transparent",
                      color: active ? "#fff" : C.muted, transition: "all 0.15s",
                    }}>
                      {y.año}{partial ? "*" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            <EChart option={trendOpt} style={{ height: 248 }} />
          </Card>
          <Card>
            <SectionTitle sub="Variación mensual respecto al año anterior">
              Aceleración mes a mes
            </SectionTitle>
            <EChart option={monthlyYoyOpt} style={{ height: 270 }} />
          </Card>
        </div>

        {/* ── Heatmap + momentum trimestral ───────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, marginBottom: GAP }}>
          <Card style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <SectionTitle sub="Volumen mensual por año — detectá patrones de estacionalidad">
                Heatmap estacional
              </SectionTitle>
              {heatTotalPages > 1 && (
                <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3 }}>
                  <button
                    onClick={() => setHeatPage((p) => Math.min(p + 1, heatTotalPages - 1))}
                    disabled={heatSafeePage >= heatTotalPages - 1}
                    style={{
                      padding: "3px 9px", borderRadius: 5, border: "none", cursor: heatSafeePage >= heatTotalPages - 1 ? "default" : "pointer",
                      fontSize: 13, fontWeight: 700, lineHeight: 1,
                      background: "transparent",
                      color: heatSafeePage >= heatTotalPages - 1 ? C.dim : C.muted,
                    }}
                  >‹</button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.muted, padding: "4px 6px", alignSelf: "center" }}>
                    {heatYears[0]?.año}–{heatYears[heatYears.length - 1]?.año}
                  </span>
                  <button
                    onClick={() => setHeatPage((p) => Math.max(p - 1, 0))}
                    disabled={heatSafeePage === 0}
                    style={{
                      padding: "3px 9px", borderRadius: 5, border: "none", cursor: heatSafeePage === 0 ? "default" : "pointer",
                      fontSize: 13, fontWeight: 700, lineHeight: 1,
                      background: "transparent",
                      color: heatSafeePage === 0 ? C.dim : C.muted,
                    }}
                  >›</button>
                </div>
              )}
            </div>
            <EChart option={heatmapOpt} style={{ height: Math.max(120, heatYears.length * 36) }} />
            <p style={{ fontSize: 11, color: C.muted, marginTop: "auto", paddingTop: 10 }}>
              Agosto siempre es el mes más débil. El cierre de año (Nov–Dic) concentra el mayor volumen.
            </p>
          </Card>
          <Card>
            <SectionTitle sub="Volumen por trimestre y año">
              Momentum trimestral
            </SectionTitle>
            <EChart option={momentumOpt} style={{ height: 240 }} />
          </Card>
        </div>

        {/* ── Mix tecnológico ──────────────────────────────────────────────── */}
        <Card style={{ marginBottom: GAP }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, alignItems: "start" }}>
            <div>
              <SectionTitle sub="Evolución del mix BEV vs PHEV como % del total anual">
                Mix tecnológico — ¿quién gana terreno?
              </SectionTitle>
              <EChart option={mixOpt} style={{ height: 220 }} />
              {(() => {
                const totBev  = ANNUAL.reduce((s, a) => s + a.bev,  0) + historico.reduce((s, h) => s + h.bev,  0);
                const totPhev = ANNUAL.reduce((s, a) => s + a.phev, 0) + historico.reduce((s, h) => s + h.phev, 0);
                const pct     = Math.round(Math.abs(totPhev - totBev) / Math.min(totPhev, totBev) * 100);
                const [winner, loser, wColor, lColor] = totPhev >= totBev
                  ? ["PHEV", "BEV", C.phev, C.bev] as const
                  : ["BEV", "PHEV", C.bev, C.phev] as const;
                const desdeAño = historico[0]?.año ?? FIRST.año;
                return (
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>
                    Se matricularon un{" "}
                    <span style={{ color: C.green, fontWeight: 700 }}>+{pct}% más <span style={{ color: wColor }}>{winner}s</span> que <span style={{ color: lColor }}>{loser}s</span></span>
                    {" "}en total desde {desdeAño} ({fmtN(totPhev)} PHEV vs {fmtN(totBev)} BEV).
                  </p>
                );
              })()}
            </div>
            <div>
              {/* Header: título + dropdown + paginación en misma fila */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: "linear-gradient(180deg,#38bdf8,#8b5cf6)", flexShrink: 0 }} />
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.01em" }}>Mix por marca</h2>
                  </div>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 4, marginLeft: 13 }}>% BEV vs PHEV por fabricante · Fuente: {FUENTE_META[fuente].tag}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {/* Dropdown año */}
                  <select
                    value={marcaMixYear}
                    onChange={(e) => { setMarcaMixYear(e.target.value === "todos" ? "todos" : Number(e.target.value)); setMarcaMixPage(0); }}
                    style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#1e293b", border: `1px solid rgba(255,255,255,0.25)`, color: "#ffffff", cursor: "pointer", outline: "none", colorScheme: "dark" } as React.CSSProperties}
                  >
                    {mixYearsAvailable.map((y) => (
                      <option key={y} value={y}>{y === "todos" ? "Todos" : y}</option>
                    ))}
                  </select>
                  {/* Paginación — ← libre, → alineado con columna de k del gráfico */}
                  {mixMarcasTotalPages > 1 && (
                    <>
                      <span style={{ fontSize: 11, color: C.dim }}>{marcaMixPage + 1}/{mixMarcasTotalPages}</span>
                      <button
                        disabled={marcaMixPage === 0}
                        onClick={() => setMarcaMixPage((p) => p - 1)}
                        style={{ padding: "3px 9px", borderRadius: 6, cursor: marcaMixPage === 0 ? "default" : "pointer", fontSize: 12, fontWeight: 700, border: `1px solid rgba(255,255,255,0.25)`, background: "rgba(255,255,255,0.15)", color: marcaMixPage === 0 ? C.dim : "#ffffff" }}
                      >←</button>
                    </>
                  )}
                  {/* → en div de 52px = mismo ancho que grid.right del gráfico */}
                  {mixMarcasTotalPages > 1 && (
                    <div style={{ width: 52, display: "flex", justifyContent: "center" }}>
                      <button
                        disabled={marcaMixPage >= mixMarcasTotalPages - 1}
                        onClick={() => setMarcaMixPage((p) => p + 1)}
                        style={{ padding: "3px 9px", borderRadius: 6, cursor: marcaMixPage >= mixMarcasTotalPages - 1 ? "default" : "pointer", fontSize: 12, fontWeight: 700, border: `1px solid rgba(255,255,255,0.25)`, background: "rgba(255,255,255,0.15)", color: marcaMixPage >= mixMarcasTotalPages - 1 ? C.dim : "#ffffff" }}
                      >→</button>
                    </div>
                  )}
                </div>
              </div>
              {fuente !== "anfac"
                ? <EChart option={mixMarcasOpt} style={{ height: Math.max(mixMarcasData.length * 34 + 16, 60) }} />
                : <NoData height={200} />}
            </div>
          </div>
        </Card>

        {/* ── Provincias ───────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, marginBottom: GAP }}>
          <Card>
            <SectionTitle sub={
              fuente === "aedive" ? `Acumulado 2019–2025 · Total: ${fmtN(PROV_TOTAL)} uds` :
              fuente === "dgt"    ? `Acumulado 2020–2026 · Microdatos DGT` :
              "Sin desglose disponible"
            }>
              Top 10 provincias
            </SectionTitle>
            {provOpt
              ? <EChart option={provOpt} style={{ height: 310 }} />
              : <NoData height={310} />}
          </Card>
          <Card>
            <SectionTitle sub="% sobre el total nacional acumulado">
              Concentración geográfica
            </SectionTitle>
            {fuente === "aedive" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 9, overflowY: "auto", maxHeight: 350, paddingRight: 4 }}>
                {[...provinciasPorMatriculaciones].sort((a,b)=>b.total-a.total).slice(0,15).map((p, i) => {
                  const pct = (p.total / PROV_TOTAL) * 100;
                  const maxPct = (provinciasPorMatriculaciones[0].total / PROV_TOTAL) * 100;
                  return (
                    <div key={p.nombre} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, color: C.dim, width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: C.text, width: 96, flexShrink: 0 }}>{p.nombre}</span>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(pct / maxPct) * 100}%`, background: "linear-gradient(90deg,#38bdf8,#8b5cf6)", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: C.muted, width: 38, textAlign: "right", flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.text, width: 68, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{fmtN(p.total)}</span>
                    </div>
                  );
                })}
              </div>
            ) : fuente === "dgt" && dgtProvs ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 9, overflowY: "auto", maxHeight: 350, paddingRight: 4 }}>
                {dgtProvs.slice(0, 15).map((p, i) => {
                  const val = filtro === "bev" ? p.bev : filtro === "phev" ? p.phev : p.total;
                  const provTotal = filtro === "bev"
                    ? dgtProvs.reduce((s, x) => s + x.bev, 0)
                    : filtro === "phev"
                    ? dgtProvs.reduce((s, x) => s + x.phev, 0)
                    : dgtProvs.reduce((s, x) => s + x.total, 0);
                  const pct = (val / provTotal) * 100;
                  const maxPct = ((filtro === "bev" ? dgtProvs[0].bev : filtro === "phev" ? dgtProvs[0].phev : dgtProvs[0].total) / provTotal) * 100;
                  return (
                    <div key={p.cod} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, color: C.dim, width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: C.text, width: 96, flexShrink: 0 }}>{p.provincia}</span>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(pct / maxPct) * 100}%`, background: "linear-gradient(90deg,#34d399,#38bdf8)", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: C.muted, width: 38, textAlign: "right", flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.text, width: 68, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{fmtN(val)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <NoData height={310} />
            )}
          </Card>
        </div>

        {/* ── Modelos + marcas ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, marginBottom: GAP }}>
          <Card>
            <SectionTitle sub={
              fuente === "aedive" ? "Unidades en España 2025" :
              fuente === "dgt"    ? "Microdatos DGT · Acumulado 2020–2026" :
              "Sin desglose disponible"
            }>Top modelos más vendidos</SectionTitle>
            {filteredModelos ? (
              <>
                <div style={{ display: "flex", gap: 14, marginBottom: 6 }}>
                  {[{label:"BEV",color:C.bev},{label:"PHEV",color:C.phev}].map((t) => (
                    <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 3, borderRadius: 2, background: t.color }} />
                      <span style={{ fontSize: 11, color: C.muted }}>{t.label}</span>
                    </div>
                  ))}
                </div>
                <EChart option={modelosOpt!} style={{ height: Math.max(filteredModelos.length * 33 + 20, 160) }} />
              </>
            ) : <NoData height={280} />}
          </Card>
          <Card>
            <SectionTitle sub={
              fuente === "aedive" ? "BEV y PHEV por fabricante · España 2025" :
              fuente === "dgt"    ? "BEV y PHEV por fabricante · Microdatos DGT" :
              "Sin desglose disponible"
            }>Ranking de marcas</SectionTitle>
            {marcasOpt
              ? <EChart option={marcasOpt} style={{ height: 280 }} />
              : <NoData height={280} />}
          </Card>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: "rgba(241,245,249,0.18)", textAlign: "center", marginTop: 8 }}>
          Dashboard Power BI público · Scraper automatizado · Actualización semanal ·
          Modelos y marcas: estimación 2025 · Acumulado provincial: 2019–2025
        </p>
      </div>
    </div>
  );
}
