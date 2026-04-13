/**
 * diagnose-grid.mjs
 * Explore the "Selecciona Marca" Image Grid via keyboard navigation
 * and try coordinate-based clicking for each grid cell
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

const slicer0 = page.frameLocator("iframe.visual-sandbox").nth(0);
await slicer0.locator(".slicerText", { hasText: "2025" }).first().click({ force: true, timeout: 5000 });
await page.waitForTimeout(3000);

function parseNum(s) {
  return parseInt(String(s).replace(/[.\s]/g, "").replace(",", ".")) || 0;
}

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
    if (mBev) bev = parseNum(mBev[1]);
    const mPhev = l.match(/Cat PHEV\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (mPhev) phev = parseNum(mPhev[1]);
    const mTot = l.match(/Matriculaciones\s+([\d.]+)/i);
    if (mTot) total = parseNum(mTot[1]);
  }
  return { bev, phev, total: total || bev + phev };
}

// Visual bounding box from previous diagnostic: x=363, y=214, w=450, h=627
const VIS = { x: 363, y: 214, w: 450, h: 627 };

// Focus the "Selecciona Marca" visual and press Enter to enter it
const selectaMarca = page.locator('[aria-label="Selecciona Marca "]').first();
await selectaMarca.focus();
await page.waitForTimeout(500);

// Press Enter to enter the visual
await page.keyboard.press("Enter");
await page.waitForTimeout(1000);

// Tab through items, collecting aria-labels and brand names
const brands = [];
let maxAttempts = 60;

console.log("=== TABBING THROUGH VISUAL ITEMS ===");
for (let i = 0; i < maxAttempts; i++) {
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    return {
      tag: el.tagName,
      aria: el.getAttribute("aria-label"),
      role: el.getAttribute("role"),
      text: el.textContent?.trim().slice(0, 80),
    };
  });

  if (!focused) break;

  // Check if we've left the visual (focus went elsewhere)
  if (focused.aria && !focused.aria.startsWith("Selecciona Marca") &&
      focused.aria !== "Selecciona Marca " &&
      !["Marca", "Selecciona Marca"].includes(focused.aria)) {

    // This might be a brand item!
    const ariaLower = (focused.aria || "").toLowerCase();
    if (!ariaLower.includes("marcador") && !ariaLower.includes("navegaci") &&
        !ariaLower.includes("filtros") && !ariaLower.includes("explorador") &&
        focused.tag !== "A") {
      console.log(`  [${i}] ${focused.tag} role="${focused.role}" aria="${focused.aria}"`);
      brands.push(focused.aria);
    }
  } else if (i > 5) {
    // We may have cycled back
    console.log(`  [${i}] Back to: ${focused.aria?.slice(0, 50)}`);
    break;
  }

  await page.keyboard.press("Tab");
  await page.waitForTimeout(200);
}

console.log(`\nFound ${brands.length} potential brand items via keyboard`);

// If keyboard didn't work, try coordinate-based grid clicking
console.log("\n=== COORDINATE-BASED GRID CLICKING ===");
// Try a 3-column, N-row grid
// Based on: clicking (588, 527) = center of visual = selected Porsche
// Grid layout: 3 columns, each ~150px wide, rows ~60px tall
const COLS = 3;
const ROWS = 10;
const cellW = VIS.w / COLS;  // 150px
const cellH = (VIS.h - 60) / ROWS;  // ~57px (leaving some header space)
const headerH = 40; // estimated header height

const results = {};

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const cx = VIS.x + col * cellW + cellW / 2;
    const cy = VIS.y + headerH + row * cellH + cellH / 2;

    // Get KPIs before
    const before = await readKPIs();

    // Click at this position
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(1500);

    // Get KPIs after
    const after = await readKPIs();

    // Check what brand is now selected by looking at aria-labels
    const ariaLabels = new Set();
    for (const f of [page, ...page.frames()]) {
      try {
        const ls = await f.evaluate(() =>
          [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
        );
        ls.forEach(l => ariaLabels.add(l));
      } catch {}
    }

    // Find brand-related aria label
    let brandLabel = null;
    for (const l of ariaLabels) {
      if (l.match(/^[A-ZÁÉÍÓÚÜÑ\s./-]{2,25}$/) && !["Marca", "BEV", "PHEV", "Inicio"].includes(l)) {
        const mTop = l.match(/^Top Modelo\s+(.+)$/i);
        if (mTop) { brandLabel = mTop[1]; break; }
      }
      // Top Modelo changes per brand selection
      const mTop = l.match(/Top Modelo\s+(.+)\./i);
      if (mTop && mTop[1].length < 30) { brandLabel = `modelo:${mTop[1]}`; break; }
    }

    const changed = after.bev !== before.bev || after.phev !== before.phev || after.total !== before.total;
    if (changed || after.bev > 0 || after.total > 0) {
      console.log(`  (${row},${col}) x=${cx.toFixed(0)} y=${cy.toFixed(0)}: BEV=${after.bev} PHEV=${after.phev} Total=${after.total}${brandLabel ? ` [${brandLabel}]` : ""}`);

      // Find brand name from selected state
      const topModelo = [...ariaLabels].find(l => l.startsWith("Top Modelo "));
      if (topModelo) {
        results[`${row}_${col}`] = { bev: after.bev, phev: after.phev, total: after.total, topModelo };
      }
    }

    // Deselect by clicking again
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(800);
  }
}

// Also try clicking at different x positions
console.log("\n=== SAMPLING Y-AXIS (x=380, different y values) ===");
for (let y = 230; y <= 830; y += 30) {
  await page.mouse.click(380, y);
  await page.waitForTimeout(1200);

  const after = await readKPIs();
  const ariaLabels = new Set();
  for (const f of [page, ...page.frames()]) {
    try {
      const ls = await f.evaluate(() =>
        [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
      );
      ls.forEach(l => ariaLabels.add(l));
    } catch {}
  }

  const topModelo = [...ariaLabels].find(l => l.startsWith("Top Modelo "));
  const marca = [...ariaLabels].find(l => l === "Marca" || l.match(/^[A-Z]{2,}( [A-Z.]+)*$/));

  if (after.bev > 0 && after.bev < 25000) { // Changed from global
    console.log(`  y=${y}: BEV=${after.bev} PHEV=${after.phev} Total=${after.total} topModelo=${topModelo?.slice(0,50)}`);
  }

  // Deselect
  await page.mouse.click(380, y);
  await page.waitForTimeout(500);
}

await br.close();
console.log("\n✅ Done");
