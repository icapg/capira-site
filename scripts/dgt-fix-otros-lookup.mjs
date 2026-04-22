/**
 * Fix 2026-04-22 — recupera `otros` en matriculaciones/bajas usando lookup
 * marca+modelo construido desde `parque` (tabla bien clasificada).
 *
 * Reglas:
 *   - solo reclasifica registros con marca real (no null, no 'SIN MARCA', no '')
 *   - solo aplica si el par (marca, modelo) tiene ≥20 registros en parque
 *     Y ≥80% están en un solo tipo_grupo (dominante)
 *   - nunca toca 'SIN MARCA' (se queda en 'otros' legítimo)
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

console.log('1) Construyendo lookup (marca,modelo) → tipo_grupo dominante desde parque…');
const t0 = Date.now();

// marca+modelo → {tipo_grupo → count}, luego filtrar por dominancia
const lookup = new Map(); // key = `${marca}||${modelo}` → { dominante, total, pct }
const rowsIt = db.prepare(`
  SELECT marca, modelo, tipo_grupo, COUNT(*) AS n
  FROM parque
  WHERE marca IS NOT NULL AND marca <> '' AND marca <> 'SIN MARCA'
    AND modelo IS NOT NULL AND modelo <> '' AND modelo <> '¡'
  GROUP BY marca, modelo, tipo_grupo
`).iterate();

const agg = new Map();
for (const r of rowsIt) {
  const key = `${r.marca}||${r.modelo}`;
  let e = agg.get(key);
  if (!e) { e = { total: 0, tipos: new Map() }; agg.set(key, e); }
  e.total += r.n;
  e.tipos.set(r.tipo_grupo, (e.tipos.get(r.tipo_grupo) ?? 0) + r.n);
}
for (const [key, e] of agg) {
  if (e.total < 20) continue;
  let dominante = null, max = 0;
  for (const [tg, n] of e.tipos) if (n > max) { max = n; dominante = tg; }
  const pct = max / e.total;
  if (pct >= 0.8 && dominante !== 'otros') {
    lookup.set(key, dominante);
  }
}
console.log(`   ${lookup.size.toLocaleString('es')} pares (marca,modelo) en lookup (${((Date.now()-t0)/1000).toFixed(1)}s)`);

console.log('\n2) Creando tabla temporal lookup_otros…');
db.exec(`DROP TABLE IF EXISTS temp.lookup_otros`);
db.exec(`CREATE TEMP TABLE lookup_otros (marca TEXT, modelo TEXT, tipo_grupo TEXT, PRIMARY KEY (marca, modelo)) WITHOUT ROWID`);
const insLook = db.prepare(`INSERT INTO temp.lookup_otros (marca, modelo, tipo_grupo) VALUES (?, ?, ?)`);
const txnLook = db.transaction((entries) => { for (const [k, tg] of entries) { const [m, mo] = k.split('||'); insLook.run(m, mo, tg); } });
txnLook([...lookup.entries()]);
console.log(`   ${lookup.size.toLocaleString('es')} filas en lookup_otros`);

function reclasificar(tabla) {
  console.log(`\n3) Reclasificando ${tabla}…`);
  const t = Date.now();
  // stats previo
  const prev = db.prepare(`
    SELECT l.tipo_grupo AS tg, COUNT(*) AS n
    FROM ${tabla} t JOIN temp.lookup_otros l USING (marca, modelo)
    WHERE t.tipo_grupo='otros' AND t.marca <> 'SIN MARCA'
    GROUP BY l.tipo_grupo ORDER BY n DESC
  `).all();
  const total = prev.reduce((s, r) => s + r.n, 0);

  const info = db.prepare(`
    UPDATE ${tabla}
       SET tipo_grupo = (SELECT l.tipo_grupo FROM temp.lookup_otros l
                          WHERE l.marca = ${tabla}.marca AND l.modelo = ${tabla}.modelo)
     WHERE tipo_grupo = 'otros'
       AND marca IS NOT NULL AND marca <> '' AND marca <> 'SIN MARCA'
       AND (marca, modelo) IN (SELECT marca, modelo FROM temp.lookup_otros)
  `).run();

  console.log(`   ${tabla}: ${info.changes.toLocaleString('es')} reclasificados (${((Date.now()-t)/1000).toFixed(1)}s)`);
  for (const r of prev) console.log(`      → ${r.tg.padEnd(18)} ${r.n.toLocaleString('es')}`);
}

reclasificar('matriculaciones');
reclasificar('bajas');

db.close();
console.log('\n✓ listo');
