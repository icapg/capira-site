"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

type Props = { perfil: MarcaPerfil; height?: number };

/**
 * Heatmap mes × año con matriculaciones totales de la marca.
 * Útil para identificar estacionalidad (cuándo vende más) y trayectoria interanual.
 */
export function HeatmapEstacionalidad({ perfil, height = 280 }: Props) {
  const option = useMemo(() => {
    const byYearMonth = new Map<string, number>();
    const años = new Set<number>();
    for (const m of perfil.serie_mensual) {
      const [y, mm] = m.periodo.split("-").map(Number);
      const total = m.bev + m.phev + m.hev + m.otro;
      byYearMonth.set(`${y}-${mm}`, (byYearMonth.get(`${y}-${mm}`) ?? 0) + total);
      años.add(y);
    }
    const añosArr = [...años].sort((a, b) => a - b);
    if (!añosArr.length) return null;

    const data: [number, number, number][] = [];
    let max = 0;
    for (let yi = 0; yi < añosArr.length; yi++) {
      for (let mi = 0; mi < 12; mi++) {
        const v = byYearMonth.get(`${añosArr[yi]}-${mi + 1}`) ?? 0;
        if (v > 0) { data.push([mi, yi, v]); if (v > max) max = v; }
      }
    }

    return {
      backgroundColor: "transparent",
      tooltip: {
        position: "top",
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (p: { data: [number, number, number] }) => {
          const [mi, yi, v] = p.data;
          return `<b>${MESES[mi]} ${añosArr[yi]}</b><br/>${v.toLocaleString("es-ES")} matric.`;
        },
      },
      grid: { left: 40, right: 8, top: 8, bottom: 50, containLabel: false },
      xAxis: {
        type: "category",
        data: MESES,
        splitArea: { show: true, areaStyle: { color: ["transparent", "rgba(255,255,255,0.02)"] } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "rgba(241,245,249,0.55)", fontSize: 10 },
      },
      yAxis: {
        type: "category",
        data: añosArr.map(String),
        splitArea: { show: true, areaStyle: { color: ["transparent", "rgba(255,255,255,0.02)"] } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "rgba(241,245,249,0.72)", fontSize: 10, fontWeight: 600 },
      },
      visualMap: {
        min: 0, max,
        calculable: true,
        orient: "horizontal",
        left: "center", bottom: 4,
        itemWidth: 8, itemHeight: 180,
        textStyle: { color: "rgba(241,245,249,0.45)", fontSize: 10 },
        inRange: { color: ["#0b1020", "#1e3a8a", "#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd"] },
        formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v)),
      },
      series: [{
        type: "heatmap",
        data,
        emphasis: { itemStyle: { borderColor: "#f1f5f9", borderWidth: 1 } },
      }],
    };
  }, [perfil]);

  if (!option) {
    return (
      <div style={{ padding: "18px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
        Sin serie mensual para heatmap.
      </div>
    );
  }
  return <EChart option={option} style={{ height }} />;
}
