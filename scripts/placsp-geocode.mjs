/**
 * placsp-geocode.mjs
 *
 * Rellena lat/lon de las ubicaciones que quedaron sin coordenadas tras la
 * extracción Vision. Sin API key ni costo. Estrategia en cascada por ubicación:
 *
 *   1. Si `google_maps_url` es `maps.app.goo.gl/...` → seguir el redirect HTTP
 *      y parsear `@lat,lon` o `!3d{lat}!4d{lon}` de la URL larga de Google Maps.
 *   2. Si `google_maps_url` ya trae `?q=lat,lon` → parsear directamente.
 *   3. Si no hay URL utilizable → consultar Nominatim (OSM) con
 *      "direccion, municipio, España". Rate limit 1.1 req/seg.
 *
 * El script muta los `extraccion.json` y reporta resultados al final.
 *
 * Después de correr esto: ejecutar
 *   node scripts/placsp-llm-apply.mjs --slug=<n>     (por cada slug afectado)
 *   node scripts/placsp-build-json.mjs
 *   node scripts/placsp-auditoria.mjs
 *
 * Usage:
 *   node scripts/placsp-geocode.mjs                  (todos los slugs aplicados)
 *   node scripts/placsp-geocode.mjs --slug=13576641  (solo uno)
 *   node scripts/placsp-geocode.mjs --dry-run        (no escribe archivos)
 */

import fs from 'node:fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const PDF_DIR   = join(ROOT, 'data', 'placsp-pdfs');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const DRY = !!args['dry-run'];
const USER_AGENT = 'CapiraSite-Geocoder/1.0 (ignaciocapurro@gmail.com)';

const slugsTodos = fs.readdirSync(PDF_DIR)
  .filter((d) => fs.existsSync(join(PDF_DIR, d, 'extraccion.json')))
  .sort();
const slugs = args.slug ? [String(args.slug)] : slugsTodos;

console.log(`📍 Geocoder PLACSP — ${slugs.length} slug${slugs.length === 1 ? '' : 's'}${DRY ? ' (dry-run)' : ''}`);
console.log('   Estrategia: maps.app.goo.gl redirect → ?q=lat,lon → Nominatim OSM');
console.log('');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Resuelve `https://maps.app.goo.gl/CODIGO` siguiendo redirects hasta encontrar
 * una URL larga de Google Maps con coords. Las URLs largas tienen patterns:
 *   - `/@<lat>,<lon>,<zoom>z`
 *   - `!3d<lat>!4d<lon>`
 *   - `/place/.../<lat>,<lon>`
 */
async function resolverGooGl(url) {
  try {
    let actual = url;
    for (let i = 0; i < 5; i++) {
      const res = await fetch(actual, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': USER_AGENT } });
      const loc = res.headers.get('location');
      if (loc) { actual = loc.startsWith('http') ? loc : new URL(loc, actual).toString(); continue; }
      // No más redirect; intentar parsear desde la URL final
      break;
    }
    // Patterns en orden de fiabilidad
    const m1 = actual.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m1) return { lat: Number(m1[1]), lon: Number(m1[2]), fuente: `redirect ${actual.slice(0, 70)}…` };
    const m2 = actual.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m2) return { lat: Number(m2[1]), lon: Number(m2[2]), fuente: `redirect ${actual.slice(0, 70)}…` };
    return { error: `no se encontró lat/lon en URL final: ${actual.slice(0, 100)}` };
  } catch (e) {
    return { error: `fetch falló: ${e.message}` };
  }
}

function parsearQDeUrl(url) {
  if (!url) return null;
  const m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!m) return null;
  return { lat: Number(m[1]), lon: Number(m[2]), fuente: 'q=lat,lon en URL' };
}

async function geocodeNominatim(query, municipioEsperado) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=es&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return { error: 'sin resultados' };
    // Si nos pasaron un municipio esperado, filtrar por display_name que lo contenga
    let elegido = arr[0];
    if (municipioEsperado) {
      const muniNorm = municipioEsperado.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const match = arr.find((r) => {
        const dn = (r.display_name ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        return dn.includes(muniNorm);
      });
      if (!match) return { error: `ningún resultado contiene "${municipioEsperado}" (top: ${arr[0].display_name?.slice(0, 80)})` };
      elegido = match;
    }
    return {
      lat: Number(elegido.lat),
      lon: Number(elegido.lon),
      fuente: `Nominatim (${elegido.display_name?.slice(0, 70)}…, importance=${elegido.importance?.toFixed?.(3) ?? '?'})`,
    };
  } catch (e) {
    return { error: `fetch falló: ${e.message}` };
  }
}

function buildQueriesNominatim(u) {
  // Estrategia en cascada: empezamos por la query más específica y vamos
  // simplificando para captar direcciones que Nominatim no indexa con detalle
  // (sótanos, polideportivos, parkings, números fraccionarios, etc.).
  const queries = [];
  // Limpieza base: quitar paréntesis, "Sótano X", "Parking", "Aparcamiento", "esquina con"
  const limpiar = (s) => s
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\b(s[óo]tano|nivel|planta)\s*-?\d+/gi, '')
    .replace(/\b(parking|aparcamiento|p\.?subterr[áa]neo)\b/gi, '')
    .replace(/\besquina\s+con\b.*$/gi, '')
    .replace(/\bnº?\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (u.direccion) {
    const dir = limpiar(u.direccion);
    if (u.municipio) queries.push(`${dir}, ${u.municipio}, España`);
    queries.push(`${dir}, España`);
    // Versión sin número (calle pelada)
    const dirSinNum = dir.replace(/,?\s*\d+\s*[a-zA-Z]?\s*$/, '').trim();
    if (dirSinNum && dirSinNum !== dir) {
      if (u.municipio) queries.push(`${dirSinNum}, ${u.municipio}, España`);
    }
  }
  if (u.nombre && u.municipio) {
    const nom = limpiar(u.nombre.replace(/^[Pp]unto de [Rr]ecarga\s*\d+\s*-?\s*/, ''));
    queries.push(`${nom}, ${u.municipio}, España`);
  }
  // Último recurso: solo municipio (centroide)
  if (u.municipio) queries.push(`${u.municipio}, España`);

  // Dedupe preservando orden
  return Array.from(new Set(queries));
}

