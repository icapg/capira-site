"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as echarts from "echarts";
import {
  dgtParqueMeta,
  dgtParqueResumen,
  dgtParqueResumenPorTipo,
  dgtParqueMensual,
} from "../../lib/insights/dgt-parque-data";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DE VEHÍCULO — exactamente los mismos que matriculaciones DGT
// Los tipo_grupo del JSON de parque (turismo, suv_todo_terreno, furgoneta_van,
// moto, especial…) se mapean aquí a los keys canónicos de matriculaciones.
// ─────────────────────────────────────────────────────────────────────────────

type ParqueFiltroTipo = "turismo" | "furgoneta" | "moto_scooter" | "microcar" | "camion" | "autobus" | "otros";

const TIPO_LABELS: Record<ParqueFiltroTipo, string> = {
  turismo:      "Turismo",
  furgoneta:    "Furgoneta",
  moto_scooter: "Moto / Scooter",
  microcar:     "Microcar",
  camion:       "Camión",
  autobus:      "Autobús",
  otros:        "Otros",
};

const TIPOS_ORDER: ParqueFiltroTipo[] = ["turismo", "furgoneta", "moto_scooter", "microcar", "camion", "autobus", "otros"];
const TIPOS_DEFAULT: ParqueFiltroTipo[] = TIPOS_ORDER.filter((t) => t !== "otros");

// Mapeo de filtro-key → tipo_grupo(s) reales en el JSON de parque
const FILTRO_TO_PARQUE_TIPOS: Record<ParqueFiltroTipo, string[]> = {
  turismo:      ["turismo", "suv_todo_terreno"],
  furgoneta:    ["furgoneta_van"],
  moto_scooter: ["moto"],
  microcar:     [],           // no existe como tipo_grupo separado en parque
  camion:       ["camion"],
  autobus:      ["autobus"],
  otros:        ["especial", "otros"],
};

// ─────────────────────────────────────────────────────────────────────────────
// PRE-COMPUTED (módulo — no cambian)
// ─────────────────────────────────────────────────────────────────────────────

const PERIODOS = dgtParqueMensual.map((m) => m.periodo);
const MAT_BEV  = dgtParqueMensual.map((m) => m.matriculaciones_mes.BEV ?? 0);
const BAJA_BEV = dgtParqueMensual.map((m) => m.bajas_mes.BEV ?? 0);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE FILTRADO
// ─────────────────────────────────────────────────────────────────────────────

function filtroToParqueTipos(filtros: ParqueFiltroTipo[]): string[] {
  return filtros.flatMap((f) => FILTRO_TO_PARQUE_TIPOS[f]);
}

function filtrarParqueBev(filtros: ParqueFiltroTipo[]): number[] {
  const parqueTipos = filtroToParqueTipos(filtros);
  const isAll = parqueTipos.length === 0 || filtros.length === TIPOS_ORDER.length;
  return dgtParqueMensual.map((m) => {
    if (isAll || !m.parque_por_tipo) return m.parque_acumulado.BEV ?? 0;
    return parqueTipos.reduce((s, t) => s + ((m.parque_por_tipo as any)[t]?.BEV ?? 0), 0);
  });
}

function filtrarParquePhev(filtros: ParqueFiltroTipo[]): number[] {
  const parqueTipos = filtroToParqueTipos(filtros);
  const isAll = parqueTipos.length === 0 || filtros.length === TIPOS_ORDER.length;
  return dgtParqueMensual.map((m) => {
    if (isAll || !m.parque_por_tipo) return m.parque_acumulado.PHEV ?? 0;
    return parqueTipos.reduce((s, t) => s + ((m.parque_por_tipo as any)[t]?.PHEV ?? 0), 0);
  });
}

