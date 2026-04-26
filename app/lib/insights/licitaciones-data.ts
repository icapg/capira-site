// ─── AUTO-GENERADO por scripts/placsp-build-json.mjs ────────────────────────
// Fuente: Plataforma de Contratación del Sector Público (PLACSP)
// Taxonomía v3 de e-movilidad · Recall 98.3 % vs AEDIVE ground truth
// ⚠️  Los JSON se regeneran corriendo `node scripts/placsp-build-json.mjs`
// ────────────────────────────────────────────────────────────────────────────
import itemsRaw from '../../../data/licitaciones-emov.json' assert { type: 'json' };
import summaryRaw from '../../../data/licitaciones-cat-summary.json' assert { type: 'json' };

export type CategoriaId = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11';
export type EstadoCodigo = 'PUB' | 'EV' | 'ADJ' | 'RES' | 'ANUL' | 'DES' | 'PRE' | 'CERR' | 'BORR' | string;

export type CategoriaMeta = {
  label: string;
  short: string;
  color: string;
};

export type Adjudicatario = {
  nombre: string;
  /** Nombre comercial/marca. Ej. razón social "(ZUNDER) Grupo Easychargar SA" → comercial "Zunder". */
  nombre_comercial?: string;
  /** party_id OCPI de 3 caracteres. Ej. "ARE", "IBD". Identificador canónico OCPI. */
  party_id?: string;
  nif?: string;
  es_ute?: boolean;
};

export type MiembroUTE = { nif?: string; nombre: string };

/** Licitador detallado — rol puede ser adjudicataria/participante/excluida.
 *  Hoy (fase 1) solo vienen adjudicatarias con campos básicos. Los campos de oferta
 *  y puntuación se pueblan en fase 2 LLM. */
export type Licitador = {
  nombre:   string;
  /** Nombre comercial/marca. Ej. razón social "IBERDROLA CLIENTES S.A.U" → comercial "Iberdrola". */
  nombre_comercial?: string;
  /** party_id OCPI de 3 caracteres. */
  party_id?: string;
  rol:      "adjudicataria" | "participante" | "excluida" | string;
  nif?:     string;
  es_ute?:  boolean;
  miembros_ute?:              MiembroUTE[];
  oferta_economica?:          number;
  oferta_canon_anual?:        number;
  oferta_canon_por_cargador?: number;
  /** Variante "venta_energia_usuario": precio €/kWh que el licitador propone cobrar al usuario. */
  oferta_precio_kwh_usuario?: number;
  /** Años de compromiso de mantener el precio del kWh sin actualización. */
  oferta_mantenimiento_precio_anos?: number;
  /** Parte variable del canon ofertado (canon mixto): euros por kWh dispensado. */
  oferta_canon_variable_eur_kwh?: number;
  /** Parte variable como % sobre facturación. */
  oferta_canon_variable_pct?: number;
  /** Descuento ofertado a residentes (si aplica, en %). */
  oferta_descuento_residentes_pct?: number;
  inversion_comprometida?:    number;
  puntuacion_economica?:      number;
  puntuacion_tecnica?:        number;
  puntuacion_total?:          number;
  /** Desglose de puntuación no-económica (criterios técnicos / otros).
   *  `oferta` = texto libre con lo que realmente propuso el licitador (ej: "150,42 kWp", "10 plazas ≥100 kW"). */
  puntuaciones_detalle?:      Array<{ nombre: string; oferta?: string; puntos?: number; peso_max?: number; color?: string }>;
  rank_position?:             number;
  motivo_exclusion?:          string;
  mejoras_ofertadas?:         string[];
};

export type Snapshot  = { estado: string; fecha: string };
export type Documento = {
  tipo: string;
  /** Nombre tal como lo subió el órgano contratante en PLACSP (ej. "ACTA MESA CONTRATACIÓN Apertura sobre 1"). */
  nombre?: string;
  url: string;
  fecha?: string;
  descargado?: boolean;
  resumen_ia?: string;
  /** Si es un anexo embebido en otro PDF (deep-link con #page=N), referencia el documento padre. */
  parent_tipo?: string;
  /** Página inicial dentro del PDF padre (1-based). */
  page_inicio?: number;
  /** Página final dentro del PDF padre (1-based, inclusive). */
  page_fin?:    number;
};

/**
 * Anexo embebido dentro de un pliego (PCAP / PPT). PLACSP no publica los anexos
 * como archivos separados — están como secciones dentro del PDF principal. Esta
 * estructura permite generar deep-links (`#page=N`) en la sección Documentos.
 */
