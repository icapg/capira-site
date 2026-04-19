// ─── AUTO-GENERADO ─────────────────────────────────────────────────────────
// Genera: node scripts/dgt-parque-build.mjs
// Fuente real:      DGT Parque de Vehículos (ZIP microdatos mensual, desde 2025-03)
// Fuente calculada: MATRABA matriculaciones − bajas (periodos anteriores a 2025-03)
// Última actualización: 2026-04-19
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

export type ParqueMes = {
  periodo:              string;
  fuente:               ParqueFuente;
  matriculaciones_mes:  ParqueCatEv;
  bajas_mes:            ParqueCatEv;
  total_bajas_mes:      number;
  parque_acumulado:     ParqueCatEv;
  parque_total:         number;
  parque_no_enchufable: number;
  parque_por_tipo?:     ParqueTipoGrupo;
};

export type ParqueResumenCat = {
  matriculadas:  number;
  bajas:         number;
  parque_activo: number;
  tasa_baja_pct: number;
};

export const dgtParqueMeta             = raw.meta             as typeof raw.meta;
export const dgtParqueResumen          = raw.resumen          as Record<string, ParqueResumenCat>;
export const dgtParqueResumenPorTipo   = raw.resumen_por_tipo as Record<string, any>;
export const dgtParqueMensual          = raw.mensual          as ParqueMes[];
