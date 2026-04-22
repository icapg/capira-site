/**
 * Fix 2026-04-22 — elimina la categoría `suv_todo_terreno` del aggregate
 * `parque_agregados_mes` del periodo 202503. Era residuo de un clasificador
 * viejo. El clasificador actual mete todos los M1/M1G en `turismo`, por lo
 * que los 1540 vehículos (y todas las claves derivadas) se suman a turismo.
 *
 * No hace falta modificar `parque` (tabla fila-a-fila): ahí ya no existen
 * registros con tipo_grupo='suv_todo_terreno' (0 filas).
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

const periodos = db.prepare(`
  SELECT DISTINCT periodo FROM parque_agregados_mes
  WHERE clave LIKE '%suv_todo_terreno%'
  ORDER BY periodo
`).all().map(r => r.periodo);
console.log(`Periodos a limpiar: ${periodos.join(', ')}`);

const upsert = db.prepare(`
  INSERT INTO parque_agregados_mes (periodo, clave, n) VALUES (?, ?, ?)
  ON CONFLICT (periodo, clave) DO UPDATE SET n = n + excluded.n
`);
const del = db.prepare(`DELETE FROM parque_agregados_mes WHERE periodo = ? AND clave = ?`);

const tx = db.transaction(() => {
  let totalMoved = 0;
  for (const PERIODO of periodos) {
    const suvRows = db.prepare(`
      SELECT clave, n FROM parque_agregados_mes
      WHERE periodo = ? AND clave LIKE '%suv_todo_terreno%'
    `).all(PERIODO);
    for (const r of suvRows) {
      const turismoClave = r.clave.replace('suv_todo_terreno', 'turismo');
      upsert.run(PERIODO, turismoClave, r.n);
      del.run(PERIODO, r.clave);
      totalMoved++;
    }
  }
  return totalMoved;
});

const moved = tx();
console.log(`Migradas ${moved} filas a turismo equivalent en ${periodos.length} periodos. suv_todo_terreno eliminado.`);

const check = db.prepare(`
  SELECT COUNT(*) AS n FROM parque_agregados_mes
  WHERE clave LIKE '%suv_todo_terreno%'
`).get();
console.log(`Verificación — filas residuales suv_todo_terreno: ${check.n} (debería ser 0)`);

const turismoSample = db.prepare(`SELECT periodo, n FROM parque_agregados_mes WHERE clave='TIPO:turismo' ORDER BY periodo`).all();
console.log(`TIPO:turismo por periodo tras merge:`);
for (const r of turismoSample) console.log(`  ${r.periodo}: ${r.n.toLocaleString('es')}`);

db.close();
console.log('✓ listo');
