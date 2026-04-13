/**
 * scrape-marcas-v3.mjs
 *
 * Strategy (based on diagnostics):
 *   - "Selecciona Marca" visual is an Image Grid at bbox (363,214,450,627)
 *   - Clicking at (x,y) within the grid selects a brand and updates BEV/PHEV KPIs
 *   - Grid has 3 columns, ~60px per row, scrollable
 *   - Brand identified by "Top Modelo" aria-label after click
 *   - Scan dense grid → scroll → scan again → deduplicate by topModelo
 *
 * Usage:
 *   node scripts/scrape-marcas-v3.mjs
 *   node scripts/scrape-marcas-v3.mjs --dry-run
 *   node scripts/scrape-marcas-v3.mjs --years=2025
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

// "Selecciona Marca" visual bounding box (from diagnostic)
const VIS = { x: 363, y: 214, w: 450, h: 627 };

// Map top models to brand names
const MODEL_TO_BRAND = {
  // BYD
  "ATTO 2 DM-I": "BYD", "SEAL U DM-I": "BYD", "DOLPHIN SURF 5P": "BYD", "ATTO 2": "BYD", "HAN": "BYD",
  // Toyota
  "C-HR 2.0 220PH": "TOYOTA", "YARIS CROSS 1.5 GR SPORT": "TOYOTA", "RAV4 2.5 PLUG-IN": "TOYOTA",
  // BMW
  "X3 2.0 (30e) G45": "BMW", "X1 1.5 XDRIVE (25e) U11": "BMW", "X5 3.0 (50e)": "BMW", "I4": "BMW",
  // VW
  "TIGUAN 1.5 E-HYBRID": "VOLKSWAGEN", "ID.3": "VOLKSWAGEN", "ID.4": "VOLKSWAGEN", "PASSAT 1.5 E-HYBRID": "VOLKSWAGEN",
  // SEAT/CUPRA
  "TERRAMAR 1.5 PHEV": "SEAT", "ARONA 1.5 E-HYBRID": "SEAT", "ATECA 1.4 E-HYBRID": "SEAT",
  "FORMENTOR 1.5 E-HYBRID": "CUPRA", "TERRAMAR E-HYBRID": "CUPRA", "BORN": "CUPRA",
  // Hyundai
  "TUCSON 1.6 TGDI PHEV 4X2": "HYUNDAI", "IONIQ 5": "HYUNDAI", "IONIQ 6": "HYUNDAI", "KONA": "HYUNDAI",
  // Volvo
  "EX 30": "VOLVO", "XC40 RECHARGEABLE P8": "VOLVO", "XC60 2.0 T8 AWD PHEV": "VOLVO",
  // MG
  "MG HS 1.5 PHEV": "MG", "ZS EV": "MG",
  // Peugeot
  "E-2008": "PEUGEOT", "E-208": "PEUGEOT", "408 1.6 PHEV": "PEUGEOT",
  // Lexus
  "NX 450 H+": "LEXUS", "UX 300E": "LEXUS",
  // Porsche
  "CAYENNE S/E-HYBRID": "PORSCHE", "CAYENNE COUPE 3.0 E-HYBRID": "PORSCHE",
  // Tesla
  "MODEL 3 4P": "TESLA", "MODEL Y": "TESLA",
  // Ford
  "KUGA 2.5 PHEV 5P": "FORD", "EXPLORER": "FORD", "PUMA GEN-E": "FORD",
  // KIA
  "EV3": "KIA", "NIRO": "KIA", "EV6": "KIA", "SORENTO": "KIA",
  // Mercedes
  "GLA 250 E (247)": "MERCEDES", "GLC 300 DE 4M (254)": "MERCEDES", "A 250 E 5P (177)": "MERCEDES",
  "C 300 E 4M (206)": "MERCEDES", "E 300 DE (214)": "MERCEDES",
  // Renault
  "CAPTUR E-TECH 1.6 PHEV": "RENAULT", "MEGANE E-TECH": "RENAULT", "SCENIC E-TECH": "RENAULT",
  // Audi
  "A3 1.4 TFSI E": "AUDI", "Q5 55 TFSI E": "AUDI", "A6 55 TFSI E": "AUDI", "Q7 3.0 TFSI E": "AUDI",
  // Land Rover
  "RANGE ROVER SPORT 3.0 PHEV": "LAND ROVER", "RANGE ROVER EVOQUE 1.5 PHEV": "LAND ROVER",
  "DEFENDER 1.5 P400E": "LAND ROVER",
  // Dacia
  "SPRING E": "DACIA",
  // Fiat
  "500 E 3P/CAB": "FIAT",
  // Honda
  "CRV 2.0 i-MMD PHEV 4X2": "HONDA",
  // Lamborghini
  "URUS SE": "LAMBORGHINI",
  // Ferrari
  "296 SPECIALE COU": "FERRARI",
  // McLaren
  "ARTURA SPIDER": "MCLAREN",
  // Maserati
  "GRAN TURISMO FOLGORE COU": "MASERATI",
  // Smart
  "#1": "SMART",
  // Nissan
  "ARIYA": "NISSAN", "LEAF": "NISSAN",
  // Opel
  "ASTRA PHEV 5P": "OPEL", "GRANDLAND X 1.6 PHEV 4X4": "OPEL", "COMBO ELECTRIC": "OPEL",
  // Citroën
  "E-C4": "CITROËN", "C5 X 1.6 PHEV": "CITROËN",
};

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

async function allAria() {
  const labels = new Set();
  for (const f of [page, ...page.frames()]) {
    try {
      const ls = await f.evaluate(() =>
        [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
      );
      ls.forEach(l => labels.add(l));
    } catch {}
  }
  return [...labels];
}

async function readKPIs() {
  await page.waitForTimeout(1200);
  const labels = await allAria();
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

async function goToMarcas() {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(5000);
  await page.getByText("Segmentación por Marcas", { exact: false }).first().click({ timeout: 10_000 });
  await page.waitForTimeout(8000);
}

// Scroll the image grid down/up
async function scrollGrid(direction = "down") {
  const ariaLabel = direction === "down" ? "Desplazarse hacia abajo" : "Desplazarse hacia arriba";
  try {
    const btn = page.locator(`[aria-label="${ariaLabel}"]`).first();
    if (await btn.isVisible({ timeout: 1000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
      return true;
    }
  } catch {}
  // Fallback: scroll wheel within the visual
  await page.mouse.wheel(0, direction === "down" ? 200 : -200);
  await page.waitForTimeout(800);
  return true;
}

// Scan the image grid and collect all brand data visible
async function scanGrid(globalBev, globalTotal) {
  const found = new Map(); // topModelo → { bev, phev, total }
  const COLS = 3;
  const cellW = VIS.w / COLS;
  const headerH = 50;
  const cellH = 65;
  const rows = Math.floor((VIS.h - headerH) / cellH);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = VIS.x + col * cellW + cellW / 2;
      const cy = VIS.y + headerH + row * cellH + cellH / 2;

      await page.mouse.click(cx, cy);
      await page.waitForTimeout(1200);

      const kpis = await readKPIs();

      // Only record if brand-specific (not global values)
      const isGlobal = kpis.bev === globalBev || kpis.total === globalTotal;
      if (!isGlobal && kpis.topModelo && (kpis.bev > 0 || kpis.phev > 0 || kpis.total > 0)) {
        if (!found.has(kpis.topModelo)) {
          found.set(kpis.topModelo, { bev: kpis.bev, phev: kpis.phev, total: kpis.total });
        }
      }

      // Deselect
      await page.mouse.click(cx, cy);
      await page.waitForTimeout(500);
    }
  }
  return found;
}

const resultsByYear = {};

for (const año of YEARS) {
  console.log(`\n📅 Procesando ${año}...`);
  await goToMarcas();

  // Select year
  let yearOk = false;
  for (let nth = 0; nth <= 2; nth++) {
    try {
      const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
      const span = slicer.locator(".slicerText", { hasText: String(año) }).first();
      if (await span.isVisible({ timeout: 2000 })) {
        await span.click({ force: true });
        await page.waitForTimeout(3000);
        yearOk = true;
        console.log(`  ✓ Año ${año}`);
        break;
      }
    } catch {}
  }
  if (!yearOk) { console.log(`  ⚠ Año ${año} no disponible`); continue; }

  // Get global KPIs (no brand selected)
  const globalKPIs = await readKPIs();
  const globalBev = globalKPIs.bev;
  const globalTotal = globalKPIs.total;
  console.log(`  Total ${año}: BEV=${globalBev} PHEV=${globalKPIs.phev} Total=${globalTotal}`);

  if (globalTotal === 0) {
    console.log(`  ✗ Sin datos para ${año}`);
    continue;
  }

  await page.screenshot({ path: join(SS_DIR, `v3-${año}-base.png`) });

  // Scan grid multiple times with scrolling to get all brands
  const allBrandData = new Map(); // topModelo → data
  const MAX_SCROLL_PAGES = 3;

  for (let scrollPage = 0; scrollPage < MAX_SCROLL_PAGES; scrollPage++) {
    const pageData = await scanGrid(globalBev, globalTotal);
    let newItems = 0;
    for (const [modelo, data] of pageData) {
      if (!allBrandData.has(modelo)) {
        allBrandData.set(modelo, data);
        newItems++;
      }
    }
    console.log(`  Scan ${scrollPage + 1}: +${newItems} nuevas marcas (${allBrandData.size} total)`);
    if (newItems === 0) break;

    // Scroll down to reveal more brands
    await scrollGrid("down");
    await page.waitForTimeout(500);
  }

  // Try mouse wheel scroll within visual as alternative
  const cx = VIS.x + VIS.w / 2;
  const cy = VIS.y + VIS.h / 2;
  await page.mouse.move(cx, cy);

  for (let scrollAmt = 0; scrollAmt < 4; scrollAmt++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(600);
    const pageData = await scanGrid(globalBev, globalTotal);
    let newItems = 0;
    for (const [modelo, data] of pageData) {
      if (!allBrandData.has(modelo)) {
        allBrandData.set(modelo, data);
        newItems++;
      }
    }
    if (newItems === 0) break;
    console.log(`  Scroll-wheel ${scrollAmt + 1}: +${newItems} marcas`);
  }

  // Map top models to brand names
  const marcasData = {};
  for (const [topModelo, data] of allBrandData) {
    // Try exact match in MODEL_TO_BRAND
    let brand = MODEL_TO_BRAND[topModelo];

    // Fuzzy match: find brand for partial model name
    if (!brand) {
      for (const [key, val] of Object.entries(MODEL_TO_BRAND)) {
        if (topModelo.includes(key) || key.includes(topModelo)) {
          brand = val;
          break;
        }
      }
    }

    // Still no match: use top model as brand hint
    if (!brand) {
      console.log(`  ⚠ Modelo desconocido: "${topModelo}" (BEV=${data.bev} PHEV=${data.phev})`);
      brand = `UNKNOWN:${topModelo}`;
    }

    // Merge if brand already seen (can happen if same brand has multiple models as top)
    if (marcasData[brand]) {
      // Keep whichever has higher total
      if (data.total > marcasData[brand].total) {
        marcasData[brand] = data;
      }
    } else {
      marcasData[brand] = data;
    }
  }

  if (Object.keys(marcasData).length > 0) {
    resultsByYear[año] = marcasData;
    console.log(`  ✅ ${año}: ${Object.keys(marcasData).length} marcas`);
    Object.entries(marcasData)
      .filter(([k]) => !k.startsWith("UNKNOWN"))
      .sort(([,a],[,b]) => b.total - a.total)
      .slice(0, 10)
      .forEach(([k, v]) => console.log(`    ${k}: BEV=${v.bev} PHEV=${v.phev} Total=${v.total}`));
  } else {
    console.log(`  ✗ ${año}: 0 marcas con datos`);
  }
}

await browser.close();

// Save raw JSON
const datestamp = new Date().toISOString().split("T")[0];
const rawPath = join(OUT_DIR, `marcas-v3-${datestamp}.json`);
writeFileSync(rawPath, JSON.stringify(resultsByYear, null, 2));
console.log(`\n💾 Raw: ${rawPath}`);

const years = Object.keys(resultsByYear).map(Number).sort((a,b) => b-a);
console.log(`\n📊 Resumen:`);
for (const año of years) {
  const m = resultsByYear[año];
  const tot = Object.values(m).reduce((s,v) => s+v.total, 0);
  console.log(`  ${año}: ${Object.keys(m).length} marcas · ${tot.toLocaleString("es")} uds`);
}

if (!DRY_RUN && years.length > 0) {
  let content = readFileSync(TS_MARCAS, "utf8");

  const entries = years.map(año => {
    const marcasAño = Object.entries(resultsByYear[año])
      .filter(([k]) => !k.startsWith("UNKNOWN"))
      .sort(([,a],[,b]) => (b.bev + b.phev) - (a.bev + a.phev))
      .map(([marca, d]) => `      { marca: ${JSON.stringify(marca)}, bev: ${d.bev}, phev: ${d.phev} },`)
      .join("\n");
    return `  {\n    año: ${año},\n    fuente: "AEDIVE",\n    marcas: [\n${marcasAño}\n    ],\n  },`;
  }).join("\n");

  const newArray = `export const topMarcasPorAño: MarcasPorAñoEntry[] = [\n${entries}\n];`;
  const regex = /export const topMarcasPorAño[\s\S]*?^\];/m;
  content = regex.test(content) ? content.replace(regex, newArray) : content + "\n" + newArray + "\n";

  // Update topMarcas with most recent year's top 10
  const añoBase = years.find(a => Object.keys(resultsByYear[a]).filter(k => !k.startsWith("UNKNOWN")).length >= 5);
  if (añoBase) {
    const top = Object.entries(resultsByYear[añoBase])
      .filter(([k]) => !k.startsWith("UNKNOWN"))
      .sort(([,a],[,b]) => (b.bev + b.phev) - (a.bev + a.phev))
      .slice(0, 10)
      .map(([m, d]) => `  { marca: ${JSON.stringify(m)}, bev: ${d.bev}, phev: ${d.phev} },`)
      .join("\n");
    content = content.replace(/export const topMarcas = \[[\s\S]*?\];/, `export const topMarcas = [\n${top}\n];`);
  }

  writeFileSync(TS_MARCAS, content);
  console.log(`\n✅ ${TS_MARCAS} actualizado`);
} else {
  console.log("\n[DRY RUN] marcas-data.ts NO actualizado.");
}

console.log("\n✨ Terminado.");