export type AnexoPliego = {
  /** Etiqueta visible (ej. "Anexo I — Planos de ubicaciones nuevas"). */
  label:        string;
  /** Tipo del documento padre que contiene el anexo (ej. "pliego_tecnico", "pliego_administrativo"). */
  doc_tipo:     "pliego_tecnico" | "pliego_administrativo" | string;
  /** Página inicial del anexo dentro del PDF padre (1-based). */
  page_inicio:  number;
  /** Página final del anexo (1-based, inclusive). Opcional. */
  page_fin?:    number;
  /** Descripción libre (ej. "34 planos de ubicaciones nuevas con coordenadas"). */
  descripcion?: string;
};

export type UbicacionConcesion = {
  nombre?:        string;
  direccion?:     string;
  municipio?:     string;
  latitud?:       number;
  longitud?:      number;
  plazas?:        number;
  cargadores_ac?:      number;
  cargadores_dc?:      number;
  cargadores_dc_plus?: number;
  cargadores_hpc?:     number;
  cargadores_total?:   number;
  potencia_total_kw?:        number;
  /** Potencia "principal" del equipo (legacy / fallback). Para tipo_hw mixto se prefiere el split por toma. */
  potencia_por_cargador_kw?: number;
  /** Potencia de la toma AC (modo 3, Mennekes Tipo 2). Aplica a tipo_hw="AC" o "mixto". */
  potencia_ac_kw?:           number;
  /** Potencia de la toma DC (modo 4, CCS Combo2 ≥50 kW típico). Aplica a tipo_hw="DC" o "mixto". */
  potencia_dc_kw?:           number;
  /** Potencia de la toma HPC (high-power charging, ≥150 kW). Aplica a tipo_hw="HPC" o "mixto". */
  potencia_hpc_kw?:          number;
  tipo_hw?:         "AC" | "DC" | "HPC" | "mixto" | string;
  plazo_pem_meses?: number;
  google_maps_url?: string;
  notas?:           string;
  es_opcional?:     boolean;
  /** Cargador ya existente que se asume sin reemplazo (no cuenta como instalación nueva del pliego). */
  es_existente?:    boolean;
  /** URL al plano/anexo del pliego asociado a esta ubicación (PDF o ZIP). */
  plano_url?:       string;
  /** Etiqueta del plano (ej. "Anexo 3 del PPT"). */
  plano_label?:     string;
};

export type CriterioValoracion = {
  peso:        number;         // 0..100
  formula?:    string;         // para económicos: fórmula de puntuación del canon
  descripcion?: string;        // para técnicos: a qué se puntúa
};

export type MejoraPuntuable = {
  descripcion: string;
  puntos_max?: number;
  tipo?:       "descuento" | "app" | "ampliacion_hw" | "sostenibilidad" | "mantenimiento" | "otro";
};

export type Garantias = {
  /** Garantía provisional — a veces se exige depósito antes de ofertar, reembolsable. */
  provisional_eur?:     number;
  provisional_pct?:     number;
  provisional_exigida?: boolean;
  /** Garantía definitiva — sólo el adjudicatario debe constituirla. */
  definitiva_eur?:      number;
  definitiva_pct?:      number;
  /** Base de cálculo del % definitivo: canon 15 años, importe base, u otro. */
  definitiva_base?:     string;
};

export type RequisitoParticipacion = {
  /** Tipo: volumen_facturacion / seguro_resp_civil / experiencia_previa / certificacion / instalaciones / etc. */
  tipo?:        string;
  descripcion:  string;
  /** Umbral exigido: "€500.000/año" · "3 años" · "certificado ISO 9001" — texto libre. */
  umbral?:      string;
  /** Si es un must-have crítico o una alternativa. */
  critico?:     boolean;
};

export type Requisitos = {
  solvencia_economica?: RequisitoParticipacion[];
  solvencia_tecnica?:   RequisitoParticipacion[];
  adicionales?:         RequisitoParticipacion[];
};

export type ProcesoLicitacion = {
  criterios_valoracion?: {
    economicos?: CriterioValoracion[];
    tecnicos?:   CriterioValoracion[];
  };
  /** Pesos agregados (0..100). Alineados con POWY tender-analysis.
   *  Top-level: económico + técnico = 100. Los sub-pesos desglosan cada uno. */
  peso_economico?:           number;
  peso_tecnico?:             number;
  /** Sub-pesos del económico (suman `peso_economico`) */
  peso_canon_fijo?:          number;
  peso_canon_variable?:      number;
  /** Sub-pesos del técnico (suman `peso_tecnico`) */
  peso_construccion_tiempo?: number;
  peso_proyecto_tecnico?:    number;
  peso_mas_hw_potencia?:     number;
  peso_mas_ubicaciones?:     number;
  peso_otros?:               number;
  /** Criterios automáticos por fórmulas (lo que el licitador ofrece sobre el mínimo del pliego, evaluable mecánicamente). */
  mejoras_puntuables?:  MejoraPuntuable[];
  /** Criterios cualitativos evaluados por la mesa con juicio de valor (proyecto técnico, plan de mantenimiento, etc.). */
  criterios_juicio_valor?: MejoraPuntuable[];
  tipo_adjudicacion?:   "subasta" | "concurso" | "concurso_multicriterio" | "acuerdo_marco" | string;
  idioma_pliego?:       "es" | "ca" | "gl" | "eu" | "mixto" | string;
  garantias?:           Garantias;
  requisitos?:          Requisitos;
  extraccion_llm?: {
    fecha:    string;
    modelo?:  string;
    /** Notas sobre los términos del pliego (pre-adjudicación). Formato preferido. */
    notas_pliego?:       string[];
    /** Notas sobre el proceso de adjudicación (post-apertura de sobres). Formato preferido. */
    notas_adjudicacion?: string[];
    /** Legacy: array plano de notas sin clasificar. Se mantiene por compatibilidad; la UI lo reclasifica con heurística. */
    warnings?: string[];
  };
};

