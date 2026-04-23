"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil, MercadoAgregados } from "../../types";

type Props = {
  perfil: MarcaPerfil;
  mercado: MercadoAgregados;
  height?: number;
};

function fmtPeriodo(p: string): string {
  return p;
}

/**
 * Línea mensual: matriculaciones totales de la marca (eje Y izq) vs
 * mercado total (eje Y der). Dos escalas para que la marca sea visible
 * incluso siendo mucho menor que el mercado.
 *
 * Una tercera serie (oculta por defecto) muestra la cuota de mercado %
 * de la marca mes a mes — cruza los otros dos ejes vía rescale.
 */
export function ChartMatricVsMercado({ perfil, mercado, height = 280 }: Props) {
  const option = useMemo(() => {
    const periodos = mercado.serie_mensual.map((m) => m.periodo);
    const byPerfil = new Map(perfil.serie_mensual.map((m) => [m.periodo, m]));

    const marcaTotal = periodos.map((p) => {
      const d = byPerfil.get(p);
      if (!d) return 0;
      return d.bev + d.phev + d.hev + d.otro;
    });
    const mercadoTotal = mercado.serie_mensual.map((m) => m.bev + m.phev + m.hev + m.otro);
    const cuotaPct = periodos.map((_, i) => mercadoTotal[i] > 0 ? +((marcaTotal[i] / mercadoTotal[i]) * 100).toFixed(3) : 0);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: Array<{ axisValue: string; seriesName: string; value: number; color: string }>) => {
          const rows = params.map((p) => {
            const v = p.seriesName === "Cuota %" ? `${p.value.toFixed(2)}%` : p.value.toLocaleString("es-ES");
            return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${v}</b>`;
          }).join("<br/>");
          return `<b>${params[0]?.axisValue ?? ""}</b><br/>${rows}`;
        },
      },
      legend: {
        data: [perfil.marca, "Mercado total", "Cuota %"],
        top: 0,
        selected: { [perfil.marca]: true, "Mercado total": true, "Cuota %": false },
        textStyle: { color: "rgba(241,245,249,0.7)", fontSize: 11 },
        itemWidth: 10, itemHeight: 10, itemGap: 14,
      },
      grid: { left: 44, right: 52, top: 32, bottom: 24, containLabel: false },
      xAxis: {
        type: "category",
        data: periodos.map(fmtPeriodo),
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: {
          color: "rgba(241,245,249,0.45)", fontSize: 10,
          formatter: (v: string) => v.endsWith("-01") ? v.slice(0, 4) : "",
        },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: perfil.marca,
          nameTextStyle: { color: "#38bdf8", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" } },
          axisLabel: {
            color: "rgba(241,245,249,0.45)", fontSize: 10,
            formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
          },
        },
        {
          type: "value",
          name: "Mercado",
          nameTextStyle: { color: "#94a3b8", fontSize: 10 },
          splitLine: { show: false },
          axisLabel: {
            color: "rgba(241,245,249,0.45)", fontSize: 10,
            formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
          },
        },
      ],
      series: [
        {
          name: perfil.marca,
          type: "line",
          yAxisIndex: 0,
          data: marcaTotal,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: "#38bdf8", width: 2 },
          itemStyle: { color: "#38bdf8" },
          areaStyle: { color: "rgba(56,189,248,0.12)" },
        },
        {
          name: "Mercado total",
          type: "line",
          yAxisIndex: 1,
          data: mercadoTotal,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: "#94a3b8", width: 1.3, type: "dashed" },
          itemStyle: { color: "#94a3b8" },
        },
        {
          name: "Cuota %",
          type: "line",
          yAxisIndex: 0,
          data: cuotaPct,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: "#a78bfa", width: 1.5 },
          itemStyle: { color: "#a78bfa" },
        },
      ],
    };
  }, [perfil, mercado]);

  return <EChart option={option} style={{ height }} />;
}
