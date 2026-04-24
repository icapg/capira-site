/**
 * placsp-migrate-v4.mjs
 *
 * Migración idempotente del schema v3 → v4 (fase 2 LLM).
 *
 * Agrega columnas fase-2 a `licitaciones` y crea la tabla `ubicaciones_concesion`.
 * Ejecutable tantas veces como se quiera: cada ALTER se envuelve en try/catch y
 * sólo ejecuta si la columna no existe.
 *
 * Uso: node scripts/placsp-migrate-v4.mjs
 */

import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'licitaciones.db');

// Columnas nuevas en `licitaciones`
const NEW_COLS_LICITACIONES = [
  // Bloque común a todas las categorías
  ['criterios_valoracion',          'TEXT'],
  ['peso_criterios_economicos',     'REAL'],
  ['peso_criterios_tecnicos',       'REAL'],
  ['mejoras_puntuables',            'TEXT'],
  ['tipo_adjudicacion',             'TEXT'],
  ['idioma_pliego',                 'TEXT'],
  ['extraccion_llm_fecha',          'TEXT'],
  ['extraccion_llm_modelo',         'TEXT'],
  ['extraccion_llm_warnings',       'TEXT'],  // legacy (flat); reemplazado por las dos siguientes
  ['extraccion_llm_notas_pliego',       'TEXT'],  // JSON array: terms del pliego (pre-adjudicación)
  ['extraccion_llm_notas_adjudicacion', 'TEXT'],  // JSON array: proceso de adjudicación (post-apertura sobres)

  // Bloque específico cat=1 (concesiones demaniales)
  ['fecha_inicio_concesion',        'TEXT'],
  ['tipo_inicio_concesion',         'TEXT'],
  ['plazo_construccion_meses',      'INTEGER'],
  ['potencia_disponible_kw',        'REAL'],
  ['potencia_disponible_garantizada','INTEGER'],
  ['tecnologia_requerida',          'TEXT'],
  ['num_cargadores_minimo',         'INTEGER'],
  ['num_cargadores_opcional_extra', 'INTEGER'],
  ['potencia_minima_por_cargador_kw','REAL'],
  ['potencia_opcional_subible',     'INTEGER'],

  // Breakdown de canon (alineado con POWY tender-analysis sheet)
  ['canon_por_ubicacion_anual',     'REAL'],    // fix: EUR/ubicación/año
  ['canon_variable_pct',            'REAL'],    // solo var: % sobre facturación
  ['canon_variable_eur_kwh',        'REAL'],    // solo var: EUR por kWh cargado
  ['canon_mix_fijo_anual',          'REAL'],    // mix: parte fija total EUR/año
  ['canon_mix_var_pct',             'REAL'],    // mix: parte variable %
  ['canon_mix_var_eur_kwh',         'REAL'],    // mix: parte variable EUR/kWh
  ['canon_mix_fijo_por_cargador',   'REAL'],    // mix: parte fija EUR/HW/año

  // Desglose de weighting (cuando extraíble del pliego)
  ['peso_construccion_tiempo',      'REAL'],    // 0..100
  ['peso_proyecto_tecnico',         'REAL'],
  ['peso_mas_hw_potencia',          'REAL'],
  ['peso_mas_ubicaciones',          'REAL'],
  ['peso_otros',                    'REAL'],
  ['peso_canon_fijo',               'REAL'],    // sub-peso del económico: alza canon fijo
  ['peso_canon_variable',           'REAL'],    // sub-peso del económico: alza canon variable

  // Garantías exigidas (para ofertar + al adjudicatario)
  ['garantia_provisional_eur',      'REAL'],    // importe fijo en EUR (se devuelve si no gana)
  ['garantia_provisional_pct',      'REAL'],    // a veces es % sobre importe base
  ['garantia_provisional_exigida',  'INTEGER'], // bool: ¿se exige para poder presentar oferta?
  ['garantia_definitiva_eur',       'REAL'],
  ['garantia_definitiva_pct',       'REAL'],
  ['garantia_definitiva_base',      'TEXT'],    // "canon_total_15_anos" / "importe_base" / "otra"

  // Requisitos para participar (must-haves)
  ['requisitos_solvencia_economica','TEXT'],    // JSON array: [{tipo, descripcion, umbral}]
  ['requisitos_solvencia_tecnica',  'TEXT'],    // JSON array: [{tipo, descripcion, umbral}]
  ['requisitos_adicionales',        'TEXT'],    // JSON array: [{descripcion, critico}] - certificaciones, presencia local, etc.
];

