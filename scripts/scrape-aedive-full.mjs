/**
 * scrape-aedive-full.mjs
 * Extrae TODA la información del dashboard Power BI de AEDIVE y genera
 * una tabla JSON unificada + actualiza los archivos .ts de datos.
 *
 * Vistas cubiertas:
 *   1. Evolución Histórica     → historicoPre2020 (BEV+PHEV anuales 2009-2019)
 *   2. Evolución por Años      → matriculacionesPorAño (mensual 2020-2026)
 *   3. Segmentación por Marcas → topMarcasPorAño (BEV+PHEV por marca y año)
 *   4. Segmentación por Provincias → provinciasPorMatriculaciones (acumulado)
 *
 * Uso:
 *   node scripts/scrape-aedive-full.mjs
 *   node scripts/scrape-aedive-full.mjs --dry-run
 *   node scripts/scrape-aedive-full.mjs --only=marcas
 *   node scripts/scrape-aedive-full.mjs --only=historico,mensual,marcas,provincias
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, "..");
const SS_DIR     = join(ROOT, "scripts/screenshots");
const OUT_DIR    = join(ROOT, "scripts/scrape-output");
const TS_MATRICULACIONES = join(ROOT, "app/lib/insights/matriculaciones-data.ts");
const TS_MARCAS          = join(ROOT, "app/lib/insights/marcas-data.ts");
const TS_PROVINCIAS      = join(ROOT, "app/lib/insights/provincias-data.ts");

const DRY_RUN = process.argv.includes("--dry-run");
const ONLY_ARG = process.argv.find(a => a.startsWith("--only="));
const ONLY = ONLY_ARG ? ONLY_ARG.split("=")[1].split(",") : ["historico","mensual","marcas","provincias"];

const URL = "https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9";

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
const MES_MAP = {
  Enero:"Ene", Febrero:"Feb", Marzo:"Mar", Abril:"Abr",
  Mayo:"May", Junio:"Jun", Julio:"Jul", Agosto:"Ago",
  Septiembre:"Sep", Octubre:"Oct", Noviembre:"Nov", Diciembre:"Dic",
};
const MES_ORDER = Object.keys(MES_MAP);

// ─── helpers ──────────────────────────────────────────────────────────────────

function log(msg) { console.log(msg); }

async function readAria(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[aria-label]")]
      .map(e => e.getAttribute("aria-label"))
      .filter(l => l && l.length > 3)
  );
}

async function navigate(page, tabText) {
  log(`  → Navegando a "${tabText}"...`);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(5000);
  try {
    await page.getByText(tabText, { exact: false }).first().click({ timeout: 8000 });
    await page.waitForTimeout(7000);
  } catch {
    log(`  ⚠  Tab "${tabText}" no encontrado — asumiendo que ya está en la vista correcta`);
  }
}

async function enterKeyboardMode(page, clickX = 700, clickY = 500) {
  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(700);
}

/** Navega derecha/izquierda/abajo para barrer todos los data points del chart activo */
async function sweepChart(page, { passes = 40, delay = 180 } = {}) {
  const labels = new Set();
  // barrido derecha
  for (let i = 0; i < passes; i++) {
    (await readAria(page)).forEach(l => labels.add(l));
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(delay);
    (await readAria(page)).forEach(l => labels.add(l));
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(delay);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(delay);
  }
  // barrido izquierda (para no perder inicio)
  for (let i = 0; i < passes; i++) {
    (await readAria(page)).forEach(l => labels.add(l));
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(delay);
    (await readAria(page)).forEach(l => labels.add(l));
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(delay);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(delay);
  }
  return [...labels];
}

function parseNum(str) {
  return parseInt(String(str).replace(/[.\s]/g, "").replace(",", ".")) || 0;
}

// ─── 1. HISTÓRICO PRE-2020 ────────────────────────────────────────────────────

