/**
 * diagnose-acumulado2.mjs
 * Extract ALL brand names from "Acumulado por marcas" page
 * to see what's available and compare with Image Grid
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SS = join(ROOT, "scripts/screenshots");
mkdirSync(SS, { recursive: true });

const URL = "https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9";

const br = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await br.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 }, locale: "es-ES",
});
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(5000);

// Navigate to "Acumulado por marcas"
await page.getByText("Acumulado por marcas", { exact: false }).first().click({ timeout: 10_000 });
await page.waitForTimeout(8000);
await page.screenshot({ path: join(SS, "acum-main.png") });

// Extract all aria-labels - the format is "Fecha M/D/YY. Marca X. Uds Acumuladas Fecha N."
const labels = new Set();
for (const f of [page, ...page.frames()]) {
  try {
    const ls = await f.evaluate(() =>
      [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
    );
    ls.forEach(l => labels.add(l));
  } catch {}
}

// Extract brand + units from aria-labels
const brandData = {};
for (const l of labels) {
  const m = l.match(/Marca\s+(.+?)\.\s*Uds Acumuladas Fecha\s+([\d.]+)/i);
  if (m) {
    const marca = m[1].trim();
    const uds = parseInt(m[2].replace(/[.\s]/g, "")) || 0;
    if (!brandData[marca] || uds > brandData[marca]) {
      brandData[marca] = uds;
    }
  }
}

console.log(`\n=== BRANDS IN "Acumulado por marcas" ===`);
const sorted = Object.entries(brandData).sort(([,a],[,b]) => b-a);
sorted.forEach(([marca, uds]) => console.log(`  ${marca}: ${uds.toLocaleString("es")} uds`));
console.log(`\nTotal: ${sorted.length} marcas`);

// Also check visible text for brand names
console.log("\n=== VISIBLE TEXT ON PAGE ===");
const visText = await page.evaluate(() =>
  [...document.querySelectorAll("*")]
    .filter(e => e.children.length === 0 && e.textContent.trim().length > 1 && e.textContent.trim().length < 40)
    .map(e => e.textContent.trim())
    .filter((t, i, a) => a.indexOf(t) === i)
    .filter(t => !/function|var |const |<|>/.test(t))
    .slice(0, 80)
);
console.log(visText.join("\n"));

// Select year 2025 and redo
console.log("\n=== SELECTING YEAR 2025 ===");
const slicer0 = page.frameLocator("iframe.visual-sandbox").nth(0);
await slicer0.locator(".slicerText", { hasText: "2025" }).first().click({ force: true, timeout: 5000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: join(SS, "acum-2025.png") });

const labels2025 = new Set();
for (const f of [page, ...page.frames()]) {
  try {
    const ls = await f.evaluate(() =>
      [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
    );
    ls.forEach(l => labels2025.add(l));
  } catch {}
}

const brandData2025 = {};
for (const l of labels2025) {
  const m = l.match(/Marca\s+(.+?)\.\s*Uds Acumuladas Fecha\s+([\d.]+)/i);
  if (m) {
    const marca = m[1].trim();
    const uds = parseInt(m[2].replace(/[.\s]/g, "")) || 0;
    if (!brandData2025[marca] || uds > brandData2025[marca]) {
      brandData2025[marca] = uds;
    }
  }
}

console.log(`\n=== BRANDS IN "Acumulado por marcas" FOR 2025 ===`);
const sorted2025 = Object.entries(brandData2025).sort(([,a],[,b]) => b-a);
sorted2025.forEach(([marca, uds]) => console.log(`  ${marca}: ${uds.toLocaleString("es")}`));
console.log(`\nTotal: ${sorted2025.length} marcas`);

// Also try scrolling to see more brands
console.log("\n=== TRYING TO SCROLL TO SEE MORE ===");
// Check if there's a slicer with brands
for (let nth = 0; nth <= 8; nth++) {
  try {
    const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);
    const texts = await iframe.locator(".slicerText").allTextContents().catch(() => []);
    if (texts.length > 3) {
      const isNotYearOrMonth = !texts[0].match(/^\d{4}$/) && !texts[0].match(/^(Enero|Febrero|Diciembre)/i);
      if (isNotYearOrMonth) {
        console.log(`  iframe[${nth}] has ${texts.length} slicer items: ${texts.slice(0,10).join(", ")}`);
      }
    }
  } catch { break; }
}

await br.close();
console.log("\n✅ Done");
