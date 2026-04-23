"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";

// Interpretación estimada de códigos DGT de servicio.
// Se marcan como (estimado) porque no hay docs oficiales públicas.
const SERVICIO_DESC: Record<string, string> = {
  B00: "Particular",
  A01: "Empresa",
  A02: "Alquiler",
  A03: "Transporte público",
  A04: "Taxi / VTC",
  A00: "Transp. mercancías",
  A07: "Ambulancia",
  A09: "Agrícola",
  A13: "Escuela conducción",
  A14: "Vehículo histórico",
  A15: "Autoescuela",
  A16: "Parque móvil",
  A18: "FFSS",
  A20: "Sanitario",
  B06: "Agricultura",
  B09: "Mercancías",
  B17: "Taxi",
  B18: "Renting",
  B19: "Leasing",
  B22: "Estudiantes",
};

const PALETA = ["#38bdf8", "#fb923c", "#a78bfa", "#34d399", "#f472b6", "#facc15", "#94a3b8"];

type Props = { servicios: Record<string, number>; height?: number };

/**
 * Barras horizontales con el top 6 servicios + "Otros" agrupados.
 */
export function ChartServicios({ servicios, height = 220 }: Props) {
  const { option, total } = useMemo(() => {
    const entries = Object.entries(servicios).sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, 6);
    const restoN = entries.slice(6).reduce((s, [, n]) => s + n, 0);
    const totalN = entries.reduce((s, [, n]) => s + n, 0);

    const items = top
      .map(([code, n]) => ({ code, desc: SERVICIO_DESC[code] ?? "—", n, color: "" }))
      .filter((x) => x.n > 0);
    if (restoN > 0) items.push({ code: "…", desc: "Otros", n: restoN, color: "" });
    items.forEach((it, i) => { it.color = PALETA[i % PALETA.length]; });

    const reversed = [...items].reverse(); // y categorías de mayor-a-menor ⇒ invertir para que top esté arriba

    const opt = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: Array<{ dataIndex: number }>) => {
          const idx = params[0]?.dataIndex ?? 0;
          const item = reversed[idx];
          if (!item) return "";
          const pct = totalN > 0 ? ((item.n / totalN) * 100).toFixed(1) : "0";
          return `<b>${item.desc}</b> <span style="color:rgba(241,245,249,0.55)">· código ${item.code}</span><br/>${item.n.toLocaleString("es-ES")} · ${pct}%`;
        },
      },
      grid: { left: 4, right: 56, top: 4, bottom: 4, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" } },
        axisLabel: {
          color: "rgba(241,245,249,0.42)", fontSize: 10,
          formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
        },
      },
      yAxis: {
        type: "category",
        data: reversed.map((it) => it.desc),
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "rgba(241,245,249,0.72)", fontSize: 11, fontWeight: 600 },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: reversed.map((it) => ({ value: it.n, itemStyle: { color: it.color, borderRadius: [0, 4, 4, 0] } })),
          barMaxWidth: 16,
          label: {
            show: true, position: "right",
            color: "rgba(241,245,249,0.7)", fontSize: 10, fontWeight: 700,
            formatter: (p: { value: number }) =>
              totalN > 0 ? `${((p.value / totalN) * 100).toFixed(0)}%` : "",
          },
        },
      ],
    };
    return { option: opt, total: totalN };
  }, [servicios]);

  if (total === 0) {
    return (
      <div style={{ padding: "28px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
        Sin servicios registrados en los últimos 24 meses.
      </div>
    );
  }

  return <EChart option={option} style={{ height }} />;
}
