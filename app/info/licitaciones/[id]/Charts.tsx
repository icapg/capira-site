"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

const C = {
  text: "#f1f5f9",
  muted: "rgba(241,245,249,0.55)",
  dim:   "rgba(241,245,249,0.30)",
  grid:  "rgba(255,255,255,0.045)",
  border:"rgba(255,255,255,0.07)",
  green: "#34d399",
  blue:  "#38bdf8",
  amber: "#fbbf24",
  purple:"#a78bfa",
  teal:  "#06b6d4",
  orange:"#fb923c",
  red:   "#f87171",
};

const TT = {
  backgroundColor: "rgba(5,8,16,0.97)",
  borderColor: C.border,
  textStyle: { color: C.text, fontSize: 12 },
  extraCssText: "box-shadow:0 8px 32px rgba(0,0,0,0.7);border-radius:10px;padding:10px 14px;",
};

function useChart(option: Record<string, any>) {
  const ref = useRef<HTMLDivElement>(null);
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
  return ref;
}

// ─── Donut de pesos de criterios ───────────────────────────────────────────
type CriterioData = { nombre: string; peso: number; color: string };

export function DonutCriterios({ criterios, height = 240 }: { criterios: CriterioData[]; height?: number }) {
  const total = criterios.reduce((s, c) => s + c.peso, 0) || 100;
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT,
      formatter: (p: any) => `<b style="color:${p.color}">${p.name}</b><br/>Peso: <b>${p.value}%</b><br/>Cuota: <b>${((p.value / total) * 100).toFixed(1)}%</b>`,
    },
    series: [{
      type: "pie",
      radius: ["55%", "82%"],
      center: ["50%", "52%"],
      padAngle: 2,
      data: criterios.map((c) => ({ name: c.nombre, value: c.peso, itemStyle: { color: c.color, borderRadius: 4 } })),
      label: {
        show: true,
        position: "inside",
        formatter: (p: any) => p.percent > 8 ? `${p.value}%` : "",
        fontSize: 13,
        fontWeight: 800,
        color: "#0a0f1a",
      },
      labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 6 },
    }],
  };
  const ref = useChart(option);
  return <div ref={ref} style={{ width: "100%", height }} />;
}

// ─── Bar horizontal de puntuaciones apiladas ───────────────────────────────
type LicitadorPunt = {
  nombre: string;
  puntuacion_economica?: number;
  puntuacion_tecnica?: number;
  puntuacion_total?: number;
  rank?: number;
  esGanador?: boolean;
};

