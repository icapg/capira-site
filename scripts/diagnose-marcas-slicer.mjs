/**
 * Diagnóstica específica para encontrar el slicer de marcas en AEDIVE
 * Vuelca TODOS los iframes, sus slicerText, y prueba "Selecciona Marca"
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SS = join(ROOT, "scripts/screenshots");
const OUT = join(ROOT, "scripts/scrape-output");
mkdirSync(SS, { recursive: true });
mkdirSync(OUT, { recursive: true });

const URL = "https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9";

const br = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await br.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 }, locale: "es-ES",
});
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(5000);
await page.getByText("Segmentación por Marcas", { exact: false }).first().click({ timeout: 10_000 });
await page.waitForTimeout(8000);

// Seleccionar 2025
const slicer0 = page.frameLocator("iframe.visual-sandbox").nth(0);
await slicer0.locator(".slicerText", { hasText: "2025" }).first().click({ timeout: 5000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: join(SS, "ms-2025-base.png") });

const results = {};

// 1. Volcar TODOS los iframes y sus contenidos
console.log("\n=== TODOS LOS IFRAMES (visual-sandbox) ===");
for (let nth = 0; nth <= 10; nth++) {
  try {
    const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);
    const texts = await iframe.locator(".slicerText").allTextContents().catch(() => []);
    const arias = await iframe.locator("[aria-label]").evaluateAll(els =>
      els.map(e => e.getAttribute("aria-label")).filter(Boolean)
    ).catch(() => []);
    const roles = await iframe.locator("[role]").evaluateAll(els =>
      els.map(e => `${e.tagName}[role=${e.getAttribute("role")}]: ${e.textContent?.trim().slice(0,40)}`)
    ).catch(() => []);

    if (texts.length > 0 || arias.length > 0) {
      console.log(`\n--- iframe.visual-sandbox[${nth}] ---`);
      if (texts.length > 0) console.log(`  slicerText (${texts.length}): ${texts.join(" | ")}`);
      if (arias.length > 0) console.log(`  aria-labels (${arias.length}): ${arias.slice(0,10).join(" | ")}`);
      if (roles.length > 0) console.log(`  roles (${roles.length}): ${roles.slice(0,5).join(" | ")}`);
      results[`iframe_${nth}`] = { texts, arias: arias.slice(0,20), roles: roles.slice(0,10) };
    }
  } catch { break; }
}

// 2. Buscar "Selecciona Marca" en el DOM y sus alrededores
console.log("\n=== BUSCANDO 'Selecciona Marca' ===");
const selectaMarca = await page.locator('[aria-label="Selecciona Marca"]').all();
console.log(`  Encontrados en DOM principal: ${selectaMarca.length}`);

for (const f of page.frames()) {
  try {
    const els = await f.locator('[aria-label*="Marca"]').all();
    if (els.length > 0) {
      const url = f.url().slice(0, 60);
      console.log(`  Frame ${url}: ${els.length} elementos con aria 'Marca'`);
      for (const el of els.slice(0, 5)) {
        const label = await el.getAttribute("aria-label").catch(() => "");
        const text  = await el.textContent().catch(() => "");
        const tag   = await el.evaluate(e => e.tagName).catch(() => "");
        console.log(`    ${tag} aria="${label}" text="${text?.trim().slice(0,50)}"`);
      }
    }
  } catch {}
}

// 3. Buscar listas/select de marcas por texto conocido
console.log("\n=== BUSCANDO MARCAS CONOCIDAS EN SLICERS ===");
const knownBrands = ["TOYOTA", "TESLA", "BMW", "KIA", "RENAULT", "HYUNDAI", "FORD", "VOLKSWAGEN", "Mercedes", "Toyota", "Tesla", "Kia", "Bmw", "Renault"];
for (let nth = 0; nth <= 10; nth++) {
  try {
    const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);
    for (const brand of knownBrands.slice(0, 6)) {
      const visible = await iframe.locator(`text=${brand}`).isVisible({ timeout: 500 }).catch(() => false);
      if (visible) {
        const all = await iframe.locator("text=/[A-Z]{3,}/").allTextContents().catch(() => []);
        console.log(`  iframe[${nth}] tiene "${brand}" — todos los textos uppercase: ${all.slice(0,20).join(", ")}`);
        results[`brands_in_iframe_${nth}`] = all;
        break;
      }
    }
  } catch { break; }
}

// 4. Capturar toda la página con scroll y ver qué textos aparecen
console.log("\n=== TEXTO VISIBLE EN PANTALLA ===");
const visText = await page.evaluate(() =>
  [...document.querySelectorAll("*")]
    .filter(e => e.children.length === 0 && e.textContent.trim().length > 1 && e.textContent.trim().length < 50)
    .map(e => e.textContent.trim())
    .filter((t,i,a) => a.indexOf(t)===i)
    .filter(t => !/function|var |const |<|>/.test(t))
    .slice(0, 100)
);
console.log(visText.join("\n"));

// 5. Screenshot con DevTools element picker hints
await page.screenshot({ path: join(SS, "ms-final.png"), fullPage: true });

// 6. Dump completo del DOM del body (truncado)
const bodyHtml = await page.evaluate(() => document.body.innerHTML.slice(0, 5000));
console.log("\n=== BODY HTML (primeros 5000 chars) ===");
console.log(bodyHtml);

await br.close();
writeFileSync(join(OUT, "marcas-slicer-diag.json"), JSON.stringify({ results, visText }, null, 2));
console.log("\n✅ Done");