export type Concesion = {
  /** Del pliego (XML) */
  plazo_anos?:        number;
  renovacion_anos?:   number;
  tipo_retribucion?:  "canon_fijo" | "canon_variable_pct" | "mixto" | "contraprestacion" | "compra" | "venta_energia_usuario" | string;
  canon_minimo_anual?: number;
  canon_ganador?:     number;
  canon_por_cargador?: number;
  num_ubicaciones?:   number;
  num_cargadores?:    number;
  num_cargadores_ac?:      number;
  num_cargadores_dc?:      number;
  num_cargadores_dc_plus?: number;
  num_cargadores_hpc?:     number;
  quality_ubicacion?: string;
  /** Fase 2 LLM */
  fecha_inicio?:                string;
  tipo_inicio?:                 "adjudicacion" | "formalizacion" | "puesta_en_marcha" | string;
  plazo_construccion_meses?:    number;
  potencia_disponible_kw?:      number;
  potencia_garantizada?:        boolean;
  tecnologia_requerida?:        "AC" | "DC" | "HPC" | "mixto" | string;
  num_cargadores_minimo?:       number;
  num_cargadores_opcional?:     boolean;
  potencia_minima_por_cargador_kw?: number;
  potencia_opcional_subible?:   boolean;
  /** Breakdown canon (POWY tender-analysis) */
  canon_por_ubicacion_anual?:   number;
  canon_variable_pct?:          number;
  canon_variable_eur_kwh?:      number;
  canon_mix_fijo_anual?:        number;
  canon_mix_var_pct?:           number;
  canon_mix_var_eur_kwh?:       number;
  canon_mix_fijo_por_cargador?: number;
  /** Variante "venta_energia_usuario": el adjudicatario no paga canon — vende energía al usuario y el órgano puntúa el precio bajo. */
  precio_max_kwh_usuario?:      number;
  precio_kwh_ofertado_ganador?: number;
  mantenimiento_precio_anos?:   number;
  ubicaciones?:                 UbicacionConcesion[];
};

/** Una licitación e-movilidad tal como se consume en la UI. Muchos campos son opcionales. */
export type LicitacionItem = {
  slug:        string;
  categoria:   CategoriaId;
  titulo:      string;

  expediente?:        string;
  idEvl?:             string;
  organo?:            string;
  organo_nif?:        string;
  tipo_contrato?:     string;

  importe_base?:      number;
  importe_estimado?:  number;
  importe_adjudicado?: number;
  plazo_meses?:       number;

  provincia?:    string;
  ccaa?:         string;
  provincia_raw?: string;
  ciudad?:       string;

  fecha_publicacion?:   string;
  fecha_limite?:        string;
  fecha_adjudicacion?:  string;
  fecha_formalizacion?: string;
  /** Última fecha en que actualizamos los datos de esta licitación (max entre extracción LLM y feed XML). */
  fecha_actualizacion?: string;
  dias_aviso?:          number;

  estado?:         EstadoCodigo;
  financiacion_ue?: boolean;
  programa_ue?:    string;

  subcategoria?:  string;
  confianza?:     number;
  tiene_infra?:   boolean;
  tags?:          string[];

  concesion?:      Concesion;
  proceso?:        ProcesoLicitacion;
  adjudicatarios?: Adjudicatario[];
  licitadores?:    Licitador[];
  cpvs?:           string[];
  snapshots?:      Snapshot[];
  documentos?:     Documento[];
  /** Anexos embebidos en pliegos (Anexo I, Anexo II, etc.). Se expanden a entradas
   *  Documento con deep-link `#page=N` durante el build del bundle. */
  anexos_pliego?:  AnexoPliego[];
};

