"use client";

import { Card } from "../../_components/Card";
import { SectionTitle } from "../../_components/SectionTitle";
import { useIsMobile } from "../../../lib/useIsMobile";
import { HeatmapEstacionalidad } from "./comercial/HeatmapEstacionalidad";
import { RentingPorProvincia } from "./comercial/RentingPorProvincia";
import type { MarcaPerfil } from "../types";

type Props = { perfil: MarcaPerfil };

function fmt(n: number): string {
  return n.toLocaleString("es-ES");
}

/**
 * Sección "Vista comercial" — agrupa métricas útiles para concesionarios y
 * equipos de venta: estacionalidad, perfil técnico promedio, renting share
 * por volumen provincial.
 */
export function Comercial({ perfil }: Props) {
  const isMobile = useIsMobile();
  const r = perfil.radar_vs_mercado;
  const renting = perfil.sociologia.renting;
  const rentingTot = renting.S + renting.N;
  const pctRenting = rentingTot > 0 ? (renting.S / rentingTot) * 100 : 0;

  return (
    <section id="comercial" style={{ scrollMarginTop: 140, marginTop: 28 }}>
      <SectionTitle
        sub="Métricas pensadas para concesionarios y equipos comerciales"
        tooltip="Estacionalidad de las ventas de la marca (cuándo se mueve más stock), perfil técnico implícito comparado con el mercado de turismos, y provincias donde más se concentra la flota con referencia al % de renting global."
      >
        Vista comercial
      </SectionTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 14,
        }}
      >
        <Card style={{ minWidth: 0 }}>
          <SectionTitle sub="Matriculaciones mensuales · identificá meses fuertes y caídas">
            Estacionalidad mes × año
          </SectionTitle>
          <HeatmapEstacionalidad perfil={perfil} height={isMobile ? 320 : 360} />
        </Card>

        <div style={{ display: "grid", gridTemplateRows: "auto auto", gap: 14, minWidth: 0 }}>
          <Card style={{ minWidth: 0 }}>
            <SectionTitle sub="Promedio turismos nuevos · últimos 24 meses">
              Perfil técnico implícito
            </SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginTop: 4 }}>
              <MiniKpi label="CO₂ marca" value={r.co2_marca != null ? `${r.co2_marca.toFixed(0)} g/km` : "—"} sub={`Mercado: ${r.co2_mercado.toFixed(0)}`} color="#38bdf8" />
              <MiniKpi label="Potencia" value={r.kw_marca != null ? `${r.kw_marca.toFixed(0)} kW` : "—"} sub={`Mercado: ${r.kw_mercado.toFixed(0)}`} color="#a78bfa" />
              <MiniKpi label="Peso" value={r.peso_marca != null ? `${r.peso_marca.toFixed(0)} kg` : "—"} sub={`Mercado: ${r.peso_mercado.toFixed(0)}`} color="#fb923c" />
              <MiniKpi label="Autonomía BEV" value={r.autonomia_bev_km_marca != null ? `${r.autonomia_bev_km_marca.toFixed(0)} km` : "—"} sub={`Mercado: ${r.autonomia_bev_km_mercado.toFixed(0)}`} color="#34d399" />
            </div>
            <p style={{ fontSize: 10, color: "rgba(241,245,249,0.4)", marginTop: 10, marginBottom: 0 }}>
              Muestra: <b>{fmt(r.n_muestra_marca)}</b> turismos nuevos. Útil como proxy de segmento de producto.
            </p>
          </Card>

          <Card style={{ minWidth: 0 }}>
            <SectionTitle sub={`Top 10 volumen · ${pctRenting.toFixed(0)}% renting global`}>
              Mercado B2B/B2C por volumen
            </SectionTitle>
            <RentingPorProvincia perfil={perfil} height={280} />
          </Card>
        </div>
      </div>
    </section>
  );
}

function MiniKpi({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(241,245,249,0.45)", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "rgba(241,245,249,0.42)", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}
