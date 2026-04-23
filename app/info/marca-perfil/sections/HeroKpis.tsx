"use client";

import { KPI } from "../../_components/KPI";
import { Sparkline } from "../components/Sparkline";
import type { MarcaPerfil, MercadoAgregados } from "../types";

type Props = { perfil: MarcaPerfil; mercado?: MercadoAgregados };

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
  const diff = prev - curr;
  if (diff === 0) return { value: "=", positive: true };
  return { value: `${diff > 0 ? "↑" : "↓"} ${Math.abs(diff)}`, positive: diff > 0 };
}

// Últimos N meses de una serie. Robusto a series cortas.
function tail<T>(arr: T[], n: number): T[] {
  return arr.length <= n ? arr.slice() : arr.slice(-n);
}

export function HeroKpis({ perfil, mercado }: Props) {
  const { stats } = perfil;
  const matDelta       = pctDelta(stats.matric_ytd, stats.matric_ytd_prev);
  const cuotaDelta     = pctDelta(stats.cuota_mercado_ytd_pct, stats.cuota_mercado_ytd_prev_pct);
  const rkDelta        = rankingDelta(stats.ranking_ytd, stats.ranking_ytd_prev);

  // Sparklines — últimos 12 meses de la serie mensual de la marca.
  const last12 = tail(perfil.serie_mensual, 12);
  const sparkMatric    = last12.map((m) => m.bev + m.phev + m.hev + m.otro);
  const sparkEnchuf    = last12.map((m) => {
    const tot = m.bev + m.phev + m.hev + m.otro;
    return tot > 0 ? ((m.bev + m.phev) / tot) * 100 : 0;
  });

  // Cuota de mercado mensual (solo si tenemos el mercado agregado)
  let sparkCuota: number[] = [];
  if (mercado) {
    const byPerfil = new Map(perfil.serie_mensual.map((m) => [m.periodo, m]));
    const mercLast12 = tail(mercado.serie_mensual, 12);
    sparkCuota = mercLast12.map((m) => {
      const p = byPerfil.get(m.periodo);
      const pT = p ? p.bev + p.phev + p.hev + p.otro : 0;
      const mT = m.bev + m.phev + m.hev + m.otro;
      return mT > 0 ? (pT / mT) * 100 : 0;
    });
  }

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
        tooltip="Matriculaciones acumuladas este año (todos los meses cerrados). Delta vs mismo período del año anterior. Sparkline: últimos 12 meses."
        extra={sparkMatric.length >= 2 ? (
          <Sparkline values={sparkMatric} color="#34d399" width={64} height={22} label="Matriculaciones últimos 12 meses" />
        ) : undefined}
      />
      <KPI
        label="Cuota mercado YTD"
        sub={`prev ${stats.cuota_mercado_ytd_prev_pct.toFixed(2)}%`}
        value={`${stats.cuota_mercado_ytd_pct.toFixed(2)}%`}
        delta={cuotaDelta}
        color="#a78bfa"
        icon="🎯"
        tooltip="% que representan las matriculaciones de esta marca sobre el total del mercado español en YTD. Sparkline: cuota mensual últimos 12 meses."
        extra={sparkCuota.length >= 2 ? (
          <Sparkline values={sparkCuota} color="#a78bfa" width={64} height={22} label="Cuota de mercado mensual" />
        ) : undefined}
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
        tooltip="Qué proporción de las matriculaciones YTD de esta marca son enchufables (BEV + PHEV). Sparkline: % mensual últimos 12 meses."
        extra={sparkEnchuf.length >= 2 ? (
          <Sparkline values={sparkEnchuf} color="#fb923c" width={64} height={22} label="% enchufables mensual" />
        ) : undefined}
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