async function scrapeHistorico(page) {
  log("\n📅 [1/4] Evolución Histórica (2009–2019)...");
  await navigate(page, "Evolución Histórica");
  await page.screenshot({ path: join(SS_DIR, "historico.png") });
  await enterKeyboardMode(page, 700, 450);

  const raw = await sweepChart(page, { passes: 24, delay: 200 });
  log(`  Labels capturados: ${raw.length}`);

  // Formato esperado: "Año 2015. Cat BEV. Suma de Unidades 2.992."
  const parsed = {};
  for (const l of raw) {
    const m = l.match(/Año\s+(\d{4})\.\s*Cat\s+(BEV|PHEV)\.\s*Suma de Unidades\s+([\d.]+)/i);
    if (m) {
      const año = Number(m[1]), cat = m[2], val = parseNum(m[3]);
      if (!parsed[año]) parsed[año] = { BEV: 0, PHEV: 0 };
      parsed[año][cat] = val;
    }
  }

  log(`  Años encontrados: ${Object.keys(parsed).sort().join(", ") || "ninguno (revisar ARIA)"}`);
  return parsed;
}

// ─── 2. MENSUAL POR AÑO ───────────────────────────────────────────────────────

async function scrapeMensual(page) {
  log("\n📅 [2/4] Evolución Mensual por Año (2020–2026)...");
  const result = {};

  for (const año of YEARS) {
    await navigate(page, "Evolución por Años");

    // Slicer de año — está en el primer iframe visual-sandbox
    const slicer = page.frameLocator("iframe.visual-sandbox").nth(0);
    const yearSpan = slicer.locator(".slicerText", { hasText: String(año) }).first();
    if (!(await yearSpan.isVisible({ timeout: 5000 }).catch(() => false))) {
      log(`  ⚠  ${año}: no disponible en el slicer`);
      continue;
    }
    await yearSpan.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(SS_DIR, `mensual-${año}.png`) });
    await enterKeyboardMode(page, 700, 530);

    const raw = await sweepChart(page, { passes: 16, delay: 180 });
    const parsed = {};
    for (const l of raw) {
      const m = l.match(/Mes\s+(\w+)\.\s*Cat\s+(BEV|PHEV)\.\s*Suma de Unidades\s+([\d.]+)/i);
      if (m) {
        const mes = m[1], cat = m[2], val = parseNum(m[3]);
        if (!parsed[mes]) parsed[mes] = { BEV: 0, PHEV: 0 };
        parsed[mes][cat] = val;
      }
    }

    const count = Object.keys(parsed).length;
    log(`  ${año}: ${count} meses`);
    if (count > 0) result[año] = parsed;

    // deseleccionar año
    await yearSpan.click().catch(() => {});
    await page.waitForTimeout(800);
  }

  return result;
}

// ─── 3. MARCAS POR AÑO ────────────────────────────────────────────────────────

async function scrapeMarcas(page) {
  log("\n🏷  [3/4] Segmentación por Marcas (por año)...");
  const result = {};

  for (const año of YEARS) {
    await navigate(page, "Segmentación por Marcas");
    await page.screenshot({ path: join(SS_DIR, `marcas-pre-${año}.png`) });

    // Intentar seleccionar año en slicer (puede estar en iframe.visual-sandbox nth(0) o nth(1))
    let yearSelected = false;
    for (let nth = 0; nth <= 3; nth++) {
      try {
        const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
        const yearSpan = slicer.locator(".slicerText", { hasText: String(año) }).first();
        if (await yearSpan.isVisible({ timeout: 2000 })) {
          await yearSpan.click();
          await page.waitForTimeout(3000);
          yearSelected = true;
          log(`  Año ${año} seleccionado en slicer iframe[${nth}]`);
          break;
        }
      } catch { /* ignorar */ }
    }

    if (!yearSelected) {
      log(`  ⚠  ${año}: slicer no encontrado — capturando estado actual`);
    }

    await page.screenshot({ path: join(SS_DIR, `marcas-${año}.png`) });
    await enterKeyboardMode(page, 700, 450);

    const raw = await sweepChart(page, { passes: 60, delay: 150 });
    const parsed = {};
    for (const l of raw) {
      // Formato esperado: "Marca Tesla. Cat BEV. Suma de Unidades 20.449."
      // Alternativo:      "Tesla. BEV. 20449"
      const m =
        l.match(/Marca\s+(.+?)\.\s*Cat\s+(BEV|PHEV)\.\s*Suma de Unidades\s+([\d.]+)/i) ||
        l.match(/^(.+?)\.\s*(BEV|PHEV)\.\s*([\d.]+)$/i);
      if (m) {
        const marca = m[1].trim(), cat = m[2].toUpperCase(), val = parseNum(m[3]);
        if (marca && val > 0) {
          if (!parsed[marca]) parsed[marca] = { BEV: 0, PHEV: 0 };
          parsed[marca][cat] = val;
        }
      }
    }

    const count = Object.keys(parsed).length;
    log(`  ${año}: ${count} marcas → ${Object.keys(parsed).slice(0,5).join(", ")}${count>5?"…":""}`);
    if (count > 0) result[año] = parsed;

    // deseleccionar
    if (yearSelected) {
      try {
        for (let nth = 0; nth <= 3; nth++) {
          const slicer = page.frameLocator("iframe.visual-sandbox").nth(nth);
          const yearSpan = slicer.locator(".slicerText", { hasText: String(año) }).first();
          if (await yearSpan.isVisible({ timeout: 1000 })) { await yearSpan.click(); break; }
        }
      } catch { /* ignorar */ }
      await page.waitForTimeout(800);
    }
  }

  return result;
}

