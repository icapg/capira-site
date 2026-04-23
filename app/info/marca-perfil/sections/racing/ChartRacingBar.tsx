"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import type { RacingDataset } from "../../types";

type Props = {
  data: RacingDataset;
  /** Ventana rolling en meses a sumar para cada frame (12 = acumulado 12m). */
  rollingMonths?: number;
  /** Slug de la marca activa para resaltar. */
  highlightSlug?: string | null;
  /** Slug de la marca comparada. */
  highlightSlugB?: string | null;
  height?: number;
};

const HIGHLIGHT_A = "#38bdf8";
const HIGHLIGHT_B = "#fb923c";
const PALETA = ["#a78bfa","#34d399","#f472b6","#facc15","#60a5fa","#fb7185","#22d3ee","#c084fc","#86efac","#fdba74","#f0abfc","#7dd3fc","#fde047","#fca5a5","#6ee7b7"];

/**
 * Racing bar chart: ranking de marcas por matriculaciones rolling-12m,
 * animado mes a mes desde 2015 hasta el último periodo.
 */
export function ChartRacingBar({ data, rollingMonths = 12, highlightSlug, highlightSlugB, height = 420 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const timerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(() => Math.max(0, data.meta.periodos.length - 1));

  // Rolling sums precomputadas por marca × periodo
  const rolling = useMemo(() => {
    const periodos = data.meta.periodos;
    return data.marcas.map((m) => {
      const acc: number[] = [];
      for (let i = 0; i < periodos.length; i++) {
        const start = Math.max(0, i - rollingMonths + 1);
        let s = 0;
        for (let j = start; j <= i; j++) s += m.serie[j] ?? 0;
        acc.push(s);
      }
      return { slug: m.slug, marca: m.marca, rolling: acc };
    });
  }, [data, rollingMonths]);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = echarts.init(ref.current);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chartRef.current?.dispose(); };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const periodo = data.meta.periodos[idx];
    const topMarcas = [...rolling]
      .map((m) => ({ slug: m.slug, marca: m.marca, value: m.rolling[idx] ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15)
      .reverse(); // yAxis category bottom-to-top → invertir para que el top esté arriba

    const colorFor = (slug: string, i: number) => {
      if (slug === highlightSlug)  return HIGHLIGHT_A;
      if (slug === highlightSlugB) return HIGHLIGHT_B;
      return PALETA[i % PALETA.length];
    };

    chartRef.current.setOption({
      backgroundColor: "transparent",
      grid: { left: 4, right: 70, top: 8, bottom: 40, containLabel: true },
      xAxis: {
        max: "dataMax",
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" } },
        axisLabel: {
          color: "rgba(241,245,249,0.42)", fontSize: 10,
          formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
        },
      },
      yAxis: {
        type: "category",
        data: topMarcas.map((m) => m.marca),
        axisLabel: { color: "rgba(241,245,249,0.72)", fontSize: 11, fontWeight: 600 },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisTick: { show: false },
        animationDuration: 300,
        animationDurationUpdate: 300,
      },
      series: [{
        type: "bar",
        realtimeSort: true,
        data: topMarcas.map((m, i) => ({
          value: m.value,
          itemStyle: { color: colorFor(m.slug, i), borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true, position: "right", valueAnimation: true,
          color: "rgba(241,245,249,0.75)", fontSize: 10, fontWeight: 700,
          formatter: (p: { value: number }) => p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}k` : String(p.value),
        },
        animationDuration: 0,
        animationDurationUpdate: 500,
        animationEasing: "linear",
        animationEasingUpdate: "linear",
      }],
      graphic: [{
        type: "text",
        right: 24, bottom: 14,
        style: {
          text: periodo,
          font: "bold 36px system-ui, sans-serif",
          fill: "rgba(241,245,249,0.12)",
        },
      }],
    }, { notMerge: true });
  }, [idx, data, rolling, highlightSlug, highlightSlugB]);

  // Play/stop loop
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = window.setInterval(() => {
      setIdx((i) => {
        const next = i + 1;
        if (next >= data.meta.periodos.length) {
          setPlaying(false);
          return i;
        }
        return next;
      });
    }, 350);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [playing, data.meta.periodos.length]);

  const play = () => {
    if (idx >= data.meta.periodos.length - 1) setIdx(0);
    setPlaying(true);
  };
  const pause = () => setPlaying(false);
  const reset = () => { setPlaying(false); setIdx(0); };

  const periodo = data.meta.periodos[idx];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, gap: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
          {!playing ? (
            <button onClick={play} style={btnStyle}>▶ Reproducir</button>
          ) : (
            <button onClick={pause} style={btnStyle}>⏸ Pausar</button>
          )}
          <button onClick={reset} style={btnStyle}>↺ Reset</button>
        </div>
        <input
          type="range"
          min={0}
          max={data.meta.periodos.length - 1}
          value={idx}
          onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }}
          style={{ flex: 1, minWidth: 140, accentColor: "#38bdf8" }}
          aria-label="Mes"
        />
        <div style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", minWidth: 64, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {periodo}
        </div>
      </div>
      <div ref={ref} style={{ width: "100%", height }} />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 700,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "rgba(241,245,249,0.7)",
};

