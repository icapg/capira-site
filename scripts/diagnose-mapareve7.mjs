/**
 * diagnose-mapareve7.mjs
 * Espera que el mapa cargue completamente y luego intenta moverlo
 * programáticamente para disparar requests hacia diferentes zonas.
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_URL = "https://www.mapareve.es/api/public/v1/markers";

const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] }); // headless:false para ver qué pasa
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 }, locale: "es-ES",
});
const page = await ctx.newPage();

const allResponses = [];

page.on("response", async (res) => {
  if (res.url() === API_URL) {
    try {
      const data = await res.json();
      if (Array.isArray(data)) {
        const total = data.reduce((s,d) => s+(d.total_evse??0),0);
        const clusters = data.filter(d=>d.type==="cluster").length;
        const locs = data.filter(d=>d.type!=="cluster").length;
        console.log(`  ✅ Response: ${data.length} items | clusters=${clusters} locs=${locs} total_evse=${total}`);
        allResponses.push(data);
      }
    } catch {}
  }
});

page.on("request", (req) => {
  if (req.url() === API_URL) {
    try {
      const b = JSON.parse(req.postData() || "{}");
      console.log(`  → POST zoom=${b.zoom} sw=[${b.latitude_sw?.toFixed(1)},${b.longitude_sw?.toFixed(1)}] ne=[${b.latitude_ne?.toFixed(1)},${b.longitude_ne?.toFixed(1)}]`);
    } catch {}
  }
});

console.log("Loading...");
await page.goto("https://www.mapareve.es/mapa-puntos-recarga", { waitUntil: "domcontentloaded", timeout: 90_000 });
console.log("DOM loaded, waiting for map...");
await page.waitForTimeout(12000); // dar tiempo al mapa para inicializarse

console.log(`After initial load: ${allResponses.length} responses captured`);
await page.screenshot({ path: join(__dirname, "screenshots/mapareve-loaded.png") });

// El mapa está en el viewport. Intentar hacer drag para moverse
console.log("\nTrying drag on map...");
const mapArea = { x: 800, y: 450 };
await page.mouse.move(mapArea.x, mapArea.y);
await page.mouse.down();
await page.mouse.move(mapArea.x + 100, mapArea.y + 50, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(3000);
console.log(`After drag: ${allResponses.length} responses`);

// Intentar scroll zoom
console.log("\nTrying scroll zoom...");
await page.mouse.wheel(0, -300); // zoom in
await page.waitForTimeout(3000);
console.log(`After scroll zoom in: ${allResponses.length} responses`);

await page.mouse.wheel(0, 300); // zoom out
await page.waitForTimeout(3000);
console.log(`After scroll zoom out: ${allResponses.length} responses`);

// Intentar click en botones +/- del mapa
console.log("\nLooking for zoom buttons...");
const buttons = await page.evaluate(() =>
  [...document.querySelectorAll("button")].map(b => ({ text: b.textContent?.trim(), ariaLabel: b.getAttribute("aria-label"), class: b.className }))
);
console.log("Buttons found:", JSON.stringify(buttons.slice(0, 15)));

await browser.close();
writeFileSync(join(__dirname, "scrape-output/mapareve-debug.json"), JSON.stringify(allResponses, null, 2));
console.log("\nDone. Responses saved.");
