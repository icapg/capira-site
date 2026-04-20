/**
 * Adaptador de datos DGT para el dashboard de matriculaciones.
 * Convierte dgt-bev-phev-mensual.json al mismo shape que YearData[]
 * usado por el dashboard de AEDIVE.
 */

import mensualJson from "../../../data/dgt-bev-phev-mensual.json";
import type { YearData } from "./matriculaciones-data";

const MES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function periodoToMes(periodo: string): string {
  return MES_SHORT[parseInt(periodo.split("-")[1]) - 1];
}

const currentYear = new Date().getFullYear();

export type TipoVehiculo = "todos" | "turismo" | "furgoneta" | "moto_scooter" | "microcar" | "camion" | "autobus" | "otros";

export const TIPO_LABELS: Record<TipoVehiculo, string> = {
  todos:       "Todos",
  turismo:     "Turismo",
  furgoneta:   "Furgoneta",
  moto_scooter:"Moto / Scooter",
  microcar:    "Microcar",
  camion:      "Camión",
  autobus:     "Autobús",
  otros:       "Otros",
};

type MensualEntry = typeof mensualJson.mensual[number];

function getBevForTipo(m: MensualEntry, tipo: TipoVehiculo): number {
  if (tipo === "todos") return m.bev.total;
  const t = m.bev_por_tipo as Record<string, number>;
  return t[tipo] ?? 0;
}

function getPhevForTipo(m: MensualEntry, tipo: TipoVehiculo): number {
  if (tipo === "todos") return m.phev.total;
  const t = m.phev_por_tipo as Record<string, number>;
  return t[tipo] ?? 0;
}

// ─── Histórico pre-2020 (solo para acumulado — no se muestra en gráficos) ───
// Agrupa los años 2014-2019 del DGT en arrays con el mismo shape que historicoPre2020
function buildHistoricoPre2020(
  getBev:  (m: MensualEntry) => number,
  getPhev: (m: MensualEntry) => number,
): { año: number; bev: number; phev: number }[] {
  const byYear: Record<number, { bev: number; phev: number }> = {};
  for (const m of mensualJson.mensual) {
    const year = parseInt(m.periodo.split("-")[0]);
    if (year >= 2020) continue;
    if (!byYear[year]) byYear[year] = { bev: 0, phev: 0 };
    byYear[year].bev  += getBev(m);
    byYear[year].phev += getPhev(m);
  }
  return Object.entries(byYear)
    .map(([y, d]) => ({ año: parseInt(y), ...d }))
    .sort((a, b) => a.año - b.año);
}

/** Pre-2020 DGT totals (2014-2019) — solo para sumar al acumulado histórico */
export const dgtHistoricoPre2020 = buildHistoricoPre2020(
  (m) => m.bev.total,
  (m) => m.phev.total,
);

/** Pre-2020 ANFAC totals (2014-2019) — solo para sumar al acumulado histórico */
export const anfacHistoricoPre2020 = buildHistoricoPre2020(
  (m) => m.anfac_bev,
  (m) => m.anfac_phev,
);

// ─── Builders para gráficos (solo desde 2020) ────────────────────────────────
function buildPorAño(
  getBev:  (m: MensualEntry) => number,
  getPhev: (m: MensualEntry) => number,
): YearData[] {
  const byYear: Record<number, { mes: string; bev: number; phev: number }[]> = {};
  for (const m of mensualJson.mensual) {
    const year = parseInt(m.periodo.split("-")[0]);
    if (year < 2020) continue;
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push({ mes: periodoToMes(m.periodo), bev: getBev(m), phev: getPhev(m) });
  }
  return Object.entries(byYear)
    .map(([y, meses]) => ({
      año: parseInt(y),
      meses,
      parcial: parseInt(y) >= currentYear,
    }))
    .sort((a, b) => a.año - b.año);
}

/** DGT total — todos los tipos de vehículo, nuevos + usados importados */
export const dgtPorAño: YearData[] = buildPorAño(
  (m) => m.bev.total,
  (m) => m.phev.total,
);

/** DGT total — todos los años desde 2014 (incluyendo pre-2020, para el selector mensual) */
export const dgtPorAñoCompleto: YearData[] = (() => {
  const byYear: Record<number, { mes: string; bev: number; phev: number }[]> = {};
  for (const m of mensualJson.mensual) {
    const year = parseInt(m.periodo.split("-")[0]);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push({ mes: periodoToMes(m.periodo), bev: m.bev.total, phev: m.phev.total });
  }
  return Object.entries(byYear)
    .map(([y, meses]) => ({ año: parseInt(y), meses, parcial: parseInt(y) >= currentYear }))
    .sort((a, b) => a.año - b.año);
})();

