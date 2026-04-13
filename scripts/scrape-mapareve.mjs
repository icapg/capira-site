/**
 * Scraper de puntos de recarga por provincia — mapareve.es (MITMA RECORE)
 *
 * Usa el endpoint POST /api/public/v1/markers con bounding box por provincia
 * para obtener total_evse real de cada una.
 *
 * Uso:
 *   node scripts/scrape-mapareve.mjs
 *   node scripts/scrape-mapareve.mjs --dry-run
 */

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_FILE = join(ROOT, "app/lib/insights/infraestructura-data.ts");
const DRY_RUN = process.argv.includes("--dry-run");

const API = "https://www.mapareve.es/api/public/v1/markers";

// Playwright page instance (inicializado en main)
let page;



// Bounding boxes aproximados por provincia (lat/lon WGS84)
// Formato: [lat_sw, lon_sw, lat_ne, lon_ne]
const PROVINCE_BBOX = {
  // Andalucía
  "Almería":     [36.7, -3.1, 38.1, -1.0],
  "Cádiz":       [35.5, -6.0, 37.3, -5.1],
  "Córdoba":     [37.2, -5.7, 38.9, -3.9],
  "Granada":     [36.7, -4.2, 37.9, -2.7],
  "Huelva":      [36.9, -7.6, 38.2, -6.2],
  "Jaén":        [37.2, -4.3, 38.5, -2.7],
  "Málaga":      [36.2, -5.5, 37.2, -3.8],
  "Sevilla":     [36.8, -6.3, 37.9, -4.8],
  // Aragón
  "Huesca":      [41.5, -2.1, 43.1, 0.7],
  "Teruel":      [39.8, -2.0, 41.0, 0.5],
  "Zaragoza":    [40.5, -2.1, 42.1, 0.5],
  // Asturias
  "Asturias":    [42.9, -7.1, 43.7, -4.5],
  // Islas Baleares
  "Islas Baleares": [38.6, 1.1, 40.1, 4.4],
  // Canarias
  "Las Palmas":          [27.5, -15.9, 29.3, -13.3],
  "Santa Cruz de Tenerife": [27.5, -18.3, 28.9, -13.4],
  // Cantabria
  "Cantabria":   [43.0, -4.5, 43.6, -3.1],
  // Castilla y León
  "Ávila":       [40.1, -5.8, 40.9, -4.4],
  "Burgos":      [41.8, -4.4, 42.9, -2.9],
  "León":        [41.8, -7.2, 43.1, -5.5],
  "Palencia":    [41.8, -4.9, 43.0, -3.9],
  "Salamanca":   [40.1, -7.1, 41.4, -5.4],
  "Segovia":     [40.7, -4.7, 41.5, -3.4],
  "Soria":       [40.9, -3.2, 42.0, -1.7],
  "Valladolid":  [41.1, -5.4, 41.9, -4.2],
  "Zamora":      [40.9, -6.9, 41.9, -5.5],
  // Castilla-La Mancha
  "Albacete":    [38.1, -2.7, 39.5, -0.9],
  "Ciudad Real": [38.1, -5.1, 39.5, -2.9],
  "Cuenca":      [39.3, -3.1, 40.9, -1.4],
  "Guadalajara": [40.3, -3.3, 41.4, -1.5],
  "Toledo":      [39.1, -5.4, 40.4, -2.9],
  // Cataluña
  "Barcelona":   [41.0, 1.3, 41.9, 2.3],
  "Girona":      [41.6, 2.0, 42.9, 3.4],
  "Lleida":      [41.2, 0.1, 42.8, 1.6],
  "Tarragona":   [40.4, 0.1, 41.4, 1.5],
  // Comunitat Valenciana
  "Alicante":    [37.7, -1.5, 38.9, -0.1],
  "Castellón":   [39.7, -0.9, 40.9, 0.5],
  "Valencia":    [38.9, -1.5, 40.0, 0.1],
  // Extremadura
  "Badajoz":     [37.8, -7.5, 39.5, -4.7],
  "Cáceres":     [39.1, -7.5, 40.6, -5.0],
  // Galicia
  "A Coruña":    [42.6, -9.3, 43.8, -7.4],
  "Lugo":        [42.4, -7.9, 43.7, -6.7],
  "Ourense":     [41.7, -8.1, 42.6, -6.5],
  "Pontevedra":  [41.7, -8.9, 42.6, -7.9],
  // La Rioja
  "La Rioja":    [41.8, -3.1, 42.7, -1.7],
  // Madrid
  "Madrid":      [39.8, -4.7, 41.0, -3.0],
  // Murcia
  "Murcia":      [37.2, -2.5, 38.9, -0.5],
  // Navarra
  "Navarra":     [41.9, -2.2, 43.5, -0.3],
  // País Vasco
  "Álava":       [42.4, -3.3, 43.1, -2.1],
  "Gipuzkoa":    [42.8, -2.5, 43.5, -1.6],
  "Vizcaya":     [43.0, -3.5, 43.6, -2.3],
  // Ceuta & Melilla
  "Ceuta":       [35.85, -5.40, 35.95, -5.28],
  "Melilla":     [35.26, -2.99, 35.32, -2.92],
};