/** No enchufables = total parque − BEV − PHEV (combustión + HEV + todo lo que no es enchufable) */
function filtrarParqueNoEnchufable(): number[] {
  return dgtParqueMensual.map((m) => m.parque_no_enchufable);
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
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

function fmtN(n: number) { return n.toLocaleString("es-ES"); }

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
  build: () => Record<string, any>,
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

function KpiCard({
  label, value, sub, color, badge,
}: { label: string; value: string; sub?: string; color: string; badge?: string }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        {badge && (
          <span style={{ fontSize: 11, background: `rgba(${hex2rgb(color)},0.15)`, color, borderRadius: 4, padding: "2px 7px" }}>
            {badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 12, color: C.muted }}>{sub}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARTS
// ─────────────────────────────────────────────────────────────────────────────

const C_NOENCH = "#94a3b8"; // color para no enchufables

function ChartParqueEvolucion({ parBev, parPhev, parNoEnch }: { parBev: number[]; parPhev: number[]; parNoEnch: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useChart(ref, () => ({
    backgroundColor: "transparent",
    grid: { top: 28, right: 24, bottom: 48, left: 64 },
    tooltip: { ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const p = params[0].axisValue;
        return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p}</div>` +
          params.map((s: any) =>
            `<div style="display:flex;gap:12px;justify-content:space-between">` +
            `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
            `<span style="font-weight:600;color:${C.text}">${fmtN(s.value)}</span></div>`
          ).join("")
      }
    },
    legend: {
      top: 0, right: 0,
      textStyle: { color: C.muted, fontSize: 12 },
      itemWidth: 18, itemHeight: 4,
      data: [
        { name: "No enchufables", icon: "path://M0,1 L5,1 L5,3 L0,3 Z M8,1 L13,1 L13,3 L8,3 Z M16,1 L21,1 L21,3 L16,3 Z" },
        { name: "PHEV",           icon: "roundRect" },
        { name: "BEV",            icon: "roundRect" },
      ],
    },
    xAxis: { type: "category", data: PERIODOS,
      axisLabel: { color: C.muted, fontSize: 11,
        formatter: (v: string) => {
          const [y, m] = v.split("-");
          return m === "01" ? y : (m === "06" ? `Jun ${y}` : "");
        }
      },
      axisLine: { lineStyle: { color: C.grid } },
      splitLine: { show: false },
    },
    yAxis: [
      { type: "value",
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
        splitLine: { lineStyle: { color: C.grid } },
      },
      { type: "value",
        axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "No enchufables", color: C_NOENCH, type: "line", data: parNoEnch, smooth: true, symbol: "none",
        yAxisIndex: 1,
        lineStyle: { color: C_NOENCH, width: 1.5, type: "dashed" },
        areaStyle: { color: linGrad(C_NOENCH, 0.08, 0.01) },
      },
      {
        name: "PHEV", color: C.phev, type: "line", data: parPhev, smooth: true, symbol: "none",
        yAxisIndex: 0,
        lineStyle: { color: C.phev, width: 2 },
        areaStyle: { color: linGrad(C.phev, 0.25, 0.02) },
      },
      {
        name: "BEV", color: C.bev, type: "line", data: parBev, smooth: true, symbol: "none",
        yAxisIndex: 0,
        lineStyle: { color: C.bev, width: 2 },
        areaStyle: { color: linGrad(C.bev, 0.25, 0.02) },
      },
    ],
  }), [parBev, parPhev, parNoEnch]);
  return <div ref={ref} style={{ width: "100%", height: 340 }} />;
}

function ChartSaldoNeto({ netBev, netPhev }: { netBev: number[]; netPhev: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const from = PERIODOS.findIndex((p) => p >= "2019-01");
  const periodos  = PERIODOS.slice(from);
  const slicedBev  = netBev.slice(from);
  const slicedPhev = netPhev.slice(from);

  useChart(ref, () => ({
    backgroundColor: "transparent",
    grid: { top: 28, right: 24, bottom: 48, left: 64 },
    tooltip: { ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const p = params[0].axisValue;
        return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p}</div>` +
          params.map((s: any) =>
            `<div style="display:flex;gap:12px;justify-content:space-between">` +
            `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
            `<span style="font-weight:600;color:${s.value >= 0 ? C.green : C.red}">${s.value >= 0 ? "+" : ""}${fmtN(s.value)}</span></div>`
          ).join("")
      }
    },
    legend: { top: 0, right: 0, textStyle: { color: C.muted, fontSize: 12 } },
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
    series: [
      {
        name: "BEV neto", type: "bar", data: slicedBev, barMaxWidth: 10,
        itemStyle: { color: (p: any) => p.value >= 0 ? C.bev : C.red, borderRadius: 2 },
      },
      {
        name: "PHEV neto", type: "bar", data: slicedPhev, barMaxWidth: 10,
        itemStyle: { color: (p: any) => p.value >= 0 ? C.phev : C.red, borderRadius: 2 },
      },
    ],
  }), [netBev, netPhev]);
  return <div ref={ref} style={{ width: "100%", height: 280 }} />;
}

