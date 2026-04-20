"use client";

import { useState } from "react";
import { EChart } from "../../components/ui/EChart";
import type { YearData } from "../../lib/insights/matriculaciones-data";

const COLORS = {
  bev: "#224bd6",
  phev: "#6eb6ff",
  grid: "#f0f0f0",
  text: "#71717a",
};

type TotalAnual = { año: number; bev: number; phev: number };

type Props = {
  porAño: YearData[];
  totalesAnuales: TotalAnual[];
};

export function MatriculacionesCharts({ porAño, totalesAnuales }: Props) {
  const ultimoAño = porAño[porAño.length - 1].año;
  const [añoSeleccionado, setAñoSeleccionado] = useState(ultimoAño);

  const yearData = porAño.find((y) => y.año === añoSeleccionado)!;
  const meses = yearData.meses.map((m) => m.mes);

  const lineOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) =>
        `<b>${params[0].axisValue}</b><br/>` +
        params
          .map(
            (p) =>
              `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <b>${p.value.toLocaleString("es-ES")}</b>`
          )
          .join("<br/>"),
    },
    legend: {
      data: ["BEV", "PHEV"],
      bottom: 0,
      textStyle: { color: COLORS.text, fontSize: 12 },
    },
    grid: { top: 20, right: 20, bottom: 40, left: 60 },
    xAxis: {
      type: "category",
      data: meses,
      axisLine: { lineStyle: { color: COLORS.grid } },
      axisLabel: { color: COLORS.text, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: COLORS.grid } },
      axisLabel: {
        color: COLORS.text,
        fontSize: 11,
        formatter: (v: number) => v.toLocaleString("es-ES"),
      },
    },
    series: [
      {
        name: "BEV",
        type: "line",
        smooth: true,
        data: yearData.meses.map((m) => m.bev),
        lineStyle: { color: COLORS.bev, width: 2.5 },
        itemStyle: { color: COLORS.bev },
        areaStyle: { color: `${COLORS.bev}18` },
      },
      {
        name: "PHEV",
        type: "line",
        smooth: true,
        data: yearData.meses.map((m) => m.phev),
        lineStyle: { color: COLORS.phev, width: 2.5 },
        itemStyle: { color: COLORS.phev },
        areaStyle: { color: `${COLORS.phev}18` },
      },
    ],
  };

  const barOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) =>
        `<b>${params[0].axisValue}</b><br/>` +
        params
          .map(
            (p) =>
              `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <b>${p.value.toLocaleString("es-ES")}</b>`
          )
          .join("<br/>"),
    },
    legend: {
      data: ["BEV", "PHEV"],
      bottom: 0,
      textStyle: { color: COLORS.text, fontSize: 12 },
    },
    grid: { top: 20, right: 20, bottom: 40, left: 70 },
    xAxis: {
      type: "category",
      data: totalesAnuales.map((t) => t.año.toString()),
      axisLine: { lineStyle: { color: COLORS.grid } },
      axisLabel: { color: COLORS.text, fontSize: 12 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: COLORS.grid } },
      axisLabel: {
        color: COLORS.text,
        fontSize: 11,
        formatter: (v: number) =>
          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString(),
      },
    },
    series: [
      {
        name: "BEV",
        type: "bar",
        data: totalesAnuales.map((t) => t.bev),
        itemStyle: { color: COLORS.bev, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 48,
      },
      {
        name: "PHEV",
        type: "bar",
        data: totalesAnuales.map((t) => t.phev),
        itemStyle: { color: COLORS.phev, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 48,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Monthly trend */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Evolución mensual</h2>
          <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5">
            {porAño.map((y) => (
              <button
                key={y.año}
                onClick={() => setAñoSeleccionado(y.año)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  añoSeleccionado === y.año
                    ? "bg-[var(--capira-brand)] text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {y.año}{y.parcial ? "*" : ""}
              </button>
            ))}
          </div>
        </div>
        <EChart option={lineOption} />
        {yearData.parcial && (
          <p className="mt-2 text-xs text-zinc-400">* Año en curso — datos hasta el último mes disponible.</p>
        )}
      </div>

      {/* Annual totals */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-zinc-900">
          Total anual (2022–2024)
        </h2>
        <EChart option={barOption} style={{ height: 300 }} />
      </div>
    </div>
  );
}
