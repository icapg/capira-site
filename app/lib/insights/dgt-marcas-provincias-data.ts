/**
 * DGT marcas, modelos y provincias — para el dashboard de matriculaciones.
 * Fuente: data/dgt-marcas-provincias.json (generado por scripts/dgt-bev-phev.mjs)
 */

import summaryJson from "../../../data/dgt-marcas-provincias.json";

export type DgtMarcaEntry = {
  marca: string;
  bev: number;
  phev: number;
  por_tipo?: Record<string, number>;
};

export type DgtModeloEntry = {
  modelo: string;
  marca: string;
  n: number;
};

export type DgtProvinciaEntry = {
  cod: string;
  provincia: string;
  bev: number;
  phev: number;
  total: number;
};

export type DgtAñoSummary = {
  año: number;
  marcas: DgtMarcaEntry[];
  bev_modelos: DgtModeloEntry[];
  phev_modelos: DgtModeloEntry[];
  provincias: DgtProvinciaEntry[];
};

export const dgtPorAñoSummary: DgtAñoSummary[] =
  summaryJson.por_año as DgtAñoSummary[];

const ALL_YEARS = dgtPorAñoSummary;

/**
 * Top marcas agregadas. Si se pasa `tipos`, filtra sumando solo esos tipos
 * usando el campo `por_tipo` de cada entrada.
 */
export function getDgtMarcas(año: number | "todos", tipos?: string[]): DgtMarcaEntry[] {
  const entries = año === "todos" ? ALL_YEARS : ALL_YEARS.filter((e) => e.año === año);
  const agg: Record<string, { marca: string; bev: number; phev: number; total_tipo: number }> = {};

  for (const e of entries) {
    for (const m of e.marcas) {
      if (!agg[m.marca]) agg[m.marca] = { marca: m.marca, bev: 0, phev: 0, total_tipo: 0 };
      if (tipos && tipos.length > 0 && m.por_tipo) {
        // Proportional split: use por_tipo to estimate BEV/PHEV share within selected tipos
        const tipoTotal = tipos.reduce((s, t) => s + (m.por_tipo![t] ?? 0), 0);
        const allTotal  = Object.values(m.por_tipo).reduce((s, n) => s + n, 0);
        if (allTotal === 0) continue;
        const ratio = tipoTotal / allTotal;
        agg[m.marca].bev        += Math.round(m.bev  * ratio);
        agg[m.marca].phev       += Math.round(m.phev * ratio);
        agg[m.marca].total_tipo += tipoTotal;
      } else {
        agg[m.marca].bev  += m.bev;
        agg[m.marca].phev += m.phev;
        agg[m.marca].total_tipo += m.bev + m.phev;
      }
    }
  }

  return Object.values(agg)
    .filter((m) => m.total_tipo > 0)
    .sort((a, b) => b.total_tipo - a.total_tipo)
    .slice(0, 20)
    .map(({ total_tipo: _, ...rest }) => rest);
}

/** Top modelos BEV/PHEV para un año o todos */
export function getDgtModelos(año: number | "todos", tipo: "bev" | "phev"): DgtModeloEntry[] {
  const entries = año === "todos" ? ALL_YEARS : ALL_YEARS.filter((e) => e.año === año);
  const agg: Record<string, DgtModeloEntry> = {};
  for (const e of entries) {
    const list = tipo === "bev" ? e.bev_modelos : e.phev_modelos;
    for (const m of list) {
      const key = `${m.marca}|${m.modelo}`;
      if (!agg[key]) agg[key] = { modelo: m.modelo, marca: m.marca, n: 0 };
      agg[key].n += m.n;
    }
  }
  return Object.values(agg).sort((a, b) => b.n - a.n).slice(0, 15);
}

/** Provincias con BEV+PHEV totales para un año o todos */
export function getDgtProvincias(año: number | "todos"): DgtProvinciaEntry[] {
  const entries = año === "todos" ? ALL_YEARS : ALL_YEARS.filter((e) => e.año === año);
  const agg: Record<string, DgtProvinciaEntry> = {};
  for (const e of entries) {
    for (const p of e.provincias) {
      if (!agg[p.cod]) agg[p.cod] = { cod: p.cod, provincia: p.provincia, bev: 0, phev: 0, total: 0 };
      agg[p.cod].bev   += p.bev;
      agg[p.cod].phev  += p.phev;
      agg[p.cod].total += p.total;
    }
  }
  return Object.values(agg).sort((a, b) => b.total - a.total);
}

/** Años disponibles en el dataset */
export const dgtAñosDisponibles: number[] = ALL_YEARS.map((e) => e.año);
