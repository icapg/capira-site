/**
 * dgt-fix-recompute-agg.mjs
 * Recomputa parque_agregados_mes para 202603 a partir del parque ya corregido.
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

const PERIODO = '202603';

console.log(`Leyendo parque ${PERIODO}…`);
const stmt = db.prepare(`
  SELECT subtipo, tipo_grupo, catelect, provincia, distintivo
  FROM parque WHERE periodo = ?
`);

const aggs = new Map();
const CATELECT_VALID = new Set(['BEV','PHEV','HEV','REEV','FCEV','NO_EV']);
let processed = 0;

for (const r of stmt.iterate(PERIODO)) {
  processed++;
  if (processed % 2_000_000 === 0) console.log(`  ${processed.toLocaleString()} filas...`);
  const tipoGrupo  = r.tipo_grupo ?? 'otros';
  const catelect   = CATELECT_VALID.has(r.catelect) ? r.catelect : 'NO_EV';
  const provincia  = r.provincia || '';
  const distintivo = r.distintivo || '';

  aggs.set('TOTAL', (aggs.get('TOTAL') ?? 0) + 1);
  aggs.set(`CATELECT:${catelect}`, (aggs.get(`CATELECT:${catelect}`) ?? 0) + 1);
  aggs.set(`TIPO:${tipoGrupo}`, (aggs.get(`TIPO:${tipoGrupo}`) ?? 0) + 1);
  aggs.set(`CATELECT_TIPO:${catelect}:${tipoGrupo}`, (aggs.get(`CATELECT_TIPO:${catelect}:${tipoGrupo}`) ?? 0) + 1);
  if (provincia) {
    aggs.set(`PROVINCIA:${provincia}`, (aggs.get(`PROVINCIA:${provincia}`) ?? 0) + 1);
    aggs.set(`PROVINCIA_CATELECT:${provincia}:${catelect}`, (aggs.get(`PROVINCIA_CATELECT:${provincia}:${catelect}`) ?? 0) + 1);
    aggs.set(`PROVINCIA_TIPO:${provincia}:${tipoGrupo}`, (aggs.get(`PROVINCIA_TIPO:${provincia}:${tipoGrupo}`) ?? 0) + 1);
    aggs.set(`PROVINCIA_CATELECT_TIPO:${provincia}:${catelect}:${tipoGrupo}`, (aggs.get(`PROVINCIA_CATELECT_TIPO:${provincia}:${catelect}:${tipoGrupo}`) ?? 0) + 1);
  }
  if (distintivo) {
    aggs.set(`DISTINTIVO:${distintivo}`, (aggs.get(`DISTINTIVO:${distintivo}`) ?? 0) + 1);
  }
}

console.log(`Escribiendo ${aggs.size.toLocaleString()} agregados…`);
const writeTxn = db.transaction(() => {
  db.prepare(`DELETE FROM parque_agregados_mes WHERE periodo = ?`).run(PERIODO);
  const insAgg = db.prepare(`INSERT INTO parque_agregados_mes (periodo, clave, n) VALUES (?,?,?)`);
  for (const [k, n] of aggs) insAgg.run(PERIODO, k, n);
});
writeTxn();

console.log('✓ Agregados recomputados');
db.close();
