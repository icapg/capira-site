/**
 * scrape-marcas-v2.mjs
 * Extrae BEV + PHEV por marca y año desde "Segmentación por Marcas" de AEDIVE.
 *
 * Estrategia correcta (basada en diagnóstico):
 *   1. Seleccionar año en slicer iframe[0]
 *   2. Clickear "Selecciona Marca" → abre picker de marcas
 *   3. Para cada marca: clickearla → leer KPI "Cat BEV / Cat PHEV / Matriculaciones"
 *   4. Guardar y actualizar marcas-data.ts
 *
 * Uso:
 *   node scripts/scrape-marcas-v2.mjs
 *   node scripts/scrape-marcas-v2.mjs --dry-run
 *   node scripts/scrape-marcas-v2.mjs --years=2025
 */
import { chromium } from "playwright";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const SS_DIR    = join(ROOT, "scripts/screenshots");
const OUT_DIR   = join(ROOT, "scripts/scrape-output");
const TS_MARCAS = join(ROOT, "app/lib/insights/marcas-data.ts");
mkdirSync(SS_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const URL      = "https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9";
const DRY_RUN  = process.argv.includes("--dry-run");
const YEARS_ARG = process.argv.find(a => a.startsWith("--years="));
const YEARS    = YEARS_ARG
  ? YEARS_ARG.split("=")[1].split(",").map(Number)
  : [2020, 2021, 2022, 2023, 2024, 2025, 2026];

function parseNum(s) {
  return parseInt(String(s).replace(/[.\s]/g, "").replace(",", ".")) || 0;
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 },
  locale: "es-ES",
});
const page = await ctx.newPage();

// Leer todos los aria-labels de la página + iframes
async function allAria() {
  const seen = new Set();
  for (const f of [page, ...page.frames()]) {
    try {
      const ls = await f.evaluate(() =>
        [...document.querySelectorAll("[aria-label]")]
          .map(e => e.getAttribute("aria-label")).filter(Boolean)
      );
      ls.forEach(l => seen.add(l));
    } catch {}
  }
  return [...seen];
}

