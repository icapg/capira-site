/**
 * diagnose-picker.mjs
 * After clicking "Selecciona Marca", dumps EVERYTHING visible.
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
await page.getByText("Segmentación por Marcas", { exact: false }).first().click({ timeout: 10_000 });
await page.waitForTimeout(8000);

// Select 2025
const slicer0 = page.frameLocator("iframe.visual-sandbox").nth(0);
await slicer0.locator(".slicerText", { hasText: "2025" }).first().click({ timeout: 5000 });
await page.waitForTimeout(3000);

await page.screenshot({ path: join(SS, "picker-before.png") });
console.log("📸 before screenshot taken");

// Count ALL iframes before click
const iframesBefore = await page.evaluate(() => document.querySelectorAll("iframe").length);
console.log(`\n🔢 Iframes before click: ${iframesBefore}`);

// Click "Selecciona Marca"
const btn = page.locator('[aria-label="Selecciona Marca "]').first();
const btnVisible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
console.log(`\n🔘 "Selecciona Marca" button visible: ${btnVisible}`);

if (btnVisible) {
  const bbox = await btn.boundingBox();
  console.log(`   BBox: ${JSON.stringify(bbox)}`);

  await btn.click();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: join(SS, "picker-after.png") });
  console.log("📸 after-click screenshot taken");

  // Count iframes after click
  const iframesAfter = await page.evaluate(() => document.querySelectorAll("iframe").length);
  console.log(`\n🔢 Iframes after click: ${iframesAfter}`);

  // Check ALL visual-sandbox iframes
  console.log("\n=== ALL visual-sandbox iframes after click ===");
  for (let nth = 0; nth <= 15; nth++) {
    try {
      const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);
      const texts = await iframe.locator(".slicerText").allTextContents().catch(() => []);
      const arias = await iframe.locator("[aria-label]").evaluateAll(els =>
        els.map(e => e.getAttribute("aria-label")).filter(Boolean)
      ).catch(() => []);
      const allText = await iframe.evaluate(() =>
        [...document.querySelectorAll("*")]
          .filter(e => e.children.length === 0 && e.textContent.trim().length > 0 && e.textContent.trim().length < 50)
          .map(e => e.textContent.trim())
          .filter((t, i, a) => a.indexOf(t) === i)
          .filter(t => !/function|var /.test(t))
          .slice(0, 30)
      ).catch(() => []);

      if (texts.length > 0 || arias.length > 0 || allText.length > 0) {
        console.log(`\n  iframe[${nth}]:`);
        if (texts.length) console.log(`    slicerText: ${texts.join(" | ")}`);
        if (arias.length) console.log(`    aria-labels: ${arias.slice(0,10).join(" | ")}`);
        if (allText.length) console.log(`    all text: ${allText.join(" | ")}`);
      }
    } catch { break; }
  }

  // Check all page frames (not just visual-sandbox)
  console.log("\n=== ALL page frames after click ===");
  for (const f of page.frames()) {
    try {
      const slicerTexts = await f.locator(".slicerText").allTextContents().catch(() => []);
      const roleOptions = await f.locator('[role="option"]').allTextContents().catch(() => []);
      const roleListbox = await f.locator('[role="listbox"]').allTextContents().catch(() => []);
      const url = f.url().slice(0, 80);

      if (slicerTexts.length > 0 || roleOptions.length > 0 || roleListbox.length > 0) {
        console.log(`\n  Frame: ${url}`);
        if (slicerTexts.length) console.log(`    slicerText(${slicerTexts.length}): ${slicerTexts.slice(0,15).join(" | ")}`);
        if (roleOptions.length) console.log(`    [role=option](${roleOptions.length}): ${roleOptions.slice(0,15).join(" | ")}`);
        if (roleListbox.length) console.log(`    [role=listbox](${roleListbox.length}): ${roleListbox.slice(0,5).join(" | ")}`);
      }
    } catch {}
  }

  // Check main DOM for new elements
  console.log("\n=== MAIN DOM - new/popup elements after click ===");
  const popupEls = await page.evaluate(() => {
    const found = [];
    // Look for dropdowns, menus, panels
    for (const sel of ['[role="listbox"]', '[role="menu"]', '[role="dialog"]', '.dropdown', '.popup', '.panel', '.filter-panel']) {
      const els = document.querySelectorAll(sel);
      if (els.length) found.push(`${sel}: ${els.length} items`);
    }
    // Look for elements containing known brand names
    const brands = ["TOYOTA", "TESLA", "BMW", "KIA", "RENAULT", "VOLKSWAGEN", "FORD", "BYD"];
    for (const brand of brands) {
      const xpath = `//*[contains(text(), '${brand}')]`;
      const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (result.snapshotLength > 0) {
        found.push(`"${brand}" found in ${result.snapshotLength} DOM element(s)`);
      }
    }
    return found;
  });
  console.log(popupEls.join("\n"));

  // Check if the click opened a new page/tab or changed URL
  console.log(`\n🌐 Current URL: ${page.url().slice(0, 100)}`);

  // Full aria dump after click
  console.log("\n=== ALL aria-labels after click (main + all frames) ===");
  const allArias = new Set();
  for (const f of [page, ...page.frames()]) {
    try {
      const ls = await f.evaluate(() =>
        [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
      );
      ls.forEach(l => allArias.add(l));
    } catch {}
  }
  const filteredArias = [...allArias].filter(l => l.length < 100);
  console.log(filteredArias.join("\n"));
} else {
  console.log("❌ Button not found");

  // Try with trailing space
  for (const variant of [
    'Selecciona Marca', 'Selecciona Marca ', 'selecciona marca',
    'Marca', 'MARCA'
  ]) {
    const el = page.locator(`[aria-label="${variant}"]`);
    const count = await el.count();
    if (count > 0) console.log(`  Found ${count} with aria="${variant}"`);
  }
}

await br.close();
console.log("\n✅ Done");
