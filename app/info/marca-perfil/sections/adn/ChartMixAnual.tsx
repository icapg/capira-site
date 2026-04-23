"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

const COL = {
  bev:  "#38bdf8",
  phev: "#fb923c",
  hev:  "#a78bfa",
  otro: "#475569",
};

type Props = { perfil: MarcaPerfil; height?: number };

/**
 * Área apilada 100% por año con el mix tecnológico de las matriculaciones.
 * Muestra el "pivot eléctrico" de la marca (cuándo empieza a cambiar el mix).
 */
export function ChartMixAnual({ perfil, height = 260 }: Props) {
  const option = useMemo(() => {
    const entries = [...perfil.mix_tecnologia_anual].sort((a, b) => a.año - b.año);
    const years = entries.map((e) => String(e.año));
    const toPct = (part: number, total: number) => (total > 0 ? +((part / total) * 100).toFixed(2) : 0);
    const totals = entries.map((e) => e.bev + e.phev + e.hev + e.otro);
    const sBev  = entries.map((e, i) => toPct(e.bev,  totals[i]));
    const sPhev = entries.map((e, i) => toPct(e.phev, totals[i]));
    const sHev  = entries.map((e, i) => toPct(e.hev,  totals[i]));
    const sOtro = entries.map((e, i) => toPct(e.otro, totals[i]));

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: Array<{ axisValue: string; seriesName: string; value: number; color: string; dataIndex: number }>) => {
          const year = params[0]?.axisValue;
          const idx = params[0]?.dataIndex ?? 0;
          const total = totals[idx];
          const rows = params
            .map((p) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${p.value.toFixed(1)}%</b>`)
            .join("<br/>");
          return `<b>${year}</b> · ${total.toLocaleString("es-ES")} matric.<br/>${rows}`;
        },
      },
      legend: {
        data: ["BEV", "PHEV", "HEV", "Combustión/otros"],
        top: 0,
        textStyle: { color: "rgba(241,245,249,0.7)", fontSize: 11 },
        itemWidth: 10, itemHeight: 10, itemGap: 12,
      },
      grid: { left: 38, right: 10, top: 36, bottom: 24, containLabel: false },
      xAxis: {
        type: "category",
        data: years,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "rgba(241,245,249,0.55)", fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        max: 100,
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" } },
        axisLabel: { color: "rgba(241,245,249,0.45)", fontSize: 10, formatter: "{value}%" },
      },
      series: [
        { name: "BEV",  type: "line", stack: "t", areaStyle: { opacity: 0.85 }, showSymbol: false, smooth: false, data: sBev,  itemStyle: { color: COL.bev },  lineStyle: { width: 0 } },
        { name: "PHEV", type: "line", stack: "t", areaStyle: { opacity: 0.85 }, showSymbol: false, smooth: false, data: sPhev, itemStyle: { color: COL.phev }, lineStyle: { width: 0 } },
        { name: "HEV",  type: "line", stack: "t", areaStyle: { opacity: 0.75 }, showSymbol: false, smooth: false, data: sHev,  itemStyle: { color: COL.hev },  lineStyle: { width: 0 } },
        { name: "Combustión/otros", type: "line", stack: "t", areaStyle: { opacity: 0.7 }, showSymbol: false, smooth: false, data: sOtro, itemStyle: { color: COL.otro }, lineStyle: { width: 0 } },
      ],
    };
  }, [perfil]);

  return <EChart option={option} style={{ height }} />;
}
