/**
 * Fix 2026-04-22 (ampliación) — expande captura de `trimoto`:
 *   - REWACO (marca entera)
 *   - HARLEY-DAVIDSON TRI GLIDE / FREEWHEELER
 *   - cualquier modelo con TRIKE / TRICICLO / MOTOTRIKE como palabra
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

function run(sql, params, label) {
  const t0 = Date.now();
  const info = db.prepare(sql).run(...params);
  console.log(`  ${label}: ${info.changes.toLocaleString('es')} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
}

// GLOB: usamos patrones con bordes de palabra via espacios/comienzos/fines.
const WHERE_REWACO    = `marca = 'REWACO'`;
const WHERE_HARLEY    = `marca = 'HARLEY-DAVIDSON' AND (modelo GLOB '*TRI GLIDE*' OR modelo GLOB '*FREEWHEELER*')`;
const WHERE_MODELO    = `(modelo GLOB '*TRIKE*' OR modelo GLOB '*TRICICLO*' OR modelo GLOB '*MOTOTRIKE*')`;

for (const tabla of ['parque','matriculaciones','bajas']) {
  console.log(`\n— ${tabla} —`);
  run(`UPDATE ${tabla} SET tipo_grupo='trimoto' WHERE (${WHERE_REWACO}) AND tipo_grupo<>'trimoto'`, [], '→ REWACO');
  run(`UPDATE ${tabla} SET tipo_grupo='trimoto' WHERE (${WHERE_HARLEY}) AND tipo_grupo<>'trimoto'`, [], '→ HARLEY TRI');
  run(`UPDATE ${tabla} SET tipo_grupo='trimoto' WHERE (${WHERE_MODELO}) AND tipo_grupo<>'trimoto'`, [], '→ modelo TRIKE/TRICICLO');
}

db.close();
console.log('\n✓ listo');