export function BarPuntuaciones({ licitadores, height }: { licitadores: LicitadorPunt[]; height?: number }) {
  const names = licitadores.map((l) => (l.nombre.length > 18 ? l.nombre.slice(0, 16) + "…" : l.nombre));
  const econ  = licitadores.map((l) => l.puntuacion_economica ?? 0);
  const tec   = licitadores.map((l) => l.puntuacion_tecnica ?? 0);
  const tot   = licitadores.map((l) => l.puntuacion_total ?? 0);
  const h = height ?? 280;
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (params: any[]) => {
        const idx = params[0]?.dataIndex ?? 0;
        const l = licitadores[idx];
        const head = `<b style="color:${l.esGanador ? C.green : C.text}">${l.nombre}</b>${l.esGanador ? ` <span style="color:${C.green}">🏆</span>` : ""}`;
        const lines = params
          .filter((p) => p.seriesName !== "total")
          .map((p) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${(p.value as number).toFixed(2)}</b>`)
          .join("<br/>");
        const total = l.puntuacion_total != null ? `<br/><span style="color:${C.muted}">Total: <b>${l.puntuacion_total.toFixed(2)} pts</b></span>` : "";
        return `${head}<br/>${lines}${total}`;
      },
    },
    grid: { top: 40, right: 12, bottom: 28, left: 12, containLabel: true },
    legend: {
      top: 0,
      right: 8,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: C.muted, fontSize: 11 },
      data: ["Puntuación económica", "Puntuación técnica"],
    },
    xAxis: {
      type: "category",
      data: names,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: {
        color: C.text, fontSize: 11, fontWeight: 600, interval: 0,
        rotate: names.length > 4 ? 20 : 0,
        formatter: (val: string, idx: number) => {
          const l = licitadores[idx];
          return l?.esGanador ? `{g|🏆} ${val}` : val;
        },
        rich: { g: { fontSize: 13 } },
      },
    },
    yAxis: {
      type: "value",
      max: 100,
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10 },
    },
    series: [
      {
        name: "Puntuación económica",
        type: "bar",
        stack: "pts",
        data: econ,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: "#e8b4a055" },
            { offset: 1, color: "#e8b4a0" },
          ]),
        },
        barMaxWidth: 48,
        label: {
          show: true,
          position: "insideBottom",
          color: "#1a1a1a",
          fontSize: 11,
          fontWeight: 700,
          formatter: (p: any) => p.value > 4 ? (p.value as number).toFixed(1) : "",
        },
      },
      {
        name: "Puntuación técnica",
        type: "bar",
        stack: "pts",
        data: tec,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: "#8b9fc455" },
            { offset: 1, color: "#8b9fc4" },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 48,
        label: {
          show: true,
          position: "insideTop",
          color: "#1a1a1a",
          fontSize: 11,
          fontWeight: 700,
          formatter: (p: any) => p.value > 4 ? (p.value as number).toFixed(1) : "",
        },
      },
      {
        name: "total",
        type: "scatter",
        data: tot.map((v) => ({ value: [v, v], symbolSize: 1 })),
        symbolSize: 0,
        label: {
          show: true,
          position: "top",
          color: C.text,
          fontWeight: 800,
          fontSize: 12,
          formatter: (p: any) => (p.value[0] as number).toFixed(2),
          offset: [0, -6],
        },
        tooltip: { show: false },
      },
    ],
  };
  const ref = useChart(option);
  return <div ref={ref} style={{ width: "100%", height: h }} />;
}

// ─── Bar vertical de canon ofertado con % vs ganador ──────────────────────
type OfertaCanon = { nombre: string; valor: number; esGanador: boolean };

export function BarCanonOferta({
  licitadores, tipo, height = 240,
}: {
  licitadores: OfertaCanon[];
  tipo: "fijo" | "variable";
  height?: number;
}) {
  const unidadSufijo = tipo === "fijo" ? "/año" : " €/kWh";
  const formatter = tipo === "fijo"
    ? (n: number) => `${Math.round(n).toLocaleString("es-ES")} €`
    : (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 4 });
  const ganador = licitadores.find((l) => l.esGanador) ?? licitadores[0];
  const refGanador = ganador?.valor ?? null;
  const valores = licitadores.map((l) => l.valor);
  const refPromedio = valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
  const refUltimo   = valores.length ? valores[valores.length - 1] : null;
  const names = licitadores.map((l) => (l.nombre.length > 14 ? l.nombre.slice(0, 13) + "…" : l.nombre));
  const values = licitadores.map((l) => l.valor);
  const pctFmt = (n: number | null): string => {
    if (n == null) return "—";
    if (Math.abs(n) < 0.05) return "0%";
    const sign = n > 0 ? "+" : "";
    const abs = Math.abs(n);
    return abs < 10 ? `${sign}${n.toFixed(1)}%` : `${sign}${Math.round(n)}%`;
  };
  const pctColor = (n: number | null) => n == null ? C.muted : n > 0 ? C.green : n < 0 ? C.red : C.muted;
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (params: any[]) => {
        const p = params[0];
        const l = licitadores[p.dataIndex];
        const vsGan = refGanador != null && refGanador !== 0 && !l.esGanador ? ((l.valor - refGanador) / refGanador) * 100 : null;
        const vsPro = refPromedio != null && refPromedio !== 0 ? ((l.valor - refPromedio) / refPromedio) * 100 : null;
        const vsUlt = refUltimo != null && refUltimo !== 0 && l.valor !== refUltimo ? ((l.valor - refUltimo) / refUltimo) * 100 : null;
        const head = `<b style="color:${l.esGanador ? C.green : C.text}">${l.nombre}</b>${l.esGanador ? ` <span style="color:${C.green}">🏆</span>` : ""}`;
        const canonLine = `Canon: <b>${formatter(l.valor)}${unidadSufijo}</b>`;
        const deltas: string[] = [];
        if (!l.esGanador) deltas.push(`<span style="color:${C.muted}">vs ganador:</span> <b style="color:${pctColor(vsGan)}">${pctFmt(vsGan)}</b>`);
        if (vsPro != null) deltas.push(`<span style="color:${C.muted}">vs promedio:</span> <b style="color:${pctColor(vsPro)}">${pctFmt(vsPro)}</b>`);
        if (vsUlt != null) deltas.push(`<span style="color:${C.muted}">vs último:</span> <b style="color:${pctColor(vsUlt)}">${pctFmt(vsUlt)}</b>`);
        return `${head}<br/>${canonLine}${deltas.length ? "<br/>" + deltas.join("<br/>") : ""}`;
      },
    },
    grid: { top: 36, right: 12, bottom: 28, left: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: names,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted, fontSize: 10, interval: 0, rotate: names.length > 4 ? 20 : 0 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => formatter(v) },
    },
    series: [{
      type: "bar",
      data: values.map((v, i) => {
        const l = licitadores[i];
        const c = l.esGanador ? C.green : "#94a3b8";
        let labelText: string;
        let labelColor: string;
        if (l.esGanador) {
          labelText = "{g|🏆}";
          labelColor = C.green;
        } else if (refGanador == null || refGanador === 0) {
          labelText = "";
          labelColor = C.muted;
        } else {
          const d = ((l.valor - refGanador) / refGanador) * 100;
          if (Math.abs(d) < 0.05) {
            labelText = "0%";
            labelColor = C.muted;
          } else {
            const sign = d > 0 ? "+" : "";
            labelText = Math.abs(d) < 10 ? `${sign}${d.toFixed(1)}%` : `${sign}${Math.round(d)}%`;
            labelColor = d > 0 ? C.green : C.red;
          }
        }
        return {
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: c },
              { offset: 1, color: `${c}33` },
            ]),
            borderRadius: [6, 6, 0, 0],
          },
          label: {
            show: true,
            position: "top",
            fontSize: 11,
            fontWeight: 700,
            formatter: labelText,
            color: labelColor,
            rich: { g: { fontSize: 14 } },
          },
        };
      }),
      barMaxWidth: 48,
    }],
  };
  const chartRef = useChart(option);
  return <div ref={chartRef} style={{ width: "100%", height }} />;
}

// ─── Bar vertical con el mix de HW por tecnología ──────────────────────────
type MixHW = { ac?: number; dc?: number; dc_plus?: number; hpc?: number };

export function BarMixHW({ mix, height = 180 }: { mix: MixHW; height?: number }) {
  const data = [
    { name: "AC",  value: mix.ac ?? 0,      color: C.purple },
    { name: "DC",  value: mix.dc ?? 0,      color: C.blue   },
    { name: "DC+", value: mix.dc_plus ?? 0, color: C.green  },
    { name: "HPC", value: mix.hpc ?? 0,     color: C.amber  },
  ].filter((d) => d.value > 0);
  const option = {
    backgroundColor: "transparent",
    tooltip: { ...TT, trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { top: 8, right: 8, bottom: 24, left: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: data.map((d) => d.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted, fontWeight: 700, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10 },
    },
    series: [{
      type: "bar",
      data: data.map((d) => ({
        value: d.value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: d.color },
            { offset: 1, color: `${d.color}33` },
          ]),
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barMaxWidth: 42,
      label: {
        show: true, position: "top", color: C.text, fontSize: 12, fontWeight: 700,
      },
    }],
  };
  const ref = useChart(option);
  return <div ref={ref} style={{ width: "100%", height }} />;
}
