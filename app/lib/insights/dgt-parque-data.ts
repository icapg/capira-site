// ─── AUTO-GENERADO ─────────────────────────────────────────────────────────
// Genera: node scripts/dgt-parque-build.mjs
// Fuente real:      DGT Parque de Vehículos (ZIP microdatos mensual, desde 2025-03)
// Fuente calculada: MATRABA matriculaciones − bajas (periodos anteriores a 2025-03)
// Última actualización: 2026-04-22
// ⚠️  No editar manualmente
// ────────────────────────────────────────────────────────────────────────────
import raw from '../../../data/dgt-parque.json' assert { type: 'json' };

export type ParqueFuente = 'real' | 'calculado';

export type ParqueCatEv = {
  BEV?:           number;
  PHEV?:          number;
  HEV?:           number;
  REEV?:          number;
  FCEV?:          number;
  total?:         number;
  no_enchufable?: number;
};

export type ParqueTipoGrupo = Record<string, ParqueCatEv>;

/** Breakdown por provincia × tipo × cat. Solo se emite para meses reales (snapshot ZIP). */
export type ParqueProvinciaTipo = Record<string, ParqueTipoGrupo>;

/** Distintivo ambiental DGT: "0", "B", "C", "ECO", "CERO", "Sin" (no tiene). */
export type ParqueDistintivo = Record<string, number>;

/** Breakdown por municipio × tipo × cat. Solo se emite en el último mes real. */
export type ParqueMunicipio = Record<string, { prov: string; tipos: ParqueTipoGrupo }>;

export type ParqueMes = {
  periodo:                    string;
  fuente:                     ParqueFuente;
  matriculaciones_mes:        ParqueCatEv;
  bajas_mes:                  ParqueCatEv;
  total_bajas_mes:            number;
  parque_acumulado:           ParqueCatEv;
  parque_total:               number;
  parque_no_enchufable:       number;
  parque_por_tipo?:           ParqueTipoGrupo;
  parque_por_provincia_tipo?: ParqueProvinciaTipo;
  parque_por_municipio?:      ParqueMunicipio;
  parque_distintivo?:         ParqueDistintivo;
};

export type ParqueResumenCat = {
  matriculadas:  number;
  bajas:         number;
  parque_activo: number;
  tasa_baja_pct: number;
};

/** Distribución del parque por año de matriculación (último snapshot). */
export type ParqueEdad = {
  periodo:       string;
  por_anio:      Record<string, Record<string, number>>;   // { "2020": { BEV:1234, NO_EV:... }, ... }
  promedio:      Record<string, number>;                    // { BEV:3.2, PHEV:4.1, NO_EV:14.1, global:12.8 }
  sums_por_tipo: Record<string, Record<string, { sum_age: number; count: number }>>; // [tipo_grupo][catelect]
};

export const dgtParqueMeta             = raw.meta             as typeof raw.meta;
export const dgtParqueResumen          = raw.resumen          as Record<string, ParqueResumenCat>;
export const dgtParqueResumenPorTipo   = raw.resumen_por_tipo as Record<string, any>;
export const dgtParqueEdad             = raw.edad_parque      as ParqueEdad;
export const dgtParqueMensual          = raw.mensual          as ParqueMes[];
