/**
 * PLACSP downloader
 *
 * Descarga los ZIPs mensuales de Atom del feed oficial:
 *   https://contrataciondelestado.es/sindicacion/sindicacion_643/
 *     licitacionesPerfilesContratanteCompleto3_YYYYMM.zip
 *
 * Window: 2018-01 → current month (configurable via --from / --to).
 * Idempotent: skips files whose local size matches the remote Content-Length.
 *
 * Usage:
 *   node scripts/placsp-download.mjs               # full 2018→now
 *   node scripts/placsp-download.mjs --from=2024-01 --to=2024-12
 *   node scripts/placsp-download.mjs --only-head   # only the "latest" atom (delta)
 */

import fs   from 'node:fs';
import path from 'node:path';
import http from 'node:https';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR   = path.join(__dirname, '..', 'data', 'placsp-raw');
const BASE_URL  = 'https://contrataciondelestado.es/sindicacion/sindicacion_643';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const FROM = args.from ?? '2018-01';
const TO   = args.to   ?? currentYM();
const HEAD_ONLY = !!args['only-head'];

function currentYM() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthRange(from, to) {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out = [];
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

// The PLACSP server does NOT honor HEAD requests (returns 200 with empty body).
// We use GET for everything. If the file already exists and is "reasonable"
// (> 1 MB and valid zip magic bytes), we skip it. Otherwise we re-download.

function isValidZip(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf[0] === 0x50 && buf[1] === 0x4b; // PK signature
  } catch {
    return false;
  }
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const tmp = destPath + '.part';
    const file = fs.createWriteStream(tmp);
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const contentType = String(res.headers['content-type'] ?? '');
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const size = fs.statSync(tmp).size;
          // Server may respond with HTML error page + status 200.
          if (contentType.includes('text/html') || !isValidZip(tmp)) {
            fs.unlinkSync(tmp);
            return resolve({ ok: false, size, reason: 'not_a_zip' });
          }
          fs.renameSync(tmp, destPath);
          resolve({ ok: true, size });
        });
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

  if (HEAD_ONLY) {
    const url  = `${BASE_URL}/licitacionesPerfilesContratanteCompleto3.atom`;
    const dest = path.join(RAW_DIR, 'licitacionesPerfilesContratanteCompleto3.atom');
    console.log(`[head] downloading delta atom`);
    const res = await download(url, dest);
    if (res.ok) console.log(`  ok  ${(res.size / 1024).toFixed(0)} KB`);
    else        console.log(`  fail: ${res.reason} (${res.size} bytes)`);
    return;
  }

  const months = monthRange(FROM, TO);
  console.log(`Range: ${FROM} → ${TO}  (${months.length} months)`);

  let ok = 0, skipped = 0, failed = 0, totalBytes = 0;
  for (const ym of months) {
    const fname = `licitacionesPerfilesContratanteCompleto3_${ym}.zip`;
    const url   = `${BASE_URL}/${fname}`;
    const dest  = path.join(RAW_DIR, fname);

    // Skip if we already have a valid zip on disk.
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1_000_000 && isValidZip(dest)) {
      console.log(`  ${ym} already present (${mb(fs.statSync(dest).size)})`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`  ${ym} downloading...`);
      const t0 = Date.now();
      const res = await download(url, dest);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      if (!res.ok) {
        console.log(` not-a-zip (${secs}s)`);
        skipped++;
        continue;
      }
      console.log(` ok ${mb(res.size)} (${secs}s)`);
      ok++;
      totalBytes += res.size;
    } catch (e) {
      console.log(` FAIL: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. downloaded=${ok}  skipped=${skipped}  failed=${failed}  total=${mb(totalBytes)}`);
}

function mb(n) { return `${(n / 1024 / 1024).toFixed(1)} MB`; }

main().catch((e) => { console.error(e); process.exit(1); });
