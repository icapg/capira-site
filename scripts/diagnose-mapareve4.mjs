/**
 * diagnose-mapareve4.mjs
 * Usa page.route() para interceptar y sustituir el body del POST /markers
 * con nuestros propios parámetros, pasando el WAF de Imperva.
 */
import { chromium } from "playwright";

const API_URL = "https://www.mapareve.es/api/public/v1/markers";
let page;

async function fetchTile(lat_sw, lon_sw, lat_ne, lon_ne, zoom) {
  return new Promise(async (resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; resolve(null); }
    }, 8000);

    await page.route(API_URL, async (route) => {
      const myBody = JSON.stringify({
        latitude_ne: lat_ne, longitude_ne: lon_ne,
        latitude_sw: lat_sw, longitude_sw: lon_sw,
        zoom,
        cpo_ids: [], only_ocpi: false, available: false,
        connector_types: [], payment_methods: [], facilities: [],
        latitude: null, longitude: null,
      });
      try {
        const response = await route.fetch({ postData: myBody });
        const text = await response.text();
        await route.fulfill({ response, body: text });
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          try { resolve(JSON.parse(text)); } catch { resolve(null); }
        }
      } catch (e) {
        await route.continue();
        if (!resolved) { resolved = true; clearTimeout(timeout); resolve(null); }
      }
      await page.unroute(API_URL).catch(() => {});
    });

    // Disparar un click para que la app haga su request
    await page.mouse.click(800 + Math.random() * 10, 450 + Math.random() * 10);
  });
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 }, locale: "es-ES",
});
page = await ctx.newPage();
await page.goto("https://www.mapareve.es/mapa-puntos-recarga", { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(5000);
console.log("Page loaded");

// Test Gipuzkoa zoom 10
const data = await fetchTile(42.8, -2.5, 43.5, -1.6, 10);
console.log("Result type:", typeof data, Array.isArray(data));
if (Array.isArray(data)) {
  console.log("Items:", data.length);
  console.log("First:", JSON.stringify(data[0], null, 2));
  const clusters = data.filter(d => d.type === "cluster").length;
  const locs = data.filter(d => d.type !== "cluster").length;
  const total = data.reduce((s, d) => s + (d.total_evse ?? 0), 0);
  console.log("Clusters:", clusters, "Locations:", locs, "Total EVSE:", total);
} else {
  console.log("Got:", data);
}

await browser.close();
console.log("Done");
