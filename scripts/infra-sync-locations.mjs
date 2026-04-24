/**
 * Sync de locations + evses + connectors desde mapareve.es → SQLite.
 *
 * Endpoint: GET /api/external/v1/locations?date_from=...&page=N&limit=100
 * Devuelve locations con evses y connectors anidados → popula las 3 tablas.
 *
 * Características:
 *   - Throttling configurable (MAPAREVE_THROTTLE_MS, default 10s)
 *   - Backoff exponencial en 429 (30s → 2min → 10min → abort)
 *   - Checkpoint por página en sync_state (reanudable)
 *   - Upsert por id (idempotente)
 *   - Modo incremental: si ya hay sync previo, date_from=last_success
 *   - --max-pages=N para limitar (testing)
 *
 * Uso:
 *   node scripts/infra-sync-locations.mjs --max-pages=2   # prueba 200 locations
 *   node scripts/infra-sync-locations.mjs                 # incremental
 *   node scripts/infra-sync-locations.mjs --full          # sync completo
 *   node scripts/infra-sync-locations.mjs --dry-run       # sin escribir
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'infraestructura.db');
const ENV_FILE  = join(__dirname, '..', '.env.local');

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
const HARD_CAP    = 500;  // seguridad absoluta

const FULL_SYNC = process.argv.includes('--full');
const DRY_RUN   = process.argv.includes('--dry-run');
const maxArg    = process.argv.find(a => a.startsWith('--max-pages='));
const MAX_PAGES = maxArg ? parseInt(maxArg.split('=')[1], 10) : HARD_CAP;

if (!API_KEY) {
  console.error('❌ Falta MAPAREVE_API_KEY en .env.local');
  process.exit(1);
}
if (!existsSync(DB_FILE)) {
  console.error(`❌ Base no encontrada: ${DB_FILE}`);
  process.exit(1);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchPage(page, dateFrom = null) {
  const url = new URL(`${API_BASE}/locations`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(LIMIT));
  if (dateFrom) url.searchParams.set('date_from', dateFrom);

  const res = await fetch(url, {
    headers: { 'x-api-key': API_KEY, 'Accept': 'application/json' },
  });
  return { status: res.status, body: await res.text() };
}

const BACKOFF_STEPS = [30_000, 120_000, 600_000];

async function fetchWithBackoff(page, dateFrom) {
  for (let attempt = 0; attempt <= BACKOFF_STEPS.length; attempt++) {
    const { status, body } = await fetchPage(page, dateFrom);

    if (status === 200) {
      try { return JSON.parse(body); }
      catch { throw new Error(`JSON inválido (page=${page}): ${body.slice(0, 200)}`); }
    }

    if (status === 429 || body.includes('Retry later')) {
      if (attempt === BACKOFF_STEPS.length) {
        throw new Error(`Rate limit persistente en page=${page}. Abortando.`);
      }
      const wait = BACKOFF_STEPS[attempt];
      console.warn(`  ⏳ 429 en page=${page}, esperando ${wait/1000}s (intento ${attempt + 1}/${BACKOFF_STEPS.length})...`);
      await sleep(wait);
      continue;
    }

    throw new Error(`HTTP ${status} en page=${page}: ${body.slice(0, 200)}`);
  }
}

async function main() {
  console.log(`🔌 Sync locations+evses+connectors — mapareve.es`);
  console.log(`   throttle: ${THROTTLE_MS}ms | limit: ${LIMIT} | max-pages: ${MAX_PAGES} | ${DRY_RUN ? 'DRY RUN' : 'escribiendo en DB'}`);

  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  let dateFrom = null;
  if (!FULL_SYNC) {
    const prev = db.prepare(`SELECT last_success_at FROM sync_state WHERE endpoint = 'locations'`).get();
    if (prev?.last_success_at) {
      dateFrom = prev.last_success_at;
      console.log(`   modo incremental: date_from=${dateFrom}`);
    } else {
      console.log(`   primera corrida: sync completo`);
    }
  } else {
    console.log(`   --full: sync completo`);
  }

  const upsertLocation = db.prepare(`
    INSERT INTO locations (id, country_code, party_id, cpo_name, version, name, address, city,
                           postal_code, region, state, country, lat, lon, parking_type, owner,
                           facilities, time_zone, opening_times, charging_when_closed, directions,
                           last_updated, synced_at)
    VALUES (@id, @country_code, @party_id, @cpo_name, @version, @name, @address, @city,
            @postal_code, @region, @state, @country, @lat, @lon, @parking_type, @owner,
            @facilities, @time_zone, @opening_times, @charging_when_closed, @directions,
            @last_updated, @synced_at)
    ON CONFLICT(id) DO UPDATE SET
      country_code=@country_code, party_id=@party_id, cpo_name=@cpo_name, version=@version,
      name=@name, address=@address, city=@city, postal_code=@postal_code,
      region=@region, state=@state, country=@country, lat=@lat, lon=@lon,
      parking_type=@parking_type, owner=@owner, facilities=@facilities, time_zone=@time_zone,
      opening_times=@opening_times, charging_when_closed=@charging_when_closed,
      directions=@directions, last_updated=@last_updated, synced_at=@synced_at
  `);

  const upsertEvse = db.prepare(`
    INSERT INTO evses (id, evse_id, location_id, accessibility, capabilities, floor_level,
                       lat, lon, physical_reference, directions, last_static_updated, synced_at)
    VALUES (@id, @evse_id, @location_id, @accessibility, @capabilities, @floor_level,
            @lat, @lon, @physical_reference, @directions, @last_static_updated, @synced_at)
    ON CONFLICT(id) DO UPDATE SET
      evse_id=@evse_id, location_id=@location_id, accessibility=@accessibility,
      capabilities=@capabilities, floor_level=@floor_level, lat=@lat, lon=@lon,
      physical_reference=@physical_reference, directions=@directions,
      last_static_updated=@last_static_updated, synced_at=@synced_at
  `);

  const upsertConnector = db.prepare(`
    INSERT INTO connectors (id, evse_id, standard, format, power_type, max_electric_power,
                            max_voltage, max_amperage, last_static_updated, synced_at)
    VALUES (@id, @evse_id, @standard, @format, @power_type, @max_electric_power,
            @max_voltage, @max_amperage, @last_static_updated, @synced_at)
    ON CONFLICT(id) DO UPDATE SET
      evse_id=@evse_id, standard=@standard, format=@format, power_type=@power_type,
      max_electric_power=@max_electric_power, max_voltage=@max_voltage,
      max_amperage=@max_amperage, last_static_updated=@last_static_updated,
      synced_at=@synced_at
  `);

  const updateSyncState = db.prepare(`
    INSERT INTO sync_state (endpoint, last_page, last_synced_at, last_success_at, total_records, notes)
    VALUES ('locations', @last_page, @last_synced_at, @last_success_at, @total_records, @notes)
    ON CONFLICT(endpoint) DO UPDATE SET
      last_page=@last_page, last_synced_at=@last_synced_at,
      last_success_at=COALESCE(@last_success_at, last_success_at),
      total_records=@total_records, notes=@notes
  `);

  let page = 1;
  let totalLocations = 0;
  let totalEvses = 0;
  let totalConnectors = 0;
  let success = false;
  let errorMsg = null;
  const startedAt = new Date().toISOString();

  try {
    while (page <= MAX_PAGES) {
      console.log(`  → page ${page}...`);
      const rows = await fetchWithBackoff(page, dateFrom);

      if (!Array.isArray(rows)) {
        throw new Error(`Respuesta no es array (page=${page}): ${JSON.stringify(rows).slice(0, 200)}`);
      }

      const syncedAt = new Date().toISOString();
      let pageEvses = 0;
      let pageConnectors = 0;

      if (!DRY_RUN && rows.length > 0) {
        const insertAll = db.transaction((locations) => {
          for (const loc of locations) {
            const lat = loc.coordinates?.latitude ? parseFloat(loc.coordinates.latitude) : null;
            const lon = loc.coordinates?.longitude ? parseFloat(loc.coordinates.longitude) : null;

            upsertLocation.run({
              id:                   loc.id,
              country_code:         loc.country_code ?? null,
              party_id:             loc.party_id ?? null,
              cpo_name:             loc.cpo_name ?? null,
              version:              loc.version ?? null,
              name:                 loc.name ?? null,
              address:              loc.address ?? null,
              city:                 loc.city ?? null,
              postal_code:          loc.postal_code ?? null,
              region:               loc.region ?? null,
              state:                loc.state ?? null,
              country:              loc.country ?? null,
              lat,
              lon,
              parking_type:         loc.parking_type ?? null,
              owner:                loc.owner ? JSON.stringify(loc.owner) : null,
              facilities:           loc.facilities ? JSON.stringify(loc.facilities) : null,
              time_zone:            loc.time_zone ?? null,
              opening_times:        loc.opening_times ? JSON.stringify(loc.opening_times) : null,
              charging_when_closed: loc.charging_when_closed == null ? null : (loc.charging_when_closed ? 1 : 0),
              directions:           loc.directions ? JSON.stringify(loc.directions) : null,
              last_updated:         loc.last_updated ?? null,
              synced_at:            syncedAt,
            });

            for (const ev of loc.evses || []) {
              const evLat = ev.coordinates?.latitude ? parseFloat(ev.coordinates.latitude) : null;
              const evLon = ev.coordinates?.longitude ? parseFloat(ev.coordinates.longitude) : null;

              upsertEvse.run({
                id:                  ev.id,
                evse_id:             ev.evse_id ?? null,
                location_id:         loc.id,
                accessibility:       ev.accessibility ?? null,
                capabilities:        ev.capabilities ? JSON.stringify(ev.capabilities) : null,
                floor_level:         ev.floor_level ?? null,
                lat:                 evLat,
                lon:                 evLon,
                physical_reference:  ev.physical_reference ?? null,
                directions:          ev.directions ? JSON.stringify(ev.directions) : null,
                last_static_updated: ev.last_static_updated ?? null,
                synced_at:           syncedAt,
              });
              pageEvses++;

              for (const co of ev.connectors || []) {
                upsertConnector.run({
                  id:                  co.id,
                  evse_id:             ev.id,
                  standard:            co.standard ?? null,
                  format:              co.format ?? null,
                  power_type:          co.power_type ?? null,
                  max_electric_power:  co.max_electric_power ?? null,
                  max_voltage:         co.max_voltage ?? null,
                  max_amperage:        co.max_amperage ?? null,
                  last_static_updated: co.last_static_updated ?? null,
                  synced_at:           syncedAt,
                });
                pageConnectors++;
              }
            }
          }
        });
        insertAll(rows);
      } else if (DRY_RUN) {
        for (const loc of rows) {
          for (const ev of loc.evses || []) {
            pageEvses++;
            pageConnectors += (ev.connectors || []).length;
          }
        }
      }

      totalLocations  += rows.length;
      totalEvses      += pageEvses;
      totalConnectors += pageConnectors;
      console.log(`    ✓ ${rows.length} locs, ${pageEvses} evses, ${pageConnectors} conns (acum: ${totalLocations}/${totalEvses}/${totalConnectors})`);

      if (!DRY_RUN) {
        updateSyncState.run({
          last_page: page,
          last_synced_at: syncedAt,
          last_success_at: null,
          total_records: totalLocations,
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

    // Si llegamos al límite por --max-pages pero la página era completa, no es fracaso
    // — es un stop intencional. Marcamos como "parcial exitoso" solo si fue --max-pages.
    if (!success && page > MAX_PAGES && MAX_PAGES < HARD_CAP) {
      console.log(`  ⏸  stop por --max-pages=${MAX_PAGES} (probablemente hay más páginas)`);
    } else if (!success && page > HARD_CAP) {
      throw new Error(`Hard cap de ${HARD_CAP} páginas alcanzado. Revisar.`);
    }
  } catch (err) {
    errorMsg = err.message;
    console.error(`\n❌ ${err.message}`);
  }

  const endedAt = new Date().toISOString();
  if (!DRY_RUN) {
    updateSyncState.run({
      last_page: page,
      last_synced_at: endedAt,
      last_success_at: success ? endedAt : null,
      total_records: totalLocations,
      notes: success
        ? `OK — ${totalLocations} locs, ${totalEvses} evses, ${totalConnectors} conns`
        : errorMsg
          ? `ERROR: ${errorMsg}`
          : `PARCIAL (--max-pages): ${totalLocations} locs, ${totalEvses} evses, ${totalConnectors} conns`,
    });
  }

  db.close();

  if (success) {
    console.log(`\n✅ Sync completo: ${totalLocations} locations, ${totalEvses} EVSEs, ${totalConnectors} connectors`);
    console.log(`   Iniciado: ${startedAt}`);
    console.log(`   Finalizado: ${endedAt}`);
  } else if (errorMsg) {
    console.error(`\n⚠️  Sync incompleto. Última página OK: ${page - 1}`);
    process.exit(1);
  } else {
    console.log(`\n⏸  Sync parcial (--max-pages): ${totalLocations} locs, ${totalEvses} evses, ${totalConnectors} conns`);
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
