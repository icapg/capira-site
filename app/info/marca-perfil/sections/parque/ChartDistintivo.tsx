"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaDistintivoAmbiental } from "../../types";

// Paleta oficial DGT de las etiquetas.
const COLORS: Record<keyof MarcaDistintivoAmbiental, string> = {
  CERO: "#3b82f6",
  ECO:  "#10b981",
  C:    "#eab308",
  B:    "#f59e0b",
  SIN:  "#64748b",
};
const ORDER: (keyof MarcaDistintivoAmbiental)[] = ["CERO", "ECO", "C", "B", "SIN"];
const LABEL: Record<keyof MarcaDistintivoAmbiental, string> = {
  CERO: "CERO (BEV/PHEV/FCEV)",
  ECO:  "ECO (HEV/GLP/GNC)",
  C:    "C (gasolina ≥2006 / diésel ≥2014)",
  B:    "B (gasolina 2000-06 / diésel 2006-14)",
  SIN:  "Sin distintivo (pre-2000)",
};

type Props = {
  distintivo: MarcaDistintivoAmbiental;
  distintivoB?: MarcaDistintivoAmbiental;
  etiquetaA?: string;
  etiquetaB?: string;
  height?: number;
};

/**
 * Stacked 100% del mix de distintivos ambientales. En modo comparación
 * renderiza dos barras (A arriba, B abajo) con la misma paleta DGT.
 */
export function ChartDistintivo({ distintivo, distintivoB, etiquetaA = "A", etiquetaB = "B", height = 140 }: Props) {
  const option = useMemo(() => {
    const pctOf = (d: MarcaDistintivoAmbiental, k: keyof MarcaDistintivoAmbiental) => {
      const total = ORDER.reduce((s, kk) => s + d[kk], 0);
      return total > 0 ? +((d[k] / total) * 100).toFixed(2) : 0;
    };

    const categories = distintivoB ? [etiquetaB, etiquetaA] : [""];
    // yAxis es category con el orden A arriba → invertimos el order (top → bottom)
    const dataA = (k: keyof MarcaDistintivoAmbiental) => pctOf(distintivo,   k);
    const dataB = (k: keyof MarcaDistintivoAmbiental) => distintivoB ? pctOf(distintivoB, k) : 0;

    const series = ORDER.map((k) => ({
      name: LABEL[k],
      type: "bar",
      stack: "d",
      data: distintivoB
        ? [dataB(k), dataA(k)]
        : [dataA(k)],
      itemStyle: { color: COLORS[k] },
      label: {
        show: true,
        formatter: (p: { value: number }) => p.value >= 6 ? `${p.value.toFixed(1)}%` : "",
        color: "#0b1020",
        fontWeight: 800,
        fontSize: 11,
      },
    }));

    if (ORDER.every((k) => dataA(k) === 0) && (!distintivoB || ORDER.every((k) => dataB(k) === 0))) return null;

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (p: { seriesName: string; value: number; color: string; name: string }) => {
          const key = ORDER.find((k) => LABEL[k] === p.seriesName);
          const d = p.name === etiquetaB ? distintivoB : distintivo;
          const n = d && key ? d[key] : 0;
          return `<b>${p.name || ""}</b><br/><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}<br/><b>${n.toLocaleString("es-ES")}</b> · ${p.value.toFixed(1)}%`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: "rgba(241,245,249,0.7)", fontSize: 10 },
        itemWidth: 10, itemHeight: 10, itemGap: 10,
      },
      grid: { left: distintivoB ? 70 : 4, right: 4, top: 12, bottom: 50, containLabel: false },
      xAxis: { type: "value", max: 100, show: false, splitLine: { show: false } },
      yAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "rgba(241,245,249,0.72)", fontSize: 11, fontWeight: 700 },
      },
      series,
    };
  }, [distintivo, distintivoB, etiquetaA, etiquetaB]);

  if (!option) {
    return (
      <div style={{ padding: "18px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
        Sin datos de distintivo ambiental.
      </div>
    );
  }
  return <EChart option={option} style={{ height }} />;
}