async function fetchTile(lat_sw, lon_sw, lat_ne, lon_ne, zoom) {
  const body = {
    latitude_ne: lat_ne, longitude_ne: lon_ne,
    latitude_sw: lat_sw, longitude_sw: lon_sw,
    zoom,
    cpo_ids: [], only_ocpi: false, available: false,
    connector_types: [], payment_methods: [], facilities: [],
    latitude: null, longitude: null,
  };
  // Usar Playwright para pasar el WAF de Imperva
  const result = await page.evaluate(async ({ url, body }) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "app-version": "1.10.0", "platform": "web", "time-zone": "Europe/Madrid" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { error: r.status, body: await r.text() };
    return { data: await r.json() };
  }, { url: API, body });

  if (result.error) {
    if (result.error === 400) return null; // bbox too large for zoom
    throw new Error(`HTTP ${result.error}: ${result.body?.slice(0, 100)}`);
  }
  if (!Array.isArray(result.data)) return null;
  return result.data;
}

// Suma EVSEs resolviendo clusters recursivamente dividiendo en 4 subtiles
async function countEvses(lat_sw, lon_sw, lat_ne, lon_ne, depth = 0) {
  if (depth > 8) return 0; // safety cap

  // Encontrar el zoom válido más bajo para este bbox
  let data = null;
  for (let z = 5; z <= 16; z++) {
    const d = await fetchTile(lat_sw, lon_sw, lat_ne, lon_ne, z);
    if (d !== null) { data = d; break; }
    await new Promise(r => setTimeout(r, 80));
  }
  if (!data) return 0;
  await new Promise(r => setTimeout(r, 100));

  let total = 0;
  const clusters = data.filter(d => d.type === "cluster");
  const locations = data.filter(d => d.type !== "cluster");

  for (const loc of locations) {
    const evses = loc.total_evse ?? loc.location?.total_evse ?? loc.locations?.reduce((s, l) => s + (l.total_evse ?? 1), 0) ?? 1;
    total += evses;
  }

  // Para clusters: dividir en 4 subtiles y recursir
  if (clusters.length > 0) {
    const latMid = (lat_sw + lat_ne) / 2;
    const lonMid = (lon_sw + lon_ne) / 2;
    for (const [a, b, c, d] of [
      [lat_sw, lon_sw, latMid, lonMid],
      [lat_sw, lonMid, latMid, lon_ne],
      [latMid, lon_sw, lat_ne, lonMid],
      [latMid, lonMid, lat_ne, lon_ne],
    ]) {
      total += await countEvses(a, b, c, d, depth + 1);
    }
  }

  return total;
}

