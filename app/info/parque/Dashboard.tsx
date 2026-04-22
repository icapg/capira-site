"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useInsights } from "../InsightsContext";
import { DashboardControls } from "../DashboardControls";
import { useWindowWidth } from "../../lib/useIsMobile";
import type { TipoVehiculo } from "../../lib/insights/dgt-bev-phev-data";
import { TIPO_LABELS, PROVINCIAS_ORDENADAS } from "../../lib/insights/dgt-bev-phev-data";
import * as echarts from "echarts";
import {
  dgtParqueMeta,
  dgtParqueResumen,
  dgtParqueResumenPorTipo,
  dgtParqueEdad,
  dgtParqueMensual,
} from "../../lib/insights/dgt-parque-data";
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
const MAT_BEV   = dgtParqueMensual.map((m) => m.matriculaciones_mes.BEV  ?? 0);
const BAJA_BEV  = dgtParqueMensual.map((m) => m.bajas_mes.BEV            ?? 0);
const MAT_PHEV  = dgtParqueMensual.map((m) => m.matriculaciones_mes.PHEV ?? 0);
const BAJA_PHEV = dgtParqueMensual.map((m) => m.bajas_mes.PHEV           ?? 0);

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
      background: `linear-gradient(135deg, rgba(${hex2rgb(color)},0.07) 0%, rgba(${hex2rgb(color)},0.02) 100%)`,
      border: `1px solid rgba(${hex2rgb(color)},0.18)`,
      borderRadius: 16,
      padding: "22px 24px",
      display: "flex", flexDirection: "column", gap: 8,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", right: 16, top: 10,
        fontSize: 48, opacity: 0.1, lineHeight: 1, userSelect: "none",
      }}>{emoji}</div>

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
          borderTop: `1px solid rgba(${hex2rgb(color)},0.16)`,
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

function ChartSaldoNeto({ netBev, netPhev, tec }: { netBev: number[]; netPhev: number[]; tec: TecFiltro }) {
  const ref = useRef<HTMLDivElement>(null);
  const from = PERIODOS.findIndex((p) => p >= "2019-01");
  const periodos  = PERIODOS.slice(from);
  const slicedBev  = netBev.slice(from);
  const slicedPhev = netPhev.slice(from);

  useChart(ref, () => {
    const series: Record<string, unknown>[] = [];
    const legendData: Record<string, unknown>[] = [];
    if (tec !== "phev") {
      series.push({
        name: "BEV neto", type: "bar", data: slicedBev, barMaxWidth: 10,
        itemStyle: { color: (p: { value: number }) => p.value >= 0 ? C.bev : C.red, borderRadius: 2 },
      });
      legendData.push({ name: "BEV neto", icon: "circle", itemStyle: { color: C.bev } });
    }
    if (tec !== "bev") {
      series.push({
        name: "PHEV neto", type: "bar", data: slicedPhev, barMaxWidth: 10,
        itemStyle: { color: (p: { value: number }) => p.value >= 0 ? C.phev : C.red, borderRadius: 2 },
      });
      legendData.push({ name: "PHEV neto", icon: "circle", itemStyle: { color: C.phev } });
    }

    return {
      backgroundColor: "transparent",
      grid: { top: 28, right: 24, bottom: 48, left: 64 },
      tooltip: { ...TT, trigger: "axis",
        formatter: (params: Record<string, unknown>[]) => {
          const p = (params[0] as { axisValue: string }).axisValue;
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p}</div>` +
            (params as { value: number; seriesName: string; color: string }[]).map((s) =>
              `<div style="display:flex;gap:12px;justify-content:space-between">` +
              `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
              `<span style="font-weight:600;color:${s.value >= 0 ? C.green : C.red}">${s.value >= 0 ? "+" : ""}${fmtN(s.value)}</span></div>`
            ).join("");
        }
      },
      legend: { top: 0, right: 0, textStyle: { color: C.muted, fontSize: 12 }, data: legendData },
      xAxis: { type: "category", data: periodos,
        axisLabel: { color: C.muted, fontSize: 11,
          formatter: (v: string) => {
            const [y, m] = v.split("-");
            return m === "01" ? y : (m === "07" ? `Jul ${y.slice(2)}` : "");
          }
        },
        axisLine: { lineStyle: { color: C.grid } },
        splitLine: { show: false },
      },
      yAxis: { type: "value",
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => fmtN(v) },
        splitLine: { lineStyle: { color: C.grid } },
      },
      series,
    };
  }, [netBev, netPhev, tec]);
  return <div ref={ref} style={{ width: "100%", height: 280 }} />;
}

