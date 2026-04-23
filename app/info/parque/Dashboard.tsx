"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useInsights } from "../InsightsContext";
import { DashboardControls } from "../DashboardControls";
import { useWindowWidth } from "../../lib/useIsMobile";
import type { TipoVehiculo } from "../../lib/insights/dgt-bev-phev-data";
import { TIPO_LABELS, PROVINCIAS_ORDENADAS } from "../../lib/insights/dgt-bev-phev-data";
import * as echarts from "echarts";
import {
  dgtParqueResumenPorTipo,
  dgtParqueEdad,
  dgtParqueMensual,
} from "../../lib/insights/dgt-parque-data";
import { EChart } from "../../components/ui/EChart";
import spainGeoJson from "../../../data/spain-provinces.json";

// Registro del mapa (una sola vez a nivel módulo — antes de que cualquier chart lo use)
type SpainGeoJson = { type: "FeatureCollection"; features: { type: string; properties: { cod_prov: string; name: string }; geometry: unknown }[] };

// Mapa dividido en dos: península+Baleares y Canarias (inset abajo-izquierda).
// Esto permite posicionar Canarias libremente sin afectar el encuadre de la península.
const CANARIAS_CODS = new Set(["35", "38"]);
const spainSrc = spainGeoJson as unknown as SpainGeoJson;
const spainPeninsulaGeo: SpainGeoJson = {
  ...spainSrc,
  features: spainSrc.features.filter((f) => !CANARIAS_CODS.has(f.properties.cod_prov)),
};
const spainCanariasGeo: SpainGeoJson = {
  ...spainSrc,
  features: spainSrc.features.filter((f) => CANARIAS_CODS.has(f.properties.cod_prov)),
};

echarts.registerMap("spain-peninsula", spainPeninsulaGeo as unknown as Parameters<typeof echarts.registerMap>[1]);
echarts.registerMap("spain-canarias", spainCanariasGeo as unknown as Parameters<typeof echarts.registerMap>[1]);

// Mapeo código letra (DashboardControls) → código INE numérico (JSON parque).
// Uso: el filtro de provincia pasa 'M' (Madrid), pero el JSON indexa por '28'.
const PROV_LETRA_A_INE: Record<string, string> = {
  A: "03", AB: "02", AL: "04", AV: "05", B: "08", BA: "06", BI: "48", BU: "09",
  C: "15", CA: "11", CC: "10", CE: "51", CO: "14", CR: "13", CS: "12", CU: "16",
  GC: "35", GI: "17", GR: "18", GU: "19", H: "21", HU: "22", IB: "07", J: "23",
  L: "25", LE: "24", LO: "26", LU: "27", M: "28", MA: "29", ME: "52", MU: "30",
  NA: "31", O: "33", OR: "32", P: "34", PM: "07", PO: "36", S: "39", SA: "37",
  SE: "41", SG: "40", SO: "42", SS: "20", T: "43", TE: "44", TF: "38", TO: "45",
  V: "46", VA: "47", VI: "01", Z: "50", ZA: "49",
};
function provIne(codLetra: string): string {
  return PROV_LETRA_A_INE[codLetra] ?? codLetra;
}
// Reverse lookup: INE → nombre provincia (para etiquetas en nuevos charts).
const INE_A_NOMBRE: Record<string, string> = Object.fromEntries(
  Object.entries(PROV_LETRA_A_INE).map(([letra, ine]) => [
    ine,
    PROVINCIAS_ORDENADAS.find((p) => p.cod === letra)?.nombre ?? ine,
  ])
);

// ─────────────────────────────────────────────────────────────────────────────
// MAPEO TipoVehiculo (matriculaciones) → tipo_grupo del JSON de parque
// ─────────────────────────────────────────────────────────────────────────────

const TIPOS_ORDER: TipoVehiculo[] = [
  "turismo", "furgoneta", "moto_scooter", "trimoto",
  "quad_atv", "microcar", "camion", "autobus", "agricola", "especial", "remolque", "otros",
];
const TIPOS_DEFAULT: TipoVehiculo[] = ["turismo", "furgoneta", "camion", "autobus"];

const FILTRO_TO_PARQUE_TIPOS: Record<TipoVehiculo, string[]> = {
  todos:            ["turismo", "furgoneta_van", "moto", "trimoto", "quad_atv", "microcar", "camion", "autobus", "agricola", "especial", "remolque", "otros"],
  turismo:          ["turismo"],
  furgoneta:        ["furgoneta_van"],
  moto_scooter:     ["moto"],
  trimoto:          ["trimoto"],
  quad_atv:         ["quad_atv"],
  microcar:         ["microcar"],
  camion:           ["camion"],
  autobus:          ["autobus"],
  agricola:         ["agricola"],
  especial:         ["especial"],
  remolque:         ["remolque"],
  otros:            ["otros"],
};

function filtroToParqueTipos(filtros: TipoVehiculo[]): string[] {
  return filtros.flatMap((f) => FILTRO_TO_PARQUE_TIPOS[f]);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-COMPUTED (módulo — no cambian)
// ─────────────────────────────────────────────────────────────────────────────

const PERIODOS  = dgtParqueMensual.map((m) => m.periodo);

const IDX_PRIMER_REAL = dgtParqueMensual.findIndex((m) => m.fuente === "real");
const PERIODO_PRIMER_REAL = IDX_PRIMER_REAL >= 0 ? dgtParqueMensual[IDX_PRIMER_REAL].periodo : null;

// ─────────────────────────────────────────────────────────────────────────────
// FILTRADO — combinación tec × tipo × provincia
// Para meses reales: usamos parque_por_provincia_tipo (desde ZIP DGT).
// Para meses calculados: escalamos el valor nacional por el share provincial
// observado en el primer mes real (aproximación lineal; se marca visualmente).
// ─────────────────────────────────────────────────────────────────────────────

type Cat = "BEV" | "PHEV";

/** Suma valores de parque_por_tipo filtrado por tipos y cat. */
function sumGlobal(m: (typeof dgtParqueMensual)[number], tipos: string[], cat: Cat | "no_enchufable" | "total"): number {
  if (!m.parque_por_tipo) {
    if (cat === "total") return m.parque_total;
    if (cat === "no_enchufable") return m.parque_no_enchufable;
    return m.parque_acumulado[cat] ?? 0;
  }
  return tipos.reduce((s, t) => s + ((m.parque_por_tipo as Record<string, Record<string, number>>)[t]?.[cat] ?? 0), 0);
}

/** Suma valores de parque_por_provincia_tipo para una provincia filtrada por tipos y cat. */
function sumProv(m: (typeof dgtParqueMensual)[number], prov: string, tipos: string[], cat: Cat | "no_enchufable" | "total"): number {
  const pb = m.parque_por_provincia_tipo;
  const ine = provIne(prov);
  if (!pb || !pb[ine]) return 0;
  return tipos.reduce((s, t) => s + ((pb[ine] as Record<string, Record<string, number>>)[t]?.[cat] ?? 0), 0);
}

/**
 * Construye una serie temporal según filtros. Si provincia="todas" usa el
 * breakdown global. Si es una provincia concreta: para meses reales usa la
 * data directa; para meses calculados aplica scaling proporcional al share
 * que tiene la provincia en el primer mes real.
 */
function buildSerie(
  tiposFiltro: TipoVehiculo[],
  provincia: string,
  cat: Cat | "no_enchufable" | "total"
): number[] {
  const parqueTipos = filtroToParqueTipos(tiposFiltro);
  const isAllTipos = tiposFiltro.length === TIPOS_ORDER.length;
  const resolvedTipos = isAllTipos ? FILTRO_TO_PARQUE_TIPOS.todos : parqueTipos;

  if (provincia === "todas") {
    return dgtParqueMensual.map((m) => sumGlobal(m, resolvedTipos, cat));
  }

  // Provincia concreta: share para escalar meses calculados
  const anchor = dgtParqueMensual[IDX_PRIMER_REAL];
  const nationalAnchor = anchor ? sumGlobal(anchor, resolvedTipos, cat) : 0;
  const provAnchor     = anchor ? sumProv(anchor, provincia, resolvedTipos, cat) : 0;
  const share = nationalAnchor > 0 ? provAnchor / nationalAnchor : 0;

  return dgtParqueMensual.map((m) => {
    if (m.fuente === "real") return sumProv(m, provincia, resolvedTipos, cat);
    const national = sumGlobal(m, resolvedTipos, cat);
    return Math.round(national * share);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.11)",
  bev:    "#38bdf8",
  phev:   "#fb923c",
  green:  "#34d399",
  red:    "#f87171",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.42)",
  dim:    "rgba(241,245,249,0.20)",
  grid:   "rgba(255,255,255,0.045)",
};

const TT = {
  backgroundColor: "rgba(5,8,16,0.97)",
  borderColor: C.border,
  textStyle: { color: C.muted, fontSize: 12 },
  extraCssText: "border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.6);padding:10px 14px;",
};

function hex2rgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

function linGrad(hex: string, a0 = 0.4, a1 = 0.04) {
  const rgb = hex2rgb(hex);
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `rgba(${rgb},${a0})` },
    { offset: 1, color: `rgba(${rgb},${a1})` },
  ]);
}

function fmtN(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-ES");
}

