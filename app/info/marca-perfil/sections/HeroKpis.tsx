"use client";

import { KPI } from "../../_components/KPI";
import { Sparkline } from "../components/Sparkline";
import type { MarcaPerfil, MercadoAgregados } from "../types";

const COLORS_A = {
  parque: "#38bdf8", matric: "#34d399", cuota: "#a78bfa",
  rank: "#34d399", ench: "#fb923c", edad: "#f472b6",
};
const COLORS_B = {
  parque: "#fb923c", matric: "#fb923c", cuota: "#fb923c",
  rank: "#fb923c", ench: "#fb923c", edad: "#fb923c",
};

type Props = { perfil: MarcaPerfil; perfilB?: MarcaPerfil; mercado?: MercadoAgregados };

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

function tail<T>(arr: T[], n: number): T[] {
  return arr.length <= n ? arr.slice() : arr.slice(-n);
}

export function HeroKpis({ perfil, perfilB, mercado }: Props) {
  return (
    <div id="resumen" style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 14 }}>
      <KpiRow perfil={perfil} colors={COLORS_A} mercado={mercado} isComparing={!!perfilB} />
      {perfilB && (
        <KpiRow perfil={perfilB} colors={COLORS_B} mercado={mercado} isB isComparing />
      )}
    </div>
  );
}

function KpiRow({ perfil, colors, mercado, isB, isComparing }: { perfil: MarcaPerfil; colors: typeof COLORS_A; mercado?: MercadoAgregados; isB?: boolean; isComparing?: boolean }) {
  const { stats } = perfil;
  const matDelta   = pctDelta(stats.matric_ytd, stats.matric_ytd_prev);
  const cuotaDelta = pctDelta(stats.cuota_mercado_ytd_pct, stats.cuota_mercado_ytd_prev_pct);
  const rkDelta    = rankingDelta(stats.ranking_ytd, stats.ranking_ytd_prev);

  const last12 = tail(perfil.serie_mensual, 12);
  const sparkMatric = last12.map((m) => m.bev + m.phev + m.hev + m.otro);
  const sparkEnchuf = last12.map((m) => {
    const tot = m.bev + m.phev + m.hev + m.otro;
    return tot > 0 ? ((m.bev + m.phev) / tot) * 100 : 0;
  });

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

  const tag = isB ? "B" : (isComparing ? "A" : undefined);

  return (
    <div style={{ position: "relative" }}>
      {isComparing && (
        <div style={{ position: "absolute", top: -8, left: -4, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: isB ? "#fb923c" : "#38bdf8", background: isB ? "rgba(251,146,60,0.12)" : "rgba(56,189,248,0.12)", border: `1px solid ${isB ? "rgba(251,146,60,0.3)" : "rgba(56,189,248,0.3)"}`, zIndex: 1 }}>
          {perfil.marca}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 14,
          marginTop: isComparing ? 8 : 0,
        }}
      >
        <KPI
          label="Parque activo"
          sub={`${perfil.ultimo_periodo} · DGT`}
          value={fmtCompact(stats.parque_activo)}
          color={colors.parque}
          icon="🚗"
          tag={tag}
          tooltip="Vehículos de esta marca activos en el último snapshot DGT del parque."
        />
        <KPI
          label="Matriculaciones YTD"
          sub={`vs ${fmt(stats.matric_ytd_prev)} año anterior`}
          value={fmtCompact(stats.matric_ytd)}
          delta={matDelta}
          color={colors.matric}
          icon="📈"
          tooltip="Matriculaciones acumuladas este año. Delta vs mismo período del año anterior. Sparkline: últimos 12 meses."
          extra={sparkMatric.length >= 2 ? <Sparkline values={sparkMatric} color={colors.matric} width={64} height={22} /> : undefined}
        />
        <KPI
          label="Cuota mercado YTD"
          sub={`prev ${stats.cuota_mercado_ytd_prev_pct.toFixed(2)}%`}
          value={`${stats.cuota_mercado_ytd_pct.toFixed(2)}%`}
          delta={cuotaDelta}
          color={colors.cuota}
          icon="🎯"
          tooltip="% de la marca sobre el total del mercado YTD."
          extra={sparkCuota.length >= 2 ? <Sparkline values={sparkCuota} color={colors.cuota} width={64} height={22} /> : undefined}
        />
        <KPI
          label="Ranking YTD"
          sub={rkDelta ? `vs #${stats.ranking_ytd_prev}` : "—"}
          value={stats.ranking_ytd ? `#${stats.ranking_ytd}` : "—"}
          color={rkDelta?.positive ? "#34d399" : "#fb923c"}
          icon="🏆"
          tag={rkDelta ? rkDelta.value : undefined}
          tooltip="Posición en el ranking del mercado total por matriculaciones YTD."
        />
        <KPI
          label="% enchufables YTD"
          sub="BEV + PHEV"
          value={`${stats.cuota_bevphev_ytd_pct.toFixed(1)}%`}
          color={colors.ench}
          icon="⚡"
          tooltip="% de las matriculaciones YTD que son enchufables. Sparkline: 12m."
          extra={sparkEnchuf.length >= 2 ? <Sparkline values={sparkEnchuf} color={colors.ench} width={64} height={22} /> : undefined}
        />
        <KPI
          label="Edad media parque"
          sub={`${fmt(stats.parque_activo)} veh.`}
          value={`${stats.edad_media_parque.toFixed(1)} a`}
          color={colors.edad}
          icon="📅"
          tooltip="Edad media ponderada del parque activo."
        />
      </div>
    </div>
  );
}
