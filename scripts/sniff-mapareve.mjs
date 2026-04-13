import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const requests = [];

page.on("request", req => {
  const url = req.url();
  if (!url.includes("google") && !url.includes("analytics") && !url.includes("fonts") && !url.includes(".png") && !url.includes(".ico")) {
    requests.push({ method: req.method(), url });
  }
});

page.on("response", async res => {
  const url = res.url();
  const ct = res.headers()["content-type"] ?? "";
  if (ct.includes("json") && !url.includes("google")) {
    try {
      const body = await res.json();
      console.log("JSON RESPONSE:", url);
      console.log("Sample:", JSON.stringify(body).slice(0, 500));
      console.log("---");
    } catch {}
  }
});

console.log("Navegando a mapareve.es...");
await page.goto("https://www.mapareve.es/mapa-puntos-recarga", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(3000);

console.log("\n=== TODAS LAS REQUESTS ===");
for (const r of requests) {
  console.log(`${r.method} ${r.url}`);
}

await browser.close();