function ChartMatVsBajas({ tec }: { tec: TecFiltro }) {
  const ref = useRef<HTMLDivElement>(null);
  const from = PERIODOS.findIndex((p) => p >= "2020-01");
  const periodos = PERIODOS.slice(from);
  const matRaw = tec === "bev"  ? MAT_BEV
               : tec === "phev" ? MAT_PHEV
               : MAT_BEV.map((v, i) => v + MAT_PHEV[i]);
  const bajRaw = tec === "bev"  ? BAJA_BEV
               : tec === "phev" ? BAJA_PHEV
               : BAJA_BEV.map((v, i) => v + BAJA_PHEV[i]);
  const mat = matRaw.slice(from);
  const baj = bajRaw.slice(from).map((v) => -v);
  const serieColor = tec === "bev" ? C.bev : tec === "phev" ? C.phev : C.green;
  const seriesLabel = tec === "bev" ? "BEV" : tec === "phev" ? "PHEV" : "BEV + PHEV";

  useChart(ref, () => ({
    backgroundColor: "transparent",
    grid: { top: 28, right: 24, bottom: 48, left: 64 },
    tooltip: { ...TT, trigger: "axis",
      formatter: (params: Record<string, unknown>[]) => {
        const first = params[0] as { axisValue: string; dataIndex: number };
        const p = first.axisValue;
        const i = first.dataIndex;
        return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p} — ${seriesLabel}</div>` +
          `<div>Nuevas: <strong style="color:${serieColor}">${fmtN(mat[i])}</strong></div>` +
          `<div>Bajas: <strong style="color:${C.red}">${fmtN(Math.abs(baj[i]))}</strong></div>`;
      }
    },
    legend: {
      top: 0, right: 0, textStyle: { color: C.muted, fontSize: 12 },
      data: [
        { name: `Matriculaciones ${seriesLabel}`, icon: "circle", itemStyle: { color: serieColor } },
        { name: `Bajas ${seriesLabel}`,           icon: "circle", itemStyle: { color: C.red } },
      ],
    },
    xAxis: { type: "category", data: periodos,
      axisLabel: { color: C.muted, fontSize: 11,
        formatter: (v: string) => {
          const [y, m] = v.split("-");
          return m === "01" ? y : (m === "07" ? `Jul ${y.slice(2)}` : "");
        }
      },
      axisLine: { lineStyle: { color: C.grid } },
      splitLine: { show: false },
    },
    yAxis: { type: "value",
      axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => fmtN(Math.abs(v)) },
      splitLine: { lineStyle: { color: C.grid } },
    },
    series: [
      {
        name: `Matriculaciones ${seriesLabel}`, type: "bar", data: mat, stack: "t",
        barMaxWidth: 16,
        itemStyle: { color: serieColor, opacity: 0.9, borderRadius: [2, 2, 0, 0] },
      },
      {
        name: `Bajas ${seriesLabel}`, type: "bar", data: baj, stack: "t",
        barMaxWidth: 16,
        itemStyle: { color: C.red, opacity: 0.8, borderRadius: [0, 0, 2, 2] },
      },
    ],
  }), [tec]);
  return <div ref={ref} style={{ width: "100%", height: 260 }} />;
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
function ChartPiramideEdad({ edad }: { edad: NonNullable<typeof dgtParqueEdad> }) {
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
      series: [
        { name: "No enchufables", type: "bar", stack: "t", data: noev, barMaxWidth: 14, itemStyle: { color: C_NOENCH } },
        { name: "HEV/otros",      type: "bar", stack: "t", data: hev,  barMaxWidth: 14, itemStyle: { color: "#a78bfa" } },
        { name: "PHEV",           type: "bar", stack: "t", data: phev, barMaxWidth: 14, itemStyle: { color: C.phev } },
        { name: "BEV",            type: "bar", stack: "t", data: bev,  barMaxWidth: 14, itemStyle: { color: C.bev } },
      ],
    };
  }, [edad]);
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
      legend: { top: 0, right: 0, textStyle: { color: C.muted, fontSize: 11 } },
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

// ─── Chart 14 — Proyección al objetivo PNIEC (5M enchufables 2030) ──────────
function ChartProyeccionPniec({
  parEnch, periodos,
}: { parEnch: number[]; periodos: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useChart(ref, () => {
    const TARGET = 5_000_000;
    const TARGET_PERIODO = "2030-12";
    // Regresión lineal sobre últimos 12 meses reales
    const nHist = Math.min(12, parEnch.length);
    const slice = parEnch.slice(-nHist);
    const n = slice.length;
    const xs = Array.from({ length: n }, (_, i) => i);
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = slice.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - xMean) * (slice[i] - yMean); den += (xs[i] - xMean) ** 2; }
    const slope = den > 0 ? num / den : 0; // vehículos/mes

    // Proyectar desde último mes hasta 2030-12
    const lastPer = periodos[periodos.length - 1];
    const [ly, lm] = lastPer.split("-").map(Number);
    const [ty, tm] = TARGET_PERIODO.split("-").map(Number);
    const mesesFalt = (ty - ly) * 12 + (tm - lm);
    const lastVal = parEnch[parEnch.length - 1];
    const projPeriodos: string[] = [];
    const projValues: number[] = [];
    for (let i = 1; i <= mesesFalt; i++) {
      const d = new Date(ly, lm - 1 + i, 1);
      const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      projPeriodos.push(p);
      projValues.push(Math.max(0, Math.round(lastVal + slope * i)));
    }

    // Fecha estimada en que se alcanzaría 5M (extrapolando al ritmo actual)
    const faltan = TARGET - lastVal;
    const mesesAl5M = slope > 0 ? Math.ceil(faltan / slope) : null;
    const etaPeriodo = (() => {
      if (!mesesAl5M || mesesAl5M <= 0) return "ya alcanzado";
      const d = new Date(ly, lm - 1 + mesesAl5M, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();

    const fullPeriodos = [...periodos, ...projPeriodos];
    const histSerie   = [...parEnch, ...projPeriodos.map(() => null)];
    const projSerie   = [...periodos.slice(0, -1).map(() => null), lastVal, ...projValues];
    const targetLine  = fullPeriodos.map(() => TARGET);

    return {
      backgroundColor: "transparent",
      grid: { top: 52, right: 24, bottom: 44, left: 68 },
      tooltip: { ...TT, trigger: "axis",
        formatter: (params: Record<string, unknown>[]) => {
          const p = (params[0] as { axisValue: string }).axisValue;
          return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p}</div>` +
            (params as { value: number | null; seriesName: string; color: string }[]).filter((s) => s.value !== null).map((s) =>
              `<div style="display:flex;gap:12px;justify-content:space-between">` +
              `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
              `<span style="font-weight:600;color:${C.text}">${fmtN(s.value as number)}</span></div>`
            ).join("");
        }
      },
      legend: {
        top: 0, right: 0, textStyle: { color: C.muted, fontSize: 12 },
        data: ["Histórico (real+calc)", "Proyección", "Objetivo PNIEC 5M"],
      },
      graphic: [{
        type: "text", right: 24, top: 24,
        style: {
          text: `ETA a 5M: ${etaPeriodo}`,
          fill: slope > 0 && etaPeriodo <= TARGET_PERIODO ? C.green : C.phev,
          fontSize: 11, fontWeight: 600,
        },
      }],
      xAxis: { type: "category", data: fullPeriodos,
        axisLabel: { color: C.muted, fontSize: 10,
          formatter: (v: string) => {
            const [y, m] = v.split("-");
            return m === "01" ? y : "";
          },
        },
        axisLine: { lineStyle: { color: C.grid } },
        splitLine: { show: false },
      },
      yAxis: { type: "value",
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
        splitLine: { lineStyle: { color: C.grid } },
      },
      series: [
        {
          name: "Histórico (real+calc)", type: "line", data: histSerie,
          smooth: true, symbol: "none",
          lineStyle: { color: C.green, width: 2.4 },
          areaStyle: { color: linGrad(C.green, 0.18, 0.02) },
        },
        {
          name: "Proyección", type: "line", data: projSerie,
          smooth: true, symbol: "none",
          lineStyle: { color: C.green, width: 1.6, type: "dashed", opacity: 0.65 },
        },
        {
          name: "Objetivo PNIEC 5M", type: "line", data: targetLine,
          symbol: "none",
          lineStyle: { color: C.phev, width: 1, type: "dotted", opacity: 0.65 },
          markPoint: {
            symbol: "circle", symbolSize: 8,
            itemStyle: { color: C.phev },
            label: { show: true, position: "right", formatter: "5M", color: C.phev, fontSize: 11, fontWeight: 600 },
            data: [{ coord: [TARGET_PERIODO, TARGET] }],
          },
        },
      ],
    };
  }, [parEnch, periodos]);
  return <div ref={ref} style={{ width: "100%", height: 320 }} />;
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
  const R = dgtParqueResumen;
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

  const netBev  = useMemo(() => parBev.map((v, i)  => i === 0 ? v : v - parBev[i-1]),  [parBev]);
  const netPhev = useMemo(() => parPhev.map((v, i) => i === 0 ? v : v - parPhev[i-1]), [parPhev]);

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
    return Object.entries(pb).map(([ine, tb]) => {
      let bev = 0, phev = 0, tot = 0;
      for (const pt of Object.keys(tb as Record<string, Record<string, number>>)) {
        const row = (tb as Record<string, Record<string, number>>)[pt];
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
  }, [filtro]);

  // ── Enchufables nacional (para proyección PNIEC — no usa filtros) ────────
  const parqueEnchNacional = useMemo(() =>
    dgtParqueMensual.map((m) => (m.parque_acumulado.BEV ?? 0) + (m.parque_acumulado.PHEV ?? 0)),
  []);

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
                  : <><span style={{ color: C.bev }}>BEV</span> + <span style={{ color: C.phev }}>PHEV</span> / Parque total</>}
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
                Exagerado
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

        {/* 2-col row: saldo neto + mat vs bajas */}
        <div style={{ display: "grid", gridTemplateColumns: cols2, gap: isMobile ? 14 : 20, marginBottom: 20 }}>
          <div style={sec}>
            <div style={sTitle}>Saldo neto mensual {filtro === "bev" ? "BEV" : filtro === "phev" ? "PHEV" : "BEV + PHEV"}</div>
            <div style={sDesc}>Variación mensual del parque filtrado. Verde = creció, rojo = se redujo</div>
            <ChartSaldoNeto netBev={netBev} netPhev={netPhev} tec={filtro} />
          </div>
          <div style={sec}>
            <div style={sTitle}>Matriculaciones vs bajas {filtro === "bev" ? "BEV" : filtro === "phev" ? "PHEV" : "BEV + PHEV"} (desde 2020)</div>
            <div style={sDesc}>Serie nacional — sin filtro por tipo ni provincia (no disponible a nivel mensual)</div>
            <ChartMatVsBajas tec={filtro} />
          </div>
        </div>

        {/* Distintivo ambiental + Pirámide de edad */}
        <div style={{ display: "grid", gridTemplateColumns: cols2, gap: isMobile ? 14 : 20, marginBottom: 20 }}>
          <div style={sec}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16 }}>
              <div style={{ ...sTitle, marginBottom: 0 }}>Distintivo ambiental DGT</div>
              <span style={{ fontSize: 10, background: `rgba(${hex2rgb(C_NOENCH)},0.14)`, color: C_NOENCH, borderRadius: 5, padding: "2px 8px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Solo nacional
              </span>
            </div>
            <div style={sDesc}>
              Distribución del parque por etiqueta · snapshot {lastMes.periodo}.
              Dato agregado a nivel país — <strong style={{ color: C.text }}>no responde a filtros de tipo ni provincia</strong>.
            </div>
            {lastMes.parque_distintivo
              ? <ChartDistintivo data={lastMes.parque_distintivo} />
              : <div style={{ padding: "40px 0", color: C.muted, fontSize: 13, textAlign: "center" }}>Sin datos de distintivo para este snapshot</div>
            }
          </div>
          <div style={sec}>
            <div style={sTitle}>Pirámide de edad del parque</div>
            <div style={sDesc}>Vehículos por año de matriculación (últimos 30 años). Muestra la penetración progresiva de BEV/PHEV en las cohortes recientes.</div>
            {dgtParqueEdad && Object.keys(dgtParqueEdad.por_anio).length > 0
              ? <ChartPiramideEdad edad={dgtParqueEdad} />
              : <div style={{ padding: "40px 0", color: C.muted, fontSize: 13, textAlign: "center" }}>Sin datos de edad — regenerar JSON</div>
            }
          </div>
        </div>

        {/* Saldo neto por tipo (último mes) */}
        <div style={{ ...sec, marginBottom: 20 }}>
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

        {/* Proyección PNIEC 5M */}
        <div style={{ ...sec, marginBottom: 20 }}>
          <div style={sTitle}>Proyección al objetivo PNIEC (5M enchufables en 2030)</div>
          <div style={sDesc}>
            Extrapolación lineal del crecimiento de los últimos 12 meses. El objetivo del Plan Nacional Integrado de Energía y Clima fija 5M de turismos eléctricos/híbridos enchufables para diciembre de 2030.
            Serie nacional, no aplica filtro por provincia.
          </div>
          <ChartProyeccionPniec parEnch={parqueEnchNacional} periodos={PERIODOS} />
        </div>

        {/* Tabla resumen */}
        <div style={sec}>
          <div style={sTitle}>Resumen por categoría EV</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Categoría", "Matriculadas", "Bajas", "Parque activo", "Tasa de baja"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Categoría" ? "left" : "right", padding: "8px 12px", color: C.muted, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["BEV", "PHEV"] as const).filter((cat) => R[cat]).map((cat) => {
                const d = R[cat]!;
                const color = cat === "BEV" ? C.bev : C.phev;
                return (
                  <tr key={cat} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: `rgba(${hex2rgb(color)},0.15)`, color, borderRadius: 4, padding: "2px 8px", fontWeight: 600, fontSize: 12 }}>{cat}</span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: C.text }}>{fmtN(d.matriculadas)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: C.red }}>{fmtN(d.bajas)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color, fontWeight: 700 }}>{fmtN(d.parque_activo)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: C.muted }}>{d.tasa_baja_pct}%</td>
                  </tr>
                );
              })}
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ background: `rgba(${hex2rgb(C_NOENCH)},0.12)`, color: C_NOENCH, borderRadius: 4, padding: "2px 8px", fontWeight: 600, fontSize: 12 }}>No enchufables</span>
                  <span style={{ fontSize: 10, color: C.dim, marginLeft: 6 }}>Gasolina · Diésel · HEV · otros</span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.muted, fontSize: 11 }}>—</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.muted, fontSize: 11 }}>—</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C_NOENCH, fontWeight: 700 }}>{fmtN(lastMes.parque_no_enchufable)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.muted, fontSize: 11 }}>—</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 16, fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
            <div>
              <strong style={{ color: C.muted }}>Fuente real:</strong> DGT — ZIP mensual Parque de Vehículos (microdatos).
              {" "}Snapshots reales desde {dgtParqueMeta.primer_periodo_real} hasta {dgtParqueMeta.ultimo_periodo_real}.
            </div>
            <div>
              <strong style={{ color: C.muted }}>Fuente calculada:</strong> DGT MATRABA (matriculaciones − bajas), aplicada hacia atrás desde el primer snapshot real.
            </div>
            <div style={{ marginTop: 6 }}>Actualizado {dgtParqueMeta.ultima_actualizacion}.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
