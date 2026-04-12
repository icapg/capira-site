/**
 * dgt-fix-cod-tipo.cjs
 * Corrige tipo_vehiculo y tipo_grupo para cod_tipo 40 y 50
 * en las tablas matriculaciones Y bajas.
 *
 *   cod_tipo 40 → turismo (no remolque_ligero)
 *   cod_tipo 50 → ciclomotor (no tractor_agricola)
 *
 * Ejecutar UNA VEZ (afecta ambas tablas):
 *   node scripts/dgt-fix-cod-tipo.cjs
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

console.log('Verificando registros afectados...');
const n40 = db.prepare("SELECT COUNT(*) as n FROM matriculaciones WHERE cod_tipo='40'").get().n;
const n50 = db.prepare("SELECT COUNT(*) as n FROM matriculaciones WHERE cod_tipo='50'").get().n;
console.log(`  cod_tipo=40: ${n40.toLocaleString()} registros`);
console.log(`  cod_tipo=50: ${n50.toLocaleString()} registros`);

const fix = db.transaction(() => {
  let total = 0;

  // ── matriculaciones ──────────────────────────────────────────────────────
  console.log('\n🔧 Corrigiendo tabla matriculaciones...');
  const m40 = db.prepare(
    "UPDATE matriculaciones SET tipo_vehiculo='turismo', tipo_grupo='turismo' WHERE cod_tipo='40'"
  ).run();
  console.log(`✓ cod_tipo=40: ${m40.changes.toLocaleString()} registros → turismo`);

  const m50 = db.prepare(
    "UPDATE matriculaciones SET tipo_vehiculo='ciclomotor', tipo_grupo='moto' WHERE cod_tipo='50'"
  ).run();
  console.log(`✓ cod_tipo=50: ${m50.changes.toLocaleString()} registros → ciclomotor/moto`);
  total += m40.changes + m50.changes;

  // ── bajas ─────────────────────────────────────────────────────────────────
  console.log('\n🔧 Corrigiendo tabla bajas...');
  const b40 = db.prepare(
    "UPDATE bajas SET tipo_vehiculo='turismo', tipo_grupo='turismo' WHERE cod_tipo='40'"
  ).run();
  console.log(`✓ cod_tipo=40: ${b40.changes.toLocaleString()} registros → turismo`);

  const b50 = db.prepare(
    "UPDATE bajas SET tipo_vehiculo='ciclomotor', tipo_grupo='moto' WHERE cod_tipo='50'"
  ).run();
  console.log(`✓ cod_tipo=50: ${b50.changes.toLocaleString()} registros → ciclomotor/moto`);
  total += b40.changes + b50.changes;

  return total;
});

const total = fix();
console.log(`\n✅ ${total.toLocaleString()} registros actualizados en total`);

// Verificar resultado
console.log('\nVerificación post-fix (matriculaciones):');
db.prepare("SELECT tipo_grupo, COUNT(*) as n FROM matriculaciones WHERE cod_tipo IN ('40','50') GROUP BY tipo_grupo ORDER BY n DESC").all()
  .forEach(r => console.log(`  tipo_grupo=${r.tipo_grupo} → ${r.n.toLocaleString()}`));

console.log('\nVerificación post-fix (bajas):');
db.prepare("SELECT tipo_grupo, COUNT(*) as n FROM bajas WHERE cod_tipo IN ('40','50') GROUP BY tipo_grupo ORDER BY n DESC").all()
  .forEach(r => console.log(`  tipo_grupo=${r.tipo_grupo} → ${r.n.toLocaleString()}`));

db.close();
console.log('\nAhora regenerá las agregaciones:');
console.log('  node scripts/dgt-matriculaciones.mjs --solo-agregar');
