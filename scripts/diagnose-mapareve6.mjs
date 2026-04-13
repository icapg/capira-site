/**
 * diagnose-mapareve6.mjs
 * Navega el mapa programáticamente para que la app dispare las requests,
 * intercepta las responses en vuelo y extrae los datos.
 *
 * Estrategia: panear el mapa a coordenadas de cada provincia usando
 * el URL con parámetros de lat/lng/zoom, y capturar lo que devuelve.
 */
import { chromium } from "playwright";

const BASE_URL = "https://www.mapareve.es/mapa-puntos-recarga";
const API_URL = "https://www.mapareve.es/api/public/v1/markers";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 }, locale: "es-ES",
});
const page = await ctx.newPage();

// Interceptar todas las responses del endpoint markers
const captured = [];
page.on("response", async (res) => {
  if (res.url() === API_URL) {
    try {
      const data = await res.json();
      if (Array.isArray(data)) {
        captured.push({ data, timestamp: Date.now() });
        console.log(`  Captured ${data.length} items, total_evse sum: ${data.reduce((s,d) => s+(d.total_evse??0),0)}`);
      }
    } catch {}
  }
});

// Ver también qué body manda la app
page.on("request", (req) => {
  if (req.url() === API_URL) {
    const body = req.postData();
    if (body) {
      try {
        const parsed = JSON.parse(body);
        console.log(`  → Request zoom=${parsed.zoom} bbox=[${parsed.latitude_sw?.toFixed(2)},${parsed.longitude_sw?.toFixed(2)},${parsed.latitude_ne?.toFixed(2)},${parsed.longitude_ne?.toFixed(2)}]`);
      } catch {}
    }
  }
});

// Cargar el mapa inicial
console.log("Loading map...");
await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(5000);
console.log(`Initial load: ${captured.length} responses captured`);

// Intentar navegar con parámetros de URL (muchos mapas soportan ?lat=&lng=&zoom=)
// Probar con el parámetro de hash o query
console.log("\nTesting URL navigation to Gipuzkoa...");
captured.length = 0;
await page.goto(`${BASE_URL}?lat=43.1&lng=-2.0&zoom=10`, { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForTimeout(3000);
console.log(`After URL nav: ${captured.length} responses`);

// Probar con hash
console.log("\nTesting hash navigation...");
captured.length = 0;
await page.goto(`${BASE_URL}#map=10/43.1/-2.0`, { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForTimeout(3000);
console.log(`After hash nav: ${captured.length} responses`);

// Intentar manipular el mapa via JS (Google Maps API)
console.log("\nTrying Google Maps JS API...");
captured.length = 0;
await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(5000);

// Buscar si hay acceso al objeto map de Google Maps
const mapInfo = await page.evaluate(() => {
  // Buscar google.maps instances
  const keys = Object.keys(window).filter(k => k.includes('map') || k.includes('Map') || k.includes('google'));
  return { keys: keys.slice(0, 20), hasGoogle: !!window.google?.maps };
});
console.log("Window map keys:", mapInfo.keys);
console.log("Has Google Maps:", mapInfo.hasGoogle);

await browser.close();
console.log("\nDone");