// ─── 4. PROVINCIAS ────────────────────────────────────────────────────────────

async function scrapeProvincias(page) {
  log("\n🗺  [4/4] Segmentación por Provincias...");
  await navigate(page, "Segmentación por Provincias");
  await page.screenshot({ path: join(SS_DIR, "provincias.png") });
  await enterKeyboardMode(page, 700, 500);

  const raw = await sweepChart(page, { passes: 60, delay: 160 });
  log(`  Labels capturados: ${raw.length}`);

  // Formato esperado: "Provincia Madrid. Suma de Unidades 136.190."
  const parsed = {};
  for (const l of raw) {
    const m =
      l.match(/Provincia\s+(.+?)\.\s*Suma de Unidades\s+([\d.]+)/i) ||
      l.match(/^([A-ZÁÉÍÓÚÜÑ][^.]+)\.\s*([\d.]{4,})/i);
    if (m) {
      const prov = m[1].trim(), val = parseNum(m[2]);
      if (prov && val > 10) parsed[prov] = val;
    }
  }

  log(`  Provincias encontradas: ${Object.keys(parsed).length}`);
  return parsed;
}

// ─── GENERADOR DE TABLA UNIFICADA ─────────────────────────────────────────────

function generateUnifiedTable(historico, mensual, marcas, provincias) {
  const rows = [];

  // Histórico
  for (const [año, d] of Object.entries(historico || {})) {
    rows.push({ vista: "historico", año: Number(año), mes: null, marca: null, provincia: null, bev: d.BEV, phev: d.PHEV, total: d.BEV + d.PHEV });
  }

  // Mensual
  for (const [año, meses] of Object.entries(mensual || {})) {
    for (const [mesES, d] of Object.entries(meses)) {
      rows.push({ vista: "mensual", año: Number(año), mes: MES_MAP[mesES] ?? mesES, marca: null, provincia: null, bev: d.BEV, phev: d.PHEV, total: d.BEV + d.PHEV });
    }
  }

  // Marcas
  for (const [año, marcasAño] of Object.entries(marcas || {})) {
    for (const [marca, d] of Object.entries(marcasAño)) {
      rows.push({ vista: "marcas", año: Number(año), mes: null, marca, provincia: null, bev: d.BEV, phev: d.PHEV, total: d.BEV + d.PHEV });
    }
  }

  // Provincias
  for (const [prov, total] of Object.entries(provincias || {})) {
    rows.push({ vista: "provincias", año: null, mes: null, marca: null, provincia: prov, bev: null, phev: null, total });
  }

  return rows;
}

// ─── ESCRITORES DE ARCHIVOS .TS ───────────────────────────────────────────────

