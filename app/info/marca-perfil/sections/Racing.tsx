"use client";

import { Card } from "../../_components/Card";
import { SectionTitle } from "../../_components/SectionTitle";
import { useIsMobile } from "../../../lib/useIsMobile";
import { ChartRacingBar } from "./racing/ChartRacingBar";
import type { RacingDataset } from "../types";

type Props = {
  racing: RacingDataset;
  highlightSlug?: string | null;
  highlightSlugB?: string | null;
};

/**
 * Sección "El podio" — racing bar animado del top 15 marcas por matriculaciones
 * rolling-12m, desde 2015 hasta el último período. La marca A se resalta en
 * azul, B (si hay comparación) en naranja.
 */
export function Racing({ racing, highlightSlug, highlightSlugB }: Props) {
  const isMobile = useIsMobile();

  return (
    <section id="racing" style={{ scrollMarginTop: 140, marginTop: 28 }}>
      <SectionTitle
        sub={`Top 15 marcas · matriculaciones rolling-12m · ${racing.meta.periodos[0]} → ${racing.meta.ultimo_periodo}`}
        tooltip="Ranking animado: para cada mes, suma las matriculaciones de los últimos 12 meses (suavizado anti-estacionalidad) y ordena las 15 primeras marcas. Presioná reproducir para ver cómo cambia la pole position. La marca que tenés seleccionada queda resaltada en color."
      >
        El podio
      </SectionTitle>
      <Card style={{ minWidth: 0 }}>
        <ChartRacingBar
          data={racing}
          rollingMonths={12}
          highlightSlug={highlightSlug}
          highlightSlugB={highlightSlugB}
          height={isMobile ? 520 : 480}
        />
      </Card>
    </section>
  );
}
