"use client";

import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import {
  infraPorProvincia,
  evolucionRedCarga,
  operadoresPrincipales,
  tiposCargador,
} from "../../lib/insights/infraestructura-data";
import { provinciasPorMatriculaciones } from "../../lib/insights/provincias-data";

// ─────────────────────────────────────────────────────────────────────────────
// PRE-COMPUTED ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

const TOTAL_PUNTOS = 56432; // mapareve.es MITMA RECORE
const TOTAL_RAPIDOS = evolucionRedCarga[evolucionRedCarga.length - 1].rapidos;
const TOTAL_ULTRAS  = evolucionRedCarga[evolucionRedCarga.length - 1].ultras;
const TOTAL_EVS     = provinciasPorMatriculaciones.reduce((s, p) => s + p.total, 0);

const RED_FIRST = evolucionRedCarga[0];
const RED_LAST  = evolucionRedCarga[evolucionRedCarga.length - 1];
const N_AÑOS    = RED_LAST.año - RED_FIRST.año;
const CAGR_RED  = +((Math.pow(RED_LAST.total / RED_FIRST.total, 1 / N_AÑOS) - 1) * 100).toFixed(1);

const YOY_RED = evolucionRedCarga.slice(1).map((curr, i) => {
  const prev = evolucionRedCarga[i];
  return {
    año: curr.año,
    yoy: +((curr.total - prev.total) / prev.total * 100).toFixed(1),
  };
});

// Cross-map: join EV data with charging infrastructure data
const CROSS = infraPorProvincia.map((p) => {
  const ev = provinciasPorMatriculaciones.find((e) => e.nombre === p.nombre);
  const evs = ev?.total ?? 0;
  const ratio = evs > 0 ? +(evs / p.puntos).toFixed(2) : 0;
  const density = +(p.puntos / (p.km2 / 100)).toFixed(2); // puntos por 100 km²
  const densityPob = +(p.puntos / p.pob).toFixed(2);       // puntos por 1k habitantes
  return { ...p, evs, ratio, density, densityPob };
}).filter((p) => p.evs > 0);

const AVG_RATIO = +(TOTAL_EVS / TOTAL_PUNTOS).toFixed(1);

// CCAA aggregates
type CCAARow = { ccaa: string; puntos: number; rapidos: number; evs: number; ratio: number };
const byCCAA: Record<string, CCAARow> = {};
CROSS.forEach((p) => {
  if (!byCCAA[p.ccaa]) byCCAA[p.ccaa] = { ccaa: p.ccaa, puntos: 0, rapidos: 0, evs: 0, ratio: 0 };
  byCCAA[p.ccaa].puntos  += p.puntos;
  byCCAA[p.ccaa].rapidos += p.rapidos;
  byCCAA[p.ccaa].evs     += p.evs;
});
Object.values(byCCAA).forEach((c) => { c.ratio = +(c.evs / c.puntos).toFixed(1); });
const CCAA_LIST = Object.values(byCCAA).sort((a, b) => b.puntos - a.puntos);

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  green:  "#34d399",
  blue:   "#38bdf8",
  purple: "#a78bfa",
  orange: "#fb923c",
  amber:  "#fbbf24",
  red:    "#f87171",
  teal:   "#06b6d4",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.42)",
  dim:    "rgba(241,245,249,0.20)",
  grid:   "rgba(255,255,255,0.045)",
};

const TIPO_COLORS = tiposCargador.map((t) => t.color);

const TT = {
  backgroundColor: "rgba(5,8,16,0.97)",
  borderColor: C.border,
  textStyle: { color: C.text, fontSize: 12 },
  extraCssText: "box-shadow:0 8px 32px rgba(0,0,0,0.7);border-radius:10px;padding:10px 14px;",
};

function fmtN(n: number) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
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