function writeMarcasTs(marcasPorAño) {
  const años = Object.keys(marcasPorAño).map(Number).sort((a,b) => b - a);
  const entries = años.map(año => {
    const marcas = Object.entries(marcasPorAño[año])
      .sort(([,a],[,b]) => (b.BEV+b.PHEV) - (a.BEV+a.PHEV))
      .map(([marca, d]) => `      { marca: ${JSON.stringify(marca)}, bev: ${d.BEV}, phev: ${d.PHEV} },`)
      .join("\n");
    return `  {\n    año: ${año},\n    fuente: "AEDIVE",\n    marcas: [\n${marcas}\n    ],\n  },`;
  }).join("\n");

  // Leer el archivo actual y reemplazar solo el array topMarcasPorAño
  let content = readFileSync(TS_MARCAS, "utf8");
  const arrayRegex = /export const topMarcasPorAño[\s\S]*?^\];/m;
  const newArray = `export const topMarcasPorAño: MarcasPorAñoEntry[] = [\n${entries}\n  // TODO: añadir años anteriores cuando estén disponibles\n];`;
  if (arrayRegex.test(content)) {
    content = content.replace(arrayRegex, newArray);
  } else {
    content += `\n${newArray}\n`;
  }

  // También actualizar topMarcas con el año más reciente completo
  const añoReciente = años.find(a => Object.keys(marcasPorAño[a]).length >= 5);
  if (añoReciente) {
    const top10 = Object.entries(marcasPorAño[añoReciente])
      .sort(([,a],[,b]) => (b.BEV+b.PHEV) - (a.BEV+a.PHEV))
      .slice(0, 10)
      .map(([marca, d]) => `  { marca: ${JSON.stringify(marca)}, bev: ${d.BEV}, phev: ${d.PHEV} },`)
      .join("\n");
    const topMarcasRegex = /export const topMarcas = \[[\s\S]*?\];/;
    content = content.replace(topMarcasRegex, `export const topMarcas = [\n${top10}\n];`);
  }

  return content;
}

function writeMatriculacionesTs(historico, mensual) {
  let content = readFileSync(TS_MATRICULACIONES, "utf8");
  const now = new Date().toISOString().split("T")[0];
  content = content.replace(/\/\/ Última actualización: .+/, `// Última actualización: ${now}`);

  // Actualizar historicoPre2020 si hay datos
  if (Object.keys(historico).length > 0) {
    const lines = Object.entries(historico)
      .filter(([a]) => Number(a) < 2020)
      .sort(([a],[b]) => Number(a)-Number(b))
      .map(([año, d]) => `  { año: ${año}, bev: ${d.BEV},${" ".repeat(Math.max(1,6-String(d.BEV).length))}phev: ${d.PHEV}${" ".repeat(Math.max(1,5-String(d.PHEV).length))}}`)
      .join(",\n");
    const histRegex = /export const historicoPre2020[\s\S]*?^\];/m;
    content = content.replace(histRegex, `export const historicoPre2020: HistoricalAnualEntry[] = [\n${lines},\n];`);
  }

  // Actualizar/añadir bloques mensuales por año
  for (const [añoStr, meses] of Object.entries(mensual)) {
    const año = Number(añoStr);
    const isParcial = año === new Date().getFullYear() && Object.keys(meses).length < 12;
    const mesLines = MES_ORDER
      .filter(m => meses[m])
      .map(m => {
        const d = meses[m] ?? { BEV: 0, PHEV: 0 };
        return `      { mes: "${MES_MAP[m]}", bev: ${d.BEV}, phev: ${d.PHEV} },`;
      })
      .join("\n");

    const newBlock = `  {\n    año: ${año},${isParcial ? "\n    parcial: true," : ""}\n    meses: [\n${mesLines}\n    ],\n  }`;
    // Anclado al bloque exacto: `  {` + newline + `    año: N,` + ...contenido... + `\n  },`
    const blockRegex = new RegExp(`  \\{\\n\\s*año:\\s*${año},[\\s\\S]*?\\n  \\},`, "g");
    if (blockRegex.test(content)) {
      content = content.replace(blockRegex, newBlock + ",");
    } else {
      content = content.replace(/(\];\s*\nexport function)/, `${newBlock},\n];\nexport function`);
    }
  }

  return content;
}

