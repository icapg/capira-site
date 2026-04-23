"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

type Props = { perfil: MarcaPerfil; perfilB?: MarcaPerfil; height?: number };

/**
 * Curva de supervivencia: para cada año de matriculación desde 2014,
 * qué % de los vehículos matriculados sigue activo hoy.
 * Más alto = marca más duradera / mejor reventa.
 *
 * Modo comparación: renderiza dos curvas (A azul, B naranja).
 */
export function ChartSupervivencia({ perfil, perfilB, height = 280 }: Props) {
  const option = useMemo(() => {
    const build = (p: MarcaPerfil) => {
      // Filtrar:
      //  - ruido estadístico (n < 20)
      //  - cohortes con más activos hoy que matriculados nuevos: son artefactos
      //    por importaciones usadas que se contabilizan en parque.fec_prim_matr
      //    pero no en matriculaciones con ind_nuevo_usado='N'.
      const cohortes = (p.cohortes ?? []).filter((c) =>
        c.matriculadas >= 20 && c.activas_hoy <= c.matriculadas,
      );
      return cohortes.map((c) => ({
        año: c.año,
        pct: c.matriculadas > 0 ? +((c.activas_hoy / c.matriculadas) * 100).toFixed(1) : 0,
        matriculadas: c.matriculadas,
        activas_hoy: c.activas_hoy,
      }));
    };

    const serieA = build(perfil);
    const serieB = perfilB ? build(perfilB) : [];
    if (!serieA.length) return null;

    const años = [...new Set([...serieA.map((x) => x.año), ...serieB.map((x) => x.año)])].sort();
    const mapA = new Map(serieA.map((x) => [x.año, x]));
    const mapB = new Map(serieB.map((x) => [x.año, x]));
    const yA = años.map((a) => mapA.get(a)?.pct ?? null);
    const yB = años.map((a) => mapB.get(a)?.pct ?? null);

    const legend: string[] = perfilB ? [perfil.marca, perfilB.marca] : [perfil.marca];

    const series: Record<string, unknown>[] = [
      {
        name: perfil.marca,
        type: "line",
        data: yA,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#38bdf8", width: 2 },
        itemStyle: { color: "#38bdf8" },
        areaStyle: { color: "rgba(56,189,248,0.12)" },
        connectNulls: true,
      },
    ];
    if (perfilB) {
      series.push({
        name: perfilB.marca,
        type: "line",
        data: yB,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#fb923c", width: 2 },
        itemStyle: { color: "#fb923c" },
        areaStyle: { color: "rgba(251,146,60,0.10)" },
        connectNulls: true,
      });
    }

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: Array<{ axisValue: string; seriesName: string; value: number | null; color: string; dataIndex: number }>) => {
          const año = params[0]?.axisValue;
          const idx = params[0]?.dataIndex ?? 0;
          const rows = params.map((p) => {
            const mapRef = p.seriesName === perfil.marca ? mapA : mapB;
            const entry = mapRef.get(años[idx]);
            const base = entry ? ` <span style="color:rgba(241,245,249,0.55)">(${entry.activas_hoy.toLocaleString("es-ES")} de ${entry.matriculadas.toLocaleString("es-ES")})</span>` : "";
            return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${p.value != null ? `${p.value.toFixed(1)}%` : "—"}</b>${base}`;
          }).join("<br/>");
          return `<b>${año}</b><br/>${rows}`;
        },
      },
      legend: { data: legend, top: 0, textStyle: { color: "rgba(241,245,249,0.7)", fontSize: 11 }, itemWidth: 10, itemHeight: 10, itemGap: 14 },
      grid: { left: 38, right: 16, top: 32, bottom: 22, containLabel: false },
      xAxis: {
        type: "category",
        data: años.map(String),
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "rgba(241,245,249,0.55)", fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0, max: 100,
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" } },
        axisLabel: { color: "rgba(241,245,249,0.45)", fontSize: 10, formatter: "{value}%" },
      },
      series,
    };
  }, [perfil, perfilB]);

  if (!option) {
    return (
      <div style={{ padding: "28px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
        Sin cohortes suficientes (requiere build v2 con cohortes).
      </div>
    );
  }
  return <EChart option={option} style={{ height }} />;
}