async function fetchProvince(nombre) {
  const [lat_sw, lon_sw, lat_ne, lon_ne] = PROVINCE_BBOX[nombre];
  const total = await countEvses(lat_sw, lon_sw, lat_ne, lon_ne);
  return { total };
}

async function main() {
  console.log("🔌 Scraper mapareve.es — MITMA RECORE");
  console.log(`   Provincias: ${Object.keys(PROVINCE_BBOX).length}`);
  if (DRY_RUN) console.log("   Modo: DRY RUN\n");

  // Inicializar Playwright para pasar el WAF de Imperva
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1600, height: 900 }, locale: "es-ES",
  });
  page = await ctx.newPage();
  // Cargar el sitio una vez para establecer cookies/sesión
  await page.goto("https://www.mapareve.es/mapa-puntos-recarga", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(3000);
  console.log("   Browser listo\n");

  const results = {};
  let totalSum = 0;

  for (const [nombre] of Object.entries(PROVINCE_BBOX)) {
    try {
      const { total } = await fetchProvince(nombre);
      results[nombre] = total;
      totalSum += total;
      console.log(`  ✅ ${nombre.padEnd(26)} ${String(total).padStart(6)} EVSEs`);
    } catch (err) {
      results[nombre] = null;
      console.log(`  ❌ ${nombre.padEnd(26)} ERROR: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  await browser.close();

  console.log(`\n  Total España: ${totalSum.toLocaleString("es-ES")} EVSEs`);

  if (!DRY_RUN) {
    patchDataFile(results);
    console.log(`\n✅ Archivo actualizado: ${DATA_FILE}`);
  }

  console.log("\n✨ Scraper terminado.");
}

function patchDataFile(results) {
  let content = readFileSync(DATA_FILE, "utf8");
  const now = new Date().toISOString().split("T")[0];

  // Update header date and source note
  content = content.replace(
    /\/\/ Fuente:.+\n\/\/ Operadores:.+\n\/\/ Total.+\n(\/\/ Nota:.+\n)?/,
    `// Fuente: mapareve.es (MITMA RECORE) — scraper automatizado\n` +
    `// Última actualización: ${now}\n` +
    `// Total EVSEs públicos: según RECORE por provincia\n`
  );

  // Replace puntos values in infraPorProvincia for each scraped province
  for (const [nombre, total] of Object.entries(results)) {
    if (total === null) continue;
    // Estimate rapidos as ~24% of total (national average from ANFAC)
    const rapidos = Math.round(total * 0.24);
    // Replace the entry line for this province
    const escapedNombre = nombre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(\\{ nombre: "${escapedNombre}",[^}]+puntos: )\\d+(, rapidos: )\\d+`);
    content = content.replace(re, `$1${total}$2${rapidos}`);
  }

  // Handle Las Palmas and Santa Cruz de Tenerife — add them if missing
  const canariasBlock = buildCanariasEntries(results);
  if (canariasBlock && !content.includes('"Las Palmas"')) {
    content = content.replace(
      '{ nombre: "Ceuta"',
      `${canariasBlock}\n  { nombre: "Ceuta"`
    );
  }

  writeFileSync(DATA_FILE, content);
}

function buildCanariasEntries(results) {
  const lasPalmas = results["Las Palmas"];
  const tenerife = results["Santa Cruz de Tenerife"];
  if (!lasPalmas && !tenerife) return null;
  const lines = [];
  if (lasPalmas) {
    const rapidos = Math.round(lasPalmas * 0.24);
    lines.push(`  { nombre: "Las Palmas",              ccaa: "Canarias",            puntos: ${lasPalmas}, rapidos: ${rapidos}, km2: 4066,  pob: 1128 },`);
  }
  if (tenerife) {
    const rapidos = Math.round(tenerife * 0.24);
    lines.push(`  { nombre: "Santa Cruz de Tenerife",  ccaa: "Canarias",            puntos: ${tenerife}, rapidos: ${rapidos}, km2: 3381,  pob: 1048 },`);
  }
  return lines.join("\n");
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
