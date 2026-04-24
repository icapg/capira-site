/**
 * Inicialización de la base de datos SQLite para infraestructura de carga.
 *
 * Crea data/infraestructura.db con el schema completo. Idempotente:
 * si la DB ya existe, solo crea las tablas/índices faltantes.
 *
 * Fuente de datos: API externa de mapareve.es (MITMA / RED ELÉCTRICA DE ESPAÑA)
 * Docs: https://www.mapareve.es/docs/api/external/v1
 *
 * Uso:
 *   node scripts/infra-init-db.mjs
 *   node scripts/infra-init-db.mjs --reset   # elimina y recrea (pide confirmación)
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, unlinkSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'data');
const DB_FILE   = join(DATA_DIR, 'infraestructura.db');
const RESET     = process.argv.includes('--reset');

const SCHEMA = `
-- ─── CPOs (operadores de carga) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS cpos (
  id           TEXT PRIMARY KEY,
  party_id     TEXT UNIQUE,
  cif          TEXT,
  name         TEXT,
  address      TEXT,
  country      TEXT,
  region       TEXT,
  state        TEXT,
  city         TEXT,
  city_code    TEXT,
  postal_code  TEXT,
  phone        TEXT,
  website      TEXT,
  last_updated TEXT,
  confirmed_at TEXT,
  synced_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cpos_party_id ON cpos(party_id);

-- ─── Ubicaciones físicas ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id                   TEXT PRIMARY KEY,
  country_code         TEXT,
  party_id             TEXT,
  cpo_name             TEXT,
  version              TEXT,
  name                 TEXT,
  address              TEXT,
  city                 TEXT,
  postal_code          TEXT,
  region               TEXT,
  state                TEXT,
  country              TEXT,
  lat                  REAL,
  lon                  REAL,
  parking_type         TEXT,
  owner                TEXT,
  facilities           TEXT,
  time_zone            TEXT,
  opening_times        TEXT,
  charging_when_closed INTEGER,
  directions           TEXT,
  last_updated         TEXT,
  synced_at            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_locations_region   ON locations(region);
CREATE INDEX IF NOT EXISTS idx_locations_party_id ON locations(party_id);
CREATE INDEX IF NOT EXISTS idx_locations_city     ON locations(city);

-- ─── EVSEs (puntos de carga individuales) ─────────────────────────
CREATE TABLE IF NOT EXISTS evses (
  id                   TEXT PRIMARY KEY,
  evse_id              TEXT UNIQUE,
  location_id          TEXT,
  accessibility        TEXT,
  capabilities         TEXT,
  floor_level          TEXT,
  lat                  REAL,
  lon                  REAL,
  physical_reference   TEXT,
  directions           TEXT,
  last_static_updated  TEXT,
  synced_at            TEXT NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);
CREATE INDEX IF NOT EXISTS idx_evses_location ON evses(location_id);
CREATE INDEX IF NOT EXISTS idx_evses_evse_id  ON evses(evse_id);

-- ─── Conectores ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connectors (
  id                   TEXT PRIMARY KEY,
  evse_id              TEXT,
  standard             TEXT,
  format               TEXT,
  power_type           TEXT,
  max_electric_power   INTEGER,
  max_voltage          INTEGER,
  max_amperage         INTEGER,
  last_static_updated  TEXT,
  synced_at            TEXT NOT NULL,
  FOREIGN KEY (evse_id) REFERENCES evses(id)
);
CREATE INDEX IF NOT EXISTS idx_connectors_evse       ON connectors(evse_id);
CREATE INDEX IF NOT EXISTS idx_connectors_power_type ON connectors(power_type);
CREATE INDEX IF NOT EXISTS idx_connectors_standard   ON connectors(standard);

-- ─── Serie temporal de estado operacional (poller cada 10 min) ────
CREATE TABLE IF NOT EXISTS evse_status_log (
  id                              INTEGER PRIMARY KEY AUTOINCREMENT,
  evse_id                         TEXT NOT NULL,
  operational_status              INTEGER NOT NULL,
  last_operational_status_updated TEXT,
  recorded_at                     TEXT NOT NULL,
  FOREIGN KEY (evse_id) REFERENCES evses(id)
);
CREATE INDEX IF NOT EXISTS idx_status_evse_recorded ON evse_status_log(evse_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_status_recorded      ON evse_status_log(recorded_at);

-- ─── Tarifas vigentes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tariffs (
  id                   TEXT PRIMARY KEY,
  evse_id              TEXT,
  connector_id         TEXT,
  currency             TEXT,
  start_date_time      TEXT,
  end_date_time        TEXT,
  elements             TEXT,
  last_tariff_updated  TEXT,
  synced_at            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tariffs_evse      ON tariffs(evse_id);
CREATE INDEX IF NOT EXISTS idx_tariffs_connector ON tariffs(connector_id);

-- ─── Control de sync (checkpoints + último éxito por endpoint) ────
CREATE TABLE IF NOT EXISTS sync_state (
  endpoint        TEXT PRIMARY KEY,
  last_page       INTEGER,
  last_synced_at  TEXT,
  last_success_at TEXT,
  total_records   INTEGER,
  notes           TEXT
);
`;

function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  if (RESET && existsSync(DB_FILE)) {
    console.log(`⚠️  --reset: eliminando ${DB_FILE}`);
    unlinkSync(DB_FILE);
  }

  const existed = existsSync(DB_FILE);
  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(SCHEMA);

  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();

  console.log(existed ? `🔄 Schema actualizado en ${DB_FILE}` : `✅ Base de datos creada: ${DB_FILE}`);
  console.log(`   Tablas (${tables.length}): ${tables.map(t => t.name).join(', ')}`);

  db.close();
}

main();
