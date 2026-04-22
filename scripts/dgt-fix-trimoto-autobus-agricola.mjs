/**
 * Fix 2026-04-22 — 3 bugs de clasificación detectados:
 *   1. suv_todo_terreno: subtipos 31/32 son AUTOBUSES articulados, no SUVs.
 *   2. agricola: subtipos 51-55 son motos/triciclos/quads, no tractores.
 *   3. Crear categoría `trimoto` separada para scooters 3 ruedas (MP3, Tricity,
 *      Metropolis, Quadro, CV3, Fuoco, Spyder, Ryker).
 *
 * Aplicado a parque, matriculaciones y bajas.
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
  const info = db.prepare(sql).run(params || {});
  console.log(`  ${label}: ${info.changes.toLocaleString('es')} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
}

// Trimoto: SQL con condiciones marca+modelo equivalente a esTrimoto() del import.
// Se aplica ANTES de reclasificar los subtipos numéricos, porque la mayoría de
// trimotos viven hoy en tipo_grupo='agricola' con subtipo 53/54.
const TRIMOTO_WHERE = `
  (
    marca = 'QUADRO'
    OR (marca = 'PIAGGIO'  AND modelo GLOB 'MP3*')
    OR (marca = 'GILERA'   AND modelo LIKE '%FUOCO%')
    OR (marca = 'PEUGEOT'  AND modelo LIKE '%METROPOLIS%')
    OR (marca = 'KYMCO'    AND modelo GLOB 'CV3*')
    OR (marca = 'YAMAHA'   AND (
           modelo GLOB 'MWD*' OR modelo GLOB 'MWS*' OR modelo GLOB 'MW*'
        OR modelo GLOB 'TRICITY*' OR modelo GLOB 'NIKEN*'))
    OR (marca = 'CAN-AM'   AND (modelo LIKE '%SPYDER%' OR modelo LIKE '%RYKER%'))
  )
`;

// ---------- PARQUE ----------
console.log('\n— parque —');
run(
  `UPDATE parque SET tipo_grupo = 'trimoto' WHERE ${TRIMOTO_WHERE}`,
  null, '→ trimoto (por marca+modelo)'
);
run(
  `UPDATE parque SET tipo_grupo = 'autobus'
     WHERE tipo_grupo = 'suv_todo_terreno' AND subtipo IN ('31','32')`,
  null, 'suv_todo_terreno 31/32 → autobus'
);
run(
  `UPDATE parque SET tipo_grupo = 'moto'
     WHERE tipo_grupo = 'agricola' AND subtipo IN ('51','52','53','55')`,
  null, 'agricola 51/52/53/55 → moto'
);
run(
  `UPDATE parque SET tipo_grupo = 'quad_atv'
     WHERE tipo_grupo = 'agricola' AND subtipo = '54'`,
  null, 'agricola 54 → quad_atv'
);

// ---------- MATRICULACIONES ----------
console.log('\n— matriculaciones —');
run(
  `UPDATE matriculaciones SET tipo_grupo = 'trimoto' WHERE ${TRIMOTO_WHERE}`,
  null, '→ trimoto (por marca+modelo)'
);
run(
  `UPDATE matriculaciones SET tipo_grupo = 'autobus'
     WHERE tipo_grupo = 'suv_todo_terreno' AND cod_tipo IN ('31','32')`,
  null, 'suv_todo_terreno 31/32 → autobus'
);
run(
  `UPDATE matriculaciones SET tipo_grupo = 'moto'
     WHERE tipo_grupo = 'agricola' AND cod_tipo IN ('51','52','53','55')`,
  null, 'agricola 51/52/53/55 → moto'
);
run(
  `UPDATE matriculaciones SET tipo_grupo = 'quad_atv'
     WHERE tipo_grupo = 'agricola' AND cod_tipo = '54'`,
  null, 'agricola 54 → quad_atv'
);

// ---------- BAJAS ----------
console.log('\n— bajas —');
run(
  `UPDATE bajas SET tipo_grupo = 'trimoto' WHERE ${TRIMOTO_WHERE}`,
  null, '→ trimoto (por marca+modelo)'
);
run(
  `UPDATE bajas SET tipo_grupo = 'autobus'
     WHERE tipo_grupo = 'suv_todo_terreno' AND cod_tipo IN ('31','32')`,
  null, 'suv_todo_terreno 31/32 → autobus'
);
run(
  `UPDATE bajas SET tipo_grupo = 'moto'
     WHERE tipo_grupo = 'agricola' AND cod_tipo IN ('51','52','53','55')`,
  null, 'agricola 51/52/53/55 → moto'
);
run(
  `UPDATE bajas SET tipo_grupo = 'quad_atv'
     WHERE tipo_grupo = 'agricola' AND cod_tipo = '54'`,
  null, 'agricola 54 → quad_atv'
);

db.close();
console.log('\n✓ listo');
