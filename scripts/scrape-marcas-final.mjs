/**
 * scrape-marcas-final.mjs
 * Extrae BEV + PHEV por marca y año desde "Segmentación por Marcas" de AEDIVE.
 *
 * Estrategia:
 *   1. Para cada año: seleccionar año en slicer
 *   2. Leer lista de marcas disponibles en el slicer de marcas
 *   3. Clickear cada marca → leer KPI BEV, PHEV, Total
 *   4. Derivar datos anuales por marca
 *
 * Uso:
 *   node scripts/scrape-marcas-final.mjs
 *   node scripts/scrape-marcas-final.mjs --dry-run
 *   node scripts/scrape-marcas-final.mjs --years=2025
 */
import { chromium } from "playwright";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, "..");
const SS_DIR  = join(ROOT, "scripts/screenshots");
const OUT_DIR = join(ROOT, "scripts/scrape-output");
const TS_MARCAS = join(ROOT, "app/lib/insights/marcas-data.ts");
mkdirSync(SS_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const URL = "https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9";
const DRY_RUN  = process.argv.includes("--dry-run");
const YEARS_ARG = process.argv.find(a => a.startsWith("--years="));
const YEARS = YEARS_ARG
  ? YEARS_ARG.split("=")[1].split(",").map(Number)
  : [2020, 2021, 2022, 2023, 2024, 2025, 2026];

function parseNum(s) {
  return parseInt(String(s).replace(/[.\s]/g,"").replace(",",".")) || 0;
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 },
  locale: "es-ES",
});
const page = await ctx.newPage();

async function allAria() {
  const sets = [];
  for (const f of [page, ...page.frames()]) {
    try {
      const ls = await f.evaluate(() =>
        [...document.querySelectorAll("[aria-label]")].map(e=>e.getAttribute("aria-label")).filter(Boolean)
      );
      sets.push(...ls);
    } catch {}
  }
  return [...new Set(sets)];
}

async function goToMarcas() {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(5000);
  await page.getByText("Segmentación por Marcas", { exact: false }).first().click({ timeout: 10_000 });
  await page.waitForTimeout(7000);
}

