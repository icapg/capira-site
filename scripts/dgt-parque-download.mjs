/**
 * dgt-parque-download.mjs
 * Descarga los ZIP mensuales del Parque de Vehículos de la DGT.
 *
 * Uso:
 *   node scripts/dgt-parque-download.mjs              # descarga faltantes abr-2025 → feb-2026
 *   node scripts/dgt-parque-download.mjs 202504 202505 ...   # meses específicos
 *
 * Fuente: https://www.dgt.es/microdatos/Parque/parque_vehiculos_YYYYMM.zip
 */

import { createWriteStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'data');

const DEFAULT_MONTHS = [
  '202504', '202505', '202506', '202507', '202508', '202509',
  '202510', '202511', '202512', '202601', '202602',
];

function fmtBytes(n) {
  const u = ['B','KB','MB','GB'];
  let i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(2)} ${u[i]}`;
}

async function downloadOne(periodo) {
  const file = `parque_vehiculos_${periodo}.zip`;
  const out  = join(DATA_DIR, file);
  const url  = `https://www.dgt.es/microdatos/Parque/${file}`;

  if (existsSync(out) && statSync(out).size > 100_000_000) {
    console.log(`[skip] ${file} ya existe (${fmtBytes(statSync(out).size)})`);
    return;
  }

  console.log(`[get ] ${url}`);
  const started = Date.now();
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[fail] ${file} → HTTP ${res.status}`);
    return;
  }
  const total = Number(res.headers.get('content-length') || 0);
  let loaded = 0;
  let lastLog = Date.now();
  const reader = res.body.getReader();
  const sink = createWriteStream(out);

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    loaded += value.length;
    sink.write(value);
    if (Date.now() - lastLog > 3000) {
      const pct = total ? ((loaded / total) * 100).toFixed(1) : '?';
      process.stdout.write(`      ${file}  ${fmtBytes(loaded)}${total ? `/${fmtBytes(total)}` : ''}  ${pct}%\r`);
      lastLog = Date.now();
    }
  }
  sink.end();
  await new Promise((res, rej) => sink.on('finish', res).on('error', rej));
  const secs = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`\n[ok  ] ${file}  (${fmtBytes(loaded)} en ${secs}s)`);
}

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const args = process.argv.slice(2);
  const periodos = args.length ? args : DEFAULT_MONTHS;
  console.log(`Descargando ${periodos.length} ZIP(s): ${periodos.join(', ')}`);
  for (const p of periodos) {
    try { await downloadOne(p); }
    catch (err) { console.error(`[err ] ${p}: ${err.message}`); }
  }
  console.log('Listo.');
}

main();
