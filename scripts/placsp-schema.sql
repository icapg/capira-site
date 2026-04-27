-- ─────────────────────────────────────────────────────────────────────────
-- PLACSP SQLite schema
-- Source: Plataforma de Contratación del Sector Público (Atom/XML, UBL/CODICE)
-- Windowed: 2018-01 → present
-- ─────────────────────────────────────────────────────────────────────────

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

-- ───── LICITACIONES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licitaciones (
  id                       TEXT PRIMARY KEY,                 -- URI PLACSP (stable)
  expediente               TEXT,                             -- ContractFolderID
  uuid_ted                 TEXT,                             -- TED UUID if federated
  deeplink                 TEXT NOT NULL,                    -- public link
  titulo                   TEXT NOT NULL,
  resumen                  TEXT,

  organo_nombre            TEXT,
  organo_nif               TEXT,
  organo_tipo_codigo       TEXT,                             -- ContractingPartyTypeCode
  organo_actividad_codigo  TEXT,                             -- ActivityCode

  tipo_contrato            TEXT,                             -- Suministro/Obras/Servicios/Mixto/Concesion (mapped from TypeCode)
  tipo_contrato_codigo     TEXT,                             -- raw TypeCode
  procedimiento            TEXT,

  importe_estimado         REAL,
  importe_base             REAL,
  importe_adjudicado       REAL,
  iva_incluido             INTEGER,                          -- bool
  plazo_ejecucion_meses    INTEGER,

  provincia_codigo         TEXT,
  provincia_nombre         TEXT,
  ciudad                   TEXT,
  ciudad_ine               TEXT,                             -- INE code (derived)
  poblacion_ine            INTEGER,                          -- derived

  fecha_publicacion        TEXT,
  fecha_limite_ofertas     TEXT,
  fecha_adjudicacion       TEXT,
  fecha_formalizacion      TEXT,
  fecha_ultima_actualizacion TEXT,

  dias_aviso               INTEGER,                          -- derived: fecha_limite - fecha_publicacion
  estado_actual            TEXT,                             -- PUB/EV/ADJ/RES/ANUL/PRE

  financiacion_ue          INTEGER,                          -- bool
  programa_ue              TEXT,                             -- MRR/FEDER/NextGen/DUS5000/PSTD...

  -- e-mobility classification (populated by placsp-classify.mjs)
  tiene_infra_recarga      INTEGER DEFAULT 0,                -- bool, derived
  categoria_emov           TEXT,                             -- 1..11 + "no_emov"
  subcategoria             TEXT,
  confianza_clasificacion  REAL,                             -- 0..1
  tags                     TEXT,                             -- JSON array

  -- concession-specific fields (when categoria=1)
  plazo_concesion_anos     INTEGER,
  renovacion_anos          INTEGER,
  tipo_retribucion         TEXT,                             -- canon_fijo/canon_variable_pct/mixto/contraprestacion/compra
  canon_minimo_anual       REAL,
  canon_anual_ofertado_ganador REAL,
  canon_por_cargador_ofertado  REAL,
  canon_fuente             TEXT,                             -- pdf_resolucion/aedive_manual/inferido_base_pliego/null
  num_ubicaciones          INTEGER,
  num_cargadores_ac        INTEGER,
  num_cargadores_dc        INTEGER,
  num_cargadores_dc_plus   INTEGER,
  num_cargadores_hpc       INTEGER,
  num_cargadores_total     INTEGER,

  -- location quality (derived for concessions)
  quality_score_ubicacion  TEXT,                             -- poor/fair/good/very_good/excellent

  -- ═════ FASE 2 LLM (extracción de PDFs pliegos/actas/resoluciones) ═════
  -- Bloque común a todas las categorías
  criterios_valoracion     TEXT,                             -- JSON: { economicos:[{peso,formula}], tecnicos:[{peso,descripcion}] }
  peso_criterios_economicos REAL,                            -- 0..100 (redundancia para queries)
  peso_criterios_tecnicos  REAL,                             -- 0..100
  mejoras_puntuables       TEXT,                             -- JSON array de criterios automáticos por fórmulas: [{descripcion, puntos_max, tipo}]
  criterios_juicio_valor   TEXT,                             -- JSON array de criterios cualitativos por juicio de valor: [{descripcion, puntos_max, tipo}]
  tipo_adjudicacion        TEXT,                             -- subasta / concurso / concurso_multicriterio / acuerdo_marco
  idioma_pliego            TEXT,                             -- es / ca / gl / eu / mixto
  extraccion_llm_fecha     TEXT,                             -- cuándo se corrió la extracción
  extraccion_llm_modelo    TEXT,                             -- claude-opus-4-7 / etc.
  extraccion_llm_warnings  TEXT,                             -- JSON array de issues detectados

  -- Bloque específico cat=1 (concesiones demaniales)
  fecha_inicio_concesion   TEXT,                             -- fecha real de inicio
  tipo_inicio_concesion    TEXT,                             -- adjudicacion / formalizacion / puesta_en_marcha
  plazo_construccion_meses INTEGER,                          -- plazo desde formalización hasta PeM
  potencia_disponible_kw   REAL,                             -- potencia eléctrica declarada en el punto
  potencia_disponible_garantizada INTEGER,                   -- bool: ¿la administración la garantiza?
  tecnologia_requerida     TEXT,                             -- AC / DC / HPC / mixto
  num_cargadores_minimo    INTEGER,                          -- mínimo exigido por pliego
  num_cargadores_opcional_extra INTEGER,                     -- bool: ¿se puntúa ofertar más?
  potencia_minima_por_cargador_kw REAL,
  potencia_opcional_subible INTEGER,                         -- bool: ¿se puntúa ofertar más potencia?

  -- Breakdown de canon (alineado con POWY tender-analysis sheet)
  canon_por_ubicacion_anual REAL,                            -- fix: EUR/ubicación/año
  canon_variable_pct       REAL,                             -- solo var: % sobre facturación
  canon_variable_eur_kwh   REAL,                             -- solo var: EUR por kWh
  canon_mix_fijo_anual     REAL,                             -- mix: parte fija total EUR/año
  canon_mix_var_pct        REAL,                             -- mix: parte variable %
  canon_mix_var_eur_kwh    REAL,                             -- mix: parte variable EUR/kWh
  canon_mix_fijo_por_cargador REAL,                          -- mix: parte fija EUR/HW/año

  -- Canon basado en €/m² del valor del suelo (spec §4.ter N — patrimonial municipal)
  canon_eur_m2_ano             REAL,                         -- canon mínimo unitario €/m²/año (= pct × valor_suelo)
  valor_suelo_eur_m2_ano       REAL,                         -- valor del suelo €/m²/año (informe municipal)
  canon_pct_valor_suelo        REAL,                         -- % aplicado al valor del suelo (típico 5)
  superficie_minima_m2         REAL,                         -- mín por ubicación (m²)
  superficie_maxima_m2         REAL,                         -- máx por ubicación (m²)

  -- Explicaciones extendidas (spec §4.ter P) — alimentan modales de la UI
  hardware_especificaciones_json TEXT,                       -- JSON: opciones de HW admitidas con specs por tipo
  canon_explicacion_json         TEXT,                       -- JSON: desglose narrativo del cálculo del canon

  -- Variante "venta de energía al usuario": el adjudicatario no paga canon al
  -- órgano sino que vende energía al usuario; el órgano puntúa el precio bajo.
  precio_max_kwh_usuario       REAL,                         -- precio máximo €/kWh que el adjudicatario puede cobrar al usuario final
  precio_kwh_ofertado_ganador  REAL,                         -- €/kWh ofertado por el ganador
  mantenimiento_precio_anos    INTEGER,                      -- años de compromiso de mantener el precio sin actualización

  -- Desglose de weighting (criterios técnicos típicos)
  peso_construccion_tiempo REAL,                             -- 0..100
  peso_proyecto_tecnico    REAL,
  peso_mas_hw_potencia     REAL,
  peso_mas_ubicaciones     REAL,
  peso_otros               REAL,                             -- otros técnicos (no construcción/proyecto/HW/ubic)
  peso_otros_economicos    REAL,                             -- spec §4.ter O: criterios cifras no-canon (gratuidades, descuentos, abonos a residentes, etc.)

  -- Garantías exigidas (para ofertar + al adjudicatario)
  garantia_provisional_eur     REAL,                         -- importe fijo (se devuelve si no gana)
  garantia_provisional_pct     REAL,                         -- a veces es % sobre importe base
  garantia_provisional_exigida INTEGER,                      -- bool: ¿se exige para presentar oferta?
  garantia_definitiva_eur      REAL,
  garantia_definitiva_pct      REAL,
  garantia_definitiva_base     TEXT,                         -- canon_total_15_anos / importe_base / otra

  -- Requisitos para participar (must-haves)
  requisitos_solvencia_economica TEXT,                       -- JSON array: [{tipo, descripcion, umbral}]
  requisitos_solvencia_tecnica   TEXT,                       -- JSON array: [{tipo, descripcion, umbral}]
  requisitos_adicionales         TEXT,                       -- JSON array: [{descripcion, critico}]

  -- raw payload
  raw_xml_gz               BLOB,                             -- gzipped XML entry

  ingested_at              TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at               TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lic_estado       ON licitaciones(estado_actual);
CREATE INDEX IF NOT EXISTS idx_lic_cat          ON licitaciones(categoria_emov);
CREATE INDEX IF NOT EXISTS idx_lic_prov         ON licitaciones(provincia_codigo);
CREATE INDEX IF NOT EXISTS idx_lic_fecha_pub    ON licitaciones(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_lic_fecha_adj    ON licitaciones(fecha_adjudicacion);
CREATE INDEX IF NOT EXISTS idx_lic_organo_nif   ON licitaciones(organo_nif);
CREATE INDEX IF NOT EXISTS idx_lic_infra        ON licitaciones(tiene_infra_recarga);
CREATE INDEX IF NOT EXISTS idx_lic_emov         ON licitaciones(tiene_infra_recarga, categoria_emov, estado_actual);

-- ───── CPVs (many-to-many) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licitacion_cpvs (
  licitacion_id            TEXT NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
  cpv_code                 TEXT NOT NULL,
  PRIMARY KEY (licitacion_id, cpv_code)
);

CREATE INDEX IF NOT EXISTS idx_cpv ON licitacion_cpvs(cpv_code);

-- ───── LICITADORES (bidders + winners) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS licitadores (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  licitacion_id            TEXT NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
  empresa_nif              TEXT,
  empresa_nombre           TEXT NOT NULL,
  rol                      TEXT NOT NULL,                   -- participante/adjudicataria/excluida
  es_ute                   INTEGER DEFAULT 0,
  miembros_ute             TEXT,                            -- JSON array of {nif, nombre}
  oferta_economica         REAL,
  oferta_canon_anual       REAL,
  oferta_canon_por_cargador REAL,
  oferta_precio_kwh_usuario     REAL,                       -- variante "venta energía al usuario": €/kWh ofertado al usuario
  oferta_mantenimiento_precio_anos INTEGER,                 -- años de compromiso de mantener el precio
  inversion_comprometida   REAL,
  puntuacion_economica     REAL,
  puntuacion_tecnica       REAL,
  puntuacion_total         REAL,
  rank_position            INTEGER,
  motivo_exclusion         TEXT,
  mejoras_ofertadas        TEXT                             -- JSON array of strings
);

CREATE INDEX IF NOT EXISTS idx_licitadores_lic  ON licitadores(licitacion_id);
CREATE INDEX IF NOT EXISTS idx_licitadores_nif  ON licitadores(empresa_nif);
CREATE INDEX IF NOT EXISTS idx_licitadores_rol  ON licitadores(rol);

-- ───── EMPRESAS (master, bottom-up) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  nif                      TEXT PRIMARY KEY,
  nombre_canonico          TEXT NOT NULL,
  nombres_alternativos     TEXT,                            -- JSON array
  grupo_matriz             TEXT,                            -- Iberdrola/Endesa-X/Repsol/Acciona/Wenea/Eranovum/...
  tipo_empresa             TEXT,                            -- cpo/utility/oil_major/epc/constructora/otro
  created_at               TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ───── DOCUMENTOS (pliegos, actas, resoluciones) ─────────────────────────
CREATE TABLE IF NOT EXISTS documentos (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  licitacion_id            TEXT NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
  tipo                     TEXT NOT NULL,                   -- pliego_administrativo/pliego_tecnico/anuncio/acta_apertura/resolucion_adjudicacion/modificacion (clasificación canónica)
  nombre_original          TEXT,                            -- el nombre tal como lo subió el órgano contratante en PLACSP
  url                      TEXT NOT NULL,
  hash_sha256              TEXT,
  fecha_subida             TEXT,
  descargado               INTEGER DEFAULT 0,
  texto_extraido           TEXT,                            -- filled on-demand by LLM pipeline (phase 2)
  resumen_ia               TEXT
);

CREATE INDEX IF NOT EXISTS idx_doc_lic ON documentos(licitacion_id);

-- ───── SNAPSHOTS DE ESTADO (full audit trail) ────────────────────────────
CREATE TABLE IF NOT EXISTS snapshots_estado (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  licitacion_id            TEXT NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
  estado                   TEXT NOT NULL,
  fecha                    TEXT NOT NULL,
  fuente_atom              TEXT                             -- filename of the atom feed that produced this snapshot
);

CREATE INDEX IF NOT EXISTS idx_snap_lic ON snapshots_estado(licitacion_id, fecha);

-- ───── META: ingest log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingest_log (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  atom_file                TEXT NOT NULL UNIQUE,
  processed_at             TEXT DEFAULT CURRENT_TIMESTAMP,
  entries_parsed           INTEGER,
  entries_new              INTEGER,
  entries_updated          INTEGER,
  entries_deleted          INTEGER,
  error                    TEXT
);

-- ───── BENCHMARKS MATERIALIZADOS (regenerated by placsp-build-benchmarks) ─
CREATE TABLE IF NOT EXISTS benchmarks_cpo (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  segmento_hw              TEXT,                            -- AC/DC/DC+/HPC
  tamano_municipio         TEXT,                            -- poor/fair/good/very_good/excellent
  provincia                TEXT,
  ccaa                     TEXT,
  tipo_ubicacion           TEXT,
  plazo_concesion_bucket   TEXT,                            -- 5/10/15/20+
  anio_adjudicacion        INTEGER,
  tipo_retribucion         TEXT,
  n_concesiones            INTEGER,
  canon_anual_por_cargador_min   REAL,
  canon_anual_por_cargador_p25   REAL,
  canon_anual_por_cargador_p50   REAL,
  canon_anual_por_cargador_p75   REAL,
  canon_anual_por_cargador_p90   REAL,
  canon_anual_por_cargador_max   REAL,
  canon_anual_total_min    REAL,
  canon_anual_total_p50    REAL,
  canon_anual_total_max    REAL,
  inversion_comprometida_p50 REAL,
  duracion_media_anos      REAL,
  num_cargadores_medio     REAL,
  ganadores_top3           TEXT,                            -- JSON array
  regenerated_at           TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bench_seg ON benchmarks_cpo(segmento_hw, tamano_municipio, anio_adjudicacion);

-- ───── UBICACIONES (concesiones cat=1 · fase 2 LLM) ──────────────────────
-- Una fila por ubicación de un pliego de concesión demanial. Rellenado desde
-- los PDFs por scripts/placsp-extract-pdfs.mjs. Permite desagregar un pliego
-- multi-ubicación en ítems individuales con HW propio.
-- Si modificás el schema acá, también ejecutá los ALTER TABLE en la DB
-- existente con `placsp-extract-pdfs.mjs` o un script de migración.
CREATE TABLE IF NOT EXISTS ubicaciones_concesion (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  licitacion_id            TEXT NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
  nombre                   TEXT,                             -- nombre/lote del pliego
  direccion                TEXT,
  municipio                TEXT,
  ciudad_ine               TEXT,
  latitud                  REAL,
  longitud                 REAL,
  plazas                   INTEGER,                          -- plazas de aparcamiento asociadas
  num_cargadores_ac        INTEGER,
  num_cargadores_dc        INTEGER,
  num_cargadores_dc_plus   INTEGER,
  num_cargadores_hpc       INTEGER,
  num_cargadores_total     INTEGER,
  potencia_total_kw        REAL,
  potencia_por_cargador_kw REAL,                             -- potencia máxima declarada por cargador
  tipo_hw                  TEXT,                             -- AC / DC / HPC / mixto
  plazo_pem_meses          INTEGER,                          -- plazo puesta en marcha específico
  google_maps_url          TEXT,                             -- URL Google Maps (si el pliego la incluye)
  notas                    TEXT,
  es_opcional              INTEGER DEFAULT 0,                -- bool: la ubicación es opcional/mejora
  es_existente             INTEGER DEFAULT 0,                -- bool: cargador ya existe y se asume sin reemplazo
  plano_url                TEXT,                             -- URL al plano/anexo del pliego (PDF o ZIP)
  plano_label              TEXT,                             -- etiqueta del plano (ej "Anexo 3 del PPT")
  extraccion_llm_fecha     TEXT
);

CREATE INDEX IF NOT EXISTS idx_ubic_lic ON ubicaciones_concesion(licitacion_id);