export type LicitacionesBundle = {
  generated_at:   string;
  fuente:         string;
  taxonomia:      string;
  ventana:        { desde: string | null; hasta: string | null };
  count:          number;
  total_universo: number;
  categorias:     Record<CategoriaId, CategoriaMeta>;
  items:          LicitacionItem[];
};

export type CategoriaAgg = {
  cat:    CategoriaId;
  label:  string;
  short:  string;
  color:  string;
  n:      number;
  importe_base_total: number;
  importe_base_n:     number;
  adjudicadas:        number;
};

export type AnualAgg = {
  anio: number;
  total: number;
  por_cat: Partial<Record<CategoriaId, number>>;
  importe_base_total: number;
};

export type MensualAgg = {
  mes: string; // "YYYY-MM"
  total: number;
  por_cat: Partial<Record<CategoriaId, number>>;
};

export type ProvinciaAgg = {
  provincia: string | null;
  ccaa:      string | null;
  nacional:  boolean;
  n:         number;
  importe_base_total: number;
  por_cat:   Partial<Record<CategoriaId, number>>;
};

export type RankingEmpresa = {
  nombre:             string;
  nif?:               string;
  n:                  number;
  importe_base_total: number;
  por_cat:            Partial<Record<CategoriaId, number>>;
};

export type EstadoAgg = { estado: string; n: number };
export type TipoAgg   = { tipo: string; n: number };
export type TagAgg    = { programa: string; n: number };

export type LicitacionesSummary = {
  generated_at:     string;
  fuente:           string;
  taxonomia:        string;
  ventana:          { desde: string | null; hasta: string | null };
  total_emov:       number;
  total_universo:   number;
  pct_emov:         number;
  importe_base_total: number;
  importe_base_n:   number;
  categorias:       Record<CategoriaId, CategoriaMeta>;
  por_categoria:    CategoriaAgg[];
  por_estado:       EstadoAgg[];
  por_tipo_contrato: TipoAgg[];
  serie_mensual:    MensualAgg[];
  serie_anual:      AnualAgg[];
  por_provincia:    ProvinciaAgg[];
  por_programa_ue:  TagAgg[];
  top_adjudicatarios: RankingEmpresa[];
  top_organos:        RankingEmpresa[];
};

export const licitacionesBundle  = itemsRaw   as unknown as LicitacionesBundle;
export const licitaciones        = licitacionesBundle.items;
export const categoriasMeta      = licitacionesBundle.categorias;
export const licitacionesSummary = summaryRaw as unknown as LicitacionesSummary;

/** Reconstruye el deeplink público de PLACSP a partir del idEvl. */
export function deeplinkFromIdEvl(idEvl?: string): string | null {
  if (!idEvl) return null;
  return `https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=${encodeURIComponent(idEvl)}`;
}

/** Busca una licitación por slug (numérico del feed Atom). */
export function findLicitacionBySlug(slug: string): LicitacionItem | undefined {
  return licitaciones.find((l) => l.slug === slug);
}

/** Etiquetas de estado PLACSP (UI-friendly). */
export const ESTADO_LABEL: Record<string, string> = {
  PUB:  'Abierta',
  EV:   'En evaluación',
  ADJ:  'Adjudicada',
  RES:  'Resuelta',
  ANUL: 'Anulada',
  DES:  'Desierta',
  PRE:  'Preliminar',
  CERR: 'Cerrada',
  BORR: 'Borrador',
};

/** Color por estado para chips/badges (alineado con design tokens de insights). */
export const ESTADO_COLOR: Record<string, string> = {
  PUB:  '#38bdf8', // publicadas / abiertas
  EV:   '#fbbf24', // en evaluación
  ADJ:  '#a78bfa', // adjudicada pendiente de formalización
  RES:  '#34d399', // resuelta / formalizada
  ANUL: '#f87171', // anulada
  DES:  '#f87171', // desierta (mismo color que anulada)
  PRE:  '#06b6d4', // preliminar
  CERR: '#6b7280',
  BORR: '#6b7280',
};

/** Devuelve el nombre a mostrar: comercial si existe, si no la razón social. */
export function displayName(l: { nombre: string; nombre_comercial?: string }): string {
  return l.nombre_comercial ?? l.nombre;
}

/** Etiqueta humana de categoría e-mov. */
export function categoriaLabel(cat: CategoriaId | string | undefined): string {
  if (!cat) return '—';
  return categoriasMeta[cat as CategoriaId]?.label ?? `Cat. ${cat}`;
}

export function categoriaShort(cat: CategoriaId | string | undefined): string {
  if (!cat) return '—';
  return categoriasMeta[cat as CategoriaId]?.short ?? `Cat. ${cat}`;
}

export function categoriaColor(cat: CategoriaId | string | undefined): string {
  if (!cat) return '#6b7280';
  return categoriasMeta[cat as CategoriaId]?.color ?? '#6b7280';
}
