/**
 * Parque activo de vehículos eléctricos en España.
 * Fuente: DGT MATRABA microdatos — matriculaciones − bajas (BEV + PHEV, HEV excluido)
 * Generado por scripts/dgt-bev-phev.mjs
 */

import parqueJson from "../../../data/dgt-parque-activo.json";

export type ParqueActivoAño = {
  año: number;
  mat_acum_bev: number;
  mat_acum_phev: number;
  bajas_acum_bev: number;
  bajas_acum_phev: number;
  parque_bev: number;
  parque_phev: number;
  parque_total: number;
};

export type ParqueActivoTotal = {
  bev: number;
  phev: number;
  total: number;
};

export const parqueActivoTotal: ParqueActivoTotal = parqueJson.total as ParqueActivoTotal;
export const parqueActivoPorAño: ParqueActivoAño[] = parqueJson.por_año as ParqueActivoAño[];
