/**
 * Fix 2026-04-21:
 *   1. Subtipos 25/0G con carroceria AC (familiares/MPV) → turismo, no VCL.
 *   2. Subtipos en "otros" que son camiones industriales (01/08/09/0B/0C/0D/0E/0F/
 *      1A/1C/1D/1E/1F/72/74/80) → reclasificar por MMA: ≤3500 → furgoneta_van,
 *      >3500 → camion.
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

const CAMION_SUBTIPOS = ['01','08','09','0B','0C','0D','0E','0F','1A','1C','1D','1E','1F','72','74','80'];
const CAMION_LIST = CAMION_SUBTIPOS.map(s => `'${s}'`).join(',');

function run(sql, label) {
  const t0 = Date.now();
  const info = db.prepare(sql).run();
  console.log(`  ${label}: ${info.changes.toLocaleString('es')} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
}

// --- PARQUE ---
console.log('\n— parque —');
// AC familiar en subtipos 25/0G → turismo
run(
  `UPDATE parque
     SET tipo_grupo = 'turismo'
   WHERE tipo_grupo = 'furgoneta_van'
     AND subtipo IN ('25','0G')
     AND UPPER(COALESCE(carroceria,'')) = 'AC'`,
  'AC familiar → turismo',
);
// Reclasificar subtipos otros→camion/furgoneta_van por MMA
run(
  `UPDATE parque
     SET tipo_grupo = CASE
       WHEN mma IS NOT NULL AND mma <= 3500 THEN 'furgoneta_van'
       ELSE 'camion'
     END
   WHERE tipo_grupo = 'otros'
     AND subtipo IN (${CAMION_LIST})`,
  'otros → camion/furgoneta_van (subtipos camión)',
);
// Excluir 80 tren_turistico si mma NULL (ambiguo) — no, lo dejamos en camion por default

// --- MATRICULACIONES ---
console.log('\n— matriculaciones —');
run(
  `UPDATE matriculaciones
     SET tipo_grupo = 'turismo'
   WHERE tipo_grupo = 'furgoneta_van'
     AND cod_tipo IN ('25','0G')
     AND UPPER(COALESCE(carroceria,'')) = 'AC'`,
  'AC familiar → turismo',
);
run(
  `UPDATE matriculaciones
     SET tipo_grupo = CASE
       WHEN masa_max_tecnica IS NOT NULL AND masa_max_tecnica <= 3500 THEN 'furgoneta_van'
       ELSE 'camion'
     END
   WHERE tipo_grupo = 'otros'
     AND cod_tipo IN (${CAMION_LIST})`,
  'otros → camion/furgoneta_van',
);

// --- BAJAS ---
console.log('\n— bajas —');
run(
  `UPDATE bajas
     SET tipo_grupo = 'turismo'
   WHERE tipo_grupo = 'furgoneta_van'
     AND cod_tipo IN ('25','0G')
     AND UPPER(COALESCE(carroceria,'')) = 'AC'`,
  'AC familiar → turismo',
);
// En bajas '80' es tren_turistico y '81','82' son autocaravana — NO los tocamos
const BAJAS_CAMION = CAMION_SUBTIPOS.filter(s => s !== '80');
const BAJAS_LIST = BAJAS_CAMION.map(s => `'${s}'`).join(',');
run(
  `UPDATE bajas
     SET tipo_grupo = CASE
       WHEN peso_max IS NOT NULL AND peso_max <= 3500 THEN 'furgoneta_van'
       ELSE 'camion'
     END
   WHERE tipo_grupo = 'otros'
     AND cod_tipo IN (${BAJAS_LIST})`,
  'otros → camion/furgoneta_van',
);

db.close();
console.log('\n✓ listo');
