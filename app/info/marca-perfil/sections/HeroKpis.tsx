"use client";

import { KPI } from "../../_components/KPI";
import type { MarcaPerfil } from "../types";

type Props = { perfil: MarcaPerfil };

function fmt(n: number): string {
  return n.toLocaleString("es-ES", { useGrouping: "always" });
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return fmt(n);
}

function pctDelta(curr: number, prev: number): number | undefined {
  if (prev <= 0) return undefined;
  return ((curr - prev) / prev) * 100;
}

function rankingDelta(curr: number | null, prev: number | null): { value: string; positive: boolean } | null {
  if (curr == null || prev == null) return null;
  const diff = prev - curr; // subir en ranking = número menor = diff positivo = bueno
  if (diff === 0) return { value: "=", positive: true };
  return { value: `${diff > 0 ? "↑" : "↓"} ${Math.abs(diff)}`, positive: diff > 0 };
}

export function HeroKpis({ perfil }: Props) {
  const { stats } = perfil;
  const matDelta       = pctDelta(stats.matric_ytd, stats.matric_ytd_prev);
  const cuotaDelta     = pctDelta(stats.cuota_mercado_ytd_pct, stats.cuota_mercado_ytd_prev_pct);
  const rkDelta        = rankingDelta(stats.ranking_ytd, stats.ranking_ytd_prev);

  return (
    <div
      id="resumen"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 14,
        marginBottom: 28,
      }}
    >
      <KPI
        label="Parque activo"
        sub={`${perfil.ultimo_periodo} · DGT`}
        value={fmtCompact(stats.parque_activo)}
        color="#38bdf8"
        icon="🚗"
        tooltip="Vehículos de esta marca activos en el último snapshot DGT del parque."
      />
      <KPI
        label="Matriculaciones YTD"
        sub={`vs ${fmt(stats.matric_ytd_prev)} año anterior`}
        value={fmtCompact(stats.matric_ytd)}
        delta={matDelta}
        color="#34d399"
        icon="📈"
        tooltip="Matriculaciones acumuladas este año (todos los meses cerrados). Delta vs mismo período del año anterior."
      />
      <KPI
        label="Cuota mercado YTD"
        sub={`prev ${stats.cuota_mercado_ytd_prev_pct.toFixed(2)}%`}
        value={`${stats.cuota_mercado_ytd_pct.toFixed(2)}%`}
        delta={cuotaDelta}
        color="#a78bfa"
        icon="🎯"
        tooltip="% que representan las matriculaciones de esta marca sobre el total del mercado español en YTD."
      />
      <KPI
        label="Ranking YTD"
        sub={rkDelta ? `vs #${stats.ranking_ytd_prev}` : "—"}
        value={stats.ranking_ytd ? `#${stats.ranking_ytd}` : "—"}
        color={rkDelta?.positive ? "#34d399" : "#fb923c"}
        icon="🏆"
        tag={rkDelta ? rkDelta.value : undefined}
        tooltip="Posición en el ranking de marcas por matriculaciones YTD, sobre todo el mercado español (todas las categorías)."
      />
      <KPI
        label="% enchufables YTD"
        sub="BEV + PHEV"
        value={`${stats.cuota_bevphev_ytd_pct.toFixed(1)}%`}
        color="#fb923c"
        icon="⚡"
        tooltip="Qué proporción de las matriculaciones YTD de esta marca son enchufables (BEV + PHEV)."
      />
      <KPI
        label="Edad media parque"
        sub={`${fmt(stats.parque_activo)} veh.`}
        value={`${stats.edad_media_parque.toFixed(1)} a`}
        color="#f472b6"
        icon="📅"
        tooltip="Edad media ponderada del parque activo (por año de primera matriculación)."
      />
    </div>
  );
}
