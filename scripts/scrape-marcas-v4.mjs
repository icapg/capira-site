/**
 * scrape-marcas-v4.mjs
 *
 * Combines two data sources:
 *  1. "Selecciona Marca" Image Grid → 22 brands with accurate BEV/PHEV
 *  2. Right-side model ranking table (with scroll) → remaining brands via model classification
 *
 * Usage:
 *   node scripts/scrape-marcas-v4.mjs
 *   node scripts/scrape-marcas-v4.mjs --dry-run
 *   node scripts/scrape-marcas-v4.mjs --years=2025
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

// Image Grid bounding box
const VIS = { x: 363, y: 214, w: 450, h: 627 };

// ─── Model → Brand mapping ────────────────────────────────────────────────────
const MODEL_BRAND = {
  // BYD
  "ATTO 2 DM-I": "BYD", "SEAL U DM-I": "BYD", "DOLPHIN SURF 5P": "BYD",
  "ATTO 2": "BYD", "HAN": "BYD", "TANG": "BYD", "SEAL": "BYD",
  // Toyota
  "C-HR 2.0 220PH": "TOYOTA", "C-HR 2": "TOYOTA", "YARIS": "TOYOTA", "RAV4 2.5 PLUG-IN": "TOYOTA",
  "COROLLA": "TOYOTA", "PRIUS": "TOYOTA",
  // BMW
  "X3 2.0 (30e) G45": "BMW", "X3 2": "BMW", "X1 1.5 XDRIVE (25e)": "BMW", "X5 3.0 (50e)": "BMW",
  "I4": "BMW", "I5": "BMW", "IX": "BMW", "I7": "BMW", "X2": "BMW",
  // VW
  "TIGUAN 1.5 E-HYBRID": "VOLKSWAGEN", "TIGUAN 1": "VOLKSWAGEN", "ID.3": "VOLKSWAGEN", "ID.4": "VOLKSWAGEN",
  "PASSAT 1.5 E-HYBRID": "VOLKSWAGEN", "GOLF 1.4 GTE": "VOLKSWAGEN",
  // SEAT
  "TERRAMAR 1.5 PHEV": "SEAT", "ARONA 1.5 E-HYBRID": "SEAT",
  "ATECA 1.4 E-HYBRID": "SEAT", "LEON (KL)": "SEAT", "LEON (KL) 1": "SEAT",
  // CUPRA
  "FORMENTOR 1.5 E-HYBRID": "CUPRA", "BORN": "CUPRA", "6E 5P": "CUPRA", "6E": "CUPRA",
  "TERRAMAR E-HYBRID": "CUPRA", "TERRAMAR": "CUPRA",
  // Hyundai
  "TUCSON 1.6 TGDI PHEV": "HYUNDAI", "TUCSON 1": "HYUNDAI", "IONIQ 5": "HYUNDAI", "IONIQ 6": "HYUNDAI",
  "KONA": "HYUNDAI",
  // Volvo
  "EX 30": "VOLVO", "XC40 RECHARGEABLE": "VOLVO", "XC60 2.0 T8": "VOLVO", "XC90": "VOLVO",
  "EC40": "VOLVO",
  // MG
  "MG HS 1.5 PHEV": "MG", "MG HS 1": "MG", "ZS EV": "MG", "MG4": "MG", "MG5": "MG",
  // Peugeot
  "E-2008": "PEUGEOT", "E-208": "PEUGEOT", "408 1.6 PHEV": "PEUGEOT",
  "E-3008": "PEUGEOT", "E-308": "PEUGEOT",
  // Lexus
  "NX 450 H+": "LEXUS", "UX 300E": "LEXUS", "RX 450 H+": "LEXUS",
  // Porsche
  "CAYENNE S/E-HYBRID": "PORSCHE", "CAYENNE COUPE": "PORSCHE", "PANAMERA": "PORSCHE",
  "TAYCAN": "PORSCHE",
  // Tesla
  "MODEL 3": "TESLA", "MODEL Y": "TESLA", "MODEL X": "TESLA", "MODEL S": "TESLA",
  "CYBERTRUCK": "TESLA",
  // Ford
  "KUGA 2.5 PHEV": "FORD", "EXPLORER": "FORD", "PUMA GEN-E": "FORD",
  "MUSTANG MACH-E": "FORD", "ESCAPE PHEV": "FORD",
  // KIA
  "EV3": "KIA", "NIRO": "KIA", "EV6": "KIA", "SORENTO": "KIA",
  "SPORTAGE": "KIA", "EV9": "KIA",
  // Mercedes
  "GLA 250 E (247)": "MERCEDES", "GLC 300 DE 4M (254)": "MERCEDES",
  "A 250 E 5P (177)": "MERCEDES", "C 300 E 4M (206)": "MERCEDES",
  "E 300 DE (214)": "MERCEDES", "GLE 350 DE 4M (167)": "MERCEDES",
  "EQA": "MERCEDES", "EQB": "MERCEDES", "EQC": "MERCEDES", "EQS": "MERCEDES",
  // Renault
  "CAPTUR E-TECH 1.6 PHEV": "RENAULT", "MEGANE E-TECH": "RENAULT",
  "SCENIC E-TECH": "RENAULT", "AUSTRAL E-TECH": "RENAULT", "KADJAR": "RENAULT",
  // Audi
  "A3 1.4 TFSI E": "AUDI", "Q5 55 TFSI E": "AUDI", "A6 55 TFSI E": "AUDI",
  "Q7 3.0 TFSI E": "AUDI", "Q8 E-TRON": "AUDI", "A7": "AUDI",
  // Land Rover
  "RANGE ROVER SPORT 3.0 PHEV": "LAND ROVER", "RANGE ROVER SPORT 3": "LAND ROVER", "RANGE ROVER EVOQUE": "LAND ROVER",
  "DEFENDER 1.5 P400E": "LAND ROVER",
  // Dacia
  "SPRING E": "DACIA",
  // Fiat
  "500 E 3P/CAB": "FIAT", "600E": "FIAT",
  // Honda
  "CRV 2.0 i-MMD PHEV": "HONDA", "CRV 2": "HONDA",
  // Lamborghini
  "URUS SE": "LAMBORGHINI",
  // Ferrari
  "296 SPECIALE": "FERRARI", "SF90": "FERRARI",
  // McLaren
  "ARTURA": "MCLAREN",
  // Maserati
  "GRAN TURISMO FOLGORE": "MASERATI",
  // Smart
  "#1": "SMART", "#3": "SMART",
  // Nissan
  "ARIYA": "NISSAN", "LEAF": "NISSAN",
  // Opel
  "ASTRA PHEV": "OPEL", "GRANDLAND X 1.6 PHEV": "OPEL", "COMBO ELECTRIC": "OPEL",
  // Citroën
  "E-C4": "CITROËN", "C5 X 1.6 PHEV": "CITROËN",
  // Jeep
  "AVENGER": "JEEP", "COMPASS 1.3 PHEV": "JEEP",
  // Alfa Romeo
  "MILANO ELETTRICA": "ALFA ROMEO", "TONALE 1.3 PHEV": "ALFA ROMEO",
};

// BEV classification: if model name contains these → BEV
const BEV_KEYWORDS = [
  "MODEL 3", "MODEL Y", "MODEL X", "MODEL S", // Tesla
  "ID.3", "ID.4", "ID.5", "ID.7",             // VW
  "EV3", "EV6", "EV9", "IONIQ 5", "IONIQ 6",  // KIA/Hyundai
  "EX 30", "EC40", "XC40 RECHARGEABLE P8",     // Volvo
  "E-2008", "E-208", "E-3008", "E-308",        // Peugeot
  "E-C4",                                      // Citroën
  "ZS EV", "MG4", "MG5",                       // MG
  "BORN", "6E 5P",                             // CUPRA
  "PUMA GEN-E",                                // Ford
  "SPRING E",                                  // Dacia
  "500 E", "600E",                             // Fiat
  "#1", "#3",                                   // Smart
  "ARIYA", "LEAF",                             // Nissan
  "Q8 E-TRON", "EQA", "EQB", "EQC", "EQS",   // Audi, Mercedes BEV
  "AVENGER",                                   // Jeep BEV
  "MILANO ELETTRICA",                          // Alfa Romeo BEV
  "GRAN TURISMO FOLGORE", "TAYCAN",            // Maserati, Porsche BEV
  "I4", "I5", "IX", "I7", "IX1", "IX3",       // BMW BEV
  "MEGANE E-TECH", "SCENIC E-TECH",           // Renault BEV
  "KONA ELECTRIC",                             // Hyundai
  "DOLPHIN SURF",                              // BYD BEV (not DM-i)
  "ATTO 3",                                    // BYD BEV
  "EXPLORER ELECTRIC",                         // Ford BEV
  "COMBO ELECTRIC",                            // Opel BEV
  "MUSTANG MACH-E",                            // Ford BEV
  "UX 300E",                                   // Lexus BEV
];

// PHEV classification: if model name contains these → PHEV
const PHEV_KEYWORDS = [
  "PHEV", "E-HYBRID", "PLUG-IN", "i-MMD",
  "DM-I",                        // BYD hybrid
  " H+",                         // Lexus PHEV (NX 450 H+)
  "TFSI E",                      // Audi PHEV
  "E 4M", "DE 4M", "300 E ", "250 E", "350 DE", // Mercedes PHEV
  "E-TECH 1.6",                  // Renault PHEV
  " GTE ",                       // VW PHEV
  "220PH", "450 H+", " H+",     // Hybrid
  "XDRIVE (25e)", "XDRIVE (30e)", "XDRIVE (45e)", "30e", "45e", // BMW PHEV
  "T8 ",                         // Volvo PHEV
  "URUS SE",                     // Lamborghini PHEV
  "296 ", "SF90",                // Ferrari PHEV
  "ARTURA",                      // McLaren PHEV
  "CAYENNE",                     // Porsche Cayenne (PHEV)
  "PANAMERA",                    // Porsche Panamera (PHEV)
  " HS ",                        // MG HS PHEV
];

function classifyModel(modelName) {
  const upper = modelName.toUpperCase();
  for (const kw of BEV_KEYWORDS) {
    if (upper.includes(kw.toUpperCase())) return "bev";
  }
  for (const kw of PHEV_KEYWORDS) {
    if (upper.includes(kw.toUpperCase())) return "phev";
  }
  return null; // unknown
}

function getBrand(modelName) {
  const upper = modelName.toUpperCase();
  for (const [key, brand] of Object.entries(MODEL_BRAND)) {
    if (upper.includes(key.toUpperCase())) return brand;
  }
  return null;
}

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
    const mTop = l.match(/^Top Modelo\s+(.+)\./i);
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

// Scan Image Grid for 22 brands
async function scanImageGrid(globalBev, globalTotal) {
  const found = new Map();
  const cellW = VIS.w / 3;
  const headerH = 50;
  const cellH = 65;
  const rows = Math.floor((VIS.h - headerH) / cellH);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = VIS.x + col * cellW + cellW / 2;
      const cy = VIS.y + headerH + row * cellH + cellH / 2;

      await page.mouse.click(cx, cy);
      await page.waitForTimeout(1000);

      const kpis = await readKPIs();
      const isGlobal = kpis.bev === globalBev || kpis.total === globalTotal;
      if (!isGlobal && kpis.topModelo && (kpis.bev > 0 || kpis.phev > 0 || kpis.total > 0)) {
        if (!found.has(kpis.topModelo)) {
          found.set(kpis.topModelo, { bev: kpis.bev, phev: kpis.phev, total: kpis.total });
        }
      }

      await page.mouse.click(cx, cy);
      await page.waitForTimeout(400);
    }
  }
  return found;
}

// Scroll model ranking table and collect all aria-labels over time
async function collectModelRankingData() {
  const allModels = new Map(); // modelName → units

  // Collect from current view
  async function collectCurrentView() {
    const labels = await allAria();
    let newCount = 0;
    for (const l of labels) {
      // Pattern: brand/model name followed by unit count in accessible chart
      // The right side entries are text nodes at x=847
    }
    return newCount;
  }

  // The right-side table has scroll buttons as hidden buttons
  // Click scrollDown button programmatically
  const scrollDownBtn = page.locator('button.scrollDown').first();

  // Initial collection - read from all visible text
  const initText = await page.evaluate(() => {
    const result = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent.trim();
      if (t.length >= 2 && t.length <= 50) result.push(t);
    }
    return [...new Set(result)];
  });

  // Parse brand-model-units from visible text
  // The text alternates: BRAND_NAME, MODEL_NAME, UNITS
  let currentBrand = null;
  const brandModels = {}; // brand → [{model, units}]

  for (let i = 0; i < initText.length; i++) {
    const t = initText[i];
    // Check if this looks like a brand name (all caps, 2-20 chars)
    if (/^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s./-]{1,19}$/.test(t) && !t.includes("barra")) {
      const brand = getBrand(t) || t;
      if (brand !== currentBrand) {
        currentBrand = brand;
        if (!brandModels[currentBrand]) brandModels[currentBrand] = [];
      }
    }
    // Check if this looks like a unit count
    const unitM = t.match(/^([\d.]+)$/);
    if (unitM && currentBrand) {
      const units = parseNum(t);
      if (units > 0 && units < 100000) {
        brandModels[currentBrand].push({ model: initText[i-1] || "unknown", units });
      }
    }
  }

  return brandModels;
}

// Main extraction for one year
async function extractBrands(año) {
  const globalKPIs = await readKPIs();
  const globalBev = globalKPIs.bev;
  const globalTotal = globalKPIs.total;
  console.log(`  Global: BEV=${globalBev} PHEV=${globalKPIs.phev} Total=${globalTotal}`);

  if (globalTotal === 0) return null;

  // STEP 1: Image Grid - accurate BEV/PHEV for 22 brands
  console.log("  Step 1: Scanning Image Grid...");
  await page.screenshot({ path: join(SS_DIR, `v4-${año}.png`) });
  const gridData = await scanImageGrid(globalBev, globalTotal);
  console.log(`    Found ${gridData.size} entries from Image Grid`);

  // Map top models to brand names
  const marcasData = {};
  for (const [topModelo, data] of gridData) {
    let brand = null;
    // Try MODEL_BRAND lookup
    for (const [key, val] of Object.entries(MODEL_BRAND)) {
      if (topModelo.toUpperCase().includes(key.toUpperCase())) {
        brand = val;
        break;
      }
    }
    if (!brand) {
      console.log(`    ⚠ Modelo sin mapeo: "${topModelo}"`);
      brand = `UNKNOWN:${topModelo.slice(0, 20)}`;
    }
    if (!marcasData[brand] || data.total > marcasData[brand].total) {
      marcasData[brand] = { bev: data.bev, phev: data.phev, total: data.total, source: "image_grid" };
    }
  }

  // STEP 2: Try to get remaining brands by clicking brand names in right-side table
  console.log("  Step 2: Checking right-side ranking for additional brands...");

  // The right-side has visible brand names at x≈847. Try clicking them.
  const knownBrandsInGrid = new Set(Object.keys(marcasData).filter(k => !k.startsWith("UNKNOWN")));

  const rightSideBrands = await page.evaluate(() => {
    const known = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent.trim();
      if (/^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s./-]{1,20}$/.test(t) && t.length >= 3) {
        const el = node.parentElement;
        const bbox = el.getBoundingClientRect();
        if (bbox.x > 800 && bbox.x < 1500 && bbox.y > 200 && bbox.y < 900) {
          known.push({ text: t, x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height });
        }
      }
    }
    return known;
  });

  // Try each unique brand text that's not already in grid data
  const seen = new Set();
  for (const { text, x, y } of rightSideBrands) {
    const brand = text.toUpperCase().replace(/B\.M\.W\./g, "BMW").trim();
    if (seen.has(brand)) continue;
    seen.add(brand);

    // Skip if already in grid data
    if (knownBrandsInGrid.has(brand) || knownBrandsInGrid.has(text)) continue;

    // Try clicking this element and see if KPIs (specifically BEV/PHEV) update
    try {
      await page.mouse.click(x + 5, y + 5);
      await page.waitForTimeout(1000);
      const kpis = await readKPIs();

      if (kpis.bev !== globalBev && kpis.bev > 0 && kpis.total < globalTotal) {
        const brandKey = MODEL_BRAND[brand] || brand;
        if (!marcasData[brandKey]) {
          marcasData[brandKey] = { bev: kpis.bev, phev: kpis.phev, total: kpis.total, source: "right_table" };
          console.log(`    + ${brandKey}: BEV=${kpis.bev} PHEV=${kpis.phev} Total=${kpis.total} (right-side click)`);
        }
      }

      // Deselect
      await page.mouse.click(x + 5, y + 5);
      await page.waitForTimeout(300);
    } catch {}
  }

  // STEP 3: Scroll right-side table and try collecting more brands
  console.log("  Step 3: Scrolling right-side table...");
  const scrollDownBtn = page.locator('button.scrollDown').first();
  let scrollCount = 0;
  let prevTopModel = null;

  for (let i = 0; i < 25; i++) {
    try {
      if (await scrollDownBtn.isVisible({ timeout: 500 })) {
        await scrollDownBtn.click();
      } else {
        // Fallback: click at button position (847, 486)
        await page.mouse.click(847, 486);
      }
      await page.waitForTimeout(800);
    } catch {}

    // Try clicking newly visible brand texts
    const newBrands = await page.evaluate(() => {
      const result = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const t = node.textContent.trim();
        if (/^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s./-]{1,20}$/.test(t) && t.length >= 3) {
          const el = node.parentElement;
          const bbox = el.getBoundingClientRect();
          if (bbox.x > 800 && bbox.x < 1500 && bbox.y > 200 && bbox.y < 900) {
            result.push({ text: t, x: bbox.x, y: bbox.y });
          }
        }
      }
      return result;
    });

    // Check if we found new brands
    let foundNew = false;
    for (const { text, x, y } of newBrands) {
      const brand = text.toUpperCase().replace(/B\.M\.W\./g, "BMW").trim();
      if (seen.has(brand)) continue;
      seen.add(brand);

      try {
        await page.mouse.click(x + 5, y + 5);
        await page.waitForTimeout(1000);
        const kpis = await readKPIs();

        if (kpis.bev !== globalBev && kpis.bev > 0) {
          const brandKey = MODEL_BRAND[brand] || brand;
          if (!marcasData[brandKey]) {
            marcasData[brandKey] = { bev: kpis.bev, phev: kpis.phev, total: kpis.total, source: "scrolled_table" };
            console.log(`    + ${brandKey}: BEV=${kpis.bev} PHEV=${kpis.phev} (scroll ${i+1})`);
            foundNew = true;
          }
        }

        await page.mouse.click(x + 5, y + 5);
        await page.waitForTimeout(300);
      } catch {}
    }

    scrollCount++;
  }

  console.log(`    Scrolled ${scrollCount} times, total brands: ${Object.keys(marcasData).filter(k => !k.startsWith("UNKNOWN")).length}`);

  // Log final results
  const cleanBrands = Object.entries(marcasData).filter(([k]) => !k.startsWith("UNKNOWN"));
  const total = cleanBrands.reduce((s, [, v]) => s + v.total, 0);
  console.log(`  Coverage: ${total.toLocaleString("es")}/${globalTotal.toLocaleString("es")} = ${(total/globalTotal*100).toFixed(1)}%`);

  return marcasData;
}

// ─── Main loop ────────────────────────────────────────────────────────────────
const resultsByYear = {};

for (const año of YEARS) {
  console.log(`\n📅 Procesando ${año}...`);
  await goToMarcas();

  let yearOk = false;
  for (let nth = 0; nth <= 2; nth++) {
    try {
      const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
      const span = slicer.locator(".slicerText", { hasText: String(año) }).first();
      if (await span.isVisible({ timeout: 2000 })) {
        await span.click({ force: true });
        await page.waitForTimeout(3000);
        yearOk = true;
        break;
      }
    } catch {}
  }
  if (!yearOk) { console.log(`  ⚠ ${año} no disponible`); continue; }

  const result = await extractBrands(año);
  if (result && Object.keys(result).filter(k => !k.startsWith("UNKNOWN")).length > 0) {
    resultsByYear[año] = result;
    console.log(`  ✅ ${año}: ${Object.keys(result).filter(k => !k.startsWith("UNKNOWN")).length} marcas`);
  }
}

await browser.close();

// Save raw JSON
const datestamp = new Date().toISOString().split("T")[0];
const rawPath = join(OUT_DIR, `marcas-v4-${datestamp}.json`);
writeFileSync(rawPath, JSON.stringify(resultsByYear, null, 2));
console.log(`\n💾 Raw: ${rawPath}`);

const years = Object.keys(resultsByYear).map(Number).sort((a,b) => b-a);
console.log(`\n📊 Resumen:`);
for (const año of years) {
  const m = resultsByYear[año];
  const clean = Object.entries(m).filter(([k]) => !k.startsWith("UNKNOWN"));
  const tot = clean.reduce((s,[,v]) => s+v.total, 0);
  console.log(`  ${año}: ${clean.length} marcas · ${tot.toLocaleString("es")} uds`);
  clean.sort(([,a],[,b]) => b.total-a.total).slice(0, 10).forEach(([k,v]) =>
    console.log(`    ${k}: BEV=${v.bev} PHEV=${v.phev} Total=${v.total} [${v.source}]`)
  );
}

if (!DRY_RUN && years.length > 0) {
  let content = readFileSync(TS_MARCAS, "utf8");

  const entries = years.map(año => {
    const clean = Object.entries(resultsByYear[año])
      .filter(([k]) => !k.startsWith("UNKNOWN"))
      .sort(([,a],[,b]) => (b.bev+b.phev) - (a.bev+a.phev));

    const marcasStr = clean
      .map(([marca, d]) => `      { marca: ${JSON.stringify(marca)}, bev: ${d.bev}, phev: ${d.phev} },`)
      .join("\n");
    return `  {\n    año: ${año},\n    fuente: "AEDIVE",\n    marcas: [\n${marcasStr}\n    ],\n  },`;
  }).join("\n");

  const newArray = `export const topMarcasPorAño: MarcasPorAñoEntry[] = [\n${entries}\n];`;
  const regex = /export const topMarcasPorAño[\s\S]*?^\];/m;
  content = regex.test(content) ? content.replace(regex, newArray) : content + "\n" + newArray + "\n";

  const añoBase = years.find(a => Object.keys(resultsByYear[a]).filter(k => !k.startsWith("UNKNOWN")).length >= 5);
  if (añoBase) {
    const top = Object.entries(resultsByYear[añoBase])
      .filter(([k]) => !k.startsWith("UNKNOWN"))
      .sort(([,a],[,b]) => (b.bev+b.phev) - (a.bev+a.phev))
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
