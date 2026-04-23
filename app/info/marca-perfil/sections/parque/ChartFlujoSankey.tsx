"use client";

import { useMemo } from "react";
import { EChart } from "../../../../components/ui/EChart";
import type { MarcaPerfil } from "../../types";

const COL_MAT    = "#38bdf8";
const COL_PARQUE = "#34d399";
const COL_BAJA   = "#f87171";

const MOTIVO_LABEL: Record<string, string> = {
  "3": "Desguace",
  "7": "Baja voluntaria",
  "6": "Transferencia",
  "8": "Exportación",
  otros: "Otros motivos",
};
const MOTIVO_COLOR: Record<string, string> = {
  "3": "#dc2626",
  "7": "#f59e0b",
  "6": "#64748b",
  "8": "#0ea5e9",
  otros: "#475569",
};

type Props = { perfil: MarcaPerfil; height?: number };

/**
 * Sankey del flujo del parque desde dic-2014:
 *   Matriculaciones → (activas hoy | ya dadas de baja)
 *   Bajas → desglose por motivo (desguace, voluntaria, transferencia, exportación)
 *
 * Útil para entender la rotación de la flota y cuánto de lo que se
 * matricula termina en desguace real (motivo=3) vs transferencia
 * administrativa (motivo=6).
 *
 * Nota: "activas_hoy" sale de parque filtrando por año_primera_matric ≥ 2014,
 * no representa el total del parque (que incluye pre-2014). Para totales
 * usar los KPIs del Hero.
 */
export function ChartFlujoSankey({ perfil, height = 360 }: Props) {
  const option = useMemo(() => {
    const cohortes = perfil.cohortes ?? [];
    const bajasMotivo = perfil.bajas_por_motivo;
    if (!cohortes.length || !bajasMotivo) return null;

    const totalMatric = cohortes.reduce((s, c) => s + c.matriculadas, 0);
    const totalActivas = cohortes.reduce((s, c) => s + c.activas_hoy, 0);

    // bajas totales = motivo 3 + 7 + 6 + 8 + otros
    const motivos = ["3", "7", "6", "8", "otros"] as const;
    const totalBajas = motivos.reduce((s, k) => s + bajasMotivo[k], 0);

    if (totalMatric === 0) return null;

    // Nodos
    const nodes = [
      { name: "Matriculadas 2014+", itemStyle: { color: COL_MAT } },
      { name: "Activas hoy",        itemStyle: { color: COL_PARQUE } },
      { name: "Dadas de baja",      itemStyle: { color: COL_BAJA } },
      ...motivos.map((k) => ({ name: MOTIVO_LABEL[k], itemStyle: { color: MOTIVO_COLOR[k] } })),
    ];

    // Enlaces: dos capas
    const links = [
      // Matriculadas → activas hoy
      { source: "Matriculadas 2014+", target: "Activas hoy",   value: totalActivas, lineStyle: { color: COL_PARQUE, opacity: 0.35 } },
      // Matriculadas → bajas (agregado — aproximación, puede exceder el total real por re-matriculación)
      { source: "Matriculadas 2014+", target: "Dadas de baja", value: Math.max(0, totalMatric - totalActivas), lineStyle: { color: COL_BAJA, opacity: 0.35 } },
      // Bajas → motivos (prorrateadas al total "Dadas de baja" mostrado)
      ...motivos.map((k) => ({
        source: "Dadas de baja",
        target: MOTIVO_LABEL[k],
        value: totalBajas > 0 ? Math.round((bajasMotivo[k] / totalBajas) * Math.max(1, totalMatric - totalActivas)) : 0,
        lineStyle: { color: MOTIVO_COLOR[k], opacity: 0.35 },
      })).filter((l) => l.value > 0),
    ];

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(5,8,16,0.97)",
        borderColor: "rgba(255,255,255,0.12)",
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (p: { name?: string; value?: number; data?: { source?: string; target?: string; value?: number } }) => {
          if (p.data && p.data.source && p.data.target) {
            return `<b>${p.data.source} → ${p.data.target}</b><br/>${(p.data.value ?? 0).toLocaleString("es-ES")} veh.`;
          }
          if (typeof p.value === "number" && p.name) {
            return `<b>${p.name}</b><br/>${p.value.toLocaleString("es-ES")}`;
          }
          return p.name ?? "";
        },
      },
      series: [{
        type: "sankey",
        emphasis: { focus: "adjacency" },
        nodeAlign: "justify",
        lineStyle: { curveness: 0.5 },
        nodeWidth: 12,
        nodeGap: 12,
        label: { color: "rgba(241,245,249,0.85)", fontSize: 11, fontWeight: 600 },
        data: nodes,
        links,
        left: 0, right: 160, top: 10, bottom: 10,
      }],
    };
  }, [perfil]);

  if (!option) {
    return (
      <div style={{ padding: "28px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
        Sin datos de flujo (requiere build v2 con bajas_por_motivo + cohortes).
      </div>
    );
  }
  return <EChart option={option} style={{ height }} />;
}
