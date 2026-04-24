/**
 * Sync de CPOs (operadores de carga) desde mapareve.es → SQLite.
 *
 * Endpoint: GET /api/external/v1/cpos?date_from=...&page=N&limit=100
 *
 * Características:
 *   - Throttling configurable (MAPAREVE_THROTTLE_MS, default 10s)
 *   - Backoff exponencial en 429 (30s → 2min → 10min → abort)
 *   - Checkpoint por página en sync_state (para reanudar si falla)
 *   - Upsert por party_id
 *   - Modo incremental: si ya hay sync previo, usa date_from=last_success
 *
 * Uso:
 *   node scripts/infra-sync-cpos.mjs
 *   node scripts/infra-sync-cpos.mjs --full     # fuerza sync completo (ignora checkpoint)
 *   node scripts/infra-sync-cpos.mjs --dry-run  # no escribe en DB
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'infraestructura.db');
const ENV_FILE  = join(__dirname, '..', '.env.local');

// ─── Carga de variables de entorno (simple, sin dependencia extra) ──
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const API_BASE    = 'https://www.mapareve.es/api/external/v1';
const API_KEY     = process.env.MAPAREVE_API_KEY;
const THROTTLE_MS = parseInt(process.env.MAPAREVE_THROTTLE_MS || '10000', 10);
const LIMIT       = 100;
const MAX_PAGES   = 50;  // hard cap de seguridad

const FULL_SYNC = process.argv.includes('--full');
const DRY_RUN   = process.argv.includes('--dry-run');

if (!API_KEY) {
  console.error('❌ Falta MAPAREVE_API_KEY en .env.local');
  process.exit(1);
}
if (!existsSync(DB_FILE)) {
  console.error(`❌ Base no encontrada: ${DB_FILE}\n   Ejecutá: node scripts/infra-init-db.mjs`);
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchPage(page, dateFrom = null) {
  const url = new URL(`${API_BASE}/cpos`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(LIMIT));
  if (dateFrom) url.searchParams.set('date_from', dateFrom);

  const res = await fetch(url, {
    headers: { 'x-api-key': API_KEY, 'Accept': 'application/json' },
  });

  return { status: res.status, body: await res.text() };
}

// Backoff exponencial: 30s → 2min → 10min → abort
const BACKOFF_STEPS = [30_000, 120_000, 600_000];

async function fetchWithBackoff(page, dateFrom) {
  for (let attempt = 0; attempt <= BACKOFF_STEPS.length; attempt++) {
    const { status, body } = await fetchPage(page, dateFrom);

    if (status === 200) {
      try { return JSON.parse(body); }
      catch { throw new Error(`Respuesta no es JSON válido (page=${page}): ${body.slice(0, 200)}`); }
    }

    if (status === 429 || body.includes('Retry later')) {
      if (attempt === BACKOFF_STEPS.length) {
        throw new Error(`Rate limit persistente en page=${page} tras ${BACKOFF_STEPS.length} reintentos. Abortando.`);
      }
      const wait = BACKOFF_STEPS[attempt];
      console.warn(`  ⏳ 429 en page=${page}, esperando ${wait/1000}s (intento ${attempt + 1}/${BACKOFF_STEPS.length})...`);
      await sleep(wait);
      continue;
    }

    throw new Error(`HTTP ${status} en page=${page}: ${body.slice(0, 200)}`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log(`🔌 Sync CPOs — mapareve.es`);
  console.log(`   throttle: ${THROTTLE_MS}ms | limit: ${LIMIT} | ${DRY_RUN ? 'DRY RUN' : 'escribiendo en DB'}`);

  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Determinar date_from
  let dateFrom = null;
  if (!FULL_SYNC) {
    const prev = db.prepare(`SELECT last_success_at FROM sync_state WHERE endpoint = 'cpos'`).get();
    if (prev?.last_success_at) {
      dateFrom = prev.last_success_at;
      console.log(`   modo incremental: date_from=${dateFrom}`);
    } else {
      console.log(`   primera corrida: sync completo`);
    }
  } else {
    console.log(`   --full: sync completo (ignorando checkpoint)`);
  }

  const startedAt = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT INTO cpos (id, party_id, cif, name, address, country, region, state, city, city_code,
                      postal_code, phone, website, last_updated, confirmed_at, synced_at)
    VALUES (@id, @party_id, @cif, @name, @address, @country, @region, @state, @city, @city_code,
            @postal_code, @phone, @website, @last_updated, @confirmed_at, @synced_at)
    ON CONFLICT(id) DO UPDATE SET
      party_id=@party_id, cif=@cif, name=@name, address=@address,
      country=@country, region=@region, state=@state, city=@city, city_code=@city_code,
      postal_code=@postal_code, phone=@phone, website=@website,
      last_updated=@last_updated, confirmed_at=@confirmed_at, synced_at=@synced_at
  `);

  const updateSyncState = db.prepare(`
    INSERT INTO sync_state (endpoint, last_page, last_synced_at, last_success_at, total_records, notes)
    VALUES ('cpos', @last_page, @last_synced_at, @last_success_at, @total_records, @notes)
    ON CONFLICT(endpoint) DO UPDATE SET
      last_page=@last_page, last_synced_at=@last_synced_at,
      last_success_at=COALESCE(@last_success_at, last_success_at),
      total_records=@total_records, notes=@notes
  `);

  let page = 1;
  let totalRecords = 0;
  let success = false;
  let errorMsg = null;

  try {
    while (page <= MAX_PAGES) {
      console.log(`  → page ${page}...`);
      const rows = await fetchWithBackoff(page, dateFrom);

      if (!Array.isArray(rows)) {
        throw new Error(`Respuesta no es array (page=${page}): ${JSON.stringify(rows).slice(0, 200)}`);
      }

      const syncedAt = new Date().toISOString();

      if (!DRY_RUN && rows.length > 0) {
        const insertAll = db.transaction((items) => {
          for (const c of items) {
            upsert.run({
              id:           c.id,
              party_id:     c.party_id ?? null,
              cif:          c.cif ?? null,
              name:         c.name ?? null,
              address:      c.address ?? null,
              country:      c.country ?? null,
              region:       c.region ?? null,
              state:        c.state ?? null,
              city:         c.city ?? null,
              city_code:    c.city_code ?? null,
              postal_code:  c.postal_code ?? null,
              phone:        c.phone ?? null,
              website:      c.website ?? null,
              last_updated: c.last_updated ?? null,
              confirmed_at: c.confirmed_at ?? null,
              synced_at:    syncedAt,
            });
          }
        });
        insertAll(rows);
      }

      totalRecords += rows.length;
      console.log(`    ✓ ${rows.length} CPOs (acumulado: ${totalRecords})`);

      if (!DRY_RUN) {
        updateSyncState.run({
          last_page: page,
          last_synced_at: syncedAt,
          last_success_at: null,  // solo se actualiza al final del sync completo
          total_records: totalRecords,
          notes: `en progreso, última página OK: ${page}`,
        });
      }

      if (rows.length < LIMIT) {
        success = true;
        break;
      }

      page++;
      if (page <= MAX_PAGES) await sleep(THROTTLE_MS);
    }

    if (!success && page > MAX_PAGES) {
      throw new Error(`Cap de ${MAX_PAGES} páginas alcanzado. Revisar — posible loop infinito.`);
    }
  } catch (err) {
    errorMsg = err.message;
    console.error(`\n❌ ${err.message}`);
  }

  // Cierre: actualizar sync_state según resultado
  const endedAt = new Date().toISOString();
  if (!DRY_RUN) {
    updateSyncState.run({
      last_page: page,
      last_synced_at: endedAt,
      last_success_at: success ? endedAt : null,
      total_records: totalRecords,
      notes: success ? `OK — ${totalRecords} registros` : `ERROR: ${errorMsg}`,
    });
  }

  db.close();

  if (success) {
    console.log(`\n✅ Sync completado: ${totalRecords} CPOs en ${page} páginas`);
    console.log(`   Iniciado: ${startedAt}`);
    console.log(`   Finalizado: ${endedAt}`);
  } else {
    console.error(`\n⚠️  Sync incompleto. Última página OK: ${page - 1}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
