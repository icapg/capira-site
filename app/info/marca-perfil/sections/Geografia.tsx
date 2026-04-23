"use client";

import { useState } from "react";
import { Card } from "../../_components/Card";
import { SectionTitle } from "../../_components/SectionTitle";
import { useIsMobile } from "../../../lib/useIsMobile";
import { ChartChoropleth, type Modo } from "./geografia/ChartChoropleth";
import { TopProvincias } from "./geografia/TopProvincias";
import type { MarcaPerfil } from "../types";

type Props = { perfil: MarcaPerfil };

/**
 * Sección "Dónde manda" — choropleth España + top 10 provincias.
 * Toggle entre "Cuota %" (% del parque provincial que es de esta marca) y
 * "Absoluto" (cantidad de vehículos de la marca en esa provincia).
 */
export function Geografia({ perfil }: Props) {
  const isMobile = useIsMobile();
  const [modo, setModo] = useState<Modo>("cuota");

  const hayProvincias = Object.keys(perfil.por_provincia).length > 0;

  return (
    <section id="geografia" style={{ scrollMarginTop: 140, marginTop: 28 }}>
      <SectionTitle
        sub="Distribución geográfica del parque activo · último snapshot DGT"
        tooltip="Muestra cómo está distribuido el parque activo de esta marca por provincia. Cuota = % del parque provincial que es de esta marca (mide dominio local). Absoluto = número de vehículos de la marca en esa provincia."
      >
        Dónde manda
      </SectionTitle>

      <div style={{ marginBottom: 12, display: "flex", justifyContent: isMobile ? "center" : "flex-end" }}>
        <ModoToggle modo={modo} onChange={setModo} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: 14,
        }}
      >
        <Card style={{ minWidth: 0, padding: isMobile ? 14 : 24 }}>
          <SectionTitle sub={`Mapa · ${modo === "cuota" ? "% de cuota provincial" : "vehículos en parque"}`}>
            España — {perfil.marca}
          </SectionTitle>
          {hayProvincias ? (
            <ChartChoropleth
              porProvincia={perfil.por_provincia}
              modo={modo}
              marca={perfil.marca}
              height={isMobile ? 320 : 440}
            />
          ) : (
            <EmptyState msg="Sin datos por provincia." />
          )}
        </Card>

        <Card style={{ minWidth: 0 }}>
          <SectionTitle sub={`Ranking por ${modo === "cuota" ? "cuota %" : "vehículos"}`}>
            Top 10 provincias
          </SectionTitle>
          {hayProvincias ? (
            <TopProvincias porProvincia={perfil.por_provincia} modo={modo} height={isMobile ? 360 : 440} />
          ) : (
            <EmptyState msg="Sin datos por provincia." />
          )}
        </Card>
      </div>
    </section>
  );
}

function ModoToggle({ modo, onChange }: { modo: Modo; onChange: (m: Modo) => void }) {
  return (
    <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3, gap: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
      {(["cuota", "absoluto"] as Modo[]).map((m) => {
        const active = modo === m;
        const color = m === "cuota" ? "#38bdf8" : "#a78bfa";
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            style={{
              padding: "5px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              border: active ? `1px solid ${color}44` : "1px solid transparent",
              background: active ? `${color}18` : "transparent",
              color: active ? color : "rgba(241,245,249,0.55)",
              transition: "all 0.15s",
            }}
          >
            {m === "cuota" ? "Cuota %" : "Absoluto"}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "28px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
      {msg}
    </div>
  );
}