/** DGT nuevos — todos los tipos, solo IND_NUEVO_USADO='N' */
export const dgtNuevosPorAño: YearData[] = buildPorAño(
  (m) => m.bev.nuevos,
  (m) => m.phev.nuevos,
);

/**
 * ANFAC-equivalente — M1+M1G turismos nuevos solamente.
 * Metodología: misma que ANFAC/IDEAUTO (excluye motos, furgonetas, usados).
 */
export const anfacPorAño: YearData[] = buildPorAño(
  (m) => m.anfac_bev,
  (m) => m.anfac_phev,
);

/**
 * DGT filtrado por uno o varios tipos de vehículo.
 * tipos vacío o ["todos"] → equivalente a dgtPorAño (suma total).
 */
export function dgtPorAñoTipos(tipos: TipoVehiculo[]): YearData[] {
  const active = tipos.filter((t) => t !== "todos");
  if (active.length === 0) return dgtPorAño;
  return buildPorAño(
    (m) => active.reduce((s, t) => s + getBevForTipo(m, t),  0),
    (m) => active.reduce((s, t) => s + getPhevForTipo(m, t), 0),
  );
}

/**
 * DGT filtrado por tipos — incluye 2014+ (mismo alcance que dgtPorAñoCompleto).
 * Para gráficos que necesitan histórico completo (heatmap, evolución mensual).
 */
export function dgtPorAñoCompletoTipos(tipos: TipoVehiculo[]): YearData[] {
  const active = tipos.filter((t) => t !== "todos");
  const getBev  = active.length === 0
    ? (m: MensualEntry) => m.bev.total
    : (m: MensualEntry) => active.reduce((s, t) => s + getBevForTipo(m, t), 0);
  const getPhev = active.length === 0
    ? (m: MensualEntry) => m.phev.total
    : (m: MensualEntry) => active.reduce((s, t) => s + getPhevForTipo(m, t), 0);
  const byYear: Record<number, { mes: string; bev: number; phev: number }[]> = {};
  for (const m of mensualJson.mensual) {
    const year = parseInt(m.periodo.split("-")[0]);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push({ mes: periodoToMes(m.periodo), bev: getBev(m), phev: getPhev(m) });
  }
  return Object.entries(byYear)
    .map(([y, meses]) => ({ año: parseInt(y), meses, parcial: parseInt(y) >= currentYear }))
    .sort((a, b) => a.año - b.año);
}

/** Todos los meses del dataset (2014+) — para el gráfico de evolución mensual DGT */
export const dgtMensualTodos: { periodo: string; label: string; bev: number; phev: number; total: number }[] =
  mensualJson.mensual.map((m) => ({
    periodo: m.periodo,
    label:   m.periodo.replace("-", " "),
    bev:     m.bev.total,
    phev:    m.phev.total,
    total:   m.bev.total + m.phev.total,
  }));

/** Usados importados vs nuevos por año — para insights y KPIs */
export type UsadosEntry = {
  año: number;
  bev_new: number; phev_new: number;
  bev_used: number; phev_used: number;
};

export const dgtUsadosAnual: UsadosEntry[] = (() => {
  const byYear: Record<number, Omit<UsadosEntry, "año">> = {};
  for (const m of mensualJson.mensual) {
    const year = parseInt(m.periodo.split("-")[0]);
    if (!byYear[year]) byYear[year] = { bev_new: 0, phev_new: 0, bev_used: 0, phev_used: 0 };
    byYear[year].bev_new  += m.bev.nuevos;
    byYear[year].phev_new += m.phev.nuevos;
    byYear[year].bev_used  += m.bev.usados;
    byYear[year].phev_used += m.phev.usados;
  }
  return Object.entries(byYear)
    .map(([y, d]) => ({ año: parseInt(y), ...d }))
    .sort((a, b) => a.año - b.año);
})();

/** Anos disponibles en el dataset */
export const dgtAñosDisponibles: number[] = (() => {
  const years = new Set(mensualJson.mensual.map(m => parseInt(m.periodo.split("-")[0])));
  return [...years].sort();
})();

/** Meta del dataset */
export const dgtMeta = {
  fuente: mensualJson.meta.fuente,
  generado_en: mensualJson.meta.generado_en,
  primer_periodo: mensualJson.meta.primer_periodo,
  ultimo_periodo: mensualJson.meta.ultimo_periodo,
};
