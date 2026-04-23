"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";

type Slice = { label: string; value: number; color: string; subtitle?: string };

type Props = { slices: Slice[]; height?: number; centerLabel?: string };

/**
 * Donut genérico para sociología. Muestra 2-4 slices con label/color explícitos
 * y un label central opcional (ej. "Particular vs empresa").
 */
export function ChartDonut({ slices, height = 220, centerLabel }: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0);

  const option = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(5,8,16,0.97)",
      borderColor: "rgba(255,255,255,0.12)",
      textStyle: { color: "#f1f5f9", fontSize: 12 },
      formatter: (p: { name: string; value: number; percent: number; data: { subtitle?: string } }) =>
        `<b>${p.name}</b>${p.data.subtitle ? ` <span style="color:rgba(241,245,249,0.55)">(${p.data.subtitle})</span>` : ""}<br/>${p.value.toLocaleString("es-ES")} · ${p.percent.toFixed(1)}%`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: "rgba(241,245,249,0.7)", fontSize: 11 },
      itemWidth: 10, itemHeight: 10, itemGap: 14,
    },
    series: [
      {
        type: "pie",
        radius: ["55%", "78%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: "rgba(5,8,16,0.9)", borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: slices.map((s) => ({
          name: s.label,
          value: s.value,
          subtitle: s.subtitle,
          itemStyle: { color: s.color },
        })),
      },
    ],
  }), [slices]);

  if (total === 0) {
    return (
      <div style={{ padding: "28px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
        Sin muestra en los últimos 24 meses.
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <EChart option={option} style={{ height }} />
      {centerLabel && (
        <div
          style={{
            position: "absolute",
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "rgba(241,245,249,0.45)",
            textTransform: "uppercase",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          {centerLabel}
        </div>
      )}
    </div>
  );
}