// Coverage tier
function coverageTier(ratio: number): { label: string; color: string } {
  if (ratio < 4)  return { label: "Excelente", color: C.green };
  if (ratio < 7)  return { label: "Buena",     color: C.teal  };
  if (ratio < 12) return { label: "Media",     color: C.amber };
  return               { label: "Baja",       color: C.red   };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function EChart({ option, style }: { option: Record<string, any>; style?: React.CSSProperties }) {
  const ref      = useRef<HTMLDivElement>(null);
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
        <div style={{ width: 3, height: 16, borderRadius: 2, background: "linear-gradient(180deg,#34d399,#38bdf8)", flexShrink: 0 }} />
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
  const glow = color ?? C.blue;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px 22px", flex: 1, minWidth: 160, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: "50%", background: `${glow}18`, filter: "blur(24px)", pointerEvents: "none" }} />
      {/* Fixed-height header so the big number aligns across all cards */}
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

// Province name mapping: GeoJSON feature names → our province names in infraPorProvincia
const GEO_PROV_MAP: Record<string, string> = {
  // Normalization for names that differ between GeoJSON sources and our data
  "Baleares":               "Islas Baleares",
  "Illes Balears":          "Islas Baleares",
  "Castellón de la Plana":  "Castellón",
  "Castellón":              "Castellón",
  "Guipúzcoa":              "Gipuzkoa",
  "Gipuzkoa":               "Gipuzkoa",
  "La Coruña":              "A Coruña",
  "A Coruña":               "A Coruña",
  "Lérida":                 "Lleida",
  "Lleida":                 "Lleida",
  "Orense":                 "Ourense",
  "Ourense":                "Ourense",
  "Gerona":                 "Girona",
  "Girona":                 "Girona",
  "Álava":                  "Álava",
  "Araba":                  "Álava",
  "Araba/Álava":            "Álava",
  "Bizkaia":                "Vizcaya",
  "Vizcaya":                "Vizcaya",
};

// Canarias: island name → province name (for shift detection + tooltip lookup)
const CANARIAS_ISLAND_TO_PROV: Record<string, string> = {
  "Las Palmas":             "Las Palmas",
  "Gran Canaria":           "Las Palmas",
  "Fuerteventura":          "Las Palmas",
  "Lanzarote":              "Las Palmas",
  "Santa Cruz de Tenerife": "Santa Cruz de Tenerife",
  "Tenerife":               "Santa Cruz de Tenerife",
  "La Palma":               "Santa Cruz de Tenerife",
  "La Gomera":              "Santa Cruz de Tenerife",
  "El Hierro":              "Santa Cruz de Tenerife",
};

// Canarias inset: shift islands to SW corner so they appear as a bottom-left inset
const CANARIAS_PROV = new Set(Object.keys(CANARIAS_ISLAND_TO_PROV));
const CANAR_LNG = 4;   // shift east: eastern Canarias (~-13.4°) lands just left of peninsula (-9.3°)
const CANAR_LAT = 8.4; // shift north: southern Canarias (~27.6°) aligns with southern peninsula (~36.0°)
function shiftCoords(coords: any[], dlng: number, dlat: number): any[] {
  if (typeof coords[0] === "number") return [coords[0] + dlng, coords[1] + dlat];
  return coords.map((c) => shiftCoords(c, dlng, dlat));
}

export function InfraDashboard() {
  const [rankBy, setRankBy] = useState<"puntos"|"rapidos"|"ratio"|"density">("puntos");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const GAP = 16;

  useEffect(() => {
    // Try jsDelivr CDN (mirrors GitHub, CORS-enabled)
    const URLS = [
      "https://cdn.jsdelivr.net/gh/codeforamerica/click_that_hood@master/public/data/spain-provinces.geojson",
      "https://cdn.jsdelivr.net/gh/codeforgermany/click_that_hood@main/public/data/spain-provinces.geojson",
    ];
    let tried = 0;
    function tryNext() {
      if (tried >= URLS.length) { setMapError("No se pudo cargar el mapa"); return; }
      const url = URLS[tried++];
      fetch(url)
        .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
        .then((geo) => {
          const normalized = {
            ...geo,
            features: geo.features.map((f: any) => {
              const rawName: string = f.properties?.name ?? f.properties?.NAME ?? f.properties?.NAME_1 ?? "";
              const isCanaria = rawName in CANARIAS_ISLAND_TO_PROV;
              // Canarias: map to province name for data lookup; Others: normalize name
              const displayName = isCanaria
                ? CANARIAS_ISLAND_TO_PROV[rawName]
                : (GEO_PROV_MAP[rawName] ?? rawName);
              const geom = isCanaria
                ? { ...f.geometry, coordinates: shiftCoords(f.geometry.coordinates, CANAR_LNG, CANAR_LAT) }
                : f.geometry;
              return { ...f, geometry: geom, properties: { ...f.properties, name: displayName } };
            }),
          };
          echarts.registerMap("spain-prov", normalized);
          setMapLoaded(true);
        })
        .catch(tryNext);
    }
    tryNext();
  }, []);

  // ── Evolución red — stacked area ─────────────────────────────────────────
  const redOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) =>
        `<b style="color:${C.text}">${params[0].axisValue}</b><br/>` +
        params.filter((p) => p.value != null).map((p) =>
          `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${fmtN(p.value)}</b>`
        ).join("<br/>") +
        `<br/><span style="color:${C.muted}">Total: <b>${fmtN(params.reduce((s,p)=>s+p.value,0))}</b></span>`,
    },
    legend: {
      top: 4, right: 8, textStyle: { color: C.muted, fontSize: 11 },
      icon: "circle", itemWidth: 8, itemHeight: 8,
    },
    grid: { top: 40, right: 16, bottom: 36, left: 72 },
    xAxis: {
      type: "category",
      data: evolucionRedCarga.map((r) => String(r.año)),
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted, fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
    },
    series: [
      {
        name: "Lento <7kW", type: "bar", stack: "s",
        data: evolucionRedCarga.map((r) => r.lentos),
        itemStyle: { color: "rgba(75,85,105,0.8)" },
        barMaxWidth: 60,
      },
      {
        name: "AC 7–22kW", type: "bar", stack: "s",
        data: evolucionRedCarga.map((r) => r.acNormal),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.purple},{offset:1,color:"rgba(167,139,250,0.5)"}]) },
        barMaxWidth: 60,
      },
      {
        name: "Rápido DC >50kW", type: "bar", stack: "s",
        data: evolucionRedCarga.map((r) => r.rapidos - r.ultras),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.blue},{offset:1,color:"rgba(56,189,248,0.5)"}]) },
        barMaxWidth: 60,
      },
      {
        name: "Ultra-rápido ≥150kW", type: "bar", stack: "s",
        data: evolucionRedCarga.map((r) => r.ultras),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.green},{offset:1,color:"rgba(52,211,153,0.6)"}]), borderRadius: [4,4,0,0] },
        barMaxWidth: 60,
      },
      {
        name: "Total", type: "line", smooth: true, symbol: "circle", symbolSize: 5,
        data: evolucionRedCarga.map((r) => r.total),
        lineStyle: { color: C.amber, width: 2, type: "dashed" },
        itemStyle: { color: C.amber },
        yAxisIndex: 0,
      },
    ],
  };

  // ── YoY red de carga ─────────────────────────────────────────────────────
  const yoyRedOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) =>
        `<b>${params[0].axisValue}</b><br/>Crecimiento: <b>+${params[0].value}%</b>`,
    },
    grid: { top: 20, right: 16, bottom: 32, left: 56 },
    xAxis: {
      type: "category",
      data: YOY_RED.map((y) => `${y.año - 1}→${y.año}`),
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted, fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => `+${v}%` },
    },
    series: [{
      name: "YoY red",
      type: "bar",
      data: YOY_RED.map((y) => ({
        value: y.yoy,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0,0,0,1,[
            { offset: 0, color: y.yoy >= 50 ? C.green : C.blue },
            { offset: 1, color: y.yoy >= 50 ? "rgba(52,211,153,0.3)" : "rgba(56,189,248,0.3)" },
          ]),
          borderRadius: [4,4,0,0],
        },
      })),
      barMaxWidth: 60,
      label: {
        show: true, position: "top", color: C.muted, fontSize: 11, fontWeight: 700,
        formatter: (p: Record<string, any>) => `+${p.value}%`,
      },
    }],
  };

  // ── Mix tipos cargador (donut) ───────────────────────────────────────────
  const mixDonutOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT,
      formatter: (p: Record<string, any>) =>
        `<b>${p.name}</b><br/>Puntos: <b>${fmtN(p.value)}</b><br/>Cuota: <b>${p.percent.toFixed(1)}%</b>`,
    },
    series: [{
      type: "pie",
      radius: ["42%", "72%"],
      center: ["50%", "50%"],
      data: tiposCargador.map((t) => ({ name: t.label, value: t.total, itemStyle: { color: t.color } })),
      label: { show: true, fontSize: 11, color: C.muted, formatter: (p: Record<string, any>) => `${p.percent.toFixed(0)}%` },
      labelLine: { lineStyle: { color: C.dim } },
      emphasis: { scale: true, scaleSize: 8 },
    }],
  };

  // ── Operadores (horizontal bar) ──────────────────────────────────────────
  const operadoresOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (p: Record<string, any>[]) =>
        `<b>${p[0].name}</b>: ${fmtN(p[0].value)} puntos (${(p[0].value/TOTAL_PUNTOS*100).toFixed(1)}%)`,
    },
    grid: { top: 8, right: 80, bottom: 8, left: 8, containLabel: true },
    xAxis: { type: "value", splitLine: { lineStyle: { color: C.grid, type: "dashed" } }, axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) } },
    yAxis: {
      type: "category",
      data: [...operadoresPrincipales].reverse().map((o) => o.nombre),
      axisLabel: { color: C.muted, fontSize: 11 },
      axisTick: { show: false }, axisLine: { show: false },
    },
    series: [{
      type: "bar", barMaxWidth: 20,
      data: [...operadoresPrincipales].reverse().map((o) => ({
        value: o.puntos,
        itemStyle: { color: new echarts.graphic.LinearGradient(1,0,0,0,[{offset:0,color:o.color},{offset:1,color:`${o.color}30`}]), borderRadius: [0,4,4,0] },
      })),
      label: { show: true, position: "right", color: C.muted, fontSize: 10, formatter: (p: Record<string, any>) => fmtN(p.value) },
    }],
  };

  // ── CROSS-MAP: EVs vs Puntos de carga ────────────────────────────────────
  // Bubble: x = EVs acumulados, y = puntos de carga, size = poblacion
  const maxEvs = Math.max(...CROSS.map((p) => p.evs));
  const maxPuntos = Math.max(...CROSS.map((p) => p.puntos));
  const crossOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT,
      trigger: "item",
      formatter: (p: Record<string, any>) => {
        const d = CROSS[p.dataIndex];
        const tier = coverageTier(d.ratio);
        return `<b style="color:${C.text}">${d.nombre}</b> <span style="color:${C.muted}">(${d.ccaa})</span><br/>` +
          `EVs acumulados: <b>${fmtN(d.evs)}</b><br/>` +
          `Puntos de carga: <b>${fmtN(d.puntos)}</b><br/>` +
          `Rápidos DC: <b>${fmtN(d.rapidos)}</b> (${(d.rapidos/d.puntos*100).toFixed(0)}%)<br/>` +
          `Ratio EVs/punto: <b style="color:${tier.color}">${d.ratio}x — ${tier.label}</b><br/>` +
          `Densidad: <b>${d.density.toFixed(1)} pts/100km²</b>`;
      },
    },
    grid: { top: 32, right: 40, bottom: 64, left: 72 },
    xAxis: {
      type: "log",
      name: "EVs acumulados (escala log)",
      nameTextStyle: { color: C.muted, fontSize: 10 },
      nameLocation: "center", nameGap: 32,
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
    },
    yAxis: {
      type: "log",
      name: "Puntos de carga (escala log)",
      nameTextStyle: { color: C.muted, fontSize: 10 },
      nameLocation: "center", nameGap: 56,
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
    },
    // Reference line: ratio = AVG_RATIO
    visualMap: {
      show: true,
      dimension: 3, // ratio
      min: 0, max: 20,
      calculable: false,
      text: ["Alta cobertura →", "← Baja cobertura"],
      textStyle: { color: C.muted, fontSize: 10 },
      orient: "horizontal",
      left: "center",
      bottom: 4,
      inRange: {
        color: [C.green, C.teal, C.amber, C.red],
      },
    },
    series: [
      // Reference diagonal line (ratio = AVG_RATIO)
      {
        name: "Ratio medio España",
        type: "line",
        data: [[100, 100 / AVG_RATIO], [maxEvs, maxEvs / AVG_RATIO]],
        lineStyle: { color: "rgba(241,245,249,0.15)", width: 1, type: "dashed" },
        symbol: "none",
        tooltip: { show: false },
      },
      // Province bubbles
      {
        name: "Provincia",
        type: "scatter",
        data: CROSS.map((p) => ({
          value: [p.evs, p.puntos, p.pob, p.ratio],
          name: p.nombre,
          symbolSize: Math.max(Math.sqrt(p.pob) * 1.4, 8),
        })),
        label: {
          show: true,
          formatter: (p: Record<string, any>) => {
            const d = CROSS[p.dataIndex];
            return d.evs > 3000 || d.puntos > 500 ? d.nombre : "";
          },
          position: "right",
          color: C.muted,
          fontSize: 9,
        },
        emphasis: { scale: 1.4, label: { show: true, color: C.text, fontSize: 11 } },
      },
    ],
  };

  // ── Ranking provincial ───────────────────────────────────────────────────
  const sortedProv = [...CROSS].sort((a, b) => {
    if (rankBy === "puntos")   return b.puntos   - a.puntos;
    if (rankBy === "rapidos")  return b.rapidos  - a.rapidos;
    if (rankBy === "ratio")    return b.ratio    - a.ratio;   // higher = worse coverage
    return b.density - a.density;
  });
  const top20 = sortedProv.slice(0, 20);

  const rankOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (p: Record<string, any>[]) => {
        const d = CROSS.find((x) => x.nombre === p[0].name)!;
        if (!d) return "";
        const tier = coverageTier(d.ratio);
        return `<b>${d.nombre}</b><br/>Puntos: <b>${fmtN(d.puntos)}</b> | Rápidos: <b>${fmtN(d.rapidos)}</b><br/>EVs: <b>${fmtN(d.evs)}</b> | Ratio: <b style="color:${tier.color}">${d.ratio}x</b><br/>Densidad: ${d.density.toFixed(1)} pts/100km²`;
      },
    },
    grid: { top: 8, right: 80, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}` },
    },
    yAxis: {
      type: "category",
      data: [...top20].reverse().map((p) => p.nombre),
      axisLabel: { color: C.muted, fontSize: 10 },
      axisTick: { show: false }, axisLine: { show: false },
    },
    series: [{
      type: "bar", barMaxWidth: 18,
      data: [...top20].reverse().map((p) => {
        const val = rankBy === "puntos" ? p.puntos : rankBy === "rapidos" ? p.rapidos : rankBy === "ratio" ? p.ratio : p.density;
        const tier = coverageTier(p.ratio);
        return {
          value: val,
          itemStyle: {
            color: rankBy === "ratio"
              ? new echarts.graphic.LinearGradient(1,0,0,0,[{offset:0,color:tier.color},{offset:1,color:`${tier.color}20`}])
              : linGrad(C.blue, "h", 1, 0.2),
            borderRadius: [0,4,4,0],
          },
        };
      }),
      label: {
        show: true, position: "right", color: C.muted, fontSize: 10,
        formatter: (p: Record<string, any>) => {
          const v = p.value;
          return v >= 1000 ? fmtN(Math.round(v)) : typeof v === "number" && v < 100 ? v.toFixed(1) : String(Math.round(v));
        },
      },
    }],
  };

  // ── CCAA ranking ─────────────────────────────────────────────────────────
  const ccaaOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const d = CCAA_LIST.find((c) => c.ccaa === params[0].axisValue)!;
        if (!d) return "";
        return `<b>${d.ccaa}</b><br/>Puntos: <b>${fmtN(d.puntos)}</b><br/>Rápidos: <b>${fmtN(d.rapidos)}</b><br/>EVs: <b>${fmtN(d.evs)}</b><br/>Ratio: <b>${d.ratio}x</b>`;
      },
    },
    grid: { top: 12, right: 16, bottom: 32, left: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: CCAA_LIST.map((c) => c.ccaa.replace("Castilla ", "C.").replace("Comunidad ", "C. ")),
      axisLabel: { color: C.muted, fontSize: 9, interval: 0, rotate: 30 },
      axisLine: { lineStyle: { color: C.grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
    },
    series: [
      {
        name: "Puntos AC", type: "bar", stack: "s",
        data: CCAA_LIST.map((c) => c.puntos - c.rapidos),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.purple},{offset:1,color:"rgba(167,139,250,0.4)"}]) },
        barMaxWidth: 40,
      },
      {
        name: "Rápidos DC", type: "bar", stack: "s",
        data: CCAA_LIST.map((c) => c.rapidos),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.green},{offset:1,color:"rgba(52,211,153,0.4)"}]), borderRadius: [4,4,0,0] },
        barMaxWidth: 40,
        label: { show: true, position: "top", color: C.muted, fontSize: 9, formatter: (p: Record<string, any>) => { const tot = CCAA_LIST[p.dataIndex].puntos; return tot >= 1000 ? `${(tot/1000).toFixed(1)}k` : String(tot); } },
      },
    ],
  };

  // ── EVs vs Cargadores por CCAA ───────────────────────────────────────────
  const ccaaBalanceOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const idx = params[0].dataIndex;
        const d = CCAA_LIST[idx];
        return `<b>${d.ccaa}</b><br/>Puntos de carga: <b>${fmtN(d.puntos)}</b><br/>EVs acumulados: <b>${fmtN(d.evs)}</b><br/>Ratio: <b>${d.ratio}x</b>`;
      },
    },
    legend: { top: 4, right: 8, textStyle: { color: C.muted, fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
    grid: { top: 40, right: 16, bottom: 60, left: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: CCAA_LIST.map((c) => c.ccaa.replace("Castilla ", "C.").replace("Comunidad ", "C. ")),
      axisLabel: { color: C.muted, fontSize: 9, interval: 0, rotate: 30 },
      axisLine: { lineStyle: { color: C.grid } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value", name: "Puntos carga",
        nameTextStyle: { color: C.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
        axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
      },
      {
        type: "value", name: "EVs",
        nameTextStyle: { color: C.muted, fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) },
      },
    ],
    series: [
      {
        name: "Puntos de carga", type: "bar",
        data: CCAA_LIST.map((c) => c.puntos),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.blue},{offset:1,color:"rgba(56,189,248,0.3)"}]), borderRadius: [4,4,0,0] },
        barMaxWidth: 36,
        yAxisIndex: 0,
      },
      {
        name: "EVs acumulados", type: "line", smooth: true, symbol: "circle", symbolSize: 5,
        data: CCAA_LIST.map((c) => c.evs),
        lineStyle: { color: C.orange, width: 2 },
        itemStyle: { color: C.orange },
        yAxisIndex: 1,
      },
    ],
  };

  // ── Spain choropleth map (province level) ───────────────────────────────
  const spainMapOpt: Record<string, any> | null = mapLoaded ? {
    backgroundColor: "transparent",
    tooltip: {
      ...TT,
      trigger: "item",
      confine: true,
      formatter: (p: any) => {
        if (!p.name) return "";
        const d = CROSS.find((c) => c.nombre === p.name);
        if (!d) return `<b style="color:${C.text}">${p.name}</b>`;
        const tier = coverageTier(d.ratio);
        return `<b style="color:${C.text}">${d.nombre}</b> <span style="color:${C.dim}">${d.ccaa}</span><br/>` +
          `EVs acumulados: <b>${fmtN(d.evs)}</b><br/>` +
          `Puntos de carga: <b>${fmtN(d.puntos)}</b><br/>` +
          `Rápidos DC: <b>${fmtN(d.rapidos)}</b><br/>` +
          `Ratio: <b style="color:${tier.color}">${d.ratio}x — ${tier.label}</b>`;
      },
    },
    visualMap: {
      type: "piecewise",
      pieces: [
        { min: 0,  max: 4,  color: C.green,  label: "Excelente  <4x"  },
        { min: 4,  max: 7,  color: C.teal,   label: "Buena  4–7x"    },
        { min: 7,  max: 12, color: C.amber,  label: "Media  7–12x"   },
        { min: 12,           color: C.red,    label: "Saturado  >12x"  },
      ],
      show: true,
      orient: "horizontal", left: "center", bottom: 8,
      textStyle: { color: C.muted, fontSize: 10 },
      itemWidth: 14, itemHeight: 10, itemGap: 20,
    },
    series: [{
      type: "map",
      map: "spain-prov",
      roam: false,
      aspectScale: 0.85,
      layoutCenter: ["50%", "48%"],
      layoutSize: "95%",
      label: { show: false },
      emphasis: { itemStyle: { areaColor: "rgba(251,191,36,0.35)" }, label: { show: true, color: C.text, fontSize: 9 } },
      itemStyle: { borderColor: "rgba(255,255,255,0.1)", borderWidth: 0.5, areaColor: "rgba(255,255,255,0.04)" },
      data: CROSS.map((p) => ({ name: p.nombre, value: p.ratio })),
    }],
  } : null;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Controls */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(5,8,16,0.88)", backdropFilter: "blur(16px)", position: "sticky", top: 52, zIndex: 40 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 50, gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, color: C.dim, letterSpacing: "0.06em", textTransform: "uppercase" }}>España · ANFAC · MITMA</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Red de Carga Pública</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.dim }}>Ranking:</span>
              {[
                { v: "puntos",  l: "Puntos totales" },
                { v: "rapidos", l: "Rápidos DC"     },
                { v: "ratio",   l: "Ratio EVs/carg" },
                { v: "density", l: "Densidad/km²"   },
              ].map((o) => (
                <button key={o.v} onClick={() => setRankBy(o.v as typeof rankBy)} style={{
                  padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700,
                  border: rankBy === o.v ? `1px solid ${C.green}44` : "1px solid transparent",
                  background: rankBy === o.v ? `${C.green}18` : "transparent",
                  color: rankBy === o.v ? C.green : C.muted, transition: "all 0.15s",
                }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 56px" }}>

        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: GAP, marginBottom: GAP, flexWrap: "wrap" }}>
          <KPI label="Puntos carga públicos"  value={fmtN(TOTAL_PUNTOS)} sub="dic 2025 (ANFAC)" color={C.blue}   icon="⚡" delta={37}    tag="ANFAC" />
          <KPI label="Rápidos DC (>50kW)"     value={fmtN(TOTAL_RAPIDOS)} sub={`${(TOTAL_RAPIDOS/TOTAL_PUNTOS*100).toFixed(0)}% del total`} color={C.green}  icon="⚡⚡" />
          <KPI label="Ultra-rápidos ≥150kW"   value={fmtN(TOTAL_ULTRAS)}  sub={`${(TOTAL_ULTRAS/TOTAL_PUNTOS*100).toFixed(0)}% del total`}  color={C.teal}   icon="🚀" />
          <KPI label="Ratio EV/punto público"  value={`${AVG_RATIO}x`}    sub="EVs matriculados / punto" color={C.amber}  icon="⚖️" />
          <KPI label={`CAGR ${RED_FIRST.año}–${RED_LAST.año}`} value={`${CAGR_RED}%`} sub="tasa anual compuesta" color={C.purple} icon="📈" />
          <KPI label="Operadores en España"   value="80+"                 sub="activos en red pública"  color={C.orange} icon="🔌" />
        </div>

        {/* ── Evolución + YoY ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: GAP, marginBottom: GAP }}>
          <Card>
            <SectionTitle sub="Puntos de carga públicos por tipo — España 2019–2025">
              Crecimiento de la red de carga
            </SectionTitle>
            <EChart option={redOpt} style={{ height: 300 }} />
            <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
              {[
                { label: "Ultra-rápido ≥150kW", color: C.green  },
                { label: "Rápido DC 50–149kW",  color: C.blue   },
                { label: "AC 7–22kW",           color: C.purple },
                { label: "Lento <7kW",          color: "#4b5563" },
                { label: "Total",               color: C.amber, dash: true },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 14, height: 3, borderRadius: 1, background: l.color }} />
                  <span style={{ fontSize: 10, color: C.muted }}>{l.label}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Crecimiento anual de la red">
              YoY red de carga
            </SectionTitle>
            <EChart option={yoyRedOpt} style={{ height: 240 }} />
            <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
              Pico de crecimiento en 2021–2022 (+{YOY_RED.find(y => y.año === 2021)?.yoy}% / +{YOY_RED.find(y => y.año === 2022)?.yoy}%). La red se multiplica × {(RED_LAST.total / RED_FIRST.total).toFixed(1)} en {N_AÑOS} años.
            </p>
          </Card>
        </div>

        {/* ── Mix tipos + Operadores ───────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: GAP, marginBottom: GAP }}>
          <Card>
            <SectionTitle sub="Distribución por potencia de carga">
              Mix por tipo de cargador
            </SectionTitle>
            <EChart option={mixDonutOpt} style={{ height: 220 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {tiposCargador.map((t) => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>{t.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.color, fontVariantNumeric: "tabular-nums" }}>{fmtN(t.total)}</span>
                  <span style={{ fontSize: 10, color: C.dim, width: 36, textAlign: "right" }}>{t.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Cuota de mercado estimada por operador (2025)">
              Operadores principales
            </SectionTitle>
            <EChart option={operadoresOpt} style={{ height: 300 }} />
            <p style={{ fontSize: 10, color: C.dim, marginTop: 8 }}>
              El mercado está fragmentado: los 8 principales operadores controlan ~58%. "Otros" agrupa +70 operadores regionales y locales.
            </p>
          </Card>
        </div>

        {/* ── CCAA ranking stacked ─────────────────────────────────────────── */}
        <Card style={{ marginBottom: GAP }}>
          <SectionTitle sub="Puntos de carga públicos por comunidad autónoma · AC vs DC rápido">
            Infraestructura por Comunidad Autónoma
          </SectionTitle>
          <EChart option={ccaaOpt} style={{ height: 280 }} />
        </Card>

        {/* ── Spain choropleth ─────────────────────────────────────────────── */}
        <Card style={{ marginBottom: GAP }}>
          <SectionTitle sub="Ratio EVs acumulados / puntos de carga por provincia — cuanto mayor el ratio, más saturada la red">
            Mapa de cobertura EV por provincia
          </SectionTitle>
          {mapError ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
              {mapError}
            </div>
          ) : !mapLoaded ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
              Cargando mapa…
            </div>
          ) : spainMapOpt ? (
            <>
              <EChart option={spainMapOpt} style={{ height: 560 }} />
              <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                {[
                  { label: "Excelente (<4x)", color: C.green },
                  { label: "Buena (4–7x)",   color: C.teal  },
                  { label: "Media (7–12x)",  color: C.amber },
                  { label: "Saturado (>12x)", color: C.red  },
                ].map((t) => (
                  <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color }} />
                    <span style={{ fontSize: 10, color: C.muted }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </Card>

        {/* ── CROSS MAP (hero) ─────────────────────────────────────────────── */}
        <Card style={{ marginBottom: GAP, border: `1px solid rgba(52,211,153,0.2)`, boxShadow: "0 0 60px rgba(52,211,153,0.06)" }}>
          <SectionTitle sub="Cada punto = una provincia · X: EVs acumulados · Y: Puntos de carga · Tamaño: Población · Color: Ratio EVs/punto de carga">
            Mapa cruzado — Adopción EV vs Cobertura de Carga
          </SectionTitle>

          <EChart option={crossOpt} style={{ height: 500 }} />

          <div style={{ display: "flex", gap: 24, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Excelente (<4x)", color: C.green },
                { label: "Buena (4–7x)",   color: C.teal  },
                { label: "Media (7–12x)",  color: C.amber },
                { label: "Baja (>12x)",    color: C.red   },
              ].map((t) => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.color }} />
                  <span style={{ fontSize: 10, color: C.muted }}>{t.label}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 10, color: C.dim, marginLeft: "auto" }}>
              Línea punteada = ratio promedio España ({AVG_RATIO}x) · Escala logarítmica
            </span>
          </div>

          {/* Coverage summary table */}
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { tier: "Excelente", threshold: (r: number) => r < 4,    color: C.green, icon: "✅" },
              { tier: "Buena",     threshold: (r: number) => r >= 4 && r < 7,  color: C.teal,  icon: "🟢" },
              { tier: "Media",     threshold: (r: number) => r >= 7 && r < 12, color: C.amber, icon: "🟡" },
              { tier: "Baja",      threshold: (r: number) => r >= 12,   color: C.red,   icon: "🔴" },
            ].map((cat) => {
              const provs = CROSS.filter((p) => cat.threshold(p.ratio));
              return (
                <div key={cat.tier} style={{ background: `${cat.color}08`, border: `1px solid ${cat.color}25`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>{cat.icon}</div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: cat.color, marginBottom: 2 }}>{cat.tier}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{provs.length}</p>
                  <p style={{ fontSize: 10, color: C.muted }}>provincias</p>
                  <p style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>
                    {provs.slice(0, 3).map((p) => p.nombre).join(", ")}{provs.length > 3 ? "…" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── EVs vs Cargadores por CCAA (dual axis) ──────────────────────── */}
        <Card style={{ marginBottom: GAP }}>
          <SectionTitle sub="Barras = puntos de carga · Línea = EVs acumulados — ¿hay equilibrio?">
            Balance Adopción vs Infraestructura por CCAA
          </SectionTitle>
          <EChart option={ccaaBalanceOpt} style={{ height: 300 }} />
        </Card>

        {/* ── Province ranking ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP, marginBottom: GAP }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <SectionTitle sub="Top 20 provincias">Ranking provincial</SectionTitle>
              <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3 }}>
                {[
                  { v: "puntos",  l: "Puntos" },
                  { v: "rapidos", l: "Rápidos" },
                  { v: "ratio",   l: "Ratio" },
                  { v: "density", l: "Densidad" },
                ].map((o) => (
                  <button key={o.v} onClick={() => setRankBy(o.v as typeof rankBy)} style={{
                    padding: "3px 9px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 11, fontWeight: 700,
                    background: rankBy === o.v ? "linear-gradient(135deg,#34d399,#38bdf8)" : "transparent",
                    color: rankBy === o.v ? "#fff" : C.muted, transition: "all 0.15s",
                  }}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <EChart option={rankOpt} style={{ height: 520 }} />
          </Card>

          <Card>
            <SectionTitle sub="Provincias más desatendidas (mayor ratio EVs/punto de carga)">
              Brecha de cobertura — Provincias prioritarias
            </SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                {["Provincia", "EVs", "Puntos", "Ratio", "Cobertura"].map((h, i) => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 800, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase",
                    flex: i === 0 ? 1 : 0, width: i === 0 ? undefined : [56, 56, 48, 72][i-1], textAlign: i > 0 ? "right" : "left" }}>
                    {h}
                  </span>
                ))}
              </div>
              {[...CROSS]
                .filter((p) => p.evs > 500) // only relevant provinces
                .sort((a, b) => b.ratio - a.ratio)
                .slice(0, 18)
                .map((p) => {
                  const tier = coverageTier(p.ratio);
                  const pct = Math.min((p.puntos / p.evs) * 100, 100);
                  return (
                    <div key={p.nombre} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.nombre}</span>
                          <span style={{ fontSize: 9, color: C.dim }}>{p.ccaa}</span>
                        </div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${tier.color},${tier.color}88)`, borderRadius: 2 }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: C.muted, width: 56, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtN(p.evs)}</span>
                      <span style={{ fontSize: 11, color: C.muted, width: 56, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtN(p.puntos)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: tier.color, width: 48, textAlign: "right" }}>{p.ratio}x</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: tier.color, background: `${tier.color}15`, borderRadius: 5, padding: "2px 6px", width: 72, textAlign: "center" }}>
                        {tier.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: "rgba(241,245,249,0.18)", textAlign: "center", marginTop: 8 }}>
          Fuentes: ANFAC (total nacional 53.072 pts, dic 2025) · MITMA/IDAE RAIPRE (distribución estimada por provincia) ·
          Operadores: estimación propia basada en memorias corporativas 2025 · Puntos de carga: mapareve.es MITMA RECORE
        </p>
      </div>
    </div>
  );
}
