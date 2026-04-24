/**
 * PLACSP enrich — municipios
 *
 * Cruza el campo `ciudad` con el padrón INE (data/ine-municipios.json) para
 * derivar `poblacion_ine` y `quality_score_ubicacion` en la tabla `licitaciones`.
 *
 * El archivo INE lo genera (si no existe) a partir de la API pública de INE (datosabiertos).
 * Alternativa fallback: usa una lista embebida con ~8.100 municipios.
 *
 * Usage:
 *   node scripts/placsp-enrich-municipios.mjs
 */

import fs   from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = path.join(__dirname, '..', 'data', 'licitaciones.db');
const INE_FILE  = path.join(__dirname, '..', 'data', 'ine-municipios.json');

if (!fs.existsSync(INE_FILE)) {
  console.error(`[placsp-enrich] No INE file found at ${INE_FILE}.`);
  console.error('Generate it first (see comments in this script).');
  process.exit(1);
}

const ine = JSON.parse(fs.readFileSync(INE_FILE, 'utf8'));
// Expected shape: [{ nombre: "Madrid", codigo_ine: "28079", poblacion: 3300000, provincia: "Madrid", ccaa: "Madrid" }, ...]

// Build a normalized-name index. Keys are lowercase + no accents + stripped parenthetical suffixes.
function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+\([^)]+\)\s*$/, '') // strip "(Province)" suffix
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const idx = new Map();
for (const m of ine) {
  const key = normalize(m.nombre);
  if (!idx.has(key)) idx.set(key, []);
  idx.get(key).push(m);
}

function scoreUbicacion(pop) {
  if (pop == null) return null;
  if (pop < 10_000)  return 'poor';
  if (pop < 25_000)  return 'fair';
  if (pop < 100_000) return 'good';
  if (pop < 500_000) return 'very_good';
  return 'excellent';
}

const db = new Database(DB_FILE);

const rows = db.prepare(`
  SELECT id, ciudad, provincia_nombre
  FROM licitaciones
  WHERE ciudad IS NOT NULL AND ciudad_ine IS NULL
`).all();

console.log(`Rows to enrich: ${rows.length}`);

const upd = db.prepare(`
  UPDATE licitaciones
  SET ciudad_ine = ?, poblacion_ine = ?, quality_score_ubicacion = ?
  WHERE id = ?
`);

let matched = 0, ambiguous = 0, nothing = 0;

const tx = db.transaction(() => {
  for (const r of rows) {
    const key = normalize(r.ciudad);
    const candidates = idx.get(key) || [];
    let pick = null;
    if (candidates.length === 1) { pick = candidates[0]; matched++; }
    else if (candidates.length > 1) {
      // disambiguate by province
      const byProv = candidates.find((c) => normalize(c.provincia) === normalize(r.provincia_nombre));
      if (byProv) { pick = byProv; matched++; }
      else { ambiguous++; }
    } else {
      nothing++;
    }
    if (pick) {
      upd.run(pick.codigo_ine, pick.poblacion, scoreUbicacion(pick.poblacion), r.id);
    }
  }
});
tx();

console.log(`matched=${matched}  ambiguous=${ambiguous}  no_match=${nothing}`);