function kLabel(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — react a cambios en deps
// ─────────────────────────────────────────────────────────────────────────────

function useChart(
  ref: React.RefObject<HTMLDivElement | null>,
  build: () => Record<string, unknown>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    chart.setOption(build(), true);
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => { chart.dispose(); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────

function YoyBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  const col = up ? C.green : C.red;
  return (
    <span style={{
      fontSize: 12, fontWeight: 700,
      color: col,
      background: up ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
      borderRadius: 6, padding: "2px 8px",
      display: "inline-flex", alignItems: "center", gap: 3,
    }}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function KpiCard({
  emoji, label, value, sub, color, badge, yoyPct, yoyLabel, secondary,
}: {
  emoji: string; label: React.ReactNode; value: string; sub?: React.ReactNode; color: string;
  badge?: React.ReactNode; yoyPct?: number; yoyLabel?: string;
  secondary?: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; color?: string; size?: number };
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.11)",
      borderRadius: 18,
      padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 8,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -24, right: -24,
        width: 80, height: 80, borderRadius: "50%",
        background: `${color}18`, filter: "blur(24px)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
          {label}
        </span>
      </div>

      <span style={{ fontSize: 30, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {yoyPct !== undefined && <YoyBadge pct={yoyPct} />}
        {yoyPct !== undefined && yoyLabel && (
          <span style={{ fontSize: 11, color: C.muted }}>vs {yoyLabel}</span>
        )}
        {badge && (
          <span style={{ fontSize: 11, background: `rgba(${hex2rgb(color)},0.15)`, color, borderRadius: 5, padding: "2px 8px", fontWeight: 600 }}>
            {badge}
          </span>
        )}
      </div>

      {sub && <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{sub}</span>}

      {secondary && (
        <div style={{
          marginTop: 10, paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.11)",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
            {secondary.label}
          </span>
          <span style={{ fontSize: secondary.size ?? 26, fontWeight: 700, color: secondary.color ?? C.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {secondary.value}
          </span>
          {secondary.sub && (
            <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{secondary.sub}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARTS
// ─────────────────────────────────────────────────────────────────────────────

const C_NOENCH = "#94a3b8";

function splitSerie(serie: number[], idxReal: number): { calc: (number | null)[]; real: (number | null)[] } {
  if (idxReal < 0) return { calc: serie.slice(), real: serie.map(() => null) };
  const calc = serie.map((v, i) => (i <= idxReal ? v : null));
  const real = serie.map((v, i) => (i >= idxReal ? v : null));
  return { calc, real };
}

type TecFiltro = "ambos" | "bev" | "phev";

function ChartParqueEvolucion({
  parBev, parPhev, parNoEnch, tec,
}: { parBev: number[]; parPhev: number[]; parNoEnch: number[]; tec: TecFiltro }) {
  const ref = useRef<HTMLDivElement>(null);

  // Recortar a 2020+ (evita años pre-2020 con datos calculados de baja calidad)
  const from2020 = PERIODOS.findIndex((p) => p.startsWith("2020"));
  const startIdx = from2020 >= 0 ? from2020 : 0;
  const periods  = PERIODOS.slice(startIdx);
  const bev      = parBev.slice(startIdx);
  const phev     = parPhev.slice(startIdx);
  const noEnch   = parNoEnch.slice(startIdx);
  const parEnch  = bev.map((v, i) => v + phev[i]);
  const idx      = IDX_PRIMER_REAL >= 0 ? IDX_PRIMER_REAL - startIdx : -1;

  const showBev  = tec !== "phev";
  const showPhev = tec !== "bev";
  const showEnch = tec === "ambos";

  // ─── Eje Y partido (broken axis) ────────────────────────────────────────
  // Un único grid con eje virtual 0–100 y transformación piece-wise:
  //   Real [0, BREAK_LOW]          → Virtual [0, ZONE_LOW_END=42]
  //   Real [BREAK_LOW, BREAK_HIGH] → GAP (no se dibuja)
  //   Real [BREAK_HIGH, DATA_MAX]  → Virtual [ZONE_HIGH_START=55, 100]
  const ZONE_LOW_END    = 42;
  const ZONE_HIGH_START = 55;
  const maxEnch    = Math.max(1, ...parEnch);
  const maxNoEnchV = Math.max(1, ...noEnch);
  const minNoEnchV = Math.min(...noEnch);
  const BREAK_LOW  = maxEnch * 1.15;
  const BREAK_HIGH = Math.max(BREAK_LOW + 1, minNoEnchV - (maxNoEnchV - minNoEnchV) * 0.2);
  const DATA_MAX   = maxNoEnchV * 1.03;

  const toVirtual = (v: number | null): number | null => {
    if (v === null || v === undefined) return null;
    if (v <= BREAK_LOW)  return (v / BREAK_LOW) * ZONE_LOW_END;
    if (v >= BREAK_HIGH) return ZONE_HIGH_START + ((v - BREAK_HIGH) / (DATA_MAX - BREAK_HIGH)) * (100 - ZONE_HIGH_START);
    return ZONE_LOW_END + ((v - BREAK_LOW) / (BREAK_HIGH - BREAK_LOW)) * (ZONE_HIGH_START - ZONE_LOW_END);
  };
  const toReal = (vy: number): number => {
    if (vy <= ZONE_LOW_END)    return (vy / ZONE_LOW_END) * BREAK_LOW;
    if (vy >= ZONE_HIGH_START) return BREAK_HIGH + ((vy - ZONE_HIGH_START) / (100 - ZONE_HIGH_START)) * (DATA_MAX - BREAK_HIGH);
    return BREAK_LOW + ((vy - ZONE_LOW_END) / (ZONE_HIGH_START - ZONE_LOW_END)) * (BREAK_HIGH - BREAK_LOW);
  };

  // Encoder: convierte un array real a items {value: virtual, _real: real} para que
  // el tooltip tenga acceso al valor original vía param.data._real
  const enc = (arr: (number | null)[]) => arr.map((v) => ({ value: toVirtual(v), _real: v }));

  const sBev    = splitSerie(bev,     idx);
  const sPhev   = splitSerie(phev,    idx);
  const sEnch   = splitSerie(parEnch, idx);
  const sNoEnch = splitSerie(noEnch,  idx);

  // Ticks explícitos: 5 en banda baja, 5 en banda alta, ninguno en el gap
  const lowTicks  = [0, BREAK_LOW * 0.25, BREAK_LOW * 0.5, BREAK_LOW * 0.75, BREAK_LOW];
  const highStep  = (DATA_MAX - BREAK_HIGH) / 4;
  const highTicks = [BREAK_HIGH, BREAK_HIGH + highStep, BREAK_HIGH + 2 * highStep, BREAK_HIGH + 3 * highStep, DATA_MAX];
  const customTicks = [...lowTicks, ...highTicks].map((t) => toVirtual(t) as number);

  useChart(ref, () => {
    const legendData: string[] = ["No enchufables"];
    if (showPhev) legendData.push("PHEV");
    if (showBev)  legendData.push("BEV");
    if (showEnch) legendData.push("Enchufables");

    const series: Record<string, unknown>[] = [];

    // ── CALCULADOS (punteados, sin área) ──
    series.push({
      name: "No enchufables", type: "line", data: enc(sNoEnch.calc), smooth: true, symbol: "none",
      lineStyle: { color: C_NOENCH, width: 1.2, type: "dashed", opacity: 0.55 }, showInLegend: false,
    });
    if (showPhev) series.push({
      name: "PHEV", type: "line", data: enc(sPhev.calc), smooth: true, symbol: "none",
      lineStyle: { color: C.phev, width: 1.4, type: "dashed", opacity: 0.55 }, showInLegend: false,
    });
    if (showBev) series.push({
      name: "BEV", type: "line", data: enc(sBev.calc), smooth: true, symbol: "none",
      lineStyle: { color: C.bev, width: 1.4, type: "dashed", opacity: 0.55 }, showInLegend: false,
    });
    if (showEnch) series.push({
      name: "Enchufables", type: "line", data: enc(sEnch.calc), smooth: true, symbol: "none",
      lineStyle: { color: C.green, width: 1.8, type: "dashed", opacity: 0.55 }, showInLegend: false,
    });

    // ── REALES (sólidos). Enchufables con área hasta 0; no-enchufables sin área (no tiene sentido). ──
    series.push({
      name: "No enchufables", type: "line", data: enc(sNoEnch.real), smooth: true, symbol: "none",
      lineStyle: { color: C_NOENCH, width: 2 },
    });
    if (showPhev) series.push({
      name: "PHEV", type: "line", data: enc(sPhev.real), smooth: true, symbol: "none",
      lineStyle: { color: C.phev, width: 2.2 },
      areaStyle: { color: linGrad(C.phev, 0.25, 0.02) },
    });
    if (showBev) series.push({
      name: "BEV", type: "line", data: enc(sBev.real), smooth: true, symbol: "none",
      lineStyle: { color: C.bev, width: 2.2 },
      areaStyle: { color: linGrad(C.bev, 0.25, 0.02) },
    });
    if (showEnch) series.push({
      name: "Enchufables", type: "line", data: enc(sEnch.real), smooth: true, symbol: "none",
      lineStyle: { color: C.green, width: 2.8 },
      areaStyle: { color: linGrad(C.green, 0.20, 0.02) },
    });

    // ── Marca vertical umbral real/calculado ──
    if (idx >= 0) series.push({
      name: "__split", type: "line", data: [], markLine: {
        silent: true, symbol: "none",
        lineStyle: { color: C.muted, width: 1, type: "dashed", opacity: 0.5 },
        label: {
          show: true, position: "middle", color: C.muted, fontSize: 10,
          rotate: 90, distance: 6,
          formatter: `DGT real ${PERIODO_PRIMER_REAL} →`,
        },
        data: [{ xAxis: PERIODO_PRIMER_REAL as string }],
      },
    });

    return {
      backgroundColor: "transparent",
      grid: { top: 32, right: 80, bottom: 48, left: 24 },
      tooltip: { ...TT, trigger: "axis",
        formatter: (params: Record<string, unknown>[]) => {
          const p = (params[0] as { axisValue: string }).axisValue;
          const fuente = dgtParqueMensual.find((m) => m.periodo === p)?.fuente ?? "calculado";
          const tag = fuente === "real"
            ? `<span style="font-size:10px;color:${C.green};background:rgba(52,211,153,0.14);border-radius:3px;padding:1px 6px;margin-left:6px">DGT real</span>`
            : `<span style="font-size:10px;color:${C.muted};background:rgba(148,163,184,0.14);border-radius:3px;padding:1px 6px;margin-left:6px">calculado</span>`;
          const colorFor = (name: string) =>
            name === "No enchufables" ? C_NOENCH
            : name === "BEV"          ? C.bev
            : name === "PHEV"         ? C.phev
            : name === "Enchufables"  ? C.green
            : C.muted;
          const uniq = new Map<string, { realValue: number; seriesName: string }>();
          for (const s of params as { data: { _real: number | null }; seriesName: string }[]) {
            const real = s.data?._real;
            if (real === null || real === undefined) continue;
            const key = s.seriesName.replace(/ \(.*\)$/, "");
            if (!uniq.has(key)) uniq.set(key, { realValue: real, seriesName: s.seriesName });
          }
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p}${tag}</div>` +
            [...uniq.values()].map((s) => {
              const name = s.seriesName.replace(/ \(.*\)$/, "");
              const col = colorFor(name);
              return `<div style="display:flex;gap:12px;justify-content:space-between">` +
                `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${col};margin-right:5px"></span>${name}</span>` +
                `<span style="font-weight:600;color:${C.text}">${fmtN(s.realValue)}</span></div>`;
            }).join("");
        }
      },
      legend: {
        top: 0, right: 0,
        textStyle: { color: C.muted, fontSize: 12 },
        icon: "rect",
        itemWidth: 20, itemHeight: 3,
        itemGap: 14,
        data: legendData.map((name) => ({
          name,
          itemStyle: {
            color: name === "No enchufables" ? C_NOENCH
                 : name === "BEV"            ? C.bev
                 : name === "PHEV"           ? C.phev
                 : name === "Enchufables"    ? C.green
                 : C.muted,
          },
        })),
      },
      xAxis: { type: "category", data: periods,
        axisLabel: { color: C.muted, fontSize: 11,
          formatter: (v: string) => {
            const [y, m] = v.split("-");
            return m === "01" ? y : (m === "06" ? `Jun ${y}` : "");
          }
        },
        axisLine: { lineStyle: { color: C.grid } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        position: "right",
        min: 0, max: 100,
        interval: 100, // suprimir splitLines/ticks automáticos
        axisLabel: {
          color: C.muted, fontSize: 11,
          customValues: customTicks,
          formatter: (v: number) => kLabel(toReal(v)),
        },
        axisLine:  { show: true, lineStyle: { color: C.grid } },
        splitLine: { show: true, lineStyle: { color: C.grid, opacity: 0.35 } },
      },
      series,
    };
  }, [parBev, parPhev, parNoEnch, tec]);
  return <div ref={ref} style={{ width: "100%", height: 400 }} />;
}

function ChartPorTipo({ entries, tec }: { entries: { tipo: string; BEV: number; PHEV: number }[]; tec: TecFiltro }) {
  const ref = useRef<HTMLDivElement>(null);
  const labelFor = (t: string) => (TIPO_LABELS[t as TipoVehiculo] ?? t.replace(/_/g, " "));
  const tipos    = entries.map((t) => labelFor(t.tipo));
  const bevData  = entries.map((t) => t.BEV);
  const phevData = entries.map((t) => Math.max(t.PHEV, 0));

  useChart(ref, () => {
    const series: Record<string, unknown>[] = [];
    if (tec !== "phev") series.push({
      name: "BEV", type: "bar", data: bevData, stack: "t", barMaxWidth: 28,
      itemStyle: { color: C.bev, borderRadius: 0 },
    });
    if (tec !== "bev") series.push({
      name: "PHEV", type: "bar", data: phevData, stack: "t", barMaxWidth: 28,
      itemStyle: { color: C.phev, borderRadius: [3, 3, 0, 0] },
    });

    return {
      backgroundColor: "transparent",
      grid: { top: 36, right: 12, bottom: 48, left: 56 },
      tooltip: { ...TT, trigger: "axis", axisPointer: { type: "shadow" },
        formatter: (params: Record<string, unknown>[]) => {
          const tg = (params[0] as { axisValue: string }).axisValue;
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${tg}</div>` +
            (params as { value: number; seriesName: string; color: string }[]).filter((s) => s.value > 0).map((s) =>
              `<div style="display:flex;gap:12px;justify-content:space-between">` +
              `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
              `<span style="font-weight:600;color:${C.text}">${fmtN(s.value)}</span></div>`
            ).join("");
        }
      },
      legend: { orient: "horizontal", right: 0, top: 0, textStyle: { color: C.muted, fontSize: 11 }, icon: "rect", itemWidth: 12, itemHeight: 8 },
      xAxis: { type: "category", data: tipos,
        axisLabel: { color: C.muted, fontSize: 11, interval: 0, rotate: 30 },
        axisLine: { lineStyle: { color: C.grid } },
      },
      yAxis: { type: "value",
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
        splitLine: { lineStyle: { color: C.grid } },
      },
      series,
    };
  }, [entries, tec]);
  return <div ref={ref} style={{ width: "100%", height: 360 }} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// NUEVOS CHARTS (2ª fila de insights — debajo de los existentes)
// ═════════════════════════════════════════════════════════════════════════════

// ─── Chart 4 — Distintivo ambiental (donut) ────────────────────────────────
const DISTINTIVO_ORDER = ["CERO", "ECO", "DISTINTIVO C", "DISTINTIVO B", "SIN DISTINTIVO"];
const DISTINTIVO_COLORS: Record<string, string> = {
  CERO:             "#3b82f6",
  ECO:              "#34d399",
  "DISTINTIVO C":   "#facc15",
  "DISTINTIVO B":   "#fb923c",
  "SIN DISTINTIVO": "#6b7280",
};
const DISTINTIVO_LABELS: Record<string, string> = {
  CERO:             "CERO",
  ECO:              "ECO",
  "DISTINTIVO C":   "C",
  "DISTINTIVO B":   "B",
  "SIN DISTINTIVO": "Sin distintivo",
};
function ChartDistintivo({ data }: { data: Record<string, number> }) {
  const ref = useRef<HTMLDivElement>(null);
  useChart(ref, () => {
    const entries = DISTINTIVO_ORDER
      .filter((k) => (data[k] ?? 0) > 0)
      .map((k) => ({ name: DISTINTIVO_LABELS[k], value: data[k], _k: k }));
    const total = entries.reduce((s, e) => s + e.value, 0);
    return {
      backgroundColor: "transparent",
      tooltip: { ...TT, trigger: "item",
        formatter: (p: { name: string; value: number; percent: number }) =>
          `<div style="color:${C.text};font-weight:600;margin-bottom:4px">${p.name}</div>` +
          `<div>${fmtN(p.value)} (${p.percent.toFixed(1)}%)</div>`,
      },
      legend: { orient: "vertical", right: 0, top: "center", textStyle: { color: C.muted, fontSize: 12 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: "pie", radius: ["55%", "82%"], center: ["38%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: C.bg, borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: entries.map((e) => ({
          name: e.name, value: e.value,
          itemStyle: { color: DISTINTIVO_COLORS[e._k] },
        })),
      }, {
        type: "pie", radius: ["0%", "0%"], center: ["38%", "50%"],
        silent: true,
        label: {
          show: true, position: "center",
          formatter: [`{v|${kLabel(total)}}`, `{s|total}`].join("\n"),
          rich: {
            v: { color: C.text, fontSize: 22, fontWeight: 700, lineHeight: 28 },
            s: { color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 },
          },
        },
        data: [{ value: 0 }],
      }],
    };
  }, [data]);
  return <div ref={ref} style={{ width: "100%", height: 280 }} />;
}

// ─── Chart 3 — Pirámide de edad del parque ──────────────────────────────────
function ChartPiramideEdad({ edad, tec }: { edad: NonNullable<typeof dgtParqueEdad>; tec: TecFiltro }) {
  const ref = useRef<HTMLDivElement>(null);
  useChart(ref, () => {
    const años = Object.keys(edad.por_anio).map(Number).sort((a, b) => a - b);
    if (años.length === 0) return { backgroundColor: "transparent" };
    const cutoff = años[años.length - 1] - 30; // últimos 30 años de antigüedad
    const used  = años.filter((y) => y >= cutoff);
    const bev   = used.map((y) => edad.por_anio[y]?.BEV ?? 0);
    const phev  = used.map((y) => edad.por_anio[y]?.PHEV ?? 0);
    const hev   = used.map((y) => (edad.por_anio[y]?.HEV ?? 0) + (edad.por_anio[y]?.REEV ?? 0) + (edad.por_anio[y]?.FCEV ?? 0));
    const noev  = used.map((y) => edad.por_anio[y]?.NO_EV ?? 0);
    type Serie = { name: string; data: number[]; color: string };
    const allSeries: Serie[] = [
      { name: "No enchufables", data: noev, color: C_NOENCH },
      { name: "HEV/otros",      data: hev,  color: "#a78bfa" },
      { name: "PHEV",           data: phev, color: C.phev },
      { name: "BEV",            data: bev,  color: C.bev },
    ];
    // Filtrar series según filtro de tecnología
    const visibles: Serie[] = tec === "bev"
      ? [{ name: "BEV", data: bev, color: C.bev }]
      : tec === "phev"
      ? [{ name: "PHEV", data: phev, color: C.phev }]
      : allSeries;
    return {
      backgroundColor: "transparent",
      grid: { top: 30, right: 24, bottom: 36, left: 60 },
      tooltip: { ...TT, trigger: "axis", axisPointer: { type: "shadow" },
        formatter: (params: Record<string, unknown>[]) => {
          const año = (params[0] as { axisValue: string }).axisValue;
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">Matriculado en ${año}</div>` +
            (params as { value: number; seriesName: string; color: string }[]).filter((s) => s.value > 0).map((s) =>
              `<div style="display:flex;gap:12px;justify-content:space-between">` +
              `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
              `<span style="font-weight:600;color:${C.text}">${fmtN(s.value)}</span></div>`
            ).join("");
        }
      },
      legend: { top: 0, right: 0, textStyle: { color: C.muted, fontSize: 12 }, itemWidth: 14, itemHeight: 4 },
      xAxis: { type: "category", data: used.map(String),
        axisLabel: { color: C.muted, fontSize: 10, interval: 2 },
        axisLine: { lineStyle: { color: C.grid } },
        splitLine: { show: false },
      },
      yAxis: { type: "value",
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
        splitLine: { lineStyle: { color: C.grid } },
      },
      series: visibles.map((s) => ({
        name: s.name, type: "bar", stack: "t", data: s.data, barMaxWidth: 14, itemStyle: { color: s.color },
      })),
    };
  }, [edad, tec]);
  return <div ref={ref} style={{ width: "100%", height: 300 }} />;
}

// ─── Chart 13 — Saldo neto por tipo (último mes) ───────────────────────────
function ChartSaldoNetoPorTipo({
  entries, tec,
}: { entries: { tipo: string; netBev: number; netPhev: number }[]; tec: TecFiltro }) {
  const ref = useRef<HTMLDivElement>(null);
  const labelFor = (t: string) => (TIPO_LABELS[t as TipoVehiculo] ?? t.replace(/_/g, " "));
  useChart(ref, () => {
    const tipos    = entries.map((e) => labelFor(e.tipo)).reverse();
    const bevData  = entries.map((e) => e.netBev).reverse();
    const phevData = entries.map((e) => e.netPhev).reverse();
    const series: Record<string, unknown>[] = [];
    if (tec !== "phev") series.push({
      name: "BEV neto", type: "bar", data: bevData, stack: "t", barMaxWidth: 20,
      itemStyle: { color: (p: { value: number }) => p.value >= 0 ? C.bev : C.red },
    });
    if (tec !== "bev") series.push({
      name: "PHEV neto", type: "bar", data: phevData, stack: "t", barMaxWidth: 20,
      itemStyle: { color: (p: { value: number }) => p.value >= 0 ? C.phev : C.red },
    });
    return {
      backgroundColor: "transparent",
      grid: { top: 20, right: 28, bottom: 8, left: 110, containLabel: false },
      tooltip: { ...TT, trigger: "axis", axisPointer: { type: "shadow" },
        formatter: (params: Record<string, unknown>[]) => {
          const tg = (params[0] as { axisValue: string }).axisValue;
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${tg}</div>` +
            (params as { value: number; seriesName: string; color: string }[]).filter((s) => s.value !== 0).map((s) =>
              `<div style="display:flex;gap:12px;justify-content:space-between">` +
              `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
              `<span style="font-weight:600;color:${s.value >= 0 ? C.green : C.red}">${s.value >= 0 ? "+" : ""}${fmtN(s.value)}</span></div>`
            ).join("");
        }
      },
      legend: { show: false },
      xAxis: { type: "value",
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => v >= 0 ? `+${fmtN(v)}` : fmtN(v) },
        splitLine: { lineStyle: { color: C.grid } },
      },
      yAxis: { type: "category", data: tipos,
        axisLabel: { color: C.muted, fontSize: 12 },
        axisLine: { show: false },
      },
      series,
    };
  }, [entries, tec]);
  return <div ref={ref} style={{ width: "100%", height: Math.max(200, entries.length * 44) }} />;
}

// ─── Chart 10 — Scatter penetración EV × volumen por provincia ──────────────
// ─── Chart — Donut parque activo (ECharts, replica del donut de /info/social) ──
// BEV y PHEV tienen ángulos fijos (28° y 22°) para que sean legibles aunque
// su proporción real sea ~1.6%. El tooltip y la penetración central muestran
// valores reales; las etiquetas externas muestran el % real, no el exagerado.
function ChartParqueDonut({
  bev, phev, noEnch, tec,
}: { bev: number; phev: number; noEnch: number; tec: TecFiltro }) {
  const ref = useRef<HTMLDivElement>(null);
  const total = bev + phev + noEnch;
  const showBev  = tec !== "phev";
  const showPhev = tec !== "bev";
  // Penetración central se ajusta al filtro: solo BEV / solo PHEV / ambos
  const enchActivos = (showBev ? bev : 0) + (showPhev ? phev : 0);
  const penetPct = total > 0 ? ((enchActivos / total) * 100).toFixed(2).replace(".", ",") : null;
  const bevPct    = total > 0 ? ((bev    / total) * 100)                    : 0;
  const phevPct   = total > 0 ? ((phev   / total) * 100)                    : 0;
  const noEnchPct = total > 0 ? ((noEnch / total) * 100)                    : 0;

  useChart(ref, () => {
    // Ángulos exagerados (en grados). Si solo una tec está activa, ocupa 50° (28+22)
    const BEV_DEG_BASE = 28, PHEV_DEG_BASE = 22, GAP = 2.5;
    const BEV_DEG  = showBev && !showPhev ? BEV_DEG_BASE + PHEV_DEG_BASE : showBev  ? BEV_DEG_BASE  : 0;
    const PHEV_DEG = showPhev && !showBev ? BEV_DEG_BASE + PHEV_DEG_BASE : showPhev ? PHEV_DEG_BASE : 0;
    const activeSlices = (showBev ? 1 : 0) + (showPhev ? 1 : 0);
    const totalGaps = activeSlices + 1; // gaps entre slices visibles + antes y después del bg
    const BG_DEG = 360 - BEV_DEG - PHEV_DEG - GAP * totalGaps;

    // Ticks cada 10° como serie pie independiente (2° visibles + 8° transparentes)
    const tickData = Array.from({ length: 36 }).flatMap(() => [
      { value: 1.5, itemStyle: { color: "rgba(255,255,255,0.18)" } },
      { value: 8.5, itemStyle: { color: "transparent" } },
    ]);

    const gap = { name: "__gap", value: GAP, itemStyle: { color: "transparent" }, label: { show: false }, labelLine: { show: false } };
    const makeDonutData = (haloOnly: boolean) => {
      const out: Record<string, unknown>[] = [];
      if (showBev) {
        out.push({
          name: "BEV",
          value: BEV_DEG,
          _real: bev,
          _realPct: bevPct,
          itemStyle: { color: haloOnly ? "rgba(56,189,248,0.14)" : C.bev },
          label:     haloOnly ? { show: false } : {
            show: true, position: "outside",
            formatter: `${bevPct.toFixed(2).replace(".", ",")}%`,
            color: C.bev, fontSize: 17, fontWeight: 700,
          },
          labelLine: haloOnly ? { show: false } : {
            show: true, length: 10, length2: 15,
            lineStyle: { color: "rgba(56,189,248,0.45)", type: "dashed", width: 1.3 },
          },
        });
        out.push({ ...gap });
      }
      if (showPhev) {
        out.push({
          name: "PHEV",
          value: PHEV_DEG,
          _real: phev,
          _realPct: phevPct,
          itemStyle: { color: haloOnly ? "rgba(251,146,60,0.14)" : C.phev },
          label:     haloOnly ? { show: false } : {
            show: true, position: "outside",
            formatter: `${phevPct.toFixed(2).replace(".", ",")}%`,
            color: C.phev, fontSize: 17, fontWeight: 700,
          },
          labelLine: haloOnly ? { show: false } : {
            show: true, length: 18, length2: 24,
            lineStyle: { color: "rgba(251,146,60,0.45)", type: "dashed", width: 1.3 },
          },
        });
        out.push({ ...gap });
      }
      out.push({
        name: "No enchufables",
        value: BG_DEG,
        _real: noEnch,
        _realPct: noEnchPct,
        itemStyle: { color: haloOnly ? "transparent" : "rgba(255,255,255,0.05)" },
        label: { show: false }, labelLine: { show: false },
      });
      out.push({ ...gap });
      return out;
    };

    return {
      backgroundColor: "transparent",
      tooltip: { ...TT, trigger: "item",
        formatter: (p: { name: string; data: { _real?: number; _realPct?: number } }) => {
          const d = p.data;
          if (!d || d._real === undefined || d._real === null || !Number.isFinite(d._real)) return "";
          const col = p.name === "BEV" ? C.bev : p.name === "PHEV" ? C.phev : C_NOENCH;
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:4px">${p.name}</div>` +
            `<div><span style="color:${col}">${fmtN(d._real)}</span> <span style="color:${C.muted}">vehículos</span></div>` +
            `<div style="color:${C.muted};font-size:11px;margin-top:2px">${(d._realPct ?? 0).toFixed(2)}% real del parque</div>`;
        },
      },
      graphic: [
        { type: "text", left: "center", top: "42%", z: 10, silent: true,
          style: { text: penetPct != null ? `${penetPct}%` : "—",
            fill: C.green, fontSize: 37, fontWeight: 900,
            textAlign: "center", textVerticalAlign: "middle" } },
        { type: "text", left: "center", top: "57%", z: 10, silent: true,
          style: { text: "ENCHUFABLES",
            fill: C.muted, fontSize: 10, fontWeight: 600,
            textAlign: "center", textVerticalAlign: "middle" } },
      ],
      series: [
        // Ticks decorativos
        {
          type: "pie", silent: true,
          radius: ["92%", "98%"], center: ["50%", "50%"],
          startAngle: 90,
          label: { show: false }, labelLine: { show: false },
          data: tickData,
          animation: false,
        },
        // Halo (atrás) — ligeramente más ancho que el donut principal
        {
          type: "pie", silent: true,
          radius: ["48%", "90%"], center: ["50%", "50%"],
          startAngle: 90,
          label: { show: false }, labelLine: { show: false },
          data: makeDonutData(true),
          animation: false,
        },
        // Donut principal — interactivo
        {
          type: "pie",
          radius: ["55%", "82%"], center: ["50%", "50%"],
          startAngle: 90,
          avoidLabelOverlap: false,
          emphasis: {
            scale: true, scaleSize: 5,
            itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.3)" },
            label: { fontSize: 19 },
          },
          data: makeDonutData(false),
        },
      ],
    };
  }, [bev, phev, noEnch, tec]);

  return <div ref={ref} style={{ width: "100%", height: 357 }} />;
}

function ChartScatterProv({
  points, tec,
}: { points: { prov: string; pen: number; evs: number; total: number }[]; tec: TecFiltro }) {
  const ref = useRef<HTMLDivElement>(null);
  const accent = tec === "bev" ? C.bev : tec === "phev" ? C.phev : C.green;
  useChart(ref, () => {
    const maxEv = Math.max(1, ...points.map((p) => p.evs));
    const serieLabel = tec === "bev" ? "BEV" : tec === "phev" ? "PHEV" : "Enchufables";
    return {
      backgroundColor: "transparent",
      grid: { top: 24, right: 24, bottom: 52, left: 72 },
      tooltip: { ...TT, trigger: "item",
        formatter: (p: { data: { value: [number, number]; prov: string; evs: number; total: number } }) => {
          const d = p.data;
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:4px">${d.prov}</div>` +
            `<div>Penetración: <strong style="color:${accent}">${d.value[0].toFixed(2)}%</strong></div>` +
            `<div>${serieLabel}: <strong>${fmtN(d.evs)}</strong></div>` +
            `<div style="color:${C.muted};font-size:11px">Parque total: ${fmtN(d.total)}</div>`;
        },
      },
      xAxis: { type: "value", name: "% penetración", nameGap: 28, nameLocation: "middle",
        nameTextStyle: { color: C.muted, fontSize: 11 },
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => `${v}%` },
        splitLine: { lineStyle: { color: C.grid } },
      },
      yAxis: { type: "log", name: `# ${serieLabel} (log)`, nameGap: 50, nameLocation: "middle",
        nameTextStyle: { color: C.muted, fontSize: 11 },
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
        splitLine: { lineStyle: { color: C.grid } },
      },
      series: [{
        type: "scatter",
        symbolSize: (d: { evs: number }) => 10 + Math.sqrt(d.evs / maxEv) * 28,
        data: points.map((p) => ({
          value: [+p.pen.toFixed(2), Math.max(1, p.evs)],
          prov: p.prov, evs: p.evs, total: p.total,
          itemStyle: {
            color: `rgba(${hex2rgb(accent)},0.6)`,
            borderColor: accent, borderWidth: 1,
          },
          label: {
            show: p.evs > maxEv * 0.01,
            formatter: p.prov, position: "top",
            color: C.muted, fontSize: 10,
          },
        })),
      }],
    };
  }, [points, tec]);
  return <div ref={ref} style={{ width: "100%", height: 340 }} />;
}

// ─── Chart 1 — Mapa choropleth provincias España ───────────────────────────
const MAP_RAMPS: Record<TecFiltro, string[]> = {
  bev:   ["#1e293b", "#0e7490", "#0891b2", "#06b6d4", "#22d3ee", "#67e8f9"],
  phev:  ["#1f1910", "#7c2d12", "#c2410c", "#ea580c", "#fb923c", "#fed7aa"],
  ambos: ["#0f1a1a", "#065f46", "#047857", "#059669", "#10b981", "#6ee7b7"],
};
function ChartMapaEspana({
  points, tec,
}: { points: { ine: string; prov: string; pen: number; evs: number; total: number }[]; tec: TecFiltro }) {
  const ref = useRef<HTMLDivElement>(null);
  const accent = tec === "bev" ? C.bev : tec === "phev" ? C.phev : C.green;
  useChart(ref, () => {
    const max = Math.max(0.5, ...points.map((p) => p.pen));
    const byIne = new Map(points.map((p) => [p.ine, p]));
    // ECharts geoJson registrado mapea por properties.name — preparamos data con name.
    const buildData = (features: SpainGeoJson["features"]) => features.map((f) => {
      const p = byIne.get(f.properties.cod_prov);
      return {
        name: f.properties.name,
        value: p ? +p.pen.toFixed(2) : 0,
        _prov: p?.prov ?? f.properties.name,
        _evs: p?.evs ?? 0,
        _total: p?.total ?? 0,
      };
    });
    const peninsulaData = buildData(spainPeninsulaGeo.features);
    const canariasData  = buildData(spainCanariasGeo.features);
    const commonStyle = {
      itemStyle: {
        borderColor: "rgba(255,255,255,0.15)", borderWidth: 0.7,
        areaColor: "#1e293b",
      },
      emphasis: {
        label: { show: true, color: C.text, fontSize: 11, fontWeight: 600 },
        itemStyle: { areaColor: accent, borderColor: C.text, borderWidth: 1 },
      },
      select: { disabled: true as const },
    };
    return {
      backgroundColor: "transparent",
      tooltip: { ...TT, trigger: "item",
        formatter: (p: { name: string; data: { name: string; value: number; _prov: string; _evs: number; _total: number } }) => {
          const d = p.data;
          if (!d || d._total === 0) return `<div style="color:${C.muted}">${p.name} · sin datos</div>`;
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:4px">${d._prov}</div>` +
            `<div>Penetración: <strong style="color:${accent}">${d.value.toFixed(2)}%</strong></div>` +
            `<div>${tec === "bev" ? "BEV" : tec === "phev" ? "PHEV" : "Enchufables"}: <strong>${fmtN(d._evs)}</strong></div>` +
            `<div style="color:${C.muted};font-size:11px">Parque total: ${fmtN(d._total)}</div>`;
        },
      },
      visualMap: {
        min: 0, max, calculable: true, orient: "horizontal",
        left: "center", top: 4,
        itemWidth: 8, itemHeight: 160,
        textStyle: { color: C.muted, fontSize: 10 },
        inRange: { color: MAP_RAMPS[tec] },
        formatter: (v: number) => `${v.toFixed(2)}%`,
        seriesIndex: [0, 1],
      },
      series: [
        {
          name: "peninsula",
          type: "map", map: "spain-peninsula", roam: false,
          aspectScale: 0.85,
          layoutCenter: ["50%", "52%"],
          layoutSize: "96%",
          data: peninsulaData,
          ...commonStyle,
        },
        {
          name: "canarias",
          type: "map", map: "spain-canarias", roam: false,
          aspectScale: 0.85,
          layoutCenter: ["12%", "90%"],
          layoutSize: "22%",
          data: canariasData,
          ...commonStyle,
        },
      ],
    };
  }, [points, tec]);
  return <div ref={ref} style={{ width: "auto", height: 440, marginLeft: -20, marginRight: -20 }} />;
}

// ─── Chart 14 — Proyección al objetivo PNIEC (5,5M enchufables 2030) ────────
function ChartProyeccionPniec({
  parEnch: parEnchFull, periodos: periodosFull,
}: { parEnch: number[]; periodos: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useChart(ref, () => {
    const TARGET = 5_500_000;
    const TARGET_PERIODO = "2030-12";
    const END_PERIODO    = "2035-12"; // hasta dónde se extiende el eje X

    // Recorta histórico visible a partir de 2018-01 (cálculos de slope/CAGR
    // siguen usando los últimos N meses, no se ven afectados).
    const startIdx = periodosFull.findIndex((p) => p >= "2018-01");
    const periodos = startIdx >= 0 ? periodosFull.slice(startIdx) : periodosFull;
    const parEnch  = startIdx >= 0 ? parEnchFull.slice(startIdx)  : parEnchFull;

    const lastPer = periodos[periodos.length - 1];
    const [ly, lm] = lastPer.split("-").map(Number);
    const [ey, em] = END_PERIODO.split("-").map(Number);
    const mesesFalt = (ey - ly) * 12 + (em - lm); // proyectar hasta END_PERIODO
    const lastVal = parEnch[parEnch.length - 1];

    // Regresión lineal genérica sobre los últimos N meses (para 12M)
    const linRegSlope = (nMonths: number): number => {
      const n = Math.min(nMonths, parEnch.length);
      if (n < 2) return 0;
      const slice = parEnch.slice(-n);
      const xs = Array.from({ length: n }, (_, i) => i);
      const xMean = xs.reduce((a, b) => a + b, 0) / n;
      const yMean = slice.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { num += (xs[i] - xMean) * (slice[i] - yMean); den += (xs[i] - xMean) ** 2; }
      return den > 0 ? num / den : 0;
    };
    const slope12 = linRegSlope(12);

    // CAGR mensual sobre últimos 24 meses → proyección exponencial (aceleración)
    const cagrSpan = Math.min(24, parEnch.length);
    const firstValForCagr = parEnch[parEnch.length - cagrSpan] ?? lastVal;
    const monthlyGrowthRate = (cagrSpan > 1 && firstValForCagr > 0)
      ? Math.pow(lastVal / firstValForCagr, 1 / (cagrSpan - 1)) - 1
      : 0;

    const projPeriodos: string[] = [];
    const proj12:  number[] = [];
    const projExp: number[] = [];
    for (let i = 1; i <= mesesFalt; i++) {
      const d = new Date(ly, lm - 1 + i, 1);
      projPeriodos.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      proj12.push(Math.max(0, Math.round(lastVal + slope12 * i)));
      projExp.push(Math.max(0, Math.round(lastVal * Math.pow(1 + monthlyGrowthRate, i))));
    }

    // Valor de cada proyección al cruzar la fecha límite (TARGET_PERIODO)
    const [tyDl, tmDl] = TARGET_PERIODO.split("-").map(Number);
    const mesesHastaDeadline = (tyDl - ly) * 12 + (tmDl - lm);
    const val12AtDeadline  = mesesHastaDeadline > 0
      ? Math.max(0, Math.round(lastVal + slope12 * mesesHastaDeadline))
      : lastVal;
    const valExpAtDeadline = mesesHastaDeadline > 0
      ? Math.max(0, Math.round(lastVal * Math.pow(1 + monthlyGrowthRate, mesesHastaDeadline)))
      : lastVal;
    const fmtM = (n: number) => `${(n / 1_000_000).toFixed(2)}M`;
    const etaColor = (eta: string) =>
      eta === "ya alcanzado" || (eta !== "no alcanza" && eta <= TARGET_PERIODO) ? C.green : C.red;

    // Eje X: histórico (para que las markLines de 2020/2024 caigan en su lugar)
    // + proyecciones hasta END_PERIODO. Las proyecciones arrancan en lastVal.
    const fullPeriodos = [...periodos, ...projPeriodos];
    const padHist      = projPeriodos.map(() => null);
    const padProj      = periodos.slice(0, -1).map(() => null);
    const histSerie    = [...parEnch, ...padHist];
    const proj12Serie  = [...padProj, lastVal, ...proj12];
    const projExpSerie = [...padProj, lastVal, ...projExp];
    const targetLine   = fullPeriodos.map(() => TARGET);

    return {
      backgroundColor: "transparent",
      grid: { top: 36, right: 24, bottom: 44, left: 68 },
      tooltip: { ...TT, trigger: "axis",
        formatter: (params: Record<string, unknown>[]) => {
          const p = (params[0] as { axisValue: string }).axisValue;
          const arr = params as { value: number | null; seriesName: string; color: string }[];
          // Excluir target (constante en todos los meses) y nulls
          const validas = arr.filter((s) => s.value !== null && s.value !== undefined && s.seriesName !== "Objetivo PNIEC 5,5M");
          const hist = validas.find((s) => s.seriesName === "Histórico");
          // Si hay histórico en este punto, solo lo mostramos.
          // Si no, mostramos las proyecciones (las que tengan valor).
          const items = hist ? [hist] : validas.filter((s) => s.seriesName !== "Histórico");
          if (items.length === 0) return "";
          // Marcador como segmento de línea con el tipo correspondiente a la serie
          const lineStyleFor = (name: string): string =>
            name === "Proyección lineal últimos 12 meses" ? "dotted"
              : name === "Proyección con aceleración"     ? "dashed"
              : "solid";
          const marker = (s: { color: string; seriesName: string }) =>
            `<span style="display:inline-block;width:20px;height:0;border-top:2px ${lineStyleFor(s.seriesName)} ${s.color};margin-right:6px;vertical-align:middle"></span>`;
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p}</div>` +
            items.map((s) =>
              `<div style="display:flex;gap:12px;justify-content:space-between;align-items:center">` +
              `<span>${marker(s)}${s.seriesName}</span>` +
              `<span style="font-weight:600;color:${C.text}">${fmtN(s.value as number)}</span></div>`
            ).join("");
        }
      },
      legend: (() => {
        // Iconos como paths SVG que simulan línea sólida / dashed / dotted
        const ICON_SOLID  = "path://M0,0 L24,0 L24,2 L0,2 Z";
        const ICON_DASHED = "path://M0,0 L6,0 L6,2 L0,2 Z M9,0 L15,0 L15,2 L9,2 Z M18,0 L24,0 L24,2 L18,2 Z";
        const ICON_DOTTED = "path://M0,0 L2,0 L2,2 L0,2 Z M5,0 L7,0 L7,2 L5,2 Z M10,0 L12,0 L12,2 L10,2 Z M15,0 L17,0 L17,2 L15,2 Z M20,0 L22,0 L22,2 L20,2 Z";
        return {
          top: 0, right: 0, textStyle: { color: C.muted, fontSize: 12 },
          itemWidth: 24, itemHeight: 6, itemGap: 14,
          data: [
            { name: "Histórico",                          icon: ICON_SOLID,  itemStyle: { color: C.green } },
            { name: "Proyección lineal últimos 12 meses", icon: ICON_DOTTED, itemStyle: { color: C.green } },
            { name: "Proyección con aceleración",         icon: ICON_DASHED, itemStyle: { color: C.green } },
            { name: "Objetivo PNIEC 5,5M",                icon: ICON_DOTTED, itemStyle: { color: C.red } },
          ],
        };
      })(),
      xAxis: { type: "category", data: fullPeriodos,
        axisLabel: { color: C.muted, fontSize: 10,
          interval: (idx: number, val: string) => {
            const m = val.split("-")[1];
            // Tick por año (enero) + el primer punto de la serie como ancla
            return m === "01" || idx === 0;
          },
          formatter: (v: string) => v.split("-")[0],
        },
        axisLine: { lineStyle: { color: C.grid } },
        splitLine: { show: false },
      },
      yAxis: { type: "value",
        min: 0, max: 10_000_000,
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
        splitLine: { lineStyle: { color: C.grid } },
      },
      series: [
        {
          name: "Histórico", type: "line", data: histSerie,
          color: C.green,
          smooth: true, symbol: "none",
          lineStyle: { color: C.green, width: 2.4 },
          areaStyle: { color: linGrad(C.green, 0.18, 0.02) },
          markLine: {
            silent: false,
            symbol: ["none", "none"],
            lineStyle: { color: "#fbbf24", type: "dashed", width: 1, opacity: 0.7 },
            label: {
              show: true,
              position: "insideEndTop",
              color: "#fbbf24",
              fontSize: 10,
              fontWeight: 600,
              backgroundColor: "rgba(5,8,16,0.85)",
              padding: [3, 6, 3, 6],
              borderRadius: 4,
            },
            data: [
              { xAxis: "2020-01", label: { formatter: "Meta 5M a 2030" } },
              { xAxis: "2024-09", label: { formatter: "Meta actualizada: 5,5M a 2030", position: "insideEndBottom" } },
            ],
          },
        },
        {
          name: "Proyección lineal últimos 12 meses", type: "line", data: proj12Serie,
          color: C.green,
          smooth: true, symbol: "none",
          lineStyle: { color: C.green, width: 1.6, type: "dotted", opacity: 0.85 },
          markPoint: {
            symbol: "circle", symbolSize: 9,
            itemStyle: { color: C.green, borderColor: "#0b1020", borderWidth: 2 },
            label: {
              show: true, position: "right", offset: [4, 0],
              color: C.green, fontSize: 11, fontWeight: 700,
              backgroundColor: "rgba(5,8,16,0.85)",
              padding: [3, 6, 3, 6], borderRadius: 4,
              formatter: fmtM(val12AtDeadline),
            },
            data: [{ coord: [TARGET_PERIODO, val12AtDeadline] }],
          },
        },
        {
          name: "Proyección con aceleración", type: "line", data: projExpSerie,
          color: C.green,
          smooth: true, symbol: "none",
          lineStyle: { color: C.green, width: 1.8, type: "dashed", opacity: 0.9 },
          markPoint: {
            symbol: "circle", symbolSize: 9,
            itemStyle: { color: C.green, borderColor: "#0b1020", borderWidth: 2 },
            label: {
              show: true, position: "right", offset: [4, 0],
              color: C.green, fontSize: 11, fontWeight: 700,
              backgroundColor: "rgba(5,8,16,0.85)",
              padding: [3, 6, 3, 6], borderRadius: 4,
              formatter: fmtM(valExpAtDeadline),
            },
            data: [{ coord: [TARGET_PERIODO, valExpAtDeadline] }],
          },
        },
        {
          name: "Objetivo PNIEC 5,5M", type: "line", data: targetLine,
          color: C.red,
          symbol: "none",
          lineStyle: { color: C.red, width: 1, type: "dotted", opacity: 0.7 },
          markPoint: {
            symbol: "circle", symbolSize: 8,
            itemStyle: { color: C.red },
            label: { show: true, position: "right", formatter: "5,5M", color: C.red, fontSize: 11, fontWeight: 600 },
            data: [{ coord: [TARGET_PERIODO, TARGET] }],
          },
          markLine: {
            silent: false,
            symbol: ["none", "none"],
            lineStyle: { color: C.red, type: "dashed", width: 1.4, opacity: 0.85 },
            label: {
              show: true,
              position: "insideEndTop",
              color: C.red,
              fontSize: 10,
              fontWeight: 600,
              backgroundColor: "rgba(5,8,16,0.85)",
              padding: [3, 6, 3, 6],
              borderRadius: 4,
              formatter: "Fecha límite",
            },
            data: [{ xAxis: TARGET_PERIODO }],
          },
        },
      ],
    };
  }, [parEnchFull, periodosFull]);
  return <div ref={ref} style={{ width: "100%", height: 360 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

const sec: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px",
};

const sTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16, letterSpacing: "-0.01em",
};

const sDesc: React.CSSProperties = {
  fontSize: 12, color: C.muted, marginTop: -10, marginBottom: 16,
};

export function Dashboard() {
  const { countryName } = useInsights();
  const winW = useWindowWidth();
  const isMobile = winW < 768;
  const cols2 = isMobile ? "1fr" : "1fr 1fr";

  // ── Filtros — mismo patrón que matriculaciones ──────────────────────────
  const [filtro, setFiltro] = useState<TecFiltro>("ambos");
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculo[]>(TIPOS_DEFAULT);
  const [provincia, setProvincia] = useState<string>("todas");

  // ── Series filtradas (aplica prov + tipos; el tec se aplica en las views) ──
  const parBev     = useMemo(() => buildSerie(tiposVehiculo, provincia, "BEV"),           [tiposVehiculo, provincia]);
  const parPhev    = useMemo(() => buildSerie(tiposVehiculo, provincia, "PHEV"),          [tiposVehiculo, provincia]);
  const parNoEnch  = useMemo(() => buildSerie(tiposVehiculo, provincia, "no_enchufable"), [tiposVehiculo, provincia]);
  const parTotal   = useMemo(() => buildSerie(tiposVehiculo, provincia, "total"),         [tiposVehiculo, provincia]);

  // Antigüedad promedio filtrada por tipos de vehículo seleccionados
  const edadFiltrada = useMemo(() => {
    const sums = (dgtParqueEdad as any)?.sums_por_tipo as
      | Record<string, Record<string, { sum_age: number; count: number }>>
      | undefined;
    if (!sums) return null;
    const tiposParque = Array.from(new Set(tiposVehiculo.flatMap((t) => FILTRO_TO_PARQUE_TIPOS[t])));
    const acc: Record<string, { sum_age: number; count: number }> = {};
    for (const tg of tiposParque) {
      const byCat = sums[tg];
      if (!byCat) continue;
      for (const cat of Object.keys(byCat)) {
        if (!acc[cat]) acc[cat] = { sum_age: 0, count: 0 };
        acc[cat].sum_age += byCat[cat].sum_age;
        acc[cat].count   += byCat[cat].count;
      }
    }
    const avg = (cat: string) => (acc[cat]?.count > 0 ? acc[cat].sum_age / acc[cat].count : 0);
    const totalSum = Object.values(acc).reduce((a, b) => a + b.sum_age, 0);
    const totalCnt = Object.values(acc).reduce((a, b) => a + b.count, 0);
    return {
      global: totalCnt > 0 ? totalSum / totalCnt : 0,
      BEV:    avg("BEV"),
      PHEV:   avg("PHEV"),
      NO_EV:  avg("NO_EV"),
    };
  }, [tiposVehiculo]);

  // Distintivo filtrado por provincia × tipos × tec — último mes real
  const distintivoFiltrado = useMemo((): Record<string, number> | null => {
    const last = dgtParqueMensual[dgtParqueMensual.length - 1];
    const breakdown = (last as unknown as { parque_distintivo_breakdown?: Record<string, Record<string, Record<string, { BEV?: number; PHEV?: number; NO_EV?: number }>>> }).parque_distintivo_breakdown;
    if (!breakdown) return last?.parque_distintivo ?? null;
    const tiposParque = Array.from(new Set(tiposVehiculo.flatMap((t) => FILTRO_TO_PARQUE_TIPOS[t])));
    const wantProv = provincia === "todas" ? null : provIne(provincia);
    const catsToInclude: ("BEV" | "PHEV" | "NO_EV")[] =
      filtro === "bev"  ? ["BEV"]
      : filtro === "phev" ? ["PHEV"]
      :                     ["BEV", "PHEV", "NO_EV"];
    const acc: Record<string, number> = {};
    for (const prov of Object.keys(breakdown)) {
      if (wantProv && prov !== wantProv) continue;
      const byTipo = breakdown[prov];
      for (const tg of tiposParque) {
        const byDist = byTipo[tg];
        if (!byDist) continue;
        for (const dist of Object.keys(byDist)) {
          const cats = byDist[dist];
          let sum = 0;
          for (const cat of catsToInclude) sum += cats[cat] ?? 0;
          if (sum > 0) acc[dist] = (acc[dist] ?? 0) + sum;
        }
      }
    }
    return acc;
  }, [tiposVehiculo, provincia, filtro]);

  // ── Entradas para ChartPorTipo — último mes real, respeta filtros ──────
  const tipoEntries = useMemo(() => {
    const anchor = dgtParqueMensual[dgtParqueMensual.length - 1];
    const isAllTipos = tiposVehiculo.length === TIPOS_ORDER.length;
    return TIPOS_ORDER
      .filter((t) => isAllTipos || tiposVehiculo.includes(t))
      .map((t) => {
        const parqueTipos = FILTRO_TO_PARQUE_TIPOS[t];
        let bev = 0, phev = 0;
        if (provincia === "todas") {
          if (anchor.parque_por_tipo) {
            for (const pt of parqueTipos) {
              const data = (anchor.parque_por_tipo as Record<string, Record<string, number>>)[pt];
              if (data) { bev += data.BEV ?? 0; phev += data.PHEV ?? 0; }
            }
          } else {
            // fallback al resumen por tipo
            for (const pt of parqueTipos) {
              bev  += dgtParqueResumenPorTipo[pt]?.BEV?.parque_activo  ?? 0;
              phev += dgtParqueResumenPorTipo[pt]?.PHEV?.parque_activo ?? 0;
            }
          }
        } else {
          const pb = anchor.parque_por_provincia_tipo;
          const ine = provIne(provincia);
          if (pb && pb[ine]) {
            for (const pt of parqueTipos) {
              const data = (pb[ine] as Record<string, Record<string, number>>)[pt];
              if (data) { bev += data.BEV ?? 0; phev += data.PHEV ?? 0; }
            }
          }
        }
        return { tipo: t, BEV: bev, PHEV: phev };
      })
      // Si el usuario eligió tipos específicos, mostramos todos (aunque sean 0).
      // Si está el default (todos los tipos), solo los que tienen EVs.
      .filter((e) => isAllTipos ? (e.BEV + e.PHEV > 0) : true)
      .sort((a, b) => (b.BEV + b.PHEV) - (a.BEV + a.PHEV));
  }, [tiposVehiculo, provincia]);

  const lastMes  = dgtParqueMensual[dgtParqueMensual.length - 1];
  const lastIdx  = parBev.length - 1;

  // ── YoY ─────────────────────────────────────────────────────────────────
  const [lastY, lastM] = lastMes.periodo.split("-").map(Number);
  const yoyPeriodo = `${lastY - 1}-${String(lastM).padStart(2, "0")}`;
  const yoyIdx     = PERIODOS.findIndex((p) => p === yoyPeriodo);

  const MESES_LARGO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const yoyLabel = `${MESES_LARGO[lastM - 1]} ${lastY - 1}`;
  const curLabel = `${MESES_LARGO[lastM - 1]} ${lastY}`;

  // Valores del último mes según filtro tec
  const bevCur  = parBev[lastIdx];
  const phevCur = parPhev[lastIdx];
  const curEnch =
    filtro === "bev"  ? bevCur :
    filtro === "phev" ? phevCur :
                        bevCur + phevCur;
  const curNoEnch = parNoEnch[lastIdx];
  const curTotal  = parTotal[lastIdx];

  const bevPrev  = yoyIdx >= 0 ? parBev[yoyIdx]  : undefined;
  const phevPrev = yoyIdx >= 0 ? parPhev[yoyIdx] : undefined;
  const prevEnch = bevPrev !== undefined && phevPrev !== undefined
    ? (filtro === "bev" ? bevPrev : filtro === "phev" ? phevPrev : bevPrev + phevPrev)
    : undefined;
  const prevNoEnch = yoyIdx >= 0 ? parNoEnch[yoyIdx] : undefined;
  const prevTotal  = yoyIdx >= 0 ? parTotal[yoyIdx]  : undefined;

  const yoyEnch   = prevEnch   !== undefined && prevEnch   > 0 ? ((curEnch   / prevEnch)   - 1) * 100 : undefined;
  const yoyNoEnch = prevNoEnch !== undefined && prevNoEnch > 0 ? ((curNoEnch / prevNoEnch) - 1) * 100 : undefined;
  const yoyTotal  = prevTotal  !== undefined && prevTotal  > 0 ? ((curTotal  / prevTotal)  - 1) * 100 : undefined;

  // Labels dinámicos según tec (BEV azul, PHEV naranja, + en verde cuando ambos)
  const enchLabel: React.ReactNode =
    filtro === "bev"  ? (<><span style={{ color: C.bev }}>BEV</span> · Eléctrico puro</>) :
    filtro === "phev" ? (<><span style={{ color: C.phev }}>PHEV</span> · Híbrido enchufable</>) :
                        (<>Enchufables (<span style={{ color: C.bev }}>BEV</span><span style={{ color: C.green }}> + </span><span style={{ color: C.phev }}>PHEV</span>)</>);
  const pctEVLabel: React.ReactNode =
    filtro === "bev"  ? (<><span style={{ color: C.bev }}>BEV</span> / Parque total</>) :
    filtro === "phev" ? (<><span style={{ color: C.phev }}>PHEV</span> / Parque total</>) :
                        "Enchufables / Parque total";
  const pctEVBadge: React.ReactNode =
    filtro === "bev"  ? (<><span style={{ color: C.bev }}>BEV</span><span style={{ color: C.muted }}> / total</span></>) :
    filtro === "phev" ? (<><span style={{ color: C.phev }}>PHEV</span><span style={{ color: C.muted }}> / total</span></>) :
                        (<><span style={{ color: C.bev }}>BEV</span><span style={{ color: C.green }}>+</span><span style={{ color: C.phev }}>PHEV</span><span style={{ color: C.muted }}> / total</span></>);
  const enchBadge: React.ReactNode =
    filtro === "bev"  ? (<><span style={{ color: C.bev }}>BEV</span> · 100% eléctrico</>) :
    filtro === "phev" ? (<><span style={{ color: C.phev }}>PHEV</span> · Híbrido plug-in</>) :
                        (<><span style={{ color: C.bev }}>BEV</span><span style={{ color: C.green }}> + </span><span style={{ color: C.phev }}>PHEV</span></>);
  const enchColor =
    filtro === "bev"  ? C.bev :
    filtro === "phev" ? C.phev :
                        C.green;

  const provinciaLabel = provincia === "todas"
    ? countryName
    : (PROVINCIAS_ORDENADAS.find((p) => p.cod === provincia)?.nombre ?? provincia);

  // ── % penetración EV sobre total ─────────────────────────────────────────
  const pctEV     = curTotal  > 0 ? (curEnch  / curTotal) * 100 : 0;
  const pctEVPrev = prevTotal && prevTotal > 0 && prevEnch !== undefined ? (prevEnch / prevTotal) * 100 : undefined;
  const yoyPctEV  = pctEVPrev !== undefined ? pctEV - pctEVPrev : undefined;

  // ── Saldo neto por tipo (último mes real vs penúltimo) ───────────────────
  const saldoNetoPorTipo = useMemo(() => {
    const L = dgtParqueMensual[dgtParqueMensual.length - 1];
    const P = dgtParqueMensual[dgtParqueMensual.length - 2];
    if (!L || !P) return [];
    const isAllTipos = tiposVehiculo.length === TIPOS_ORDER.length;
    const ine = provincia !== "todas" ? provIne(provincia) : null;
    const get = (m: typeof L, pt: string, cat: "BEV" | "PHEV"): number => {
      if (ine) {
        const pb = m.parque_por_provincia_tipo;
        return (pb?.[ine] as Record<string, Record<string, number>> | undefined)?.[pt]?.[cat] ?? 0;
      }
      return (m.parque_por_tipo as Record<string, Record<string, number>> | undefined)?.[pt]?.[cat] ?? 0;
    };
    return TIPOS_ORDER
      .filter((t) => isAllTipos || tiposVehiculo.includes(t))
      .map((t) => {
        const parqueTipos = FILTRO_TO_PARQUE_TIPOS[t];
        let netBev = 0, netPhev = 0;
        for (const pt of parqueTipos) {
          netBev  += get(L, pt, "BEV")  - get(P, pt, "BEV");
          netPhev += get(L, pt, "PHEV") - get(P, pt, "PHEV");
        }
        return { tipo: t, netBev, netPhev };
      })
      .filter((e) => e.netBev !== 0 || e.netPhev !== 0)
      .sort((a, b) => (b.netBev + b.netPhev) - (a.netBev + a.netPhev));
  }, [tiposVehiculo, provincia]);

  // ── Puntos por provincia (comparten el scatter y el mapa) ────────────────
  const scatterPoints = useMemo(() => {
    const L = dgtParqueMensual[dgtParqueMensual.length - 1];
    const pb = L?.parque_por_provincia_tipo;
    if (!pb) return [] as { ine: string; prov: string; pen: number; evs: number; total: number }[];
    const isAllTipos = tiposVehiculo.length === TIPOS_ORDER.length;
    const tiposParque = isAllTipos
      ? FILTRO_TO_PARQUE_TIPOS.todos
      : Array.from(new Set(tiposVehiculo.flatMap((t) => FILTRO_TO_PARQUE_TIPOS[t])));
    return Object.entries(pb).map(([ine, tb]) => {
      const byTipo = tb as Record<string, Record<string, number>>;
      let bev = 0, phev = 0, tot = 0;
      for (const pt of tiposParque) {
        const row = byTipo[pt];
        if (!row) continue;
        bev  += row.BEV   ?? 0;
        phev += row.PHEV  ?? 0;
        tot  += row.total ?? 0;
      }
      const evs = filtro === "bev" ? bev : filtro === "phev" ? phev : bev + phev;
      return {
        ine,
        prov: INE_A_NOMBRE[ine] ?? ine,
        evs,
        total: tot,
        pen: tot > 0 ? (evs / tot) * 100 : 0,
      };
    }).filter((p) => p.total > 0);
  }, [filtro, tiposVehiculo]);

  // ── Enchufables PNIEC: nacional, BEV+PHEV, alcance fijo (insensible a filtros) ──
  // Tipos cubiertos por el objetivo PNIEC 5,5M: turismo, furgoneta, camión, autobús, moto, trimoto.
  const parqueEnchNacional = useMemo(() => {
    const TIPOS_PNIEC = ["turismo", "furgoneta_van", "camion", "autobus", "moto", "trimoto"];
    return dgtParqueMensual.map((m) => {
      if (!m.parque_por_tipo) return (m.parque_acumulado.BEV ?? 0) + (m.parque_acumulado.PHEV ?? 0);
      const pt = m.parque_por_tipo as Record<string, Record<string, number>>;
      let s = 0;
      for (const t of TIPOS_PNIEC) {
        s += (pt[t]?.BEV ?? 0) + (pt[t]?.PHEV ?? 0);
      }
      return s;
    });
  }, []);

  // ── Mix tecnológico — calculado desde el PARQUE ACTIVO (snapshot anual) ──
  // Toma el último mes disponible de cada año (ej. dic) y deriva % BEV / (BEV+PHEV)
  // sobre el stock acumulado del parque, respetando filtros tipo/provincia.
  const mixParqueAnual = useMemo(() => {
    const lastIdxByYear = new Map<string, number>();
    PERIODOS.forEach((p, i) => {
      const año = p.slice(0, 4);
      lastIdxByYear.set(año, i);
    });
    const ultimoPeriodo = PERIODOS[PERIODOS.length - 1] ?? "";
    const añoUltimo = ultimoPeriodo.slice(0, 4);
    const mesUltimo = ultimoPeriodo.slice(5, 7);
    return Array.from(lastIdxByYear.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([año, idx]) => {
        const bev  = parBev[idx]  ?? 0;
        const phev = parPhev[idx] ?? 0;
        const total = bev + phev;
        const parcial = año === añoUltimo && mesUltimo !== "12";
        return {
          año, bev, phev, total, parcial,
          bevPct:  total > 0 ? Math.round((bev  / total) * 100) : 0,
          phevPct: total > 0 ? Math.round((phev / total) * 100) : 0,
        };
      });
  }, [parBev, parPhev]);

  const mixOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const seriesColor = (name: string) => name === "BEV" ? C.bev : C.phev;
        return `<b style="color:${C.text}">${params[0].axisValue}</b><br/>` +
          params.map((p) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${seriesColor(p.seriesName)};margin-right:6px"></span>${p.seriesName}: <b>${Math.round(p.value)}%</b>`).join("<br/>");
      },
    },
    grid: { top: 12, right: 16, bottom: 32, left: isMobile ? 36 : 52 },
    xAxis: {
      type: "category",
      data: mixParqueAnual.map((a) => a.parcial ? `${a.año} YTD` : a.año),
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
        data: mixParqueAnual.map((a) => a.bevPct),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.bev},{offset:1,color:"rgba(56,189,248,0.6)"}]) },
        barMaxWidth: 64,
        label: { show: true, position: "inside", color: "#fff", fontSize: 11, fontWeight: 700, formatter: (p: Record<string, any>) => `${Math.round(p.value)}%` },
      },
      {
        name: "PHEV", type: "bar", stack: "s",
        data: mixParqueAnual.map((a) => a.phevPct),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:C.phev},{offset:1,color:"rgba(251,146,60,0.6)"}]), borderRadius: [4,4,0,0] },
        barMaxWidth: 64,
        label: { show: true, position: "inside", color: "#fff", fontSize: 11, fontWeight: 700, formatter: (p: Record<string, any>) => `${Math.round(p.value)}%` },
      },
    ],
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,sans-serif" }}>

      {/* Título */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "14px 14px 0" : "18px 24px 0", textAlign: "center" }}>
        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
          Parque activo de vehículos en {provinciaLabel}
        </h1>
      </div>

      <DashboardControls
        filtro={filtro}
        setFiltro={setFiltro}
        tiposVehiculo={tiposVehiculo}
        setTiposVehiculo={setTiposVehiculo}
        provincia={provincia}
        setProvincia={setProvincia}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "20px 14px 48px" : "32px 24px" }}>

        {/* Top row: 4 KPIs combinados (volumen + antigüedad) */}
        {(() => {
          const edadGlobal = (edadFiltrada?.global ?? dgtParqueEdad?.promedio?.global ?? 0).toFixed(1);
          const edadNoEnch = (edadFiltrada?.NO_EV  ?? (dgtParqueEdad?.promedio as Record<string, number> | undefined)?.NO_EV ?? 0).toFixed(1);
          const edadBev    = (edadFiltrada?.BEV    ?? dgtParqueEdad?.promedio?.BEV  ?? 0).toFixed(1);
          const edadPhev   = (edadFiltrada?.PHEV   ?? dgtParqueEdad?.promedio?.PHEV ?? 0).toFixed(1);
          const enchAge = filtro === "bev"
            ? <><span style={{ color: C.bev }}>{edadBev}</span> <span style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>años</span></>
            : filtro === "phev"
            ? <><span style={{ color: C.phev }}>{edadPhev}</span> <span style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>años</span></>
            : <>
                <span style={{ color: C.bev }}>{edadBev}</span>
                <span style={{ fontSize: 14, color: C.muted, fontWeight: 600, margin: "0 6px" }}>/</span>
                <span style={{ color: C.phev }}>{edadPhev}</span>
                <span style={{ fontSize: 14, color: C.muted, fontWeight: 600, marginLeft: 6 }}>años</span>
              </>;
          const enchAgeLabel = filtro === "bev"
            ? <>Antigüedad <span style={{ color: C.bev }}>BEV</span></>
            : filtro === "phev"
            ? <>Antigüedad <span style={{ color: C.phev }}>PHEV</span></>
            : <>Antigüedad <span style={{ color: C.bev }}>BEV</span> / <span style={{ color: C.phev }}>PHEV</span></>;
          const hasEdad = !!dgtParqueEdad?.promedio?.global;
          return (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 14 : 20 }}>
              <KpiCard
                emoji="🚗"
                label={`Parque total ${provinciaLabel}`}
                value={kLabel(curTotal)}
                color={C.text}
                badge="Total"
                yoyPct={yoyTotal}
                yoyLabel={yoyLabel}
                secondary={hasEdad ? {
                  label: "Antigüedad promedio global",
                  value: <>{edadGlobal} <span style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>años</span></>,
                } : undefined}
              />
              <KpiCard
                emoji="⛽"
                label="No enchufables"
                value={kLabel(curNoEnch)}
                color={C_NOENCH}
                badge="Combustión"
                yoyPct={yoyNoEnch}
                yoyLabel={yoyLabel}
                secondary={hasEdad ? {
                  label: "Antigüedad no enchufables",
                  value: <>{edadNoEnch} <span style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>años</span></>,
                } : undefined}
              />
              <KpiCard
                emoji="⚡"
                label={enchLabel}
                value={kLabel(curEnch)}
                color={enchColor}
                yoyPct={yoyEnch}
                yoyLabel={yoyLabel}
                secondary={hasEdad ? {
                  label: enchAgeLabel,
                  value: enchAge,
                } : undefined}
              />
              <KpiCard
                emoji="📊"
                label={filtro === "bev"
                  ? <><span style={{ color: C.bev }}>BEV</span> / Parque total</>
                  : filtro === "phev"
                  ? <><span style={{ color: C.phev }}>PHEV</span> / Parque total</>
                  : <>(<span style={{ color: C.bev }}>BEV</span> + <span style={{ color: C.phev }}>PHEV</span>) / Parque total</>}
                value={`${pctEV.toFixed(2)}%`}
                color={C.green}
                yoyPct={yoyPctEV}
                yoyLabel={yoyLabel}
                secondary={curEnch > 0 ? {
                  label: filtro === "bev"
                    ? <><span style={{ color: C.text }}>1</span> <span style={{ color: C.bev }}>BEV</span> por cada {Math.round(curTotal / curEnch)} vehículos</>
                    : filtro === "phev"
                    ? <><span style={{ color: C.text }}>1</span> <span style={{ color: C.phev }}>PHEV</span> por cada {Math.round(curTotal / curEnch)} vehículos</>
                    : <><span style={{ color: C.text }}>1</span> <span style={{ color: C.green }}>enchufable</span> por cada {Math.round(curTotal / curEnch)} vehículos</>,
                  value: <>1 <span style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>cada</span> {Math.round(curTotal / curEnch)}</>,
                } : undefined}
              />
            </div>
          );
        })()}

        {/* Parque activo por tipo (col izq, 1/3) + Evolución del parque (col der, 2/3) */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: isMobile ? 14 : 20, marginBottom: isMobile ? 20 : 28 }}>
          <div style={sec}>
            <div style={sTitle}>Parque activo por tipo de vehículo</div>
            <div style={sDesc}>Desglose según los tipos seleccionados{provincia !== "todas" ? ` en ${provinciaLabel}` : ""}</div>
            {tipoEntries.length > 0
              ? <ChartPorTipo entries={tipoEntries} tec={filtro} />
              : <div style={{ padding: "24px 0", color: C.muted, fontSize: 13, textAlign: "center" }}>Sin datos para la combinación seleccionada</div>
            }
          </div>

          <div style={sec}>
            <div style={sTitle}>Evolución del parque activo</div>
            <div style={sDesc}>
              Dato empírico desde <strong style={{ color: C.text }}>{PERIODO_PRIMER_REAL ?? ""}</strong>, meses anteriores calculado desde matriculaciones y bajas.
              {provincia !== "todas" && " Para meses calculados la serie provincial se estima con el share del primer mes real."}
            </div>
            <ChartParqueEvolucion parBev={parBev} parPhev={parPhev} parNoEnch={parNoEnch} tec={filtro} />
          </div>
        </div>

        {/* Mapa + scatter (dos columnas, el mapa ya no ocupa toda la fila) */}
        <div style={{ display: "grid", gridTemplateColumns: cols2, gap: isMobile ? 14 : 20, marginBottom: 20 }}>
          <div style={sec}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ ...sTitle, marginBottom: 0 }}>Mapa de penetración por provincia</div>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
                background: `rgba(${hex2rgb(enchColor)},0.12)`,
                border: `1px solid rgba(${hex2rgb(enchColor)},0.35)`,
                color: C.muted, borderRadius: 6, padding: "4px 10px",
              }}>
                <strong style={{ color: C.text }}>{pctEV.toFixed(2)}%</strong>
                <span style={{ display: "inline-block", width: 1, height: 11, background: "rgba(255,255,255,0.22)", margin: "0 8px", verticalAlign: "middle" }} />
                {filtro === "bev"
                  ? <span style={{ color: C.bev }}>BEV</span>
                  : filtro === "phev"
                  ? <span style={{ color: C.phev }}>PHEV</span>
                  : <><span style={{ color: C.bev }}>BEV</span><span style={{ color: C.green }}>+</span><span style={{ color: C.phev }}>PHEV</span></>
                } / Parque Total
              </span>
            </div>
            {scatterPoints.length > 0
              ? <ChartMapaEspana points={scatterPoints} tec={filtro} />
              : <div style={{ padding: "80px 0", color: C.muted, fontSize: 13, textAlign: "center" }}>Sin datos por provincia disponibles</div>
            }
          </div>
          <div style={sec}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ ...sTitle, marginBottom: 0 }}>Distribución del parque activo</div>
              <span style={{
                fontSize: 10, background: `rgba(${hex2rgb(C_NOENCH)},0.14)`, color: C_NOENCH,
                borderRadius: 5, padding: "2px 8px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                Amplificado
              </span>
            </div>
            <div style={sDesc}>
              {filtro === "bev"
                ? <><span style={{ color: C.bev }}>BEV</span> está amplificado visualmente para que sea legible.</>
                : filtro === "phev"
                ? <><span style={{ color: C.phev }}>PHEV</span> está amplificado visualmente para que sea legible.</>
                : <><span style={{ color: C.bev }}>BEV</span> y <span style={{ color: C.phev }}>PHEV</span> están amplificados visualmente para que sean legibles.</>
              }
            </div>
            <ChartParqueDonut bev={bevCur} phev={phevCur} noEnch={curNoEnch} tec={filtro} />
          </div>
        </div>

        {/* 2-col row: mix tecnológico + mix por marca (intercambiados con Matriculaciones) */}
        <div style={{ display: "grid", gridTemplateColumns: cols2, gap: isMobile ? 14 : 20, marginBottom: 20 }}>
          <div style={sec}>
            <div style={sTitle}>Mix tecnológico — ¿quién gana terreno?</div>
            <div style={sDesc}>Evolución del mix BEV vs PHEV como % del parque activo enchufable (snapshot al cierre de cada año)</div>
            <EChart theme="dark" option={mixOpt} style={{ height: 220 }} />
          </div>
          <div style={sec}>
            <div style={sTitle}>Saldo neto del último mes por tipo</div>
            <div style={sDesc}>
              Variación <strong style={{ color: C.text }}>{lastMes.periodo}</strong> vs mes anterior, desagregada por tipo de vehículo.
              {provincia !== "todas" ? ` · ${provinciaLabel}` : ""}
            </div>
            {saldoNetoPorTipo.length > 0
              ? <ChartSaldoNetoPorTipo entries={saldoNetoPorTipo} tec={filtro} />
              : <div style={{ padding: "24px 0", color: C.muted, fontSize: 13, textAlign: "center" }}>Sin variación en la combinación seleccionada</div>
            }
          </div>
        </div>

        {/* Distintivo ambiental + Pirámide de edad */}
        <div style={{ display: "grid", gridTemplateColumns: cols2, gap: isMobile ? 14 : 20, marginBottom: 20 }}>
          <div style={sec}>
            <div style={sTitle}>Distintivo ambiental DGT</div>
            <div style={sDesc}>
              Distribución por etiqueta · snapshot {lastMes.periodo}
              {provincia !== "todas" ? ` · ${provinciaLabel}` : ""}
              {filtro !== "ambos"
                ? <> · solo <span style={{ color: filtro === "bev" ? C.bev : C.phev }}>{filtro === "bev" ? "BEV" : "PHEV"}</span></>
                : null}
              .
            </div>
            {distintivoFiltrado && Object.keys(distintivoFiltrado).length > 0
              ? <ChartDistintivo data={distintivoFiltrado} />
              : <div style={{ padding: "40px 0", color: C.muted, fontSize: 13, textAlign: "center" }}>Sin datos de distintivo para esta combinación</div>
            }
          </div>
          <div style={sec}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ ...sTitle, marginBottom: 0 }}>Pirámide de edad del parque</div>
              <span style={{
                fontSize: 10, background: `rgba(${hex2rgb(C_NOENCH)},0.14)`, color: C_NOENCH,
                border: `1px solid rgba(${hex2rgb(C_NOENCH)},0.35)`,
                borderRadius: 5, padding: "2px 8px", fontWeight: 600,
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                Solo nacional
              </span>
            </div>
            <div style={sDesc}>
              Vehículos por año de matriculación (últimos 30 años). Muestra la penetración progresiva de BEV/PHEV en las cohortes recientes.
              Responde al filtro de tecnología; <strong style={{ color: C.text }}>no responde a tipo ni provincia</strong> (dato agregado a nivel país).
            </div>
            {dgtParqueEdad && Object.keys(dgtParqueEdad.por_anio).length > 0
              ? <ChartPiramideEdad edad={dgtParqueEdad} tec={filtro} />
              : <div style={{ padding: "40px 0", color: C.muted, fontSize: 13, textAlign: "center" }}>Sin datos de edad — regenerar JSON</div>
            }
          </div>
        </div>

        {/* Proyección PNIEC 5,5M */}
        <div style={{ ...sec, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ ...sTitle, marginBottom: 0 }}>Proyección al objetivo PNIEC (5,5M enchufables en 2030)</div>
            <span style={{
              fontSize: 10, background: "rgba(251,191,36,0.14)", color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.35)",
              borderRadius: 5, padding: "2px 8px", fontWeight: 600,
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              Filtros fijos
            </span>
          </div>
          <div style={sDesc}>
            Histórico del parque enchufable más dos extrapolaciones: lineal con los últimos 12 meses y exponencial considerando la aceleración de los últimos 24 meses (CAGR mensual).
          </div>
          <ChartProyeccionPniec parEnch={parqueEnchNacional} periodos={PERIODOS} />
        </div>

      </div>
    </div>
  );
}
