"use client";

import { useMemo } from "react";
import * as echarts from "echarts";
import { EChart } from "../../../../components/ui/EChart";
import spainGeoJson from "../../../../../data/spain-provinces.json";
import type { MarcaPorProvinciaEntry } from "../../types";

// Registro idempotente del mapa (spain-peninsula + spain-canarias inset).
// Patrón: dashboard-specialist "spain-choropleth-canarias-inset".
type SpainGeoJson = { type: "FeatureCollection"; features: { type: string; properties: { cod_prov: string; name: string }; geometry: unknown }[] };
const CANARIAS_CODS = new Set(["35", "38"]);
const spainSrc = spainGeoJson as unknown as SpainGeoJson;
const spainPeninsulaGeo: SpainGeoJson = { ...spainSrc, features: spainSrc.features.filter((f) => !CANARIAS_CODS.has(f.properties.cod_prov)) };
const spainCanariasGeo:  SpainGeoJson = { ...spainSrc, features: spainSrc.features.filter((f) =>  CANARIAS_CODS.has(f.properties.cod_prov)) };
echarts.registerMap("spain-peninsula", spainPeninsulaGeo as unknown as Parameters<typeof echarts.registerMap>[1]);
echarts.registerMap("spain-canarias",  spainCanariasGeo  as unknown as Parameters<typeof echarts.registerMap>[1]);

const RAMP_CUOTA    = ["#0b1020", "#164e63", "#0369a1", "#0284c7", "#38bdf8", "#bae6fd"];
const RAMP_ABSOLUTO = ["#0b1020", "#312e81", "#5b21b6", "#7c3aed", "#a78bfa", "#ddd6fe"];

export type Modo = "cuota" | "absoluto";

type Props = {
  porProvincia: Record<string, MarcaPorProvinciaEntry>;
  modo: Modo;
  marca: string;
  height?: number;
};

export function ChartChoropleth({ porProvincia, modo, marca, height = 440 }: Props) {
  const option = useMemo(() => {
    const byIne = new Map(Object.entries(porProvincia));
    const values = [...byIne.values()].map((d) => modo === "cuota" ? d.cuota_pct : d.parque);
    const max = Math.max(0.01, ...values);
    const ramp = modo === "cuota" ? RAMP_CUOTA : RAMP_ABSOLUTO;

    const buildData = (features: SpainGeoJson["features"]) => features.map((f) => {
      const d = byIne.get(f.properties.cod_prov);
      return {
        name: f.properties.name,
        value: d ? +(modo === "cuota" ? d.cuota_pct : d.parque).toFixed(3) : 0,
        _cod: f.properties.cod_prov,
        _parque: d?.parque ?? 0,
        _cuota: d?.cuota_pct ?? 0,
        _rank: d?.ranking ?? null,
        _top3: d?.top_3 ?? [],
      };
    });

    const commonStyle = {
      itemStyle: { borderColor: "rgba(255,255,255,0.15)", borderWidth: 0.7, areaColor: "#1e293b" },
      emphasis:  { label: { show: true, color: "#f1f5f9", fontSize: 11, fontWeight: 600 }, itemStyle: { borderColor: "#f1f5f9", borderWidth: 1 } },
      select:    { disabled: true as const },
    };

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (p: { name: string; data?: { _parque: number; _cuota: number; _rank: number | null; _top3: string[] } }) => {
          const d = p.data;
          if (!d || d._parque === 0) return `<span style="color:rgba(241,245,249,0.5)">${p.name} · sin datos</span>`;
          const rankLine = d._rank != null ? `<div>Ranking: <b>#${d._rank}</b></div>` : "";
          const top3 = d._top3.length ? `<div style="color:rgba(241,245,249,0.55);font-size:11px;margin-top:4px">Top: ${d._top3.join(" · ")}</div>` : "";
          return `<div style="font-weight:700;margin-bottom:4px">${p.name}</div>` +
            `<div>Parque ${marca}: <b>${d._parque.toLocaleString("es-ES")}</b></div>` +
            `<div>Cuota provincial: <b style="color:#38bdf8">${d._cuota.toFixed(2)}%</b></div>` +
            rankLine + top3;
        },
      },
      visualMap: {
        min: 0, max, calculable: true, orient: "horizontal",
        left: "center", top: 4, itemWidth: 8, itemHeight: 160,
        textStyle: { color: "rgba(241,245,249,0.45)", fontSize: 10 },
        inRange: { color: ramp },
        formatter: modo === "cuota"
          ? (v: number) => `${v.toFixed(2)}%`
          : (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v)),
        seriesIndex: [0, 1],
      },
      series: [
        { name: "peninsula", type: "map", map: "spain-peninsula", roam: false,
          aspectScale: 0.85, layoutCenter: ["50%", "52%"], layoutSize: "96%",
          data: buildData(spainPeninsulaGeo.features), ...commonStyle },
        { name: "canarias",  type: "map", map: "spain-canarias",  roam: false,
          aspectScale: 0.85, layoutCenter: ["12%", "90%"], layoutSize: "22%",
          data: buildData(spainCanariasGeo.features), ...commonStyle },
      ],
    };
  }, [porProvincia, modo, marca]);

  return <EChart option={option} style={{ height }} />;
}