// Leer KPI cards: BEV, PHEV, Total
async function readKPIs() {
  await page.waitForTimeout(1500);
  const labels = await allAria();
  let bev = 0, phev = 0, total = 0;

  for (const l of labels) {
    const mBev  = l.match(/Cat BEV\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (mBev) bev = parseNum(mBev[1]);

    const mPhev = l.match(/Cat PHEV\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (mPhev) phev = parseNum(mPhev[1]);

    const mTot  = l.match(/Matriculaciones\s+([\d.]+)/i);
    if (mTot) total = parseNum(mTot[1]);
  }

  // Fallback: leer porcentajes del texto visible y aplicar sobre total
  if (total > 0 && bev === 0) {
    for (const l of labels) {
      const m = l.match(/Cat BEV.*?([\d,]+)\s*%/i);
      if (m) {
        const pct = parseFloat(m[1].replace(",", "."));
        bev  = Math.round(total * pct / 100);
        phev = total - bev;
        break;
      }
    }
  }

  return { bev, phev, total: total || bev + phev };
}

async function goToMarcas() {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(5000);
  await page.getByText("Segmentación por Marcas", { exact: false }).first().click({ timeout: 10_000 });
  await page.waitForTimeout(8000);
}

// Leer la tabla visible de marcas (sin necesidad de dropdown)
async function readVisibleBrands() {
  const text = await page.evaluate(() =>
    [...document.querySelectorAll("*")]
      .filter(e => e.children.length === 0 && e.textContent.trim().length > 1 && e.textContent.trim().length < 40)
      .map(e => e.textContent.trim())
      .filter((t, i, a) => a.indexOf(t) === i)
      .filter(t => !/function|var |const |<|>|{|}/.test(t))
  );

  // Marcas = texto en MAYÚSCULAS de 2-20 chars que no sean números ni palabras clave
  const keywords = new Set(["BEV","PHEV","DATOS","INICIO","URL","FILTROS","MARCA","CAT","MES","AÑO",
    "DICIEMBRE","NOVIEMBRE","OCTUBRE","SEPTIEMBRE","AGOSTO","JULIO","JUNIO","MAYO",
    "ABRIL","MARZO","FEBRERO","ENERO","CANAL","EMPRESA","PARTICULAR","RENTING"]);

  return text.filter(t =>
    /^[A-ZÁÉÍÓÚÜÑ\s./-]{2,20}$/.test(t) &&
    !keywords.has(t.trim()) &&
    !/^\d+$/.test(t) &&
    t.trim().length >= 2
  );
}

const resultsByYear = {};

for (const año of YEARS) {
  console.log(`\n📅 ${año}...`);
  await goToMarcas();

  // 1. Seleccionar año
  let yearOk = false;
  for (let nth = 0; nth <= 2; nth++) {
    try {
      const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
      const span = slicer.locator(".slicerText", { hasText: String(año) }).first();
      if (await span.isVisible({ timeout: 2000 })) {
        await span.click();
        await page.waitForTimeout(3000);
        yearOk = true;
        break;
      }
    } catch {}
  }
  if (!yearOk) { console.log(`  ⚠ Año ${año} no disponible`); continue; }

  // Limpiar selección de mes (clickear "Borrar selecciones" si existe)
  try {
    const clearBtn = page.locator('[aria-label*="Borrar selecciones"]').first();
    if (await clearBtn.isVisible({ timeout: 1500 })) {
      await clearBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}

  await page.screenshot({ path: join(SS_DIR, `v2-${año}-base.png`) });

  // 2. Leer KPI totales sin marca seleccionada
  const totalKPIs = await readKPIs();
  console.log(`  Total ${año}: BEV=${totalKPIs.bev} PHEV=${totalKPIs.phev} Total=${totalKPIs.total}`);

  // 3. Abrir picker "Selecciona Marca"
  let brandNames = [];
  try {
    // El botón está en el DOM principal (no iframe)
    const btn = page.locator('[aria-label="Selecciona Marca "]').first();
    if (await btn.isVisible({ timeout: 3000 })) {
      await btn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: join(SS_DIR, `v2-${año}-picker.png`) });

      // Leer opciones del picker abierto
      const opts = await page.locator('[role="option"], [role="listitem"], .brand-item, .slicer-item').allTextContents().catch(() => []);
      console.log(`  Picker opciones raw: ${opts.slice(0,10).join(" | ")}`);

      // También leer aria-labels del picker
      const pickerAria = await allAria();
      const marcaOpts = pickerAria.filter(l => /^[A-ZÁÉÍÓÚÜÑ\s./-]{2,25}$/.test(l) && !/^\d/.test(l));
      console.log(`  Picker aria marcas: ${marcaOpts.slice(0,10).join(" | ")}`);

      brandNames = [...new Set([...opts, ...marcaOpts])]
        .map(s => s.trim())
        .filter(s => s.length >= 2 && s.length <= 25 && !/^\d+$/.test(s));

      // Cerrar picker con Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    } else {
      console.log(`  Picker "Selecciona Marca" no visible — usando tabla visible`);
    }
  } catch (e) {
    console.log(`  ⚠ Error en picker: ${e.message}`);
  }

  // 4. Fallback: leer marcas de la tabla visible
  if (brandNames.length === 0) {
    brandNames = await readVisibleBrands();
    console.log(`  Marcas de tabla visible: ${brandNames.slice(0,10).join(", ")}`);
  }

  if (brandNames.length === 0) {
    console.log(`  ✗ Sin marcas detectadas`);
    continue;
  }

  console.log(`  → ${brandNames.length} marcas a procesar`);

  // 5. Para cada marca: clickear en la tabla y leer KPIs
  const marcasData = {};
  for (const marca of brandNames.slice(0, 40)) {
    try {
      // Buscar el texto de la marca en la página y clickearlo
      const el = page.locator(`text="${marca}"`).first();
      if (!(await el.isVisible({ timeout: 1000 }))) continue;

      await el.click();
      await page.waitForTimeout(1800);

      const kpis = await readKPIs();
      if (kpis.total > 0 || kpis.bev > 0 || kpis.phev > 0) {
        // Normalizar nombre de marca
        const marcaNorm = marca.trim().toUpperCase()
          .replace(/B\.M\.W\./g, "BMW")
          .replace(/\bMG\b/g, "MG");
        marcasData[marcaNorm] = kpis;
        console.log(`    ${marcaNorm}: BEV=${kpis.bev} PHEV=${kpis.phev} Total=${kpis.total}`);
      }

      // Deseleccionar clickeando de nuevo
      await el.click();
      await page.waitForTimeout(800);
    } catch { /* ignorar */ }
  }

  if (Object.keys(marcasData).length > 0) {
    resultsByYear[año] = marcasData;
    console.log(`  ✅ ${año}: ${Object.keys(marcasData).length} marcas`);
  } else {
    console.log(`  ✗ ${año}: 0 marcas con datos`);
  }
}

await browser.close();

// ── Guardar raw JSON ─────────────────────────────────────────────────────────
const datestamp = new Date().toISOString().split("T")[0];
const rawPath = join(OUT_DIR, `marcas-v2-${datestamp}.json`);
writeFileSync(rawPath, JSON.stringify(resultsByYear, null, 2));
console.log(`\n💾 Raw: ${rawPath}`);

const years = Object.keys(resultsByYear).map(Number).sort((a,b)=>b-a);
console.log(`\n📊 Resumen:`);
for (const año of years) {
  const m = resultsByYear[año];
  const tot = Object.values(m).reduce((s,v)=>s+v.total,0);
  console.log(`  ${año}: ${Object.keys(m).length} marcas · ${tot.toLocaleString("es")} uds`);
  Object.entries(m).slice(0,5).forEach(([k,v]) => console.log(`    ${k}: BEV=${v.bev} PHEV=${v.phev}`));
}

if (!DRY_RUN && years.length > 0) {
  let content = readFileSync(TS_MARCAS, "utf8");

  const entries = years.map(año => {
    const marcas = Object.entries(resultsByYear[año])
      .sort(([,a],[,b]) => (b.bev+b.phev)-(a.bev+a.phev))
      .map(([marca,d]) => `      { marca: ${JSON.stringify(marca)}, bev: ${d.bev}, phev: ${d.phev} },`)
      .join("\n");
    return `  {\n    año: ${año},\n    fuente: "AEDIVE",\n    marcas: [\n${marcas}\n    ],\n  },`;
  }).join("\n");

  const newArray = `export const topMarcasPorAño: MarcasPorAñoEntry[] = [\n${entries}\n];`;
  const regex = /export const topMarcasPorAño[\s\S]*?^\];/m;
  content = regex.test(content) ? content.replace(regex, newArray) : content + "\n" + newArray + "\n";

  // topMarcas = top 10 del año más reciente completo
  const añoBase = years.find(a => Object.keys(resultsByYear[a]).length >= 5);
  if (añoBase) {
    const top = Object.entries(resultsByYear[añoBase])
      .sort(([,a],[,b]) => (b.bev+b.phev)-(a.bev+a.phev))
      .slice(0,10)
      .map(([m,d]) => `  { marca: ${JSON.stringify(m)}, bev: ${d.bev}, phev: ${d.phev} },`)
      .join("\n");
    content = content.replace(/export const topMarcas = \[[\s\S]*?\];/, `export const topMarcas = [\n${top}\n];`);
  }

  writeFileSync(TS_MARCAS, content);
  console.log(`\n✅ ${TS_MARCAS} actualizado`);
} else {
  console.log("\n[DRY RUN] marcas-data.ts NO actualizado.");
}

console.log("\n✨ Terminado.");
