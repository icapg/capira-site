"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

const PROV_NAMES: Record<string, string> = {
  "01":"Álava","02":"Albacete","03":"Alicante","04":"Almería","05":"Ávila","06":"Badajoz",
  "07":"Baleares","08":"Barcelona","09":"Burgos","10":"Cáceres","11":"Cádiz","12":"Castellón",
  "13":"Ciudad Real","14":"Córdoba","15":"A Coruña","16":"Cuenca","17":"Girona","18":"Granada",
  "19":"Guadalajara","20":"Guipúzcoa","21":"Huelva","22":"Huesca","23":"Jaén","24":"León",
  "25":"Lleida","26":"La Rioja","27":"Lugo","28":"Madrid","29":"Málaga","30":"Murcia",
  "31":"Navarra","32":"Ourense","33":"Asturias","34":"Palencia","35":"Las Palmas","36":"Pontevedra",
  "37":"Salamanca","38":"S.C. Tenerife","39":"Cantabria","40":"Segovia","41":"Sevilla","42":"Soria",
  "43":"Tarragona","44":"Teruel","45":"Toledo","46":"Valencia","47":"Valladolid","48":"Bizkaia",
  "49":"Zamora","50":"Zaragoza","51":"Ceuta","52":"Melilla",
};

type Props = { perfil: MarcaPerfil; height?: number };

/**
 * Top 10 provincias ordenadas por volumen, mostrando % de ventas
 * (matriculaciones últimos 24m) que son renting/leasing. Diferencia
 * marcada entre B2B-heavy (grandes capitales) y B2C.
 *
 * Nota: el dato de renting está agregado a nivel marca (no por provincia),
 * así que mostramos % renting global de la marca como referencia en cada
 * provincia del top 10 por volumen. Útil como "volumen × naturaleza mixta".
 */
export function RentingPorProvincia({ perfil, height = 260 }: Props) {
  const option = useMemo(() => {
    const rentingPct = perfil.sociologia.renting.S + perfil.sociologia.renting.N > 0
      ? (perfil.sociologia.renting.S / (perfil.sociologia.renting.S + perfil.sociologia.renting.N)) * 100
      : 0;

    const top = Object.entries(perfil.por_provincia)
      .map(([cod, d]) => ({
        cod,
        name: PROV_NAMES[cod] ?? cod,
        parque: d.parque,
      }))
      .filter((x) => x.parque > 0)
      .sort((a, b) => b.parque - a.parque)
      .slice(0, 10)
      .reverse();

    if (!top.length) return null;

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: Array<{ dataIndex: number }>) => {
          const idx = params[0]?.dataIndex ?? 0;
          const item = top[idx];
          if (!item) return "";
          return `<b>${item.name}</b><br/>Parque: <b>${item.parque.toLocaleString("es-ES")}</b><br/>Renting global: <b>${rentingPct.toFixed(1)}%</b>`;
        },
      },
      grid: { left: 4, right: 70, top: 8, bottom: 8, containLabel: true },
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
        data: top.map((x) => x.name),
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "rgba(241,245,249,0.72)", fontSize: 11, fontWeight: 600 },
        axisTick: { show: false },
      },
      series: [{
        type: "bar",
        data: top.map((x) => x.parque),
        barMaxWidth: 18,
        itemStyle: { color: "#38bdf8", borderRadius: [0, 4, 4, 0] },
        label: {
          show: true, position: "right",
          color: "rgba(241,245,249,0.7)", fontSize: 10, fontWeight: 700,
          formatter: (p: { value: number }) => p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}k` : String(p.value),
        },
      }],
    };
  }, [perfil]);

  if (!option) {
    return (
      <div style={{ padding: "18px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
        Sin datos por provincia.
      </div>
    );
  }
  return <EChart option={option} style={{ height }} />;
}
