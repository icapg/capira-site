"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaDistintivoAmbiental } from "../../types";

// Paleta oficial DGT de las etiquetas.
const COLORS: Record<keyof MarcaDistintivoAmbiental, string> = {
  CERO: "#3b82f6",  // azul — 0 emisiones
  ECO:  "#10b981",  // verde — híbridos / GLP / GNC
  C:    "#eab308",  // amarillo — gasolina post-2006 o diésel post-2014
  B:    "#f59e0b",  // amarillo oscuro — gasolina 2000-2006 o diésel 2006-2014
  SIN:  "#64748b",  // gris — sin distintivo (pre-2000 diésel o pre-2001 gasolina)
};
const ORDER: (keyof MarcaDistintivoAmbiental)[] = ["CERO", "ECO", "C", "B", "SIN"];
const LABEL: Record<keyof MarcaDistintivoAmbiental, string> = {
  CERO: "CERO (BEV/PHEV/FCEV)",
  ECO:  "ECO (HEV/GLP/GNC)",
  C:    "C (gasolina ≥2006 / diésel ≥2014)",
  B:    "B (gasolina 2000-06 / diésel 2006-14)",
  SIN:  "Sin distintivo (pre-2000)",
};

type Props = { distintivo: MarcaDistintivoAmbiental; height?: number };

/**
 * Barra horizontal apilada 100% con el mix de distintivos ambientales
 * DGT del parque activo. Útil para ver restricciones ZBE.
 */
export function ChartDistintivo({ distintivo, height = 140 }: Props) {
  const option = useMemo(() => {
    const total = ORDER.reduce((s, k) => s + distintivo[k], 0);
    if (total === 0) return null;

    // Stacked single-bar chart: cada serie es una categoría
    const series = ORDER.map((k) => {
      const n = distintivo[k];
      const pct = total > 0 ? (n / total) * 100 : 0;
      return {
        name: LABEL[k],
        type: "bar",
        stack: "d",
        data: [+pct.toFixed(2)],
        itemStyle: { color: COLORS[k] },
        label: {
          show: pct >= 6,
          formatter: `${pct.toFixed(1)}%`,
          color: "#0b1020",
          fontWeight: 800,
          fontSize: 11,
        },
      };
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (p: { seriesName: string; value: number; color: string }) => {
          const key = ORDER.find((k) => LABEL[k] === p.seriesName);
          const n = key ? distintivo[key] : 0;
          return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}<br/><b>${n.toLocaleString("es-ES")}</b> · ${p.value.toFixed(1)}%`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: "rgba(241,245,249,0.7)", fontSize: 10 },
        itemWidth: 10, itemHeight: 10, itemGap: 10,
      },
      grid: { left: 4, right: 4, top: 18, bottom: 50, containLabel: false },
      xAxis: { type: "value", max: 100, show: false, splitLine: { show: false } },
      yAxis: { type: "category", data: [""], show: false },
      series,
    };
  }, [distintivo]);

  if (!option) {
    return (
      <div style={{ padding: "18px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
        Sin datos de distintivo ambiental.
      </div>
    );
  }
  return <EChart option={option} style={{ height }} />;
}
