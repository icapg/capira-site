/**
 * dgt-update.mjs
 *
 * Wrapper de actualización mensual DGT.
 * Detecta qué meses faltan, los descarga, regenera los archivos de salida,
 * genera data/dgt-status.json y hace git commit + push para Vercel.
 *
 * DGT publica los datos alrededor del día 15 de cada mes (mes anterior).
 * El Task Scheduler está configurado para correr el día 16.
 *
 * Uso manual:
 *   node scripts/dgt-update.mjs
 *   node scripts/dgt-update.mjs --dry-run    (no escribe ni hace git)
 *   node scripts/dgt-update.mjs --no-push    (commit pero no push)
 */

import Database from 'better-sqlite3';
import { execSync }  from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, '..');
const DB_FILE     = join(ROOT, 'data', 'dgt-matriculaciones.db');
const STATUS_FILE = join(ROOT, 'data', 'dgt-status.json');

const DRY_RUN = process.argv.includes('--dry-run');
const NO_PUSH = process.argv.includes('--no-push') || DRY_RUN;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  if (opts.drySkip) { console.log('    (dry-run, skipped)'); return ''; }
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'inherit', ...opts });
}

/** "YYYY-MM" del mes anterior al actual (último disponible en DGT) */
function mesObjetivo() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMes(periodo) {
  let [y, m] = periodo.split('-').map(Number);
  m++;
  if (m > 12) { m = 1; y++; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/** Lista de periodos entre desde y hasta (inclusive) */
function rangoMeses(desde, hasta) {
  const meses = [];
  let [y, m] = desde.split('-').map(Number);
  const [hy, hm] = hasta.split('-').map(Number);
  while (y < hy || (y === hy && m <= hm)) {
    meses.push(`${y}-${String(m).padStart(2, '0')}`);
    m++; if (m > 12) { m = 1; y++; }
  }
  return meses;
}

function ultimoMesProcesado(db, tabla) {
  try {
    return db.prepare(`SELECT periodo FROM ${tabla} ORDER BY periodo DESC LIMIT 1`).get()?.periodo ?? null;
  } catch { return null; }
}

function countTabla(db, tabla) {
  try { return db.prepare(`SELECT COUNT(*) as n FROM ${tabla}`).get()?.n ?? 0; }
  catch { return 0; }
}

function ultimosMeses(db, tabla, n = 24) {
  try {
    return db.prepare(
      `SELECT periodo, COUNT(*) as total FROM ${tabla}
       GROUP BY periodo ORDER BY periodo DESC LIMIT ?`
    ).all(n);
  } catch { return []; }
}

// ─── Generar dgt-status.json ──────────────────────────────────────────────────

function generarStatus(db, objetivo) {
  console.log('\n📊 Generando data/dgt-status.json...');

  const matUltimo    = ultimoMesProcesado(db, 'meses_procesados');
  const bajasUltimo  = ultimoMesProcesado(db, 'meses_procesados_bajas');
  const matTotal     = countTabla(db, 'matriculaciones');
  const bajasTotal   = countTabla(db, 'bajas');
  const matMeses     = ultimosMeses(db, 'matriculaciones', 24);
  const bajasMeses   = ultimosMeses(db, 'bajas', 24);

  const periodos = [...new Set([
    ...matMeses.map(r => r.periodo),
    ...bajasMeses.map(r => r.periodo),
  ])].sort().reverse();

  const matByP   = Object.fromEntries(matMeses.map(r => [r.periodo, r.total]));
  const bajasByP = Object.fromEntries(bajasMeses.map(r => [r.periodo, r.total]));

  const historial = periodos.map(p => ({
    periodo:         p,
    matriculaciones: matByP[p]   ?? 0,
    bajas:           bajasByP[p] ?? 0,
  }));

  const status = {
    generado_en:       new Date().toISOString(),
    mes_objetivo:      objetivo,
    matriculaciones: {
      ultimo_mes:      matUltimo,
      al_dia:          matUltimo === objetivo,
      total_registros: matTotal,
      total_meses:     countTabla(db, 'meses_procesados'),
    },
    bajas: {
      ultimo_mes:      bajasUltimo,
      al_dia:          bajasUltimo === objetivo,
      total_registros: bajasTotal,
      total_meses:     countTabla(db, 'meses_procesados_bajas'),
    },
    historial,
  };

  if (!DRY_RUN) {
    writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
    console.log('  ✓ Guardado: data/dgt-status.json');
  } else {
    console.log('  (dry-run) dgt-status.json no escrito');
  }

  return status;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔄 DGT Update — ' + new Date().toLocaleString('es-ES'));
  if (DRY_RUN) console.log('   (modo dry-run)\n');

  if (!existsSync(DB_FILE)) {
    console.error('❌ No se encontró la DB. Ejecutá primero:');
    console.error('   node scripts/dgt-matriculaciones.mjs --init');
    console.error('   node scripts/dgt-bajas.mjs --init');
    process.exit(1);
  }

  const db      = new Database(DB_FILE, { readonly: true });
  const objetivo = mesObjetivo();

  const matUltimo   = ultimoMesProcesado(db, 'meses_procesados');
  const bajasUltimo = ultimoMesProcesado(db, 'meses_procesados_bajas');
  db.close();

  console.log(`\n📋 Estado actual:`);
  console.log(`   Matriculaciones → último mes: ${matUltimo   ?? 'ninguno'} ${matUltimo   === objetivo ? '✅' : '⏳'}`);
  console.log(`   Bajas           → último mes: ${bajasUltimo ?? 'ninguno'} ${bajasUltimo === objetivo ? '✅' : '⏳'}`);
  console.log(`   Objetivo (DGT)  → ${objetivo}`);

  const matFaltantes   = matUltimo   ? rangoMeses(nextMes(matUltimo),   objetivo) : [];
  const bajasFaltantes = bajasUltimo ? rangoMeses(nextMes(bajasUltimo), objetivo) : [];

  let hayNovedad = false;

  // ── Matriculaciones ────────────────────────────────────────────────────────
  if (matFaltantes.length === 0) {
    console.log('\n✅ Matriculaciones al día');
  } else {
    console.log(`\n📥 Matriculaciones — ${matFaltantes.length} mes(es) pendiente(s): ${matFaltantes.join(', ')}`);
    for (const mes of matFaltantes) {
      try {
        run(`node scripts/dgt-matriculaciones.mjs --mes=${mes}`, { drySkip: DRY_RUN });
        hayNovedad = true;
      } catch (e) {
        console.error(`  ⚠️  Error en matriculaciones ${mes}: ${e.message}`);
      }
    }
  }

  // ── Bajas ──────────────────────────────────────────────────────────────────
  if (bajasFaltantes.length === 0) {
    console.log('\n✅ Bajas al día');
  } else {
    console.log(`\n📥 Bajas — ${bajasFaltantes.length} mes(es) pendiente(s): ${bajasFaltantes.join(', ')}`);
    for (const mes of bajasFaltantes) {
      try {
        run(`node scripts/dgt-bajas.mjs --mes=${mes}`, { drySkip: DRY_RUN });
        hayNovedad = true;
      } catch (e) {
        console.error(`  ⚠️  Error en bajas ${mes}: ${e.message}`);
      }
    }
  }

  // ── Regenerar JSON/TS ──────────────────────────────────────────────────────
  if (hayNovedad) {
    console.log('\n🔁 Regenerando agregaciones matriculaciones...');
    try { run('node scripts/dgt-matriculaciones.mjs --solo-agregar', { drySkip: DRY_RUN }); } catch {}

    console.log('\n🔁 Regenerando parque activo...');
    try { run('node scripts/dgt-parque.mjs', { drySkip: DRY_RUN }); } catch {}
  }

  // ── Generar status.json siempre ────────────────────────────────────────────
  const db2 = new Database(DB_FILE, { readonly: true });
  generarStatus(db2, objetivo);
  db2.close();

  // ── Git commit + push ──────────────────────────────────────────────────────
  if (!hayNovedad) {
    console.log('\nℹ️  Sin cambios — actualizando solo dgt-status.json');
  }

  console.log('\n📦 Commit...');
  try {
    const archivos = [
      'data/dgt-status.json',
      ...(hayNovedad ? [
        'data/dgt-matriculaciones.json',
        'data/dgt-bajas.json',
        'data/dgt-parque.json',
        'app/lib/insights/dgt-data.ts',
      ] : []),
    ].join(' ');

    const msg = hayNovedad
      ? `data: DGT actualización ${objetivo}`
      : `data: DGT status check ${new Date().toISOString().slice(0, 10)}`;

    run(`git add ${archivos}`, { drySkip: DRY_RUN });
    run(`git commit -m "${msg}"`, { drySkip: DRY_RUN });

    if (!NO_PUSH) {
      run('git push', { drySkip: DRY_RUN });
      console.log('  ✓ Push OK → Vercel deploy en curso');
    } else {
      console.log('  ℹ️  --no-push activo: commit hecho, no pusheado');
    }
  } catch (e) {
    console.error('  ⚠️  Git error:', e.message);
  }

  console.log('\n✅ Update completo.');
}

main().catch(e => { console.error(e); process.exit(1); });
