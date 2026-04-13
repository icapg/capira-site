/**
 * diagnose-brands.mjs
 * Find where brand names are and how to click them
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

// Select year with force
const slicer0 = page.frameLocator("iframe.visual-sandbox").nth(0);
await slicer0.locator(".slicerText", { hasText: "2025" }).first().click({ force: true, timeout: 5000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: join(SS, "brands-default.png") });

async function readKPIs() {
  await page.waitForTimeout(1500);
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

const defaultKPIs = await readKPIs();
console.log(`Default KPIs: BEV=${defaultKPIs.bev} PHEV=${defaultKPIs.phev} Total=${defaultKPIs.total}`);

// 1. Find all text nodes in ALL frames (including visual-sandbox iframes)
console.log("\n=== TEXT IN ALL FRAMES (visual-sandbox content) ===");
for (let nth = 0; nth <= 10; nth++) {
  try {
    const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);

    // All text nodes
    const texts = await iframe.evaluate(() => {
      const result = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const t = node.textContent.trim();
        if (t.length > 0) result.push(t);
      }
      return result;
    }).catch(() => null);

    if (texts === null) break;
    if (texts.length > 0) {
      console.log(`  iframe[${nth}]: ${texts.slice(0, 20).join(" | ")}`);
    } else {
      // Try SVG text elements specifically
      const svgTexts = await iframe.locator("text, tspan").allTextContents().catch(() => []);
      if (svgTexts.length > 0) {
        console.log(`  iframe[${nth}] SVG text: ${svgTexts.slice(0, 20).join(" | ")}`);
      }

      // Try all elements with innerText
      const innerTexts = await iframe.evaluate(() => {
        return [...document.querySelectorAll("*")]
          .filter(e => e.children.length === 0)
          .map(e => e.textContent?.trim() || "")
          .filter(t => t.length > 0 && t.length < 40)
          .filter((t, i, a) => a.indexOf(t) === i)
          .slice(0, 20);
      }).catch(() => []);
      if (innerTexts.length > 0) {
        console.log(`  iframe[${nth}] leaf text: ${innerTexts.join(" | ")}`);
      }
    }
  } catch { break; }
}

// 2. Check main DOM accessible text for brand names
console.log("\n=== MAIN DOM TEXT NODES ===");
const mainDomTexts = await page.evaluate(() => {
  const result = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (t.length >= 2 && t.length <= 30) result.push(t);
  }
  return [...new Set(result)];
});
const brands = ["TOYOTA", "TESLA", "BMW", "KIA", "BYD", "FORD", "VOLKSWAGEN", "MERCEDES", "MG", "RENAULT", "HYUNDAI", "PEUGEOT", "VOLVO", "AUDI", "CUPRA", "DACIA", "PORSCHE", "B.M.W."];
const foundInMain = mainDomTexts.filter(t => brands.some(b => t.toUpperCase().includes(b)));
console.log("Brand names found in main DOM:", foundInMain);

// All main DOM texts for reference
console.log("All main DOM texts (first 30):", mainDomTexts.slice(0, 30));

// 3. Try clicking known brands via page.frames() iteration
console.log("\n=== CLICKING BRANDS VIA FRAMES ===");
for (const brand of ["TOYOTA", "TESLA", "KIA", "FORD"]) {
  let found = false;

  // Try main page
  try {
    const count = await page.locator(`text="${brand}"`).count();
    if (count > 0) {
      const el = page.locator(`text="${brand}"`).first();
      const bbox = await el.boundingBox();
      const visible = await el.isVisible({ timeout: 500 });
      console.log(`  ${brand} in main page: count=${count} visible=${visible} bbox=${JSON.stringify(bbox)}`);
      if (visible) {
        await el.click({ force: true });
        await page.waitForTimeout(2000);
        const kpis = await readKPIs();
        console.log(`    → KPIs: BEV=${kpis.bev} PHEV=${kpis.phev} Total=${kpis.total}`);
        // Deselect
        await el.click({ force: true });
        await page.waitForTimeout(1000);
        found = true;
      }
    }
  } catch {}

  if (!found) {
    // Try in visual-sandbox iframes
    for (let nth = 0; nth <= 10; nth++) {
      try {
        const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);
        const el = iframe.locator(`text="${brand}"`).first();
        const visible = await el.isVisible({ timeout: 500 }).catch(() => false);
        if (visible) {
          console.log(`  ${brand} in iframe[${nth}]: visible!`);
          await el.click({ force: true });
          await page.waitForTimeout(2000);
          const kpis = await readKPIs();
          console.log(`    → KPIs: BEV=${kpis.bev} PHEV=${kpis.phev} Total=${kpis.total}`);
          await el.click({ force: true });
          await page.waitForTimeout(1000);
          found = true;
          break;
        }
      } catch { break; }
    }
  }

  if (!found) console.log(`  ${brand}: NOT FOUND in any frame`);
}

// 4. Try keyboard navigation inside the visual
console.log("\n=== KEYBOARD NAVIGATION APPROACH ===");
// Press Enter on "Selecciona Marca" to enter the visual
const selectaMarca = page.locator('[aria-label="Selecciona Marca "]').first();
await selectaMarca.click({ force: true });
await page.waitForTimeout(2000);
await page.screenshot({ path: join(SS, "brands-after-enter.png") });

const kpisAfterEnter = await readKPIs();
console.log(`KPIs after clicking Selecciona Marca: BEV=${kpisAfterEnter.bev} PHEV=${kpisAfterEnter.phev} Total=${kpisAfterEnter.total}`);

// Check all aria-labels now
const ariaAfterEnter = new Set();
for (const f of [page, ...page.frames()]) {
  try {
    const ls = await f.evaluate(() =>
      [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
    );
    ls.forEach(l => ariaAfterEnter.add(l));
  } catch {}
}
console.log("\nAria labels after entering Selecciona Marca:");
for (const l of [...ariaAfterEnter]) {
  if (l.length < 100 && (l.includes("Marca") || brands.some(b => l.toUpperCase().includes(b)))) {
    console.log(`  ${l}`);
  }
}

// 5. Try pressing F6 to navigate into visual, then Tab to see brand items
await page.keyboard.press("F6");
await page.waitForTimeout(1000);

// Check if we can tab through brand items
for (let i = 0; i < 5; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(500);
}

const focusedElement = await page.evaluate(() => {
  const el = document.activeElement;
  return {
    tag: el?.tagName,
    aria: el?.getAttribute("aria-label"),
    text: el?.textContent?.slice(0, 100),
  };
});
console.log(`\nFocused element after Tab: ${JSON.stringify(focusedElement)}`);

// 6. Check if the "Segmentación por Marcas" visual is navigable by keyboard
// Power BI visuals support Ctrl+Enter to enter them
console.log("\n=== TRYING Ctrl+Enter ON VISUAL ===");
await page.keyboard.press("Escape"); // Reset first
await page.waitForTimeout(500);
await selectaMarca.focus().catch(() => {});
await page.waitForTimeout(500);

// Check the accessible HTML for the Selecciona Marca visual
const selectaMarcaHtml = await selectaMarca.evaluate(el => el.outerHTML.slice(0, 1000)).catch(() => "");
console.log(`Selecciona Marca element HTML: ${selectaMarcaHtml}`);

await br.close();
console.log("\n✅ Done");
