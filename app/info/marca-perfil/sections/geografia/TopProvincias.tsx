"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPorProvinciaEntry } from "../../types";
import type { Modo } from "./ChartChoropleth";

// Nombre visible por código INE (copiado del schema DGT).
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

type Props = {
  porProvincia: Record<string, MarcaPorProvinciaEntry>;
  modo: Modo;
  height?: number;
};

/**
 * Barras horizontales con el top 10 de provincias según el modo activo (cuota % o parque absoluto).
 */
export function TopProvincias({ porProvincia, modo, height = 440 }: Props) {
  const option = useMemo(() => {
    const top = Object.entries(porProvincia)
      .map(([cod, d]) => ({
        cod,
        name: PROV_NAMES[cod] ?? cod,
        parque: d.parque,
        cuota:  d.cuota_pct,
        rank:   d.ranking,
      }))
      .filter((x) => x.parque > 0)
      .sort((a, b) => (modo === "cuota" ? b.cuota - a.cuota : b.parque - a.parque))
      .slice(0, 10)
      .reverse(); // invertido para que el top quede arriba en yAxis category

    const values = top.map((x) => modo === "cuota" ? +x.cuota.toFixed(3) : x.parque);
    const names  = top.map((x) => x.name);
    const color  = modo === "cuota" ? "#38bdf8" : "#a78bfa";

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
          const rankLine = item.rank != null ? `<div>Ranking: <b>#${item.rank}</b></div>` : "";
          return `<div style="font-weight:700;margin-bottom:4px">${item.name}</div>` +
            `<div>Parque: <b>${item.parque.toLocaleString("es-ES")}</b></div>` +
            `<div>Cuota provincial: <b style="color:${color}">${item.cuota.toFixed(2)}%</b></div>` +
            rankLine;
        },
      },
      grid: { left: 4, right: 48, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)", type: "dashed" } },
        axisLabel: {
          color: "rgba(241,245,249,0.42)", fontSize: 10,
          formatter: modo === "cuota"
            ? (v: number) => `${v}%`
            : (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
        },
      },
      yAxis: {
        type: "category",
        data: names,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "rgba(241,245,249,0.72)", fontSize: 11, fontWeight: 600 },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: values,
          barMaxWidth: 18,
          itemStyle: { color, borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: "right",
            color: "rgba(241,245,249,0.75)",
            fontSize: 10,
            fontWeight: 700,
            formatter: modo === "cuota"
              ? (p: { value: number }) => `${p.value.toFixed(2)}%`
              : (p: { value: number }) => p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}k` : String(p.value),
          },
        },
      ],
    };
  }, [porProvincia, modo]);

  return <EChart option={option} style={{ height }} />;
}
