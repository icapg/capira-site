/**
 * diagnose-picker3.mjs
 * Read brands from page WITHOUT clicking "Selecciona Marca"
 * Then try clicking each brand text directly
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

const br = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
const ctx = await br.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 }, locale: "es-ES",
});
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(5000);
await page.getByText("Segmentación por Marcas", { exact: false }).first().click({ timeout: 10_000 });
await page.waitForTimeout(8000);

const slicer0 = page.frameLocator("iframe.visual-sandbox").nth(0);
await slicer0.locator(".slicerText", { hasText: "2025" }).first().click({ timeout: 5000 });
await page.waitForTimeout(3000);

await page.screenshot({ path: join(SS, "p3-default.png") });
console.log("📸 default state screenshot");

// 1. Read all aria-labels from main frame + all frames WITHOUT clicking anything
console.log("\n=== ALL aria-labels (default state) ===");
const allAria = new Set();
for (const f of [page, ...page.frames()]) {
  try {
    const ls = await f.evaluate(() =>
      [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
    );
    ls.forEach(l => allAria.add(l));
  } catch {}
}
for (const l of [...allAria]) {
  if (l.length < 150) console.log(l);
}

// 2. Look for brand names in visual-sandbox iframes (including SVG text)
console.log("\n=== BRAND SEARCH IN ALL VISUAL-SANDBOX IFRAMES ===");
const knownBrands = ["TOYOTA", "TESLA", "BMW", "KIA", "RENAULT", "VOLKSWAGEN", "FORD", "BYD", "MG", "HYUNDAI", "MERCEDES", "VOLVO", "PEUGEOT", "SEAT", "AUDI"];
for (let nth = 0; nth <= 10; nth++) {
  try {
    const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);
    // Check text in ALL elements including SVG
    const allText = await iframe.evaluate(() => {
      const texts = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const t = node.textContent.trim();
        if (t.length >= 2 && t.length <= 30) texts.push(t);
      }
      return [...new Set(texts)];
    }).catch(() => []);

    const brandFound = allText.some(t => knownBrands.some(b => t === b || t.includes(b)));
    if (brandFound || allText.length > 5) {
      console.log(`\n  iframe[${nth}] allText (${allText.length}): ${allText.slice(0,20).join(" | ")}`);
    }
  } catch { break; }
}

// 3. Find TOYOTA in all frames including iframes using Playwright locators
console.log("\n=== FINDING TOYOTA IN ALL FRAMES ===");
for (const f of page.frames()) {
  try {
    const els = await f.locator('text="TOYOTA"').all();
    if (els.length > 0) {
      const url = f.url().slice(0, 80);
      console.log(`  Found TOYOTA in frame: ${url}`);
      for (const el of els) {
        const tag = await el.evaluate(e => e.tagName).catch(() => "?");
        const bbox = await el.boundingBox().catch(() => null);
        const aria = await el.getAttribute("aria-label").catch(() => "");
        console.log(`    ${tag} bbox=${JSON.stringify(bbox)} aria="${aria}"`);
      }
    }
  } catch {}
}

// 4. Also check: does page.locator find it?
const toyotaMain = await page.locator('text="TOYOTA"').count();
console.log(`\n  page.locator('text="TOYOTA"') count: ${toyotaMain}`);

// 5. Check visual-sandbox[2] specifically
console.log("\n=== VISUAL-SANDBOX[2] DETAILED ===");
try {
  const iframe2 = page.frameLocator("iframe.visual-sandbox").nth(2);
  const allText2 = await iframe2.evaluate(() => {
    const texts = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent.trim();
      if (t.length >= 2) texts.push(t);
    }
    return [...new Set(texts)].slice(0, 50);
  }).catch(() => []);
  console.log(`  All text: ${allText2.join(" | ")}`);

  const allHtml = await iframe2.locator("body").innerHTML().catch(() => "");
  console.log(`  Body HTML (2000 chars): ${allHtml.slice(0, 2000)}`);
} catch (e) {
  console.log(`  Error: ${e.message}`);
}

// 6. Try clicking TOYOTA text in main page (no .nth())
console.log("\n=== TRYING TO CLICK TOYOTA IN MAIN PAGE ===");
const kpisBefore = await readKPIs();
console.log(`  KPIs before: BEV=${kpisBefore.bev} PHEV=${kpisBefore.phev} Total=${kpisBefore.total}`);

// Try clicking Toyota in main frame
try {
  const toyotaEl = page.locator('text="TOYOTA"').first();
  if (await toyotaEl.isVisible({ timeout: 2000 })) {
    console.log("  TOYOTA visible in main frame, clicking...");
    await toyotaEl.click();
    await page.waitForTimeout(2000);
    const kpisAfter = await readKPIs();
    console.log(`  KPIs after: BEV=${kpisAfter.bev} PHEV=${kpisAfter.phev} Total=${kpisAfter.total}`);
    await page.screenshot({ path: join(SS, "p3-toyota.png") });
  } else {
    console.log("  TOYOTA NOT visible in main frame");
  }
} catch (e) {
  console.log(`  Error: ${e.message}`);
}

// 7. Try clicking TOYOTA in visual-sandbox frames
console.log("\n=== TRYING TO CLICK TOYOTA IN IFRAMES ===");
for (let nth = 0; nth <= 10; nth++) {
  try {
    const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);
    const el = iframe.locator('text="TOYOTA"').first();
    if (await el.isVisible({ timeout: 500 })) {
      console.log(`  TOYOTA visible in iframe[${nth}], clicking...`);
      await el.click();
      await page.waitForTimeout(2000);
      const kpisAfter = await readKPIs();
      console.log(`  KPIs after: BEV=${kpisAfter.bev} PHEV=${kpisAfter.phev} Total=${kpisAfter.total}`);
      await page.screenshot({ path: join(SS, `p3-toyota-iframe${nth}.png`) });
      break;
    }
  } catch { break; }
}

// Helper to read KPIs
async function readKPIs() {
  const labels = new Set();
  for (const f of [page, ...page.frames()]) {
    try {
      const ls = await f.evaluate(() =>
        [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
      );
      ls.forEach(l => labels.add(l));
    } catch {}
  }
  let bev = 0, phev = 0, total = 0;
  for (const l of labels) {
    const mBev = l.match(/Cat BEV\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (mBev) bev = parseInt(mBev[1].replace(/[.\s]/g, "")) || 0;
    const mPhev = l.match(/Cat PHEV\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (mPhev) phev = parseInt(mPhev[1].replace(/[.\s]/g, "")) || 0;
    const mTot = l.match(/Matriculaciones\s+([\d.]+)/i);
    if (mTot) total = parseInt(mTot[1].replace(/[.\s]/g, "")) || 0;
  }
  return { bev, phev, total: total || bev + phev };
}

await br.close();
console.log("\n✅ Done");