function writeProvinciasTs(provincias) {
  if (Object.keys(provincias).length === 0) return null;
  let content = readFileSync(TS_PROVINCIAS, "utf8");

  const entries = Object.entries(provincias)
    .sort(([,a],[,b]) => b - a)
    .map(([nombre, total]) => {
      const safe = JSON.stringify(nombre);
      return `  { nombre: ${safe}, aedive: ${safe.toUpperCase()}, total: ${total}, ccaa: "" },`;
    })
    .join("\n");

  const arrayRegex = /export const provinciasPorMatriculaciones[\s\S]*?^\];/m;
  if (arrayRegex.test(content)) {
    content = content.replace(arrayRegex,
      `export const provinciasPorMatriculaciones: ProvinciaData[] = [\n${entries}\n];`);
  }
  return content;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(SS_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  log("🚀 AEDIVE Full Scraper");
  log(`   Vistas: ${ONLY.join(", ")}`);
  if (DRY_RUN) log("   Modo: DRY RUN (no escribe archivos .ts)");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1400, height: 900 },
    locale: "es-ES",
  });
  const page = await context.newPage();

  const data = { historico: {}, mensual: {}, marcas: {}, provincias: {} };

  try {
    if (ONLY.includes("historico"))  data.historico  = await scrapeHistorico(page);
    if (ONLY.includes("mensual"))    data.mensual    = await scrapeMensual(page);
    if (ONLY.includes("marcas"))     data.marcas     = await scrapeMarcas(page);
    if (ONLY.includes("provincias")) data.provincias = await scrapeProvincias(page);
  } catch (err) {
    log(`\n❌ Error durante scraping: ${err.message}`);
    await page.screenshot({ path: join(SS_DIR, "error.png") });
  } finally {
    await browser.close();
  }

  // Tabla unificada
  const table = generateUnifiedTable(data.historico, data.mensual, data.marcas, data.provincias);
  const datestamp = new Date().toISOString().split("T")[0];
  const jsonPath = join(OUT_DIR, `aedive-full-${datestamp}.json`);
  writeFileSync(jsonPath, JSON.stringify({ scrapeDate: datestamp, data, table }, null, 2));
  log(`\n💾 JSON unificado: ${jsonPath}`);
  log(`   Total filas: ${table.length}`);
  log(`   Histórico: ${Object.keys(data.historico).length} años`);
  log(`   Mensual: ${Object.values(data.mensual).reduce((s,m)=>s+Object.keys(m).length,0)} meses`);
  log(`   Marcas: ${Object.values(data.marcas).reduce((s,m)=>s+Object.keys(m).length,0)} entradas (${Object.keys(data.marcas).length} años)`);
  log(`   Provincias: ${Object.keys(data.provincias).length}`);

  // Escribir archivos .ts
  if (!DRY_RUN) {
    if (ONLY.includes("marcas") && Object.keys(data.marcas).length > 0) {
      writeFileSync(TS_MARCAS, writeMarcasTs(data.marcas));
      log(`✅ Actualizado: ${TS_MARCAS}`);
    }
    if ((ONLY.includes("historico") || ONLY.includes("mensual")) &&
        (Object.keys(data.historico).length > 0 || Object.keys(data.mensual).length > 0)) {
      writeFileSync(TS_MATRICULACIONES, writeMatriculacionesTs(data.historico, data.mensual));
      log(`✅ Actualizado: ${TS_MATRICULACIONES}`);
    }
    if (ONLY.includes("provincias") && Object.keys(data.provincias).length > 0) {
      const pContent = writeProvinciasTs(data.provincias);
      if (pContent) { writeFileSync(TS_PROVINCIAS, pContent); log(`✅ Actualizado: ${TS_PROVINCIAS}`); }
    }
  } else {
    log("\n[DRY RUN] Archivos .ts NO escritos.");
  }

  log("\n✨ Terminado.");
}

main().catch(err => { console.error("❌ Fatal:", err); process.exit(1); });