let totalConCoord    = 0;
let totalSinCoord    = 0;
let totalResueltas   = 0;
let totalGooGl       = 0;
let totalNominatim   = 0;
let totalQ           = 0;
let totalFallidas    = 0;
const slugsAfectados = new Set();
const fallos         = [];

for (const slug of slugs) {
  const jsonPath = join(PDF_DIR, slug, 'extraccion.json');
  if (!fs.existsSync(jsonPath)) continue;
  const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const ubis = j.ubicaciones ?? [];
  if (ubis.length === 0) continue;

  let mod = false;
  for (let i = 0; i < ubis.length; i++) {
    const u = ubis[i];
    const tieneCoord = u.latitud != null && u.longitud != null;
    if (tieneCoord) { totalConCoord++; continue; }
    totalSinCoord++;

    let resultado = null;

    // 1) ?q=lat,lon
    if (u.google_maps_url) {
      const r = parsearQDeUrl(u.google_maps_url);
      if (r) { resultado = r; totalQ++; }
    }
    // 2) maps.app.goo.gl redirect
    if (!resultado && u.google_maps_url && /maps\.app\.goo\.gl/.test(u.google_maps_url)) {
      const r = await resolverGooGl(u.google_maps_url);
      if (!r.error) { resultado = r; totalGooGl++; }
      else fallos.push(`${slug} #${i + 1} ${u.nombre?.slice(0, 50)}: goo.gl ${r.error}`);
      await sleep(300);
    }
    // 3) Nominatim — cascada de queries (de más específica a más general).
    // Validamos que el resultado caiga DENTRO del municipio esperado para evitar
    // matches en otra ciudad por homonimia de calles.
    if (!resultado) {
      const queries = buildQueriesNominatim(u);
      let usado = null;
      for (const q of queries) {
        // Sólo el query "municipio, España" no exige verificación (es el centroide).
        const esCentroide = q.split(',').length <= 2 && u.municipio && q.toLowerCase().startsWith(u.municipio.toLowerCase());
        const r = await geocodeNominatim(q, esCentroide ? null : u.municipio);
        await sleep(1200);
        if (!r.error) { resultado = { ...r, fuente: `${r.fuente} | q="${q}"` }; usado = q; totalNominatim++; break; }
      }
      if (!resultado) fallos.push(`${slug} #${i + 1} ${u.nombre?.slice(0, 50)}: nominatim sin match en ${queries.length} queries (último: "${queries[queries.length - 1]}")`);
      else if (queries.indexOf(usado) === queries.length - 1 && usado.split(',').length <= 2) {
        resultado.fuente = `[centroide municipio] ${resultado.fuente}`;
      }
    }

    if (resultado) {
      u.latitud  = resultado.lat;
      u.longitud = resultado.lon;
      // Preserva nota de la fuente para auditoría
      const nota = `[geocode] ${resultado.fuente}`;
      u._geocode_fuente = nota;
      // Si NO había google_maps_url o solo era un search, ahora lo upgradeamos a ?q=lat,lon
      if (!u.google_maps_url || /search\?api=1/.test(u.google_maps_url)) {
        u.google_maps_url = `https://www.google.com/maps?q=${resultado.lat},${resultado.lon}`;
      }
      totalResueltas++;
      mod = true;
      console.log(`   ✅ ${slug} #${i + 1} ${u.nombre?.slice(0, 50)} → ${resultado.lat.toFixed(5)}, ${resultado.lon.toFixed(5)} (${resultado.fuente.slice(0, 60)})`);
    } else {
      totalFallidas++;
      console.log(`   ❌ ${slug} #${i + 1} ${u.nombre?.slice(0, 50)} — sin match`);
    }
  }

  if (mod && !DRY) {
    fs.writeFileSync(jsonPath, JSON.stringify(j, null, 2) + '\n');
    slugsAfectados.add(slug);
  }
}

console.log('');
console.log('─── Resumen ────────────────────────────────────────────');
console.log(`   Ya tenían coords:        ${totalConCoord}`);
console.log(`   Sin coords (target):     ${totalSinCoord}`);
console.log(`   ✅ Resueltas:            ${totalResueltas}`);
console.log(`      · ?q=lat,lon URL:     ${totalQ}`);
console.log(`      · maps.app.goo.gl:    ${totalGooGl}`);
console.log(`      · Nominatim:          ${totalNominatim}`);
console.log(`   ❌ Fallidas:             ${totalFallidas}`);
console.log('');
if (fallos.length > 0) {
  console.log('─── Fallos detallados ───────────────────────────────────');
  for (const f of fallos.slice(0, 20)) console.log('   ' + f);
  if (fallos.length > 20) console.log(`   … y ${fallos.length - 20} más`);
  console.log('');
}
if (slugsAfectados.size > 0 && !DRY) {
  console.log('─── Próximos pasos ──────────────────────────────────────');
  for (const s of slugsAfectados) console.log(`   node scripts/placsp-llm-apply.mjs --slug=${s}`);
  console.log(`   node scripts/placsp-build-json.mjs`);
  console.log(`   node scripts/placsp-auditoria.mjs`);
}
