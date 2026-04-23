"use client";

import { Card } from "../../_components/Card";
import { SectionTitle } from "../../_components/SectionTitle";
import { useIsMobile } from "../../../lib/useIsMobile";
import { ChartTreemap } from "./adn/ChartTreemap";
import { ChartDonutModelos } from "./adn/ChartDonutModelos";
import { ChartMixAnual } from "./adn/ChartMixAnual";
import { ChartRadar } from "./adn/ChartRadar";
import type { MarcaPerfil } from "../types";

type Props = { perfil: MarcaPerfil };

/**
 * Sección "ADN de la marca" — qué vende, mix, posicionamiento vs mercado.
 * Layout:
 *   - Desktop: treemap a la izquierda (2x alto) + columna derecha con donut + mix anual + radar.
 *   - Mobile:  1 columna, orden natural.
 */
export function AdnMarca({ perfil }: Props) {
  const isMobile = useIsMobile();

  const hayModelosParque = perfil.top_modelos_parque.length > 0;
  const hayMixAnual      = perfil.mix_tecnologia_anual.length > 0;

  return (
    <section id="adn" style={{ scrollMarginTop: 140, marginTop: 28 }}>
      <SectionTitle
        sub="Qué vende esta marca, cómo cambió su mix y cómo se posiciona"
        tooltip="Composición del parque activo por tipo de vehículo y modelo, evolución del mix tecnológico a lo largo de los años, y posicionamiento técnico comparado con el promedio del mercado de turismos."
      >
        ADN de la marca
      </SectionTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.1fr) minmax(0, 1fr)",
          gap: 14,
        }}
      >
        {/* Treemap */}
        <Card style={{ minWidth: 0 }}>
          <SectionTitle sub="Parque activo · tipo → modelo">
            Qué compone el parque
          </SectionTitle>
          {hayModelosParque ? (
            <ChartTreemap perfil={perfil} height={isMobile ? 320 : 420} />
          ) : (
            <EmptyState msg="Sin modelos en el parque activo." />
          )}
        </Card>

        {/* Columna derecha con 3 charts apilados */}
        <div style={{ display: "grid", gridTemplateRows: "auto auto auto", gap: 14, minWidth: 0 }}>
          <Card style={{ minWidth: 0 }}>
            <SectionTitle sub="Top 5 modelos del parque">Modelos</SectionTitle>
            {hayModelosParque ? (
              <ChartDonutModelos perfil={perfil} height={isMobile ? 240 : 220} />
            ) : (
              <EmptyState msg="Sin modelos del parque." />
            )}
          </Card>

          <Card style={{ minWidth: 0 }}>
            <SectionTitle sub="Evolución anual de BEV/PHEV/HEV/combustión (matriculaciones)">
              Pivot tecnológico
            </SectionTitle>
            {hayMixAnual ? (
              <ChartMixAnual perfil={perfil} height={220} />
            ) : (
              <EmptyState msg="Sin serie anual de matriculaciones." />
            )}
          </Card>

          <Card style={{ minWidth: 0 }}>
            <SectionTitle sub="Turismos nuevos · últimos 24 meses">
              Posicionamiento vs mercado
            </SectionTitle>
            <ChartRadar perfil={perfil} height={280} />
          </Card>
        </div>
      </div>
    </section>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "28px 14px", textAlign: "center", color: "rgba(241,245,249,0.4)", fontSize: 12 }}>
      {msg}
    </div>
  );
}