function ChartMatVsBajas() {
  const ref = useRef<HTMLDivElement>(null);
  const from = PERIODOS.findIndex((p) => p >= "2020-01");
  const periodos = PERIODOS.slice(from);
  const matBev   = MAT_BEV.slice(from);
  const bajBev   = BAJA_BEV.slice(from).map((v) => -v);

  useChart(ref, () => ({
    backgroundColor: "transparent",
    grid: { top: 28, right: 24, bottom: 48, left: 64 },
    tooltip: { ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const p = params[0].axisValue;
        return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p} — BEV</div>` +
          `<div>Nuevas: <strong style="color:${C.bev}">${fmtN(matBev[params[0].dataIndex])}</strong></div>` +
          `<div>Bajas: <strong style="color:${C.red}">${fmtN(BAJA_BEV.slice(from)[params[0].dataIndex])}</strong></div>`
      }
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
        name: "Matriculaciones BEV", type: "bar", data: matBev, stack: "bev",
        barMaxWidth: 16,
        itemStyle: { color: C.bev, opacity: 0.9, borderRadius: [2, 2, 0, 0] },
      },
      {
        name: "Bajas BEV", type: "bar", data: bajBev, stack: "bev",
        barMaxWidth: 16,
        itemStyle: { color: C.red, opacity: 0.8, borderRadius: [0, 0, 2, 2] },
      },
    ],
  }), []);
  return <div ref={ref} style={{ width: "100%", height: 260 }} />;
}

function ChartPorTipo({ entries }: { entries: { tipo: string; BEV: number; PHEV: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const tipos    = entries.map((t) => TIPO_LABELS[t.tipo as ParqueFiltroTipo] ?? t.tipo.replace(/_/g, " "));
  const bevData  = entries.map((t) => t.BEV);
  const phevData = entries.map((t) => Math.max(t.PHEV, 0));

  useChart(ref, () => ({
    backgroundColor: "transparent",
    grid: { top: 8, right: 80, bottom: 8, left: 110, containLabel: false },
    tooltip: { ...TT, trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (params: Record<string, any>[]) => {
        const tg = params[0].axisValue;
        return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${tg}</div>` +
          params.filter((s: any) => s.value > 0).map((s: any) =>
            `<div style="display:flex;gap:12px;justify-content:space-between">` +
            `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
            `<span style="font-weight:600;color:${C.text}">${fmtN(s.value)}</span></div>`
          ).join("")
      }
    },
    legend: { orient: "vertical", right: 0, top: "center", textStyle: { color: C.muted, fontSize: 11 } },
    xAxis: { type: "value",
      axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
      splitLine: { lineStyle: { color: C.grid } },
    },
    yAxis: { type: "category", data: tipos.slice().reverse(),
      axisLabel: { color: C.muted, fontSize: 12 },
      axisLine: { show: false },
    },
    series: [
      { name: "BEV",  type: "bar", data: bevData.slice().reverse(),  stack: "t", barMaxWidth: 24,
        itemStyle: { color: C.bev, borderRadius: 0 } },
      { name: "PHEV", type: "bar", data: phevData.slice().reverse(), stack: "t", barMaxWidth: 24,
        itemStyle: { color: C.phev, borderRadius: [0, 3, 3, 0] } },
    ],
  }), [entries]);
  return <div ref={ref} style={{ width: "100%", height: Math.max(200, entries.length * 44) }} />;
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

  // ── Filtro por tipo de vehículo ─────────────────────────────────────────
  const [tiposVehiculo, setTiposVehiculo] = useState<ParqueFiltroTipo[]>(TIPOS_DEFAULT);

  const isAllDefault = tiposVehiculo.length === TIPOS_DEFAULT.length &&
    TIPOS_DEFAULT.every((t) => tiposVehiculo.includes(t));
  const otrosSelected = tiposVehiculo.includes("otros");

  function toggleTipo(t: ParqueFiltroTipo) {
    if (t === "otros") {
      setTiposVehiculo((prev) =>
        prev.includes("otros") ? prev.filter((x) => x !== "otros") : [...prev, "otros"]
      );
      return;
    }
    setTiposVehiculo((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function selectTodos() {
    setTiposVehiculo(TIPOS_DEFAULT);
  }

  // ── Series filtradas ────────────────────────────────────────────────────
  const parBev     = useMemo(() => filtrarParqueBev(tiposVehiculo),  [tiposVehiculo]);
  const parPhev    = useMemo(() => filtrarParquePhev(tiposVehiculo), [tiposVehiculo]);
  const parNoEnch  = useMemo(() => filtrarParqueNoEnchufable(), []);

  // Saldo neto mensual derivado del parque filtrado (diff entre periodos)
  const netBev  = useMemo(() => parBev.map((v, i)  => i === 0 ? v : v - parBev[i-1]),  [parBev]);
  const netPhev = useMemo(() => parPhev.map((v, i) => i === 0 ? v : v - parPhev[i-1]), [parPhev]);

  // ── KPIs filtrados (via mapeo filtro → tipo_grupo) ─────────────────────
  const parqueTiposActivos = useMemo(() => filtroToParqueTipos(tiposVehiculo), [tiposVehiculo]);

  const filteredBev  = useMemo(() =>
    parqueTiposActivos.reduce((s, t) => s + (dgtParqueResumenPorTipo[t]?.BEV?.parque_activo  ?? 0), 0),
    [parqueTiposActivos]
  );
  const filteredPhev = useMemo(() =>
    parqueTiposActivos.reduce((s, t) => s + (dgtParqueResumenPorTipo[t]?.PHEV?.parque_activo ?? 0), 0),
    [parqueTiposActivos]
  );

  // ── Entradas para ChartPorTipo ──────────────────────────────────────────
  const tipoEntries = useMemo(() =>
    TIPOS_ORDER
      .filter((t) => tiposVehiculo.includes(t))
      .map((t) => {
        const parqueTipos = FILTRO_TO_PARQUE_TIPOS[t];
        const bev  = parqueTipos.reduce((s, pt) => s + (dgtParqueResumenPorTipo[pt]?.BEV?.parque_activo  ?? 0), 0);
        const phev = parqueTipos.reduce((s, pt) => s + (dgtParqueResumenPorTipo[pt]?.PHEV?.parque_activo ?? 0), 0);
        return { tipo: t, BEV: bev, PHEV: phev };
      })
      .filter((e) => e.BEV + e.PHEV > 0)
      .sort((a, b) => (b.BEV + b.PHEV) - (a.BEV + a.PHEV)),
    [tiposVehiculo]
  );

  const lastMes = dgtParqueMensual[dgtParqueMensual.length - 1];
  const lastNetBev = (lastMes.matriculaciones_mes.BEV ?? 0) - (lastMes.bajas_mes.BEV ?? 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Parque activo EV — España
          </h1>
          <p style={{ color: C.muted, fontSize: 14, margin: "6px 0 0" }}>
            Vehículos electrificados en circulación (BEV + PHEV, sin HEV).
            Datos DGT microdatos MATRABA · Hasta {dgtParqueMeta.ultimo_periodo}
          </p>
        </div>

        {/* ── Filtro tipo de vehículo ───────────────────────────────────── */}
        <div style={{ marginBottom: 28, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.dim, marginRight: 4 }}>Vehículo:</span>

          {/* Todos */}
          <button
            onClick={selectTodos}
            style={{
              padding: "3px 11px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700,
              border: isAllDefault && !otrosSelected ? `1px solid ${C.text}44` : "1px solid transparent",
              background: isAllDefault && !otrosSelected ? "rgba(241,245,249,0.1)" : "rgba(255,255,255,0.04)",
              color: isAllDefault && !otrosSelected ? C.text : C.muted,
              transition: "all 0.15s",
            }}
          >
            Todos
          </button>

          {/* Tipos individuales */}
          {(["turismo","furgoneta","moto_scooter","microcar","camion","autobus","otros"] as ParqueFiltroTipo[]).map((t) => {
            const active = tiposVehiculo.includes(t);
            const col = t === "turismo"      ? "#38bdf8"
              : t === "furgoneta"            ? "#a78bfa"
              : t === "moto_scooter"         ? "#fb923c"
              : t === "microcar"             ? "#34d399"
              : t === "camion"               ? "#fbbf24"
              : t === "autobus"              ? "#f87171"
              : "#94a3b8";
            const isOtros = t === "otros";
            const otrosExcluido = isOtros && !active;
            const tooltip = isOtros
              ? "Incluye: vehículos especiales industriales, quads/ATV, carretillas y otras categorías no clasificadas"
              : undefined;
            return (
              <button key={t} title={tooltip} onClick={() => toggleTipo(t)} style={{
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

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          <KpiCard
            label="Parque total enchufable"
            value={kLabel(filteredBev + filteredPhev)}
            sub={`${fmtN(filteredBev + filteredPhev)} vehículos`}
            color={C.green}
            badge="BEV+PHEV"
          />
          <KpiCard
            label="Parque BEV"
            value={fmtN(filteredBev)}
            sub={`${((filteredBev / (R.BEV?.matriculadas ?? 1)) * 100).toFixed(1)}% tasa de retención`}
            color={C.bev}
            badge="100% eléctrico"
          />
          <KpiCard
            label="Parque PHEV"
            value={fmtN(filteredPhev)}
            sub={`${((filteredPhev / (R.PHEV?.matriculadas ?? 1)) * 100).toFixed(1)}% tasa de retención`}
            color={C.phev}
            badge="Enchufable"
          />
          <KpiCard
            label="No enchufables"
            value={kLabel(lastMes.parque_no_enchufable)}
            sub={`${fmtN(lastMes.parque_no_enchufable)} vehículos · combustión + HEV`}
            color={C_NOENCH}
            badge="Diésel · Gasolina · HEV"
          />
          <KpiCard
            label="Saldo neto BEV (último mes)"
            value={`${lastNetBev >= 0 ? "+" : ""}${fmtN(lastNetBev)}`}
            sub={`${lastMes.periodo} · mats ${fmtN(lastMes.matriculaciones_mes.BEV ?? 0)} · bajas ${fmtN(lastMes.bajas_mes.BEV ?? 0)}`}
            color={lastNetBev >= 0 ? C.green : C.red}
          />
        </div>

        {/* Parque evolution */}
        <div style={{ ...sec, marginBottom: 20 }}>
          <div style={sTitle}>Evolución del parque activo</div>
          <div style={sDesc}>Vehículos en circulación cada mes (matriculaciones acumuladas − bajas acumuladas)</div>
          <ChartParqueEvolucion parBev={parBev} parPhev={parPhev} parNoEnch={parNoEnch} />
        </div>

        {/* 2-col row: saldo neto + mat vs bajas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div style={sec}>
            <div style={sTitle}>Saldo neto mensual BEV + PHEV</div>
            <div style={sDesc}>Variación mensual del parque filtrado. Verde = creció, rojo = se redujo</div>
            <ChartSaldoNeto netBev={netBev} netPhev={netPhev} />
          </div>
          <div style={sec}>
            <div style={sTitle}>Matriculaciones vs bajas BEV (desde 2020)</div>
            <div style={sDesc}>Total BEV — sin filtro por tipo (no disponible a nivel mensual)</div>
            <ChartMatVsBajas />
          </div>
        </div>

        {/* Por tipo de vehículo */}
        <div style={{ ...sec, marginBottom: 20 }}>
          <div style={sTitle}>Parque activo por tipo de vehículo</div>
          <div style={sDesc}>Desglose BEV/PHEV según los tipos seleccionados</div>
          <ChartPorTipo entries={tipoEntries} />
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
              {/* BEV y PHEV */}
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
              {/* No enchufables = total − BEV − PHEV (combustión + HEV + todo lo demás) */}
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
          <div style={{ marginTop: 16, fontSize: 11, color: C.dim }}>
            Fuente: DGT — Microdatos MATRABA (matriculaciones + bajas) · Datos hasta {dgtParqueMeta.ultimo_periodo} · Actualizado {dgtParqueMeta.ultima_actualizacion}
          </div>
        </div>

      </div>
    </div>
  );
}
