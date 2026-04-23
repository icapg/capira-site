"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

const COL = {
  bev:  "#38bdf8",
  phev: "#fb923c",
  hev:  "#a78bfa",
  no_ev: "#475569",
};

const MAX_ANIO = 30; // después agrupamos como "30+"

type Props = { perfil: MarcaPerfil; height?: number };

/**
 * Pirámide de edad: barras horizontales por años de antigüedad (0-30, +30),
 * apiladas por tecnología. Las edades más recientes arriba.
 */
export function ChartPiramideEdad({ perfil, height = 440 }: Props) {
  const option = useMemo(() => {
    // Compactar años > MAX_ANIO en un bucket "30+"
    const buckets = new Map<number, { bev: number; phev: number; hev: number; no_ev: number }>();
    for (let y = 0; y <= MAX_ANIO; y++) buckets.set(y, { bev: 0, phev: 0, hev: 0, no_ev: 0 });
    for (const p of perfil.piramide_edad) {
      const key = Math.min(p.años, MAX_ANIO);
      const acc = buckets.get(key)!;
      acc.bev   += p.bev;
      acc.phev  += p.phev;
      acc.hev   += p.hev;
      acc.no_ev += p.no_ev;
    }

    const anios = [...buckets.keys()].sort((a, b) => a - b);
    const labels = anios.map((y) => y === MAX_ANIO ? `${MAX_ANIO}+` : String(y));
    const bev   = anios.map((y) => buckets.get(y)!.bev);
    const phev  = anios.map((y) => buckets.get(y)!.phev);
    const hev   = anios.map((y) => buckets.get(y)!.hev);
    const noEv  = anios.map((y) => buckets.get(y)!.no_ev);

    const totals = anios.map((_, i) => bev[i] + phev[i] + hev[i] + noEv[i]);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: Array<{ axisValue: string; seriesName: string; value: number; color: string; dataIndex: number }>) => {
          const idx = params[0]?.dataIndex ?? 0;
          const total = totals[idx];
          const rows = params
            .filter((p) => p.value > 0)
            .map((p) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${p.value.toLocaleString("es-ES")}</b>`)
            .join("<br/>");
          return `<b>${params[0]?.axisValue} años</b> · ${total.toLocaleString("es-ES")} total<br/>${rows || `<span style=\"color:rgba(241,245,249,0.5)\">sin vehículos</span>`}`;
        },
      },
      legend: {
        data: ["BEV", "PHEV", "HEV", "Combustión/otros"],
        top: 0,
        textStyle: { color: "rgba(241,245,249,0.7)", fontSize: 11 },
        itemWidth: 10, itemHeight: 10, itemGap: 14,
      },
      grid: { left: 32, right: 14, top: 32, bottom: 24, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" } },
        axisLabel: {
          color: "rgba(241,245,249,0.45)", fontSize: 10,
          formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
        },
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "rgba(241,245,249,0.55)", fontSize: 10 },
        axisTick: { show: false },
        inverse: false, // años jóvenes arriba (invertimos orden manualmente si queremos al revés)
      },
      series: [
        { name: "BEV",  type: "bar", stack: "t", data: bev,  itemStyle: { color: COL.bev } },
        { name: "PHEV", type: "bar", stack: "t", data: phev, itemStyle: { color: COL.phev } },
        { name: "HEV",  type: "bar", stack: "t", data: hev,  itemStyle: { color: COL.hev } },
        { name: "Combustión/otros", type: "bar", stack: "t", data: noEv, itemStyle: { color: COL.no_ev } },
      ],
    };
  }, [perfil]);

  return <EChart option={option} style={{ height }} />;
}
