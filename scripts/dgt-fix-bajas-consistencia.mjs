/**
 * Fix 2026-04-22 — alinea tipo_grupo en `bajas` con matriculaciones.
 *
 * Problema: ~800k registros en bajas (3.64%) tienen tipo_grupo distinto al
 * que tendría el mismo vehículo en matriculaciones. Esto pasa porque los
 * fixes previos (MMA split, AC familiar, subtipos alfanuméricos, agricola
 * whitelist, etc.) se aplicaron a matriculaciones usando datos como
 * carroceria, peso/MMA, marca whitelist — pero en bajas algunos de esos
 * datos están peor poblados o ausentes.
 *
 * Estrategia: construir un lookup (cod_tipo, marca, modelo) → tipo_grupo
 * dominante desde matriculaciones (≥20 filas y ≥80% dominancia) y aplicarlo
 * a bajas donde el tipo_grupo difiera.
 *
 * No se toca: SIN MARCA / null marca / null cod_tipo (no hay info para
 * reclasificar con confianza).
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

console.log('1) Construyendo lookup (cod_tipo, marca, modelo) → tipo_grupo dominante desde matriculaciones…');
const t0 = Date.now();

const rowsIt = db.prepare(`
  SELECT cod_tipo, marca, modelo, tipo_grupo, COUNT(*) AS n
  FROM matriculaciones
  WHERE cod_tipo IS NOT NULL
    AND marca IS NOT NULL AND marca <> '' AND marca <> 'SIN MARCA'
    AND modelo IS NOT NULL AND modelo <> '' AND modelo <> '¡'
  GROUP BY cod_tipo, marca, modelo, tipo_grupo
`).iterate();

const agg = new Map();
for (const r of rowsIt) {
  const key = `${r.cod_tipo}||${r.marca}||${r.modelo}`;
  let e = agg.get(key);
  if (!e) { e = { total: 0, tipos: new Map() }; agg.set(key, e); }
  e.total += r.n;
  e.tipos.set(r.tipo_grupo, (e.tipos.get(r.tipo_grupo) ?? 0) + r.n);
}

const lookup = new Map();
for (const [key, e] of agg) {
  if (e.total < 20) continue;
  let dominante = null, max = 0;
  for (const [tg, n] of e.tipos) if (n > max) { max = n; dominante = tg; }
  if (max / e.total >= 0.8) lookup.set(key, dominante);
}
console.log(`   ${lookup.size.toLocaleString('es')} triples (cod_tipo,marca,modelo) en lookup (${((Date.now()-t0)/1000).toFixed(1)}s)`);

console.log('\n2) Construyendo lookup fallback (cod_tipo, marca) → tipo_grupo dominante…');
const rowsIt2 = db.prepare(`
  SELECT cod_tipo, marca, tipo_grupo, COUNT(*) AS n
  FROM matriculaciones
  WHERE cod_tipo IS NOT NULL
    AND marca IS NOT NULL AND marca <> '' AND marca <> 'SIN MARCA'
  GROUP BY cod_tipo, marca, tipo_grupo
`).iterate();
const agg2 = new Map();
for (const r of rowsIt2) {
  const key = `${r.cod_tipo}||${r.marca}`;
  let e = agg2.get(key);
  if (!e) { e = { total: 0, tipos: new Map() }; agg2.set(key, e); }
  e.total += r.n;
  e.tipos.set(r.tipo_grupo, (e.tipos.get(r.tipo_grupo) ?? 0) + r.n);
}
const lookupFallback = new Map();
for (const [key, e] of agg2) {
  if (e.total < 50) continue;
  let dominante = null, max = 0;
  for (const [tg, n] of e.tipos) if (n > max) { max = n; dominante = tg; }
  if (max / e.total >= 0.85) lookupFallback.set(key, dominante);
}
console.log(`   ${lookupFallback.size.toLocaleString('es')} pares (cod_tipo,marca) en fallback`);

console.log('\n3) Creando tablas temporales…');
db.exec(`DROP TABLE IF EXISTS temp.lookup_bajas`);
db.exec(`CREATE TEMP TABLE lookup_bajas (cod_tipo TEXT, marca TEXT, modelo TEXT, tipo_grupo TEXT, PRIMARY KEY (cod_tipo, marca, modelo)) WITHOUT ROWID`);
const insLook = db.prepare(`INSERT INTO temp.lookup_bajas (cod_tipo, marca, modelo, tipo_grupo) VALUES (?,?,?,?)`);
const txnLook = db.transaction((entries) => {
  for (const [k, tg] of entries) {
    const [ct, m, mo] = k.split('||');
    insLook.run(ct, m, mo, tg);
  }
});
txnLook([...lookup.entries()]);

db.exec(`DROP TABLE IF EXISTS temp.lookup_bajas_fb`);
db.exec(`CREATE TEMP TABLE lookup_bajas_fb (cod_tipo TEXT, marca TEXT, tipo_grupo TEXT, PRIMARY KEY (cod_tipo, marca)) WITHOUT ROWID`);
const insLookFb = db.prepare(`INSERT INTO temp.lookup_bajas_fb (cod_tipo, marca, tipo_grupo) VALUES (?,?,?)`);
const txnLookFb = db.transaction((entries) => {
  for (const [k, tg] of entries) {
    const [ct, m] = k.split('||');
    insLookFb.run(ct, m, tg);
  }
});
txnLookFb([...lookupFallback.entries()]);
console.log(`   listas.`);

console.log('\n4) Aplicando pass 1 (cod_tipo, marca, modelo)…');
const t1 = Date.now();
const info1 = db.prepare(`
  UPDATE bajas
     SET tipo_grupo = (
       SELECT l.tipo_grupo FROM temp.lookup_bajas l
        WHERE l.cod_tipo = bajas.cod_tipo
          AND l.marca    = bajas.marca
          AND l.modelo   = bajas.modelo
     )
   WHERE cod_tipo IS NOT NULL
     AND marca IS NOT NULL AND marca <> '' AND marca <> 'SIN MARCA'
     AND modelo IS NOT NULL AND modelo <> ''
     AND (cod_tipo, marca, modelo) IN (SELECT cod_tipo, marca, modelo FROM temp.lookup_bajas)
     AND tipo_grupo <> (
       SELECT l.tipo_grupo FROM temp.lookup_bajas l
        WHERE l.cod_tipo = bajas.cod_tipo
          AND l.marca    = bajas.marca
          AND l.modelo   = bajas.modelo
     )
`).run();
console.log(`   reclasificados pass 1: ${info1.changes.toLocaleString('es')} (${((Date.now()-t1)/1000).toFixed(1)}s)`);

console.log('\n5) Aplicando pass 2 fallback (cod_tipo, marca)…');
const t2 = Date.now();
const info2 = db.prepare(`
  UPDATE bajas
     SET tipo_grupo = (
       SELECT l.tipo_grupo FROM temp.lookup_bajas_fb l
        WHERE l.cod_tipo = bajas.cod_tipo
          AND l.marca    = bajas.marca
     )
   WHERE cod_tipo IS NOT NULL
     AND marca IS NOT NULL AND marca <> '' AND marca <> 'SIN MARCA'
     AND (cod_tipo, marca) IN (SELECT cod_tipo, marca FROM temp.lookup_bajas_fb)
     AND tipo_grupo <> (
       SELECT l.tipo_grupo FROM temp.lookup_bajas_fb l
        WHERE l.cod_tipo = bajas.cod_tipo
          AND l.marca    = bajas.marca
     )
`).run();
console.log(`   reclasificados pass 2: ${info2.changes.toLocaleString('es')} (${((Date.now()-t2)/1000).toFixed(1)}s)`);

console.log('\n5.5) Pass 3: cod_tipo puro (fallback sin marca, ≥90% dominancia)…');
const t3 = Date.now();
const matRows = db.prepare(`
  SELECT cod_tipo, tipo_grupo, COUNT(*) n FROM matriculaciones
   WHERE cod_tipo IS NOT NULL GROUP BY cod_tipo, tipo_grupo
`).all();
const matByTipo = new Map();
for (const r of matRows) {
  if (!matByTipo.has(r.cod_tipo)) matByTipo.set(r.cod_tipo, new Map());
  matByTipo.get(r.cod_tipo).set(r.tipo_grupo, r.n);
}
const lookupPuro = new Map();
for (const [ct, tipos] of matByTipo) {
  let total = 0, max = 0, dominante = null;
  for (const [tg, n] of tipos) { total += n; if (n > max) { max = n; dominante = tg; } }
  if (total >= 100 && max / total >= 0.9) lookupPuro.set(ct, dominante);
}
db.exec(`DROP TABLE IF EXISTS temp.lookup_bajas_p`);
db.exec(`CREATE TEMP TABLE lookup_bajas_p (cod_tipo TEXT PRIMARY KEY, tipo_grupo TEXT) WITHOUT ROWID`);
const insP = db.prepare(`INSERT INTO temp.lookup_bajas_p VALUES (?,?)`);
const txnP = db.transaction(m => { for (const [k, v] of m) insP.run(k, v); });
txnP(lookupPuro);
const info3 = db.prepare(`
  UPDATE bajas
     SET tipo_grupo = (SELECT l.tipo_grupo FROM temp.lookup_bajas_p l WHERE l.cod_tipo = bajas.cod_tipo)
   WHERE cod_tipo IN (SELECT cod_tipo FROM temp.lookup_bajas_p)
     AND tipo_grupo <> (SELECT l.tipo_grupo FROM temp.lookup_bajas_p l WHERE l.cod_tipo = bajas.cod_tipo)
`).run();
console.log(`   ${lookupPuro.size} cod_tipos con dominancia ≥90%`);
console.log(`   reclasificados pass 3: ${info3.changes.toLocaleString('es')} (${((Date.now()-t3)/1000).toFixed(1)}s)`);

console.log('\n6) Verificación final…');
const mat = db.prepare(`
  SELECT cod_tipo, tipo_grupo, COUNT(*) n FROM matriculaciones
   WHERE cod_tipo IS NOT NULL GROUP BY cod_tipo, tipo_grupo
`).all();
const matMap = new Map();
for (const x of mat) {
  if (!matMap.has(x.cod_tipo)) matMap.set(x.cod_tipo, new Map());
  matMap.get(x.cod_tipo).set(x.tipo_grupo, x.n);
}
const bajasCheck = db.prepare(`
  SELECT cod_tipo, tipo_grupo AS tg_baja, COUNT(*) AS n FROM bajas
   WHERE cod_tipo IS NOT NULL GROUP BY cod_tipo, tipo_grupo
`).all();

let inconsistentes = 0, filasAfectadas = 0;
for (const x of bajasCheck) {
  const mm = matMap.get(x.cod_tipo);
  if (!mm) continue;
  const dominanteM = [...mm.entries()].sort((a,b)=>b[1]-a[1])[0];
  if (dominanteM[0] !== x.tg_baja) {
    inconsistentes++;
    filasAfectadas += x.n;
  }
}
const totalBajas = db.prepare('SELECT COUNT(*) n FROM bajas').get().n;
console.log(`   combos inconsistentes: ${inconsistentes}`);
console.log(`   filas residuales: ${filasAfectadas.toLocaleString('es')} (${((filasAfectadas/totalBajas)*100).toFixed(2)}% de bajas)`);

db.close();
console.log('\n✓ listo');
