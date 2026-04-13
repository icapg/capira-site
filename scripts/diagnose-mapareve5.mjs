/**
 * diagnose-mapareve5.mjs
 * Estrategia: usar page.request (APIRequestContext) desde Playwright
 * con las mismas cookies/headers de la sesión del browser — así pasa el WAF.
 */
import { chromium } from "playwright";

const API_URL = "https://www.mapareve.es/api/public/v1/markers";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 }, locale: "es-ES",
});
const page = await ctx.newPage();

// Cargar el sitio para establecer cookies de sesión
await page.goto("https://www.mapareve.es/mapa-puntos-recarga", { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(5000);
console.log("Page loaded, cookies established");

// Ahora usar el APIRequestContext del contexto (tiene las cookies del browser)
const response = await ctx.request.post(API_URL, {
  headers: {
    "content-type": "application/json",
    "app-version": "1.10.0",
    "platform": "web",
    "time-zone": "Europe/Madrid",
    "referer": "https://www.mapareve.es/mapa-puntos-recarga",
  },
  data: {
    latitude_ne: 43.5, longitude_ne: -1.6,
    latitude_sw: 42.8, longitude_sw: -2.5,
    zoom: 10,
    cpo_ids: [], only_ocpi: false, available: false,
    connector_types: [], payment_methods: [], facilities: [],
    latitude: null, longitude: null,
  },
});

console.log("Status:", response.status());
const body = await response.text();
console.log("Body preview:", body.slice(0, 500));

try {
  const data = JSON.parse(body);
  if (Array.isArray(data)) {
    console.log("\nItems:", data.length);
    const clusters = data.filter(d => d.type === "cluster").length;
    const locs = data.filter(d => d.type !== "cluster").length;
    const total = data.reduce((s, d) => s + (d.total_evse ?? 0), 0);
    console.log("Clusters:", clusters, "Locations:", locs, "Total EVSE:", total);
    console.log("First:", JSON.stringify(data[0], null, 2));
  }
} catch(e) {
  console.log("Parse error:", e.message);
}

await browser.close();
console.log("\nDone");
