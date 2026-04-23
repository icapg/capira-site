"use client";

import { Card } from "../../_components/Card";
import { SectionTitle } from "../../_components/SectionTitle";
import { useIsMobile } from "../../../lib/useIsMobile";
import { ChartMatricVsMercado } from "./evolucion/ChartMatricVsMercado";
import { ChartMixMensual } from "./evolucion/ChartMixMensual";
import type { MarcaPerfil, MercadoAgregados } from "../types";

type Props = { perfil: MarcaPerfil; perfilB?: MarcaPerfil; mercado: MercadoAgregados };

/**
 * Sección "La película" — evolución temporal de la marca.
 * - Matric mensual vs mercado total (dos ejes Y, cuota % opcional).
 * - Mix tecnológico mensual (apilado absoluto o 100%).
 * En modo comparación agrega serie de B al primer chart. El segundo (mix)
 * solo muestra A — comparar dos stacked areas es confuso.
 */
export function Evolucion({ perfil, perfilB, mercado }: Props) {
  const isMobile = useIsMobile();
  const haySerie = perfil.serie_mensual.length > 0;

  return (
    <section id="evolucion" style={{ scrollMarginTop: 140, marginTop: 28 }}>
      <SectionTitle
        sub="Matriculaciones mensuales: cómo crece la marca vs el mercado y cómo cambia su mix tecnológico"
        tooltip="Dos series paralelas de matriculaciones de la marca desde dic-2014. Arriba: tendencia absoluta contra la del mercado total (ejes independientes) con overlay opcional de la cuota %. Abajo: mix BEV / PHEV / HEV / combustión mes a mes — útil para ver cuándo empieza el pivot eléctrico."
      >
        La película
      </SectionTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr)",
          gap: 14,
        }}
      >
        <Card style={{ minWidth: 0 }}>
          <SectionTitle sub="Matriculaciones mensuales — doble eje Y (izq marca, der mercado)">
            Tracción vs mercado
          </SectionTitle>
          {haySerie ? (
            <ChartMatricVsMercado perfil={perfil} perfilB={perfilB} mercado={mercado} height={isMobile ? 260 : 320} />
          ) : (
            <EmptyState msg="Sin serie mensual." />
          )}
        </Card>

        <Card style={{ minWidth: 0 }}>
          <SectionTitle sub="BEV / PHEV / HEV / combustión · por mes">
            Evolución del mix
          </SectionTitle>
          {haySerie ? (
            <ChartMixMensual perfil={perfil} height={isMobile ? 260 : 320} />
          ) : (
            <EmptyState msg="Sin serie mensual." />
          )}
        </Card>
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
