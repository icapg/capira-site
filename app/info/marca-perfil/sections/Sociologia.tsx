"use client";

import { Card } from "../../_components/Card";
import { SectionTitle } from "../../_components/SectionTitle";
import { useIsMobile } from "../../../lib/useIsMobile";
import { ChartDonut } from "./sociologia/ChartDonut";
import { ChartServicios } from "./sociologia/ChartServicios";
import type { MarcaPerfil } from "../types";

type Props = { perfil: MarcaPerfil };

/**
 * Sección "Quién compra" — sociología del cliente (matriculaciones nuevas 24m).
 * 3 cards: persona (D/X), renting (S/N), top servicios.
 */
export function Sociologia({ perfil }: Props) {
  const isMobile = useIsMobile();
  const { persona, renting, servicio } = perfil.sociologia;

  const personaSlices = Object.entries(persona)
    .sort((a, b) => b[1] - a[1])
    .map(([code, n], i) => ({
      label: LABEL_PERSONA[code] ?? code,
      subtitle: `código ${code}`,
      value: n,
      color: COLORS_PERSONA[i] ?? "#94a3b8",
    }));

  const rentingSlices = [
    { label: "Compra / propiedad", subtitle: "No renting", value: renting.N, color: "#38bdf8" },
    { label: "Renting / leasing", subtitle: "Renting", value: renting.S, color: "#fb923c" },
  ].filter((s) => s.value > 0);

  return (
    <section id="sociologia" style={{ scrollMarginTop: 140, marginTop: 28 }}>
      <SectionTitle
        sub="Quién compra esta marca · matriculaciones nuevas últimos 24 meses"
        tooltip="Perfil sociológico inferido a partir de los campos de matriculaciones: persona_fisica_jur (códigos DGT D/X), renting (S/N) y servicio declarado. Las interpretaciones literales (D/X = particular/empresa) son estimadas por proporción, no están documentadas oficialmente."
      >
        Quién compra
      </SectionTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr)",
          gap: 14,
        }}
      >
        <Card style={{ minWidth: 0 }}>
          <SectionTitle sub="Tipo de titular (código DGT)">Persona</SectionTitle>
          <ChartDonut slices={personaSlices} height={230} />
          <Footnote>
            D típicamente corresponde a personas con DNI, X a empresas o extranjeros. Estimación basada en proporciones.
          </Footnote>
        </Card>

        <Card style={{ minWidth: 0 }}>
          <SectionTitle sub="Compra vs renting / leasing">Modelo de compra</SectionTitle>
          <ChartDonut slices={rentingSlices} height={230} />
        </Card>

        <Card style={{ minWidth: 0 }}>
          <SectionTitle sub="Top usos declarados (código DGT servicio)">
            Uso del vehículo
          </SectionTitle>
          <ChartServicios servicios={servicio} height={230} />
          <Footnote>
            Códigos DGT mapeados a descripciones estimadas (B00 ≈ particular, A01 ≈ empresa…). Pasá el cursor por una barra para ver el código original.
          </Footnote>
        </Card>
      </div>
    </section>
  );
}

const LABEL_PERSONA: Record<string, string> = {
  D: "DNI (particulares)",
  X: "NIE/empresas",
  F: "Física",
  J: "Jurídica",
};
const COLORS_PERSONA = ["#38bdf8", "#fb923c", "#a78bfa", "#94a3b8"];

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, color: "rgba(241,245,249,0.4)", marginTop: 10, marginBottom: 0, lineHeight: 1.4 }}>
      {children}
    </p>
  );
}
