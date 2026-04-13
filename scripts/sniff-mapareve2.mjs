import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Capture POST bodies
page.on("request", req => {
  if (req.method() === "POST") {
    console.log("POST:", req.url());
    console.log("Body:", req.postData());
    console.log("---");
  }
});

await page.goto("https://www.mapareve.es/mapa-puntos-recarga", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);

// Try to fetch the JS bundle to find more endpoints
const bundleUrl = "https://www.mapareve.es/assets/index-BPsARsbN.js";
const resp = await page.evaluate(async (url) => {
  const r = await fetch(url);
  const text = await r.text();
  // Find all /api/ paths
  const matches = [...text.matchAll(/["'`](\/api\/[^"'`\s]+)["'`]/g)].map(m => m[1]);
  return [...new Set(matches)];
}, bundleUrl);

console.log("\n=== API PATHS IN BUNDLE ===");
for (const p of resp) console.log(p);

// Also try direct API calls to discover endpoints
const endpoints = [
  "/api/public/v1/provinces",
  "/api/public/v1/communities",
  "/api/public/v1/stats",
  "/api/public/v1/locations",
  "/api/public/v1/locations/count",
  "/api/public/v1/evse/count",
];

console.log("\n=== TESTING ENDPOINTS ===");
for (const ep of endpoints) {
  const result = await page.evaluate(async (ep) => {
    try {
      const r = await fetch("https://www.mapareve.es" + ep);
      const text = await r.text();
      return { status: r.status, body: text.slice(0, 300) };
    } catch(e) { return { error: e.message }; }
  }, ep);
  console.log(`${ep}: ${result.status ?? "ERR"} → ${result.body ?? result.error}`);
}

await browser.close();
