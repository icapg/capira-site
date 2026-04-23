"use client";

import { useMemo, useState } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

const COL = {
  bev:  "#38bdf8",
  phev: "#fb923c",
  hev:  "#a78bfa",
  otro: "#475569",
};

type Modo = "absoluto" | "pct";

type Props = { perfil: MarcaPerfil; height?: number };

/**
 * Área apilada mensual mostrando BEV/PHEV/HEV/combustión del parque matriculado.
 * Modo "absoluto": ejes en unidades absolutas (ve el volumen de ventas también).
 * Modo "pct": apilado 100% mensual (ve solo el mix, sin volumen).
 */
export function ChartMixMensual({ perfil, height = 280 }: Props) {
  const [modo, setModo] = useState<Modo>("absoluto");

  const option = useMemo(() => {
    const serie = perfil.serie_mensual;
    const periodos = serie.map((m) => m.periodo);
    const totales = serie.map((m) => m.bev + m.phev + m.hev + m.otro);

    const toVal = (part: number, i: number) => {
      if (modo === "pct") return totales[i] > 0 ? +((part / totales[i]) * 100).toFixed(2) : 0;
      return part;
    };
    const sBev  = serie.map((m, i) => toVal(m.bev,  i));
    const sPhev = serie.map((m, i) => toVal(m.phev, i));
    const sHev  = serie.map((m, i) => toVal(m.hev,  i));
    const sOtro = serie.map((m, i) => toVal(m.otro, i));

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: Array<{ axisValue: string; seriesName: string; value: number; color: string; dataIndex: number }>) => {
          const periodo = params[0]?.axisValue;
          const idx = params[0]?.dataIndex ?? 0;
          const total = totales[idx];
          const rows = params.map((p) => {
            const v = modo === "pct" ? `${p.value.toFixed(1)}%` : p.value.toLocaleString("es-ES");
            return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${v}</b>`;
          }).join("<br/>");
          return `<b>${periodo}</b> · ${total.toLocaleString("es-ES")} total<br/>${rows}`;
        },
      },
      legend: {
        data: ["BEV", "PHEV", "HEV", "Combustión/otros"],
        top: 0,
        textStyle: { color: "rgba(241,245,249,0.7)", fontSize: 11 },
        itemWidth: 10, itemHeight: 10, itemGap: 12,
      },
      grid: { left: 42, right: 12, top: 32, bottom: 24, containLabel: false },
      xAxis: {
        type: "category",
        data: periodos,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: {
          color: "rgba(241,245,249,0.45)", fontSize: 10,
          formatter: (v: string) => v.endsWith("-01") ? v.slice(0, 4) : "",
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        max: modo === "pct" ? 100 : undefined,
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" } },
        axisLabel: {
          color: "rgba(241,245,249,0.45)", fontSize: 10,
          formatter: modo === "pct"
            ? (v: number) => `${v}%`
            : (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
        },
      },
      series: [
        { name: "BEV",  type: "line", stack: "t", areaStyle: { opacity: 0.85 }, showSymbol: false, data: sBev,  itemStyle: { color: COL.bev },  lineStyle: { width: 0 } },
        { name: "PHEV", type: "line", stack: "t", areaStyle: { opacity: 0.85 }, showSymbol: false, data: sPhev, itemStyle: { color: COL.phev }, lineStyle: { width: 0 } },
        { name: "HEV",  type: "line", stack: "t", areaStyle: { opacity: 0.75 }, showSymbol: false, data: sHev,  itemStyle: { color: COL.hev },  lineStyle: { width: 0 } },
        { name: "Combustión/otros", type: "line", stack: "t", areaStyle: { opacity: 0.7 }, showSymbol: false, data: sOtro, itemStyle: { color: COL.otro }, lineStyle: { width: 0 } },
      ],
    };
  }, [perfil, modo]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: 2, gap: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["absoluto", "pct"] as Modo[]).map((m) => {
            const active = modo === m;
            return (
              <button
                key={m}
                onClick={() => setModo(m)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  color: active ? "#f4f4f5" : "rgba(241,245,249,0.5)",
                }}
              >
                {m === "pct" ? "Mix 100%" : "Absoluto"}
              </button>
            );
          })}
        </div>
      </div>
      <EChart option={option} style={{ height }} />
    </div>
  );
}
