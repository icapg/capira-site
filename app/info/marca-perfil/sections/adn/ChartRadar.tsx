"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

const COL_MARCA   = "#38bdf8";
const COL_MARCA_B = "#fb923c";
const COL_MERCADO = "#94a3b8";

type Props = { perfil: MarcaPerfil; perfilB?: MarcaPerfil; height?: number };

/**
 * Radar comparando la marca vs el promedio del mercado de turismos nuevos (24m).
 * Ejes: CO2 (g/km), kW, peso (kg), autonomía BEV (km).
 * Escala dinámica por eje: max = max(marca, mercado) × 1.25 (padding para visual).
 * Si la marca no tiene muestra suficiente en un eje (null), usa valor mercado con estilo atenuado.
 */
export function ChartRadar({ perfil, perfilB, height = 320 }: Props) {
  const option = useMemo(() => {
    const r = perfil.radar_vs_mercado;
    const MAX_PAD = 1.25;

    const marcaCo2  = r.co2_marca ?? r.co2_mercado;
    const marcaKw   = r.kw_marca  ?? r.kw_mercado;
    const marcaPeso = r.peso_marca ?? r.peso_mercado;
    const marcaAuto = r.autonomia_bev_km_marca ?? r.autonomia_bev_km_mercado;

    // Valores de B (si existe)
    const rB = perfilB?.radar_vs_mercado;
    const bCo2  = rB?.co2_marca ?? rB?.co2_mercado ?? 0;
    const bKw   = rB?.kw_marca  ?? rB?.kw_mercado  ?? 0;
    const bPeso = rB?.peso_marca ?? rB?.peso_mercado ?? 0;
    const bAuto = rB?.autonomia_bev_km_marca ?? rB?.autonomia_bev_km_mercado ?? 0;

    const maxCo2  = Math.max(r.co2_mercado, marcaCo2, bCo2);
    const maxKw   = Math.max(r.kw_mercado,  marcaKw,  bKw);
    const maxPeso = Math.max(r.peso_mercado, marcaPeso, bPeso);
    const maxAuto = Math.max(r.autonomia_bev_km_mercado, marcaAuto, bAuto);

    const indicator = [
      { name: "CO₂ (g/km)",         max: +(maxCo2  * MAX_PAD).toFixed(0) },
      { name: "Potencia (kW)",      max: +(maxKw   * MAX_PAD).toFixed(0) },
      { name: "Peso (kg)",          max: +(maxPeso * MAX_PAD).toFixed(0) },
      { name: "Autonomía BEV (km)", max: +(maxAuto * MAX_PAD).toFixed(0) },
    ];

    const legend = perfilB ? [perfil.marca, perfilB.marca, "Mercado"] : [perfil.marca, "Mercado (turismos)"];
    const serieData: Array<Record<string, unknown>> = [
      {
        name: perfilB ? "Mercado" : "Mercado (turismos)",
        value: [r.co2_mercado, r.kw_mercado, r.peso_mercado, r.autonomia_bev_km_mercado],
        areaStyle: { color: "rgba(148,163,184,0.18)" },
        lineStyle: { color: COL_MERCADO, width: 1.5, type: "dashed" },
        itemStyle: { color: COL_MERCADO },
        symbol: "circle",
        symbolSize: 4,
      },
      {
        name: perfil.marca,
        value: [marcaCo2, marcaKw, marcaPeso, marcaAuto],
        areaStyle: { color: "rgba(56,189,248,0.22)" },
        lineStyle: { color: COL_MARCA, width: 2 },
        itemStyle: { color: COL_MARCA },
        symbol: "circle",
        symbolSize: 6,
      },
    ];
    if (perfilB) {
      serieData.push({
        name: perfilB.marca,
        value: [bCo2, bKw, bPeso, bAuto],
        areaStyle: { color: "rgba(251,146,60,0.22)" },
        lineStyle: { color: COL_MARCA_B, width: 2 },
        itemStyle: { color: COL_MARCA_B },
        symbol: "circle",
        symbolSize: 6,
      });
    }

    return {
      backgroundColor: "transparent",
      tooltip: {
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
      },
      legend: {
        data: legend,
        top: 0,
        textStyle: { color: "rgba(241,245,249,0.7)", fontSize: 11 },
        itemWidth: 10, itemHeight: 10, itemGap: 14,
      },
      radar: {
        indicator,
        center: ["50%", "55%"],
        radius: "62%",
        splitNumber: 4,
        axisName: { color: "rgba(241,245,249,0.8)", fontSize: 10, fontWeight: 600 },
        splitArea: { areaStyle: { color: ["rgba(255,255,255,0.02)", "rgba(255,255,255,0.04)"] } },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
      },
      series: [
        { type: "radar", emphasis: { focus: "series" }, data: serieData },
      ],
    };
  }, [perfil, perfilB]);

  const r = perfil.radar_vs_mercado;
  const avisoSinMuestra =
    r.co2_marca == null && r.kw_marca == null && r.peso_marca == null && r.autonomia_bev_km_marca == null;

  return (
    <div>
      <EChart option={option} style={{ height }} />
      {avisoSinMuestra && (
        <div style={{ textAlign: "center", fontSize: 10, color: "rgba(241,245,249,0.4)", marginTop: -8 }}>
          Sin muestra de turismos nuevos de esta marca en los últimos 24 meses.
        </div>
      )}
      {!avisoSinMuestra && r.n_muestra_marca < 30 && (
        <div style={{ textAlign: "center", fontSize: 10, color: "rgba(241,245,249,0.4)", marginTop: -8 }}>
          Muestra pequeña (n={r.n_muestra_marca}) — valores indicativos.
        </div>
      )}
    </div>
  );
}
