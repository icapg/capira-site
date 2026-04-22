/**
 * dgt-fix-subtipos-alfanumericos.mjs
 *
 * Aplica fix retroactivo a las 3 tablas (parque, matriculaciones, bajas) para los
 * subtipos alfanuméricos N1/M1 que no estaban mapeados en TIPO_NOMBRE y caían a 'otros':
 *   0G, 02, 00, 07, 0A, 7A, 70 (quad), R*, S*
 *
 * Además aplica brand-override para subtipo '70' (→ 'especial' si la marca es maquinaria).
 *
 * Uso: node scripts/dgt-fix-subtipos-alfanumericos.mjs
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

const MAQUINARIA_MARCAS = [
  'JCB','MANITOU','CASE','CATERPILLAR','BOBCAT','NEW HOLLAND','KOMATSU',
  'LIEBHERR','MERLO','LINDE','AUSA','CNH','HYSTER','STILL','JUNGHEINRICH',
  'DOOSAN','KUBOTA','TAKEUCHI','KRAMER','VOLVO CE','WACKER NEUSON','SANDVIK',
];
const MAQUINARIA_LIST_SQL = MAQUINARIA_MARCAS.map(m => `'${m}'`).join(',');

// Mapeo (subtipo/cod_tipo) → (tipo_vehiculo, tipo_grupo).
// tipo_grupo sigue la agrupación del dashboard.
const MAPEOS = [
  // Subtipos alfanuméricos N1/M1 — VCL/camiones ligeros
  { codes: ['0G'],            tipo_vehiculo: 'furgoneta',        tipo_grupo: 'furgoneta_van' },
  { codes: ['02','00','07','0A'], tipo_vehiculo: 'camion_ligero', tipo_grupo: 'camion' },
  { codes: ['7A'],            tipo_vehiculo: 'autocaravana',     tipo_grupo: 'furgoneta_van' },
  // '70' default: quad_atv. El override a 'especial' para maquinaria se aplica aparte.
  { codes: ['70'],            tipo_vehiculo: 'quad_atv',         tipo_grupo: 'quad_atv' },
  // Remolques
  { codes: ['R0','R1','R2','R3','R5','R6','R7','RA','RD'],
    tipo_vehiculo: 'remolque_ligero', tipo_grupo: 'remolque' },
  // Semirremolques
  { codes: ['S0','S1','S2','S3','S5','S6','S7','S9','SA','SD'],
    tipo_vehiculo: 'semirremolque',   tipo_grupo: 'remolque' },
];

function list(codes) { return codes.map(c => `'${c}'`).join(','); }

console.log('— parque (subtipo → tipo_grupo) —');
for (const m of MAPEOS) {
  const info = db.prepare(`
    UPDATE parque SET tipo_grupo = ?
    WHERE subtipo IN (${list(m.codes)}) AND tipo_grupo != ?
  `).run(m.tipo_grupo, m.tipo_grupo);
  console.log(`  ${m.codes.join(',')} → ${m.tipo_grupo}: ${info.changes} rows`);
}
// Brand override '70' → especial
{
  const info = db.prepare(`
    UPDATE parque SET tipo_grupo = 'especial'
    WHERE subtipo = '70' AND marca IN (${MAQUINARIA_LIST_SQL})
  `).run();
  console.log(`  '70' + marca MAQUINARIA → especial: ${info.changes} rows`);
}

console.log('\n— matriculaciones (cod_tipo → tipo_vehiculo + tipo_grupo) —');
for (const m of MAPEOS) {
  const info = db.prepare(`
    UPDATE matriculaciones SET tipo_vehiculo = ?, tipo_grupo = ?
    WHERE cod_tipo IN (${list(m.codes)})
      AND (tipo_vehiculo IS NULL OR tipo_vehiculo != ? OR tipo_grupo != ?)
  `).run(m.tipo_vehiculo, m.tipo_grupo, m.tipo_vehiculo, m.tipo_grupo);
  console.log(`  ${m.codes.join(',')} → ${m.tipo_vehiculo}/${m.tipo_grupo}: ${info.changes} rows`);
}
{
  const info = db.prepare(`
    UPDATE matriculaciones SET tipo_vehiculo = 'especial', tipo_grupo = 'especial'
    WHERE cod_tipo = '70' AND marca IN (${MAQUINARIA_LIST_SQL})
  `).run();
  console.log(`  '70' + marca MAQUINARIA → especial: ${info.changes} rows`);
}

console.log('\n— bajas (cod_tipo → tipo_vehiculo + tipo_grupo) —');
for (const m of MAPEOS) {
  const info = db.prepare(`
    UPDATE bajas SET tipo_vehiculo = ?, tipo_grupo = ?
    WHERE cod_tipo IN (${list(m.codes)})
      AND (tipo_vehiculo IS NULL OR tipo_vehiculo != ? OR tipo_grupo != ?)
  `).run(m.tipo_vehiculo, m.tipo_grupo, m.tipo_vehiculo, m.tipo_grupo);
  console.log(`  ${m.codes.join(',')} → ${m.tipo_vehiculo}/${m.tipo_grupo}: ${info.changes} rows`);
}
{
  const info = db.prepare(`
    UPDATE bajas SET tipo_vehiculo = 'especial', tipo_grupo = 'especial'
    WHERE cod_tipo = '70' AND marca IN (${MAQUINARIA_LIST_SQL})
  `).run();
  console.log(`  '70' + marca MAQUINARIA → especial: ${info.changes} rows`);
}

console.log('\n✓ UPDATE complete');
db.close();
