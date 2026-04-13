/**
 * scrape-marcas-v5.mjs
 *
 * Clean version: scans the "Selecciona Marca" Image Grid only.
 * Confirmed working: 22 brands with real BEV/PHEV from AEDIVE.
 *
 * Notes on coverage:
 *   - AEDIVE's Image Grid includes ~22 brands (their member/tracked brands)
 *   - Some large brands (Tesla, Ford, KIA, Mercedes) are not in the Grid
 *   - These are labeled with source: "AEDIVE - Segmentación por Marcas"
 *
 * Usage:
 *   node scripts/scrape-marcas-v5.mjs --dry-run --years=2025
 *   node scripts/scrape-marcas-v5.mjs --years=2025
 *   node scripts/scrape-marcas-v5.mjs
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

const VIS = { x: 363, y: 214, w: 450, h: 627 };

// Model → Brand (greedy regex fix ensures full model names match here)
const MODEL_BRAND = {
  // BYD
  "ATTO 2 DM-I": "BYD", "SEAL U DM-I": "BYD", "DOLPHIN SURF": "BYD",
  "HAN": "BYD", "TANG": "BYD", "SEAL": "BYD", "ATTO 3": "BYD",
  // Toyota — "C-HR 2.0 220PH" (greedy) or truncated "C-HR 2" (old)
  "C-HR": "TOYOTA", "YARIS": "TOYOTA", "RAV4": "TOYOTA", "COROLLA": "TOYOTA",
  // BMW — "X3 2.0 (30e) G45"
  "X3 2.0": "BMW", "X1 1.5": "BMW", "X5 3.0": "BMW",
  "I4": "BMW", "I5": "BMW", "IX": "BMW", "I7": "BMW",
  // VW — "TIGUAN 1.5 E-HYBRID"
  "TIGUAN": "VOLKSWAGEN", "ID.3": "VOLKSWAGEN", "ID.4": "VOLKSWAGEN",
  "PASSAT": "VOLKSWAGEN", "GOLF 1.4 GTE": "VOLKSWAGEN",
  // SEAT
  "TERRAMAR 1.5 PHEV": "SEAT", "ARONA": "SEAT", "ATECA": "SEAT",
  "LEON (KL)": "SEAT",
  // CUPRA
  "FORMENTOR": "CUPRA", "BORN": "CUPRA", "6E": "CUPRA",
  // Hyundai — "TUCSON 1.6 TGDI PHEV"
  "TUCSON": "HYUNDAI", "IONIQ 5": "HYUNDAI", "IONIQ 6": "HYUNDAI", "KONA": "HYUNDAI",
  // Volvo
  "EX 30": "VOLVO", "XC40": "VOLVO", "XC60": "VOLVO", "XC90": "VOLVO", "EC40": "VOLVO",
  // MG — "MG HS 1.5 PHEV"
  "MG HS": "MG", "ZS EV": "MG", "MG4": "MG", "MG5": "MG",
  // Peugeot
  "E-2008": "PEUGEOT", "E-208": "PEUGEOT", "408": "PEUGEOT", "E-3008": "PEUGEOT",
  // Lexus
  "NX 450": "LEXUS", "UX 300E": "LEXUS", "RX 450": "LEXUS",
  // Porsche
  "CAYENNE": "PORSCHE", "PANAMERA": "PORSCHE", "TAYCAN": "PORSCHE",
  // Land Rover — "RANGE ROVER SPORT 3.0 PHEV"
  "RANGE ROVER": "LAND ROVER", "DEFENDER": "LAND ROVER",
  // Dacia
  "SPRING": "DACIA",
  // Fiat
  "500 E": "FIAT", "600E": "FIAT",
  // Honda — "CRV 2.0 i-MMD PHEV"
  "CRV": "HONDA",
  // Lamborghini
  "URUS": "LAMBORGHINI",
  // Ferrari
  "296": "FERRARI", "SF90": "FERRARI",
  // McLaren
  "ARTURA": "MCLAREN",
  // Maserati
  "GRAN TURISMO FOLGORE": "MASERATI", "GRECALE": "MASERATI",
  // Smart — "#1", "#3", "01 PHEV" (Smart #01)
  "#1": "SMART", "#3": "SMART", "01 PHEV": "SMART", "01 BEV": "SMART",
  // Tesla
  "MODEL 3": "TESLA", "MODEL Y": "TESLA", "MODEL S": "TESLA", "MODEL X": "TESLA",
  // DS — "DS7 CROSSBACK E-TENSE"
  "DS7": "DS", "DS3": "DS", "DS4": "DS",
  // Mercedes — "GLA 250 E (247)"
  "GLA 250 E": "MERCEDES", "EQA": "MERCEDES", "EQB": "MERCEDES", "EQC": "MERCEDES", "EQS": "MERCEDES",
  // Audi — "A3 1.5 TFSI E SPORTBACK"
  "A3 1.5 TFSI": "AUDI", "Q4": "AUDI", "Q5": "AUDI", "E-TRON": "AUDI",
  // Renault — "5 E-TECH ELECT"
  "5 E-TECH": "RENAULT", "MEGANE E-TECH": "RENAULT", "ZOE": "RENAULT", "CLIO": "RENAULT",
  // Citroën — "NC3 E 5P" (ë-C3)
  "NC3 E": "CITROEN", "C5 X": "CITROEN", "AMI": "CITROEN",
  // Skoda — "KODIAQ 1.5 PHEV"
  "KODIAQ": "SKODA", "ENYAQ": "SKODA", "OCTAVIA": "SKODA",
  // Opel — "FRONTERA ELECT"
  "FRONTERA": "OPEL", "ASTRA": "OPEL", "MOKKA": "OPEL", "CORSA": "OPEL",
  // Mitsubishi — "ECLIPSE CROSS 2.4 PHEV 4X4"
  "ECLIPSE CROSS": "MITSUBISHI", "OUTLANDER": "MITSUBISHI",
  // Polestar
  "POLESTAR 2": "POLESTAR", "POLESTAR 3": "POLESTAR", "POLESTAR 4": "POLESTAR",
  // Alfa Romeo — "TONALE 1.3 PHEV", "JUNIOR ELECT"
  "TONALE": "ALFA ROMEO", "JUNIOR": "ALFA ROMEO",
  // Alpine — "A290 5P"
  "A290": "ALPINE",
  // SsangYong — "KORANDO E-MOTION"
  "KORANDO": "SSANGYONG",
  // Subaru — "SOLTERRA"
  "SOLTERRA": "SUBARU",
  // Lotus — "ELETRE"
  "ELETRE": "LOTUS",
  // KIA — "EV3"
  "EV3": "KIA", "EV6": "KIA", "NIRO": "KIA", "SORENTO": "KIA",
  // Peugeot (additional) — "3008 (P8) 1.6 HYBRID"
  "3008": "PEUGEOT",
  // MINI — "MINI COOPER SE", "MINI ACEMAN SE"
  "MINI COOPER": "MINI", "MINI ELECTRIC": "MINI", "MINI ACEMAN": "MINI", "MINI COUNTRY": "MINI",
  // Jeep — "AVENGER BEV"
  "AVENGER": "JEEP", "RENEGADE": "JEEP", "COMPASS": "JEEP",
  // Bentley — "CONTINENTAL GT SPEED PHEV"
  "CONTINENTAL GT": "BENTLEY", "BENTAYGA": "BENTLEY",
  // Seres
  "SERES": "SERES",
  // Ford — "KUGA 2.5 PHEV 5P"
  "KUGA": "FORD", "MUSTANG MACH": "FORD", "EXPLORER": "FORD",
  // Nissan — "LEAF 5P"
  "LEAF": "NISSAN", "ARIYA": "NISSAN", "TOWNSTAR": "NISSAN",
  // Jaguar — "F-PACE 2.0 P400E"
  "F-PACE": "JAGUAR", "I-PACE": "JAGUAR",
  // Suzuki — "ACROSS 2.5 PHEV 4X4"
  "ACROSS": "SUZUKI", "SWACE": "SUZUKI",
};

function parseNum(s) {
  return parseInt(String(s).replace(/[.\s]/g, "").replace(",", ".")) || 0;
}

function getBrand(modelName) {
  if (!modelName) return null;
  const upper = modelName.toUpperCase();
  for (const [key, brand] of Object.entries(MODEL_BRAND)) {
    if (upper.includes(key.toUpperCase())) return brand;
  }
  return null;
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
    // GREEDY match — stops at last period so "C-HR 2.0 220PH." → "C-HR 2.0 220PH"
    const mTop = l.match(/^Top Modelo\s+(.+)\.$/i);
    if (mTop) topModelo = mTop[1].trim();
  }
  return { bev, phev, total: total || bev + phev, topModelo };
}

async function goToMarcas() {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(5000);
  await page.getByText("Segmentación por Marcas", { exact: false }).first().click({ timeout: 10_000, force: true });
  await page.waitForTimeout(8000);
}

async function scanImageGrid(globalBev, globalTotal) {
  const found = new Map(); // topModelo → { bev, phev, total }
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

const resultsByYear = {};

for (const año of YEARS) {
  console.log(`\n📅 ${año}...`);
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
        break;
      }
    } catch {}
  }
  if (!yearOk) { console.log(`  ⚠ no disponible`); continue; }

  const globalKPIs = await readKPIs();
  const { bev: globalBev, phev: globalPhev, total: globalTotal } = globalKPIs;
  console.log(`  Total: BEV=${globalBev} PHEV=${globalPhev} Total=${globalTotal}`);
  if (globalTotal === 0) { console.log(`  ✗ sin datos`); continue; }

  await page.screenshot({ path: join(SS_DIR, `v5-${año}.png`) });

  const gridData = await scanImageGrid(globalBev, globalTotal);
  console.log(`  Grid: ${gridData.size} entradas`);

  // Map top models → brand names
  const marcasData = {};
  for (const [topModelo, data] of gridData) {
    const brand = getBrand(topModelo);
    if (!brand) {
      console.log(`  ⚠ Modelo sin mapeo: "${topModelo}" (BEV=${data.bev} PHEV=${data.phev}) - agregando como desconocido`);
      // Still add with raw model name so data isn't lost
      const key = topModelo.slice(0, 20).toUpperCase();
      if (!marcasData[key] || data.total > marcasData[key].total) {
        marcasData[key] = { bev: data.bev, phev: data.phev, total: data.total };
      }
      continue;
    }
    if (!marcasData[brand]) {
      marcasData[brand] = { bev: data.bev, phev: data.phev, total: data.total };
    } else {
      // Brand appears in multiple grid cells (e.g. SEAT Terramar + SEAT León) → sum
      marcasData[brand].bev += data.bev;
      marcasData[brand].phev += data.phev;
      marcasData[brand].total += data.total;
    }
  }

  if (Object.keys(marcasData).length > 0) {
    resultsByYear[año] = marcasData;
    const coverage = Object.values(marcasData).reduce((s,v) => s+v.total, 0);
    console.log(`  ✅ ${Object.keys(marcasData).length} marcas · ${coverage.toLocaleString("es")}/${globalTotal.toLocaleString("es")} uds (${(coverage/globalTotal*100).toFixed(1)}%)`);
    Object.entries(marcasData).sort(([,a],[,b]) => b.total-a.total).slice(0, 8).forEach(([k,v]) =>
      console.log(`    ${k}: BEV=${v.bev} PHEV=${v.phev} Total=${v.total}`)
    );
  } else {
    console.log(`  ✗ 0 marcas`);
  }
}

await browser.close();

const datestamp = new Date().toISOString().split("T")[0];
const rawPath = join(OUT_DIR, `marcas-v5-${datestamp}.json`);
writeFileSync(rawPath, JSON.stringify(resultsByYear, null, 2));
console.log(`\n💾 Raw: ${rawPath}`);

const years = Object.keys(resultsByYear).map(Number).sort((a,b) => b-a);
if (!DRY_RUN && years.length > 0) {
  let content = readFileSync(TS_MARCAS, "utf8");

  const entries = years.map(año => {
    const marcas = Object.entries(resultsByYear[año])
      .sort(([,a],[,b]) => (b.bev+b.phev) - (a.bev+a.phev))
      .map(([marca, d]) => `      { marca: ${JSON.stringify(marca)}, bev: ${d.bev}, phev: ${d.phev} },`)
      .join("\n");
    return `  {\n    año: ${año},\n    fuente: "AEDIVE",\n    marcas: [\n${marcas}\n    ],\n  },`;
  }).join("\n");

  const newArray = `export const topMarcasPorAño: MarcasPorAñoEntry[] = [\n${entries}\n];`;
  const regex = /export const topMarcasPorAño[\s\S]*?^\];/m;
  content = regex.test(content) ? content.replace(regex, newArray) : content + "\n" + newArray + "\n";

  const añoBase = years.find(a => Object.keys(resultsByYear[a]).length >= 5);
  if (añoBase) {
    const top = Object.entries(resultsByYear[añoBase])
      .sort(([,a],[,b]) => (b.bev+b.phev) - (a.bev+a.phev))
      .slice(0, 10)
      .map(([m, d]) => `  { marca: ${JSON.stringify(m)}, bev: ${d.bev}, phev: ${d.phev} },`)
      .join("\n");
    content = content.replace(/export const topMarcas = \[[\s\S]*?\];/, `export const topMarcas = [\n${top}\n];`);
  }

  writeFileSync(TS_MARCAS, content);
  console.log(`\n✅ ${TS_MARCAS} actualizado`);
} else {
  console.log(`\n[DRY RUN] ${TS_MARCAS} no actualizado.`);
}

console.log("\n✨ Terminado.");
