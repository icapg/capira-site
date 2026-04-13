/**
 * diagnose-mapareve.mjs
 * Intercepta todas las llamadas de red de mapareve.es para encontrar la API de cargadores.
 */
import { chromium } from "playwright";

const URL = "https://www.mapareve.es/mapa-puntos-recarga";

const br = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await br.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 },
});
const page = await ctx.newPage();

const requests = [];

page.on("request", (req) => {
  const url = req.url();
  const method = req.method();
  const headers = req.headers();
  // Filtrar solo llamadas interesantes (no assets)
  if (!url.match(/\.(js|css|png|jpg|svg|ico|woff|woff2|ttf)(\?|$)/)) {
    requests.push({ method, url, headers: JSON.stringify(headers).slice(0, 200) });
  }
});

page.on("response", async (res) => {
  const url = res.url();
  const status = res.status();
  const contentType = res.headers()["content-type"] || "";
  if (contentType.includes("json") && !url.match(/\.(js|css)(\?|$)/)) {
    try {
      const body = await res.text();
      console.log(`\n✅ JSON Response [${status}]: ${url}`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Body preview: ${body.slice(0, 500)}`);
    } catch {}
  }
});

console.log("Navegando a mapareve.es...");
await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(5000);

console.log("\n=== TODAS LAS REQUESTS NO-ASSET ===");
for (const r of requests) {
  console.log(`${r.method} ${r.url}`);
}

// Tomar screenshot para ver qué cargó
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(__dirname, "screenshots"), { recursive: true });
await page.screenshot({ path: join(__dirname, "screenshots/mapareve.png"), fullPage: false });
console.log("\n📸 Screenshot guardado en scripts/screenshots/mapareve.png");

await br.close();
console.log("\n✅ Done");
