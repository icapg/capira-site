"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

const PALETA = ["#38bdf8", "#fb923c", "#a78bfa", "#34d399", "#f472b6", "#facc15", "#94a3b8"];

type Props = { perfil: MarcaPerfil; height?: number };

/**
 * Donut con top 5 modelos del parque + "resto".
 * Muestra el modelo estrella (label central) y cuánto pesa vs el resto.
 */
export function ChartDonutModelos({ perfil, height = 300 }: Props) {
  const { option, estrella, estrellaPct } = useMemo(() => {
    const top = [...perfil.top_modelos_parque].sort((a, b) => b.total - a.total);
    const top5 = top.slice(0, 5);
    const restoN = top.slice(5).reduce((s, m) => s + m.total, 0);

    const total = perfil.parque_activo || top.reduce((s, m) => s + m.total, 0);
    const star = top5[0];
    const starPct = star && total > 0 ? (star.total / total) * 100 : 0;

    const data = top5.map((m, i) => ({
      name: m.modelo,
      value: m.total,
      itemStyle: { color: PALETA[i] },
    }));
    if (restoN > 0) {
      data.push({ name: "Resto", value: restoN, itemStyle: { color: "#334155" } });
    }

    return {
      estrella: star ?? null,
      estrellaPct: starPct,
      option: {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(5,8,16,0.97)",
          borderColor: "rgba(255,255,255,0.12)",
          textStyle: { color: "#f1f5f9", fontSize: 12 },
          formatter: (p: { name: string; value: number; percent: number }) =>
            `<b>${p.name}</b><br/>${p.value.toLocaleString("es-ES")} veh · ${p.percent.toFixed(1)}%`,
        },
        legend: {
          orient: "vertical",
          right: 0,
          top: "center",
          textStyle: { color: "rgba(241,245,249,0.65)", fontSize: 11 },
          itemGap: 6,
          itemWidth: 10,
          itemHeight: 10,
        },
        series: [
          {
            type: "pie",
            radius: ["55%", "82%"],
            center: ["32%", "50%"],
            avoidLabelOverlap: true,
            itemStyle: {
              borderColor: "rgba(5,8,16,0.9)",
              borderWidth: 2,
            },
            label: { show: false },
            labelLine: { show: false },
            data,
          },
        ],
      },
    };
  }, [perfil]);

  return (
    <div style={{ position: "relative" }}>
      <EChart option={option} style={{ height }} />
      {estrella && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "32%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(241,245,249,0.45)", textTransform: "uppercase", marginBottom: 2 }}>
            Modelo estrella
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1.15, maxWidth: 140, wordBreak: "break-word" }}>
            {estrella.modelo}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", marginTop: 2 }}>
            {estrellaPct.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}
