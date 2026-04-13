/**
 * diagnose-aedive.mjs
 * Vuelca TODOS los ARIA labels de cada vista del Power BI para entender
 * el formato real antes de parsear.
 *
 * Uso: node scripts/diagnose-aedive.mjs
 * Salida: scripts/scrape-output/diagnose-[fecha].json
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, "..");
const SS_DIR  = join(ROOT, "scripts/screenshots");
const OUT_DIR = join(ROOT, "scripts/scrape-output");

const URL = "https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9";

mkdirSync(SS_DIR,  { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1400, height: 900 },
  locale: "es-ES",
});
const page = await context.newPage();
const results = {};

async function dumpAll(label) {
  // 1. Todos los aria-label del DOM principal
  const ariaMain = await page.evaluate(() =>
    [...document.querySelectorAll("[aria-label]")]
      .map(e => e.getAttribute("aria-label"))
      .filter(Boolean)
  );

  // 2. Todo el texto visible en la página
  const visibleText = await page.evaluate(() =>
    [...document.querySelectorAll("*")]
      .filter(e => e.children.length === 0 && e.textContent.trim().length > 1)
      .map(e => e.textContent.trim())
      .filter((t, i, a) => a.indexOf(t) === i)  // unique
      .slice(0, 300)
  );

  // 3. ARIA labels dentro de todos los iframes accesibles
  const iframeAria = [];
  for (const frame of page.frames()) {
    try {
      const labels = await frame.evaluate(() =>
        [...document.querySelectorAll("[aria-label]")]
          .map(e => e.getAttribute("aria-label"))
          .filter(Boolean)
      );
      if (labels.length > 0) iframeAria.push(...labels);
    } catch { /* cross-origin o no accesible */ }
  }

  results[label] = { ariaMain, iframeAria, visibleText };
  console.log(`[${label}] ariaMain:${ariaMain.length} iframeAria:${iframeAria.length} visible:${visibleText.length}`);
}

async function navigateTo(tabText) {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(5000);
  try {
    await page.getByText(tabText, { exact: false }).first().click({ timeout: 8000 });
    await page.waitForTimeout(7000);
  } catch { console.log(`  ⚠ Tab "${tabText}" no encontrado`); }
}

// ── 1. Estado inicial (home) ────────────────────────────────────────────────
console.log("\n[1] Home / estado inicial...");
await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: join(SS_DIR, "diag-home.png") });
await dumpAll("home");

// ── 2. Evolución por Años — seleccionar 2025 + keyboard sweep ──────────────
console.log("\n[2] Evolución por Años (2025)...");
await navigateTo("Evolución por Años");
await page.screenshot({ path: join(SS_DIR, "diag-evolucion.png") });

// Intentar seleccionar 2025 en slicer
try {
  const slicer = page.frameLocator("iframe.visual-sandbox").nth(0);
  await slicer.locator(".slicerText", { hasText: "2025" }).first().click({ timeout: 5000 });
  await page.waitForTimeout(3000);
} catch { console.log("  ⚠ Slicer 2025 no encontrado"); }

await page.mouse.click(700, 530);
await page.waitForTimeout(400);
await page.keyboard.press("Enter");
await page.waitForTimeout(600);
for (let i = 0; i < 14; i++) {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
}
await page.screenshot({ path: join(SS_DIR, "diag-evolucion-post.png") });
await dumpAll("evolucion_2025");

// ── 3. Segmentación por Marcas — seleccionar 2025 + keyboard sweep ─────────
console.log("\n[3] Segmentación por Marcas (2025)...");
await navigateTo("Segmentación por Marcas");
await page.screenshot({ path: join(SS_DIR, "diag-marcas-pre.png") });

// Intentar seleccionar 2025 en slicer (probar iframes 0-3)
for (let nth = 0; nth <= 3; nth++) {
  try {
    const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
    const span = slicer.locator(".slicerText", { hasText: "2025" }).first();
    if (await span.isVisible({ timeout: 2000 })) {
      await span.click();
      await page.waitForTimeout(3000);
      console.log(`  Slicer 2025 clickeado en iframe[${nth}]`);
      break;
    }
  } catch { /* ignorar */ }
}

await page.screenshot({ path: join(SS_DIR, "diag-marcas-2025.png") });

// Keyboard sweep en varios puntos del gráfico
for (const [cx, cy] of [[400,400],[700,400],[700,500],[700,600]]) {
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
  }
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(150);
  }
}

await page.screenshot({ path: join(SS_DIR, "diag-marcas-post.png") });
await dumpAll("marcas_2025");

// ── 4. Segmentación por Provincias ─────────────────────────────────────────
console.log("\n[4] Segmentación por Provincias...");
await navigateTo("Segmentación por Provincias");
await page.screenshot({ path: join(SS_DIR, "diag-provincias.png") });

await page.mouse.click(700, 500);
await page.waitForTimeout(400);
await page.keyboard.press("Enter");
await page.waitForTimeout(600);
for (let i = 0; i < 60; i++) {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
}
await dumpAll("provincias");

// ── Guardar todo ───────────────────────────────────────────────────────────
await browser.close();

const outPath = join(OUT_DIR, `diagnose-${new Date().toISOString().split("T")[0]}.json`);
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\n✅ Diagnóstico guardado: ${outPath}`);
console.log("\n── Muestra de labels de marcas_2025 ──");
const sample = [
  ...(results.marcas_2025?.ariaMain  ?? []).filter(l => l.length > 5).slice(0, 30),
  ...(results.marcas_2025?.iframeAria ?? []).filter(l => l.length > 5).slice(0, 30),
];
sample.forEach(l => console.log(" ", l));
