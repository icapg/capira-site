"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

const TIPO_LABEL: Record<string, string> = {
  turismo: "Turismos",
  moto: "Motos",
  trimoto: "Trimotos",
  furgoneta_van: "Furgonetas (VCL)",
  camion: "Camiones",
  autobus: "Autobuses",
  quad_atv: "Quads/ATV",
  microcar: "Microcars",
  remolque: "Remolques",
  especial: "Maquinaria",
  agricola: "Agrícola",
  otros: "Otros",
};

// Paleta por tipo. Respeta el criterio visual BEV(azul)/PHEV(naranja) en otros charts.
const TIPO_COLOR: Record<string, string> = {
  turismo:       "#38bdf8",
  furgoneta_van: "#fb923c",
  moto:          "#a78bfa",
  trimoto:       "#c084fc",
  camion:        "#f472b6",
  autobus:       "#facc15",
  agricola:      "#4ade80",
  quad_atv:      "#fb7185",
  microcar:      "#94a3b8",
  especial:      "#64748b",
  remolque:      "#475569",
  otros:         "#334155",
};

type Props = { perfil: MarcaPerfil; height?: number };

/**
 * Treemap tipo_grupo → modelo (top 20).
 * Niveles:
 *   - nivel 0: tipos de vehículo con sus totales.
 *   - nivel 1: modelos dentro de cada tipo (solo los que aparecen en top_modelos_parque).
 * Click en un tipo hace drill-in.
 */
export function ChartTreemap({ perfil, height = 360 }: Props) {
  const option = useMemo(() => {
    const tipos = Object.entries(perfil.mix_tipo_grupo)
      .filter(([, m]) => m.total > 0)
      .sort((a, b) => b[1].total - a[1].total);

    // Agrupar top_modelos_parque por tipo
    const modsByTipo = new Map<string, typeof perfil.top_modelos_parque>();
    for (const m of perfil.top_modelos_parque) {
      const list = modsByTipo.get(m.tipo_grupo) ?? [];
      list.push(m);
      modsByTipo.set(m.tipo_grupo, list);
    }

    const data = tipos.map(([tipo, mix]) => {
      const mods = modsByTipo.get(tipo) ?? [];
      const sumMods = mods.reduce((s, m) => s + m.total, 0);
      const otros = Math.max(0, mix.total - sumMods);

      const children = mods.slice(0, 10).map((m) => ({
        name: m.modelo,
        value: m.total,
        _tipo: tipo,
      }));
      if (otros > 0 && mods.length > 0) {
        children.push({ name: "— otros —", value: otros, _tipo: tipo });
      }

      return {
        name: TIPO_LABEL[tipo] ?? tipo,
        value: mix.total,
        itemStyle: { color: TIPO_COLOR[tipo] ?? "#64748b" },
        children: children.length ? children : undefined,
      };
    });

    const imputacion = perfil.imputacion_sin_clasificar;

    return {
      backgroundColor: "transparent",
      tooltip: {
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        // Mantiene el tooltip dentro del contenedor del chart (si el contenido
        // es alto, ECharts lo reubica automáticamente en vez de salirse).
        confine: true,
        // Ancho máximo para que no sea ultra-ancho en hover.
        extraCssText: "max-width: 340px; white-space: normal;",
        formatter: (info: { name: string; value: number; treePathInfo?: Array<{ name: string }>; data?: { _tipo?: string } }) => {
          const path = info.treePathInfo?.map((p) => p.name).filter(Boolean).join(" → ") ?? info.name;
          const base = `<b>${path}</b><br/>${info.value.toLocaleString("es-ES")} vehículos`;

          // Enriquecer solo cuando se hace hover sobre "— otros —" (bucket residual de modelos).
          if (info.name !== "— otros —") return base;
          if (!imputacion) return base;

          const tipo = info.data?._tipo;
          if (!tipo) return base;
          const imp = imputacion.por_tipo?.[tipo];
          if (!imp || imp.imputacion.length === 0) return base;

          const lines = imp.imputacion.slice(0, 4).map((x) => {
            const pct = (x.pct * 100).toFixed(x.pct < 0.05 ? 1 : 0);
            return `<span style="color:#94a3b8">${x.modelo}</span> <b style="color:#f1f5f9">~${pct}%</b>`;
          }).join("<br/>");

          const totalImp = imp.total.toLocaleString("es-ES");

          // Badge de confianza (si el imputador emitió confianza_top1/top3).
          let confianzaBadge = "";
          if (imp.confianza_top1 != null) {
            const t1 = Math.round(imp.confianza_top1 * 100);
            const t3 = imp.confianza_top3 != null ? Math.round(imp.confianza_top3 * 100) : null;
            const col = t1 >= 70 ? "#4ade80" : t1 >= 50 ? "#facc15" : "#fb923c";
            const t3Txt = t3 != null ? ` · top-3 ${t3}%` : "";
            confianzaBadge = `<br/><span style="color:${col};font-size:11px;font-weight:700">🎯 top-1 ${t1}%${t3Txt}</span>`;
          }

          const explicacion = `<span style="color:rgba(241,245,249,0.4);font-size:10px;font-style:italic">Imputación sobre vehículos con modelo='¡' en DGT (no es dato real). Confianza estimada por concentración del perfil técnico.</span>`;

          return `${base}<hr style="border:0;border-top:1px dashed rgba(255,255,255,0.15);margin:6px 0"/><b style="color:#fb923c;font-size:11px">Estimación sin clasificar (~${totalImp})</b><br/>${lines}${confianzaBadge}<br/><br/>${explicacion}`;
        },
      },
      series: [
        {
          name: "parque",
          type: "treemap",
          roam: false,
          // Drill-in desactivado: el dataset solo trae modelos para el tipo
          // dominante, así que zoom a tipos secundarios mostraba un cuadro
          // vacío. Todos los niveles ya se ven simultáneamente por upperLabel.
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            color: "#0b1020",
            fontSize: 12,
            fontWeight: 700,
            overflow: "truncate",
            formatter: (params: { name: string; value: number }) =>
              params.value > 0 ? `{b|${params.name}}\n{v|${params.value.toLocaleString("es-ES")}}` : params.name,
            rich: {
              b: { color: "#0b1020", fontSize: 12, fontWeight: 700 },
              v: { color: "rgba(11,16,32,0.7)", fontSize: 10, fontWeight: 600 },
            },
          },
          upperLabel: {
            show: true,
            height: 22,
            color: "#0b1020",
            fontWeight: 800,
            fontSize: 11,
            backgroundColor: "rgba(255,255,255,0.08)",
          },
          itemStyle: {
            borderColor: "rgba(5,8,16,0.8)",
            borderWidth: 2,
            gapWidth: 2,
          },
          levels: [
            {
              itemStyle: { borderColor: "rgba(5,8,16,0.9)", borderWidth: 0, gapWidth: 2 },
              upperLabel: { show: false },
            },
            {
              colorSaturation: [0.4, 0.8],
              itemStyle: { borderColor: "rgba(5,8,16,0.85)", borderWidth: 2, gapWidth: 2 },
              upperLabel: { show: true },
            },
            {
              colorSaturation: [0.3, 0.6],
              itemStyle: { borderColorSaturation: 0.4, gapWidth: 1 },
            },
          ],
          data,
        },
      ],
    };
  }, [perfil]);

  return <EChart option={option} style={{ height }} />;
}
