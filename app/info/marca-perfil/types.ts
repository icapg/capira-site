// Tipos que reflejan la estructura de:
//   - data/dgt-marca-perfil-index.json
//   - data/dgt-marca-perfil-mercado.json
//   - public/data/marca-perfil/<slug>.json
// Generados por scripts/dgt-marca-perfil-build.mjs.

export type MarcaMix = { bev: number; phev: number; hev: number; otro: number };

export type MarcaTipoGrupo = {
  total: number;
  bev: number;
  phev: number;
  hev: number;
  no_enchufable: number;
};

export type MarcaModeloParque = {
  modelo: string;
  tipo_grupo: string;
  total: number;
  bev: number;
  phev: number;
  hev: number;
  no_ev: number;
};

export type MarcaPorProvinciaEntry = {
  parque: number;
  cuota_pct: number;
  ranking: number | null;
  top_3: string[];
};

export type MarcaSociologia = {
  /** Código DGT de persona. "D" / "X" en dataset actual. */
  persona: Record<string, number>;
  /** "S" (renting) / "N" (no renting). */
  renting: { S: number; N: number };
  /** Códigos DGT de servicio (B00 particular, A01 empresa, etc.). */
  servicio: Record<string, number>;
};

export type MarcaDistintivoAmbiental = {
  CERO: number;
  ECO: number;
  C: number;
  B: number;
  SIN: number;
};

export type MarcaPiramideEdadEntry = {
  años: number;
  bev: number;
  phev: number;
  hev: number;
  no_ev: number;
};

export type MarcaRadar = {
  co2_marca: number | null;
  kw_marca: number | null;
  peso_marca: number | null;
  autonomia_bev_km_marca: number | null;
  n_muestra_marca: number;
  co2_mercado: number;
  kw_mercado: number;
  peso_mercado: number;
  autonomia_bev_km_mercado: number;
};

export type MarcaStats = {
  parque_activo: number;
  matric_ytd: number;
  matric_ytd_prev: number;
  cuota_bevphev_ytd_pct: number;
  cuota_mercado_ytd_pct: number;
  cuota_mercado_ytd_prev_pct: number;
  ranking_ytd: number | null;
  ranking_ytd_prev: number | null;
  edad_media_parque: number;
  ratio_bajas_matric_ytd: number;
};

export type MarcaSerieMes = {
  periodo: string;
  bev: number;
  phev: number;
  hev: number;
  otro: number;
  bajas: number;
};

export type MarcaMixAnualEntry = {
  año: number;
  bev: number;
  phev: number;
  hev: number;
  otro: number;
};

export type MarcaBajasPorMotivo = {
  /** Desguace (motivo_baja='3'). Salida real del parque. */
  '3': number;
  /** Voluntaria (motivo_baja='7'). */
  '7': number;
  /** Transferencia (motivo_baja='6'). */
  '6': number;
  /** Exportación (motivo_baja='8'). */
  '8': number;
  otros: number;
};

export type MarcaCohorte = {
  año: number;
  /** Matriculaciones nuevas (ind_nuevo_usado='N') de ese año. */
  matriculadas: number;
  /** Vehículos activos hoy (último snapshot) cuya fec_prim_matr es de ese año. */
  activas_hoy: number;
};

export type ImputacionTopModelo = {
  modelo: string;
  count_estimado: number;
  pct: number;
};

export type ImputacionPorTipo = {
  total: number;
  imputacion: ImputacionTopModelo[];
  /** Accuracy esperada top-1 (0..1). Null si no calculable. */
  confianza_top1?: number | null;
  /** Accuracy esperada top-3 (0..1). Null si no calculable. */
  confianza_top3?: number | null;
};

export type ImputacionSinClasificar = {
  marca: string;
  total_sin_clasificar: number;
  residual_no_matcheable: number;
  cobertura: number;
  por_tipo: Record<string, ImputacionPorTipo>;
};

export type MarcaPerfil = {
  slug: string;
  marca: string;
  total_hist: number;
  parque_activo: number;
  dominio: string;
  tiene_ev: boolean;
  pocos_datos: boolean;
  ultimo_periodo: string;
  generado_en: string;
  stats: MarcaStats;
  serie_mensual: MarcaSerieMes[];
  mix_tipo_grupo: Record<string, MarcaTipoGrupo>;
  top_modelos_parque: MarcaModeloParque[];
  mix_tecnologia_anual: MarcaMixAnualEntry[];
  por_provincia: Record<string, MarcaPorProvinciaEntry>;
  sociologia: MarcaSociologia;
  distintivo_ambiental: MarcaDistintivoAmbiental;
  piramide_edad: MarcaPiramideEdadEntry[];
  radar_vs_mercado: MarcaRadar;
  /** v2: motivos de baja para Sankey. Emitido solo en builds post-v2. */
  bajas_por_motivo?: MarcaBajasPorMotivo;
  /** v2: cohortes anuales para curva de supervivencia. Emitido solo en builds post-v2. */
  cohortes?: MarcaCohorte[];
  /** v3: imputación probabilística de los vehículos con modelo='¡' en DGT. null si no aplica. */
  imputacion_sin_clasificar?: ImputacionSinClasificar | null;
};

export type RacingMarcaEntry = {
  slug: string;
  marca: string;
  /** Matriculaciones totales por mes, alineado con meta.periodos. */
  serie: number[];
};

export type RacingDataset = {
  meta: {
    generado_en: string;
    ultimo_periodo: string;
    top_n: number;
    periodos: string[];
  };
  marcas: RacingMarcaEntry[];
};

export type MarcaIndexEntry = {
  slug: string;
  marca: string;
  total_hist: number;
  parque_activo: number;
  dominio: string;
  tiene_ev: boolean;
  pocos_datos: boolean;
  destacada: boolean;
};

export type MarcaIndex = {
  meta: {
    generado_en: string;
    ultimo_periodo: string;
    total_marcas_visibles: number;
    min_total_hist: number;
    min_parque_activo: number;
    pocos_datos_umbral: number;
  };
  marcas: MarcaIndexEntry[];
};

export type MercadoAgregados = {
  meta: { generado_en: string; ultimo_periodo: string; periodo_ini_socio: string };
  serie_mensual: MarcaSerieMes[];
  mix_tecnologia_anual: MarcaMixAnualEntry[];
  parque_total_por_provincia: Record<string, number>;
  radar_mercado: {
    co2: number;
    kw: number;
    peso: number;
    autonomia_bev_km: number;
    n_muestra: number;
  };
  matric_ytd_total: number;
  matric_ytd_prev_total: number;
};
