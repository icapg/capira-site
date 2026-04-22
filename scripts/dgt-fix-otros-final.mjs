/**
 * Fix 2026-04-21 (segunda pasada, verificado por marca):
 *   - 81, 7C, 7E, 7F → camion (tractocamiones, hormigoneras, grúas, bomberos)
 *   - 71, 73, 7B, 7D, 7J → especial (maquinaria industrial)
 *   - s3, SC, RC → remolque (semirremolques)
 *
 * Nota: en bajas el subtipo '81' significa autocaravana (distinto a matriculaciones/
 * parque donde es tractocamión). NO se toca '81' en bajas.
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
  console.log(`  ${label}: ${info.changes.toLocaleString('es')} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
}

// --- PARQUE ---
console.log('\n— parque —');
run(
  `UPDATE parque SET tipo_grupo = 'camion'
     WHERE tipo_grupo = 'otros'
       AND subtipo IN ('81','7C','7E','7F')`,
  '81/7C/7E/7F → camion',
);
run(
  `UPDATE parque SET tipo_grupo = 'especial'
     WHERE tipo_grupo = 'otros'
       AND subtipo IN ('71','73','7B','7D','7J')`,
  '71/73/7B/7D/7J → especial',
);
run(
  `UPDATE parque SET tipo_grupo = 'remolque'
     WHERE tipo_grupo = 'otros'
       AND subtipo IN ('s3','SC','RC')`,
  's3/SC/RC → remolque',
);

// --- MATRICULACIONES ---
console.log('\n— matriculaciones —');
run(
  `UPDATE matriculaciones SET tipo_grupo = 'camion'
     WHERE tipo_grupo = 'otros'
       AND cod_tipo IN ('81','7C','7E','7F')`,
  '81/7C/7E/7F → camion',
);
run(
  `UPDATE matriculaciones SET tipo_grupo = 'especial'
     WHERE tipo_grupo = 'otros'
       AND cod_tipo IN ('71','73','7B','7D','7J')`,
  '71/73/7B/7D/7J → especial',
);
run(
  `UPDATE matriculaciones SET tipo_grupo = 'remolque'
     WHERE tipo_grupo = 'otros'
       AND cod_tipo IN ('s3','SC','RC')`,
  's3/SC/RC → remolque',
);

// --- BAJAS (sin '81' — ahí es autocaravana) ---
console.log('\n— bajas —');
run(
  `UPDATE bajas SET tipo_grupo = 'camion'
     WHERE tipo_grupo = 'otros'
       AND cod_tipo IN ('7C','7E','7F')`,
  '7C/7E/7F → camion',
);
run(
  `UPDATE bajas SET tipo_grupo = 'especial'
     WHERE tipo_grupo = 'otros'
       AND cod_tipo IN ('71','73','7B','7D','7J')`,
  '71/73/7B/7D/7J → especial',
);
run(
  `UPDATE bajas SET tipo_grupo = 'remolque'
     WHERE tipo_grupo = 'otros'
       AND cod_tipo IN ('s3','SC','RC')`,
  's3/SC/RC → remolque',
);

db.close();
console.log('\n✓ listo');
