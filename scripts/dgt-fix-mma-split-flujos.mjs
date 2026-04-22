/**
 * Reclasifica tipo_grupo en matriculaciones y bajas por masa:
 *   camion con masa ≤3500 → furgoneta_van
 *   furgoneta_van con masa >3500 (no autocaravana) → camion
 * Uso único.
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

function run(sql, label) {
  const t0 = Date.now();
  const info = db.prepare(sql).run();
  console.log(`${label}: ${info.changes.toLocaleString('es')} filas  (${((Date.now()-t0)/1000).toFixed(1)}s)`);
}

console.log('\n— matriculaciones —');
run(
  `UPDATE matriculaciones
     SET tipo_grupo = 'furgoneta_van'
   WHERE tipo_grupo = 'camion'
     AND masa_max_tecnica IS NOT NULL
     AND masa_max_tecnica <= 3500`,
  'camion → furgoneta_van (≤3500)',
);
run(
  `UPDATE matriculaciones
     SET tipo_grupo = 'camion'
   WHERE tipo_grupo = 'furgoneta_van'
     AND masa_max_tecnica IS NOT NULL
     AND masa_max_tecnica > 3500
     AND tipo_vehiculo <> 'autocaravana'`,
  'furgoneta_van → camion (>3500)',
);

console.log('\n— bajas —');
run(
  `UPDATE bajas
     SET tipo_grupo = 'furgoneta_van'
   WHERE tipo_grupo = 'camion'
     AND peso_max IS NOT NULL
     AND peso_max <= 3500`,
  'camion → furgoneta_van (≤3500)',
);
run(
  `UPDATE bajas
     SET tipo_grupo = 'camion'
   WHERE tipo_grupo = 'furgoneta_van'
     AND peso_max IS NOT NULL
     AND peso_max > 3500
     AND tipo_vehiculo <> 'autocaravana'`,
  'furgoneta_van → camion (>3500)',
);

db.close();
console.log('\n✓ listo');
