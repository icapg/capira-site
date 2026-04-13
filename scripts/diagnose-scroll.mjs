/**
 * diagnose-scroll.mjs
 * Try to scroll/navigate the Image Grid to find more brands
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

function parseNum(s) { return parseInt(String(s).replace(/[.\s]/g, "")) || 0; }
const VIS = { x: 363, y: 214, w: 450, h: 627 };

async function readKPIs() {
  await page.waitForTimeout(1200);
  const labels = new Set();
  for (const f of [page, ...page.frames()]) {
    try {
      const ls = await f.evaluate(() =>
        [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
      );
      ls.forEach(l => labels.add(l));
    } catch {}
  }
  let bev = 0, phev = 0, total = 0, topModelo = null;
  for (const l of labels) {
    const mBev = l.match(/Cat BEV\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (mBev) bev = parseNum(mBev[1]);
    const mPhev = l.match(/Cat PHEV\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (mPhev) phev = parseNum(mPhev[1]);
    const mTot = l.match(/Matriculaciones\s+([\d.]+)/i);
    if (mTot) total = parseNum(mTot[1]);
    const mTop = l.match(/^Top Modelo\s+(.+?)\./i);
    if (mTop) topModelo = mTop[1].trim();
  }
  return { bev, phev, total: total || bev + phev, topModelo };
}

// Global KPIs
const g = await readKPIs();
console.log(`Global: BEV=${g.bev} Total=${g.total} topModelo=${g.topModelo}`);

// Try 1: Click inside visual + Down arrow navigation
console.log("\n=== TEST 1: Click first cell + Arrow keys ===");
// Click first brand cell (BYD at row 0, col 0)
const firstX = VIS.x + VIS.w/3/2;  // col 0 center = 363 + 75 = 438
const firstY = VIS.y + 50 + 65/2;  // first row center
await page.mouse.click(firstX, firstY);
await page.waitForTimeout(1200);
const k1 = await readKPIs();
console.log(`After click (${firstX.toFixed(0)},${firstY.toFixed(0)}): BEV=${k1.bev} PHEV=${k1.phev} topModelo=${k1.topModelo}`);

// Try arrow keys
for (const key of ["ArrowRight", "ArrowRight", "ArrowDown", "ArrowDown", "ArrowLeft"]) {
  await page.keyboard.press(key);
  await page.waitForTimeout(800);
  const k = await readKPIs();
  const changed = k.bev !== k1.bev || k.topModelo !== k1.topModelo;
  console.log(`  ${key}: BEV=${k.bev} PHEV=${k.phev} topModelo=${k.topModelo} ${changed ? "←CHANGED" : ""}`);
}

// Deselect
await page.mouse.click(firstX, firstY);
await page.waitForTimeout(500);

// Try 2: Enter keyboard navigation mode via Ctrl+Enter
console.log("\n=== TEST 2: Ctrl+Enter on visual ===");
const selectaMarca = page.locator('[aria-label="Selecciona Marca "]').first();
await selectaMarca.focus();
await page.waitForTimeout(500);
await page.keyboard.press("Control+Enter");
await page.waitForTimeout(1000);

// Navigate with arrows
for (const key of ["ArrowRight", "ArrowRight", "ArrowDown", "ArrowDown", "ArrowDown"]) {
  await page.keyboard.press(key);
  await page.waitForTimeout(600);
}
const k2 = await readKPIs();
console.log(`After Ctrl+Enter + arrows: BEV=${k2.bev} PHEV=${k2.phev} topModelo=${k2.topModelo}`);

await page.keyboard.press("Escape");
await page.waitForTimeout(500);

// Try 3: Look for scroll buttons by text content
console.log("\n=== TEST 3: Find scroll buttons by text ===");
const scrollButtons = await page.evaluate(() => {
  const texts = ["Desplazarse hacia abajo", "Desplazarse hacia arriba", "Desplazar a la derecha", "Desplazar a la izquierda"];
  const found = [];
  for (const text of texts) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim() === text) {
        const el = node.parentElement;
        const bbox = el.getBoundingClientRect();
        found.push({
          text,
          tag: el.tagName,
          role: el.getAttribute("role"),
          class: el.className?.toString().slice(0, 50),
          clickable: el.onclick !== null || el.tagName === "BUTTON",
          x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height,
          html: el.outerHTML.slice(0, 200),
        });
        break;
      }
    }
  }
  return found;
});
scrollButtons.forEach(b => {
  console.log(`  "${b.text}": ${b.tag} role=${b.role} at (${b.x.toFixed(0)},${b.y.toFixed(0)},${b.w.toFixed(0)}x${b.h.toFixed(0)})`);
  console.log(`    html: ${b.html}`);
});

// Try 4: Click "Desplazar a la derecha" or "Desplazarse hacia abajo" if found
for (const btn of scrollButtons) {
  if (btn.text === "Desplazarse hacia abajo" || btn.text === "Desplazar a la derecha") {
    const cx = btn.x + btn.w/2;
    const cy = btn.y + btn.h/2;
    console.log(`\n=== TEST 4: Clicking "${btn.text}" at (${cx.toFixed(0)},${cy.toFixed(0)}) ===`);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(SS, `scroll-after.png`) });

    // Scan first row after scroll
    for (let col = 0; col < 3; col++) {
      const cx2 = VIS.x + col * (VIS.w/3) + (VIS.w/3)/2;
      const cy2 = VIS.y + 50 + 65/2;
      await page.mouse.click(cx2, cy2);
      await page.waitForTimeout(1200);
      const kpis = await readKPIs();
      const isNew = kpis.bev !== g.bev && (kpis.bev > 0 || kpis.phev > 0);
      if (isNew) console.log(`  Row 0, Col ${col}: BEV=${kpis.bev} PHEV=${kpis.phev} topModelo=${kpis.topModelo}`);
      await page.mouse.click(cx2, cy2);
      await page.waitForTimeout(500);
    }
  }
}

// Try 5: Hover over visual and scroll
console.log("\n=== TEST 5: Hover + scroll wheel ===");
const cx = VIS.x + VIS.w/2;
const cy = VIS.y + VIS.h/2;
await page.mouse.move(cx, cy);
await page.waitForTimeout(500);

// Try different scroll amounts
for (const delta of [300, 500, 800]) {
  await page.mouse.wheel(0, delta);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(SS, `scroll-wheel-${delta}.png`) });

  // Check first row
  const firstCx = VIS.x + (VIS.w/3)/2;
  const firstCy = VIS.y + 50 + 32;
  await page.mouse.click(firstCx, firstCy);
  await page.waitForTimeout(1200);
  const kpis = await readKPIs();
  if (kpis.bev !== g.bev && kpis.topModelo) {
    console.log(`  After wheel(${delta}): first cell = BEV=${kpis.bev} topModelo=${kpis.topModelo}`);
  } else {
    console.log(`  After wheel(${delta}): no change in first cell`);
  }
  // Deselect
  await page.mouse.click(firstCx, firstCy);
  await page.waitForTimeout(300);
}

// Try 6: Check if the visual is inside an iframe that we can scroll
console.log("\n=== TEST 6: Scroll inside visual-sandbox iframe ===");
for (let nth = 0; nth <= 8; nth++) {
  try {
    const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);
    const body = iframe.locator("body");
    const scrollable = await body.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTop: el.scrollTop,
    })).catch(() => null);

    if (scrollable && scrollable.scrollHeight > scrollable.clientHeight) {
      console.log(`  iframe[${nth}] scrollable! scrollHeight=${scrollable.scrollHeight} clientHeight=${scrollable.clientHeight}`);
      // Scroll down
      await body.evaluate(el => el.scrollTop = 500).catch(() => {});
      await page.waitForTimeout(800);
    }
  } catch { break; }
}

// Try 7: Check total brands accessible via keyboard navigation in the iframe
console.log("\n=== TEST 7: Navigate the iframe keyboard ===");
// After clicking a cell, try using keyboard inside the iframe
await page.mouse.click(VIS.x + 438 - VIS.x, VIS.y + 282 - VIS.y);
await page.waitForTimeout(800);

// Try Tab navigation inside visual-sandbox iframes
for (let nth = 0; nth <= 8; nth++) {
  try {
    const iframe = page.frameLocator("iframe.visual-sandbox").nth(nth);
    const focusable = await iframe.locator("[tabindex], button, a, input, [role='button'], [role='option']").count().catch(() => 0);
    if (focusable > 5) {
      console.log(`  iframe[${nth}]: ${focusable} focusable elements`);
      const ariaItems = await iframe.locator("[aria-label]").evaluateAll(els =>
        els.map(e => e.getAttribute("aria-label")).filter(Boolean).slice(0, 10)
      ).catch(() => []);
      if (ariaItems.length) console.log(`    aria-labels: ${ariaItems.join(" | ")}`);
    }
  } catch { break; }
}

await br.close();
console.log("\n✅ Done");