// Columnas nuevas en `licitadores` (ofertas más detalladas)
const NEW_COLS_LICITADORES = [
  ['oferta_canon_variable_eur_kwh', 'REAL'],    // canon variable por kWh cargado (canon mixto)
  ['oferta_canon_variable_pct',     'REAL'],    // canon variable como % sobre facturación
  ['oferta_descuento_residentes_pct', 'REAL'],  // descuento % ofertado a residentes
  ['puntuaciones_detalle',          'TEXT'],    // JSON array: [{ nombre, puntos, peso_max, color? }] — sub-puntuaciones no-económicas
];

function columnExists(db, table, col) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === col);
}

function main() {
  console.log(`⏳ Migración v4 sobre ${DB_FILE}`);
  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  let added = 0, skipped = 0;
  for (const [col, type] of NEW_COLS_LICITACIONES) {
    if (columnExists(db, 'licitaciones', col)) { skipped++; continue; }
    db.prepare(`ALTER TABLE licitaciones ADD COLUMN ${col} ${type}`).run();
    console.log(`   + licitaciones.${col} (${type})`);
    added++;
  }
  for (const [col, type] of NEW_COLS_LICITADORES) {
    if (columnExists(db, 'licitadores', col)) { skipped++; continue; }
    db.prepare(`ALTER TABLE licitadores ADD COLUMN ${col} ${type}`).run();
    console.log(`   + licitadores.${col} (${type})`);
    added++;
  }
  console.log(`   → ${added} columnas añadidas, ${skipped} ya existían`);

  // Tabla ubicaciones_concesion
  db.exec(`
    CREATE TABLE IF NOT EXISTS ubicaciones_concesion (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      licitacion_id            TEXT NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
      nombre                   TEXT,
      direccion                TEXT,
      municipio                TEXT,
      ciudad_ine               TEXT,
      latitud                  REAL,
      longitud                 REAL,
      plazas                   INTEGER,
      num_cargadores_ac        INTEGER,
      num_cargadores_dc        INTEGER,
      num_cargadores_dc_plus   INTEGER,
      num_cargadores_hpc       INTEGER,
      num_cargadores_total     INTEGER,
      potencia_total_kw        REAL,
      potencia_por_cargador_kw REAL,
      tipo_hw                  TEXT,
      plazo_pem_meses          INTEGER,
      notas                    TEXT,
      es_opcional              INTEGER DEFAULT 0,
      extraccion_llm_fecha     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_ubic_lic ON ubicaciones_concesion(licitacion_id);
  `);
  // ALTER idempotente para columnas añadidas después de la v4 inicial
  const UBIC_LATER_COLS = [
    ['latitud', 'REAL'], ['longitud', 'REAL'], ['plazo_pem_meses', 'INTEGER'],
    ['google_maps_url', 'TEXT'],
  ];
  for (const [col, type] of UBIC_LATER_COLS) {
    if (!columnExists(db, 'ubicaciones_concesion', col)) {
      db.prepare(`ALTER TABLE ubicaciones_concesion ADD COLUMN ${col} ${type}`).run();
      console.log(`   + ubicaciones_concesion.${col} (${type})`);
    }
  }
  console.log(`   ✔ ubicaciones_concesion lista`);

  // UNIQUE para documentos (evita duplicar la misma URL en una licitación)
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_doc_lic_url ON documentos(licitacion_id, url);`);
  console.log(`   ✔ uniq_doc_lic_url creado`);

  db.close();
  console.log(`✅ Migración v4 completa`);
}

main();
