/**
 * Adaptador de datos ANFAC para el dashboard de matriculaciones.
 * Lee anfac-matriculaciones.json (generado por scripts/anfac-matriculaciones.mjs)
 * y exporta con el mismo shape que YearData[] usado por el dashboard.
 *
 * Fuente: ANFAC / Ideauto — solo M1 turismos nuevos (metodología oficial ANFAC).
 * Cobertura: desde 2022-03 (PDFs ANFAC) + últimos 13 meses (chart API oficial).
 * 2020-2021 no disponibles en la web de ANFAC.
 */

import anfacJson from "../../../data/anfac-matriculaciones.json";
import type { YearData } from "./matriculaciones-data";

const MES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const currentYear = new Date().getFullYear();

function periodoToMes(periodo: string): string {
  return MES_SHORT[parseInt(periodo.split("-")[1]) - 1];
}

// ─── Por año (para gráficos) ──────────────────────────────────────────────────

export const anfacPorAño: YearData[] = (() => {
  const byYear: Record<number, { mes: string; bev: number; phev: number }[]> = {};
  for (const [periodo, vals] of Object.entries(anfacJson.mensual)) {
    const year = parseInt(periodo.split("-")[0]);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push({ mes: periodoToMes(periodo), bev: vals.bev, phev: vals.phev });
  }
  return Object.entries(byYear)
    .map(([y, meses]) => ({
      año: parseInt(y),
      meses,
      parcial: parseInt(y) >= currentYear,
    }))
    .sort((a, b) => a.año - b.año);
})();

/**
 * Pre-2020 ANFAC — no hay datos en anfac.com.
 * Retorna array vacío para que el acumulado histórico no sume nada pre-2020 desde ANFAC.
 * (El dashboard usa esto para sumar al acumulado histórico; sin datos pre-2022 es correcto
 *  mostrar solo desde 2022.)
 */
export const anfacHistoricoPre2020: { año: number; bev: number; phev: number }[] = [];

// ─── Meta ─────────────────────────────────────────────────────────────────────

export const anfacMeta = {
  fuente:         anfacJson.meta.fuente,
  generado_en:    anfacJson.meta.generado_en,
  primer_periodo: anfacJson.meta.primer_periodo,
  ultimo_periodo: anfacJson.meta.ultimo_periodo,
};