// Leer KPI cards de la página: BEV, PHEV, Total, %Cambio
async function readKPIs() {
  const labels = await allAria();
  let bev = 0, phev = 0, total = 0, cambio = null;

  for (const l of labels) {
    // "Cat BEV. Suma de Unidades 20.449 (61,30%)."
    const mBev = l.match(/Cat BEV\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (mBev) bev = parseNum(mBev[1]);

    const mPhev = l.match(/Cat PHEV\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (mPhev) phev = parseNum(mPhev[1]);

    // "Matriculaciones 20.449."
    const mTot = l.match(/Matriculaciones\s+([\d.]+)/i);
    if (mTot) total = parseNum(mTot[1]);

    // "%Cambio (selección) 71,8 %."
    const mCambio = l.match(/%Cambio.*?([\d,]+)\s*%/i);
    if (mCambio) cambio = parseFloat(mCambio[1].replace(",","."));
  }

  // Si tenemos total pero no bev/phev, intentar con porcentaje visible
  if (total > 0 && bev === 0 && phev === 0) {
    for (const l of labels) {
      const m = l.match(/Cat BEV.*?([\d,]+)\s*%/i);
      if (m) { const pct = parseFloat(m[1].replace(",",".")); bev = Math.round(total * pct / 100); phev = total - bev; }
    }
  }

  return { bev, phev, total: total || bev + phev, cambio };
}

const resultsByYear = {};

for (const año of YEARS) {
  console.log(`\n📅 Procesando ${año}...`);
  await goToMarcas();

  // 1. Seleccionar año en slicer iframe[0]
  let yearOk = false;
  for (let nth = 0; nth <= 2; nth++) {
    try {
      const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
      const span = slicer.locator(".slicerText", { hasText: String(año) }).first();
      if (await span.isVisible({ timeout: 2000 })) {
        await span.click();
        await page.waitForTimeout(3000);
        yearOk = true;
        console.log(`  ✓ Año ${año} en slicer[${nth}]`);
        break;
      }
    } catch {}
  }
  if (!yearOk) { console.log(`  ⚠ Año ${año}: slicer no encontrado, saltando`); continue; }

  await page.screenshot({ path: join(SS_DIR, `marcas-year-${año}.png`) });

  // 2. Leer lista de marcas disponibles en slicer de marcas
  //    Buscar en todos los iframes el slicer que tenga texto de marcas conocidas
  let brandNames = [];
  for (let nth = 0; nth <= 5; nth++) {
    try {
      const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
      const texts = await slicer.locator(".slicerText").allTextContents();
      // Filtrar textos que parezcan marcas (no años, no meses)
      const filtered = texts
        .map(t => t.trim())
        .filter(t => t.length > 1 && !/^\d{4}$/.test(t) && !/^(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)$/i.test(t));
      if (filtered.length > 3) {
        brandNames = filtered;
        console.log(`  ✓ ${filtered.length} marcas en slicer[${nth}]: ${filtered.slice(0,8).join(", ")}${filtered.length>8?"…":""}`);
        break;
      }
    } catch {}
  }

  if (brandNames.length === 0) {
    console.log(`  ⚠ No se encontraron marcas en slicer, intentando extracción directa`);
    // Fallback: extraer de aria labels
    const labels = await allAria();
    const marcaLabels = labels.filter(l => /^[A-Z][A-Z.\s-]{2,}$/.test(l) && l.length < 30);
    brandNames = marcaLabels.slice(0, 30);
    console.log(`  Fallback marcas: ${brandNames.join(", ")}`);
  }

  if (brandNames.length === 0) {
    console.log(`  ✗ Sin marcas — saltando ${año}`);
    continue;
  }

  // 3. Para cada marca: clickear + leer KPIs
  const marcasData = {};
  for (const marca of brandNames) {
    // Buscar el slicer con esta marca y clickear
    let clicked = false;
    for (let nth = 0; nth <= 5; nth++) {
      try {
        const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
        const span = slicer.locator(".slicerText", { hasText: marca }).first();
        if (await span.isVisible({ timeout: 1500 })) {
          await span.click();
          await page.waitForTimeout(2000);
          clicked = true;
          break;
        }
      } catch {}
    }

    if (!clicked) { console.log(`    ⚠ ${marca}: no clickeable`); continue; }

    const kpis = await readKPIs();
    if (kpis.total > 0 || kpis.bev > 0 || kpis.phev > 0) {
      marcasData[marca] = kpis;
      console.log(`    ${marca}: BEV=${kpis.bev} PHEV=${kpis.phev} Total=${kpis.total}`);
    } else {
      console.log(`    ${marca}: sin datos`);
    }

    // Deseleccionar marca
    for (let nth = 0; nth <= 5; nth++) {
      try {
        const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
        const span = slicer.locator(".slicerText", { hasText: marca }).first();
        if (await span.isVisible({ timeout: 1000 })) { await span.click(); await page.waitForTimeout(500); break; }
      } catch {}
    }
  }

  if (Object.keys(marcasData).length > 0) {
    resultsByYear[año] = marcasData;
    console.log(`  ✅ ${año}: ${Object.keys(marcasData).length} marcas capturadas`);
  } else {
    console.log(`  ✗ ${año}: 0 marcas con datos`);
  }
}

await browser.close();

// ── Guardar resultados ──────────────────────────────────────────────────────
const datestamp = new Date().toISOString().split("T")[0];
const rawPath = join(OUT_DIR, `marcas-raw-${datestamp}.json`);
writeFileSync(rawPath, JSON.stringify(resultsByYear, null, 2));
console.log(`\n💾 Raw JSON: ${rawPath}`);

// ── Generar topMarcasPorAño ─────────────────────────────────────────────────
const years = Object.keys(resultsByYear).map(Number).sort((a,b)=>b-a);
console.log(`\n📊 Resumen:`);
for (const año of years) {
  const marcas = resultsByYear[año];
  const total = Object.values(marcas).reduce((s,m)=>s+m.total,0);
  console.log(`  ${año}: ${Object.keys(marcas).length} marcas, ${total.toLocaleString("es")} unidades totales`);
}

if (!DRY_RUN && years.length > 0) {
  // Actualizar marcas-data.ts
  let content = readFileSync(TS_MARCAS, "utf8");

  const entries = years.map(año => {
    const marcasAño = Object.entries(resultsByYear[año])
      .sort(([,a],[,b]) => (b.bev+b.phev) - (a.bev+a.phev))
      .map(([marca, d]) => `      { marca: ${JSON.stringify(marca)}, bev: ${d.bev}, phev: ${d.phev} },`)
      .join("\n");
    return `  {\n    año: ${año},\n    fuente: "AEDIVE",\n    marcas: [\n${marcasAño}\n    ],\n  },`;
  }).join("\n");

  const newArray = `export const topMarcasPorAño: MarcasPorAñoEntry[] = [\n${entries}\n  // TODO: añadir años anteriores cuando estén disponibles\n];`;
  const arrayRegex = /export const topMarcasPorAño[\s\S]*?^\];/m;
  content = arrayRegex.test(content) ? content.replace(arrayRegex, newArray) : content + "\n" + newArray + "\n";

  // Actualizar topMarcas con el año más reciente
  const añoBase = years.find(a => Object.keys(resultsByYear[a]).length >= 5) ?? years[0];
  if (añoBase) {
    const top = Object.entries(resultsByYear[añoBase])
      .sort(([,a],[,b]) => (b.bev+b.phev) - (a.bev+a.phev))
      .slice(0, 10)
      .map(([marca, d]) => `  { marca: ${JSON.stringify(marca)}, bev: ${d.bev}, phev: ${d.phev} },`)
      .join("\n");
    content = content.replace(/export const topMarcas = \[[\s\S]*?\];/, `export const topMarcas = [\n${top}\n];`);
  }

  writeFileSync(TS_MARCAS, content);
  console.log(`\n✅ Actualizado: ${TS_MARCAS}`);
} else if (DRY_RUN) {
  console.log("\n[DRY RUN] marcas-data.ts NO actualizado.");
}

console.log("\n✨ Terminado.");
