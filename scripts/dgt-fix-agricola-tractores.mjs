/**
 * Fix 2026-04-22 — recupera categoría `agricola` a partir de whitelist de
 * marcas puramente tractoreras en subtipos 70/80/81 (donde hoy caen por
 * default como quad_atv/camion/furgoneta_van).
 *
 * NO toca subtipos 7J/71/7D (retroexcavadoras, maquinaria construcción de
 * NH/JD/Kubota — quedan en 'especial'). NO toca sub 40 (LAMBORGHINI supercars).
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

const TRACTOR_MARCAS = [
  'JOHN DEERE','NEW HOLLAND','KUBOTA','CASE IH','FENDT','MASSEY FERGUSON',
  'DEUTZ-FAHR','CLAAS','VALTRA','LANDINI','MCCORMICK','ZETOR','STEYR','SAME',
  'DEUTZ','AGCO','SAMPO','URSUS','PASQUALI','BCS','GOLDONI','CARRARO',
  'ANTONIO CARRARO','ARBOS','LAMBORGHINI','LINDNER','HURLIMANN',
];
const placeholders = TRACTOR_MARCAS.map(() => '?').join(',');

function run(sql, params, label) {
  const t0 = Date.now();
  const info = db.prepare(sql).run(...params);
  console.log(`  ${label}: ${info.changes.toLocaleString('es')} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
}

console.log('\n— parque —');
run(
  `UPDATE parque SET tipo_grupo = 'agricola'
     WHERE marca IN (${placeholders})
       AND subtipo IN ('70','80','81')`,
  TRACTOR_MARCAS, '→ agricola'
);

console.log('\n— matriculaciones —');
run(
  `UPDATE matriculaciones SET tipo_grupo = 'agricola'
     WHERE marca IN (${placeholders})
       AND cod_tipo IN ('70','80','81')`,
  TRACTOR_MARCAS, '→ agricola'
);

console.log('\n— bajas —');
run(
  `UPDATE bajas SET tipo_grupo = 'agricola'
     WHERE marca IN (${placeholders})
       AND cod_tipo IN ('70','80','81')`,
  TRACTOR_MARCAS, '→ agricola'
);

db.close();
console.log('\n✓ listo');
