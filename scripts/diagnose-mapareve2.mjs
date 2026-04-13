/**
 * diagnose-mapareve2.mjs
 * Intercepta el POST a /api/public/v1/markers y muestra la estructura completa.
 */
import { chromium } from "playwright";

const URL = "https://www.mapareve.es/mapa-puntos-recarga";

const br = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await br.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 },
});
const page = await ctx.newPage();

page.on("response", async (res) => {
  const url = res.url();
  if (url.includes("/api/public/v1/")) {
    try {
      const body = await res.json();
      console.log(`\n=== ${url} ===`);
      if (Array.isArray(body)) {
        console.log(`Total items: ${body.length}`);
        console.log("First 2 items:");
        console.log(JSON.stringify(body.slice(0, 2), null, 2));
      } else {
        console.log(JSON.stringify(body, null, 2).slice(0, 2000));
      }
    } catch (e) {
      console.log(`Error parsing ${url}: ${e.message}`);
    }
  }
});

// También capturamos el request body del POST markers
page.on("request", (req) => {
  if (req.url().includes("/markers")) {
    console.log("\n=== POST /markers REQUEST BODY ===");
    console.log(req.postData());
    console.log("Headers:", JSON.stringify(req.headers(), null, 2));
  }
});

console.log("Navegando...");
await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(5000);

await br.close();
console.log("\n✅ Done");
