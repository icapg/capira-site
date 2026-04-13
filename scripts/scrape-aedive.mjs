/**
 * Scraper de matriculaciones EV — AEDIVE Power BI
 *
 * Navega el dashboard de AEDIVE, selecciona cada año en el slicer,
 * y extrae datos BEV/PHEV mensuales via navegación por teclado (ARIA labels).
 *
 * Uso:
 *   node scripts/scrape-aedive.mjs
 *   node scripts/scrape-aedive.mjs --dry-run   (no escribe el archivo de datos)
 *   node scripts/scrape-aedive.mjs --years=2024,2025
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_FILE = join(ROOT, "app/lib/insights/matriculaciones-data.ts");
const SCREENSHOTS_DIR = join(ROOT, "scripts/screenshots");

const DRY_RUN = process.argv.includes("--dry-run");
const YEARS_ARG = process.argv.find((a) => a.startsWith("--years="));
const YEARS_TO_SCRAPE = YEARS_ARG
  ? YEARS_ARG.split("=")[1].split(",").map(Number)
  : [2022, 2023, 2024, 2025, 2026];

const POWERBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9";

const MES_MAP = {
  Enero: "Ene", Febrero: "Feb", Marzo: "Mar", Abril: "Abr",
  Mayo: "May", Junio: "Jun", Julio: "Jul", Agosto: "Ago",
  Septiembre: "Sep", Octubre: "Oct", Noviembre: "Nov", Diciembre: "Dic",
};
const MES_ORDER = Object.keys(MES_MAP);

// ---------------------------------------------------------------------------

async function readAriaLabels(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[aria-label]")]
      .map((e) => e.getAttribute("aria-label"))
      .filter((l) => l && /Mes \w+\.\s*Cat (BEV|PHEV)\.\s*Suma de Unidades/.test(l))
  );
}

async function extractYearData(page, año) {
  console.log(`\n📅 Extrayendo ${año}...`);

  // Navegar al inicio
  await page.goto(POWERBI_URL, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(4000);

  // Ir a "Evolución por Años"
  await page.getByText("Evolución por Años", { exact: false }).first().click();
  await page.waitForTimeout(6000);

  // Seleccionar año en el slicer (iframe.visual-sandbox[0])
  const slicer = page.frameLocator("iframe.visual-sandbox").nth(0);
  const yearSpan = slicer.locator(".slicerText", { hasText: String(año) }).first();
  if (!(await yearSpan.isVisible({ timeout: 3000 }))) {
    console.log(`  ⚠️  Año ${año} no disponible en el slicer`);
    return null;
  }
  await yearSpan.click();
  await page.waitForTimeout(3000);

  // Screenshot del estado
  await page.screenshot({ path: join(SCREENSHOTS_DIR, `año-${año}.png`) });

  // Entrar modo accesibilidad del chart
  await page.mouse.click(700, 530);
  await page.waitForTimeout(500);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(700);

  // Recoger datos navegando: primero avanzar a la derecha (futuro), luego retroceder al inicio
  // El chart empieza en el mes más reciente con datos
  const allLabels = new Set();

  // Paso 1: avanzar a la derecha 14 veces (llegar al mes 12 si empezamos en mes 1, o al final)
  for (let i = 0; i < 14; i++) {
    (await readAriaLabels(page)).forEach((l) => allLabels.add(l));
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(180);
    (await readAriaLabels(page)).forEach((l) => allLabels.add(l));
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(250);
  }

  // Paso 2: retroceder a la izquierda 14 veces para capturar meses del inicio del año
  for (let i = 0; i < 14; i++) {
    (await readAriaLabels(page)).forEach((l) => allLabels.add(l));
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(180);
    (await readAriaLabels(page)).forEach((l) => allLabels.add(l));
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(250);
  }

  // Parsear ARIA labels → { mes: { BEV, PHEV } }
  // Formato español: "Mes Enero. Cat BEV. Suma de Unidades 1.234. Total 5.678."
  // Nota: separador de miles es punto (.) en España
  const parsed = {};
  for (const label of allLabels) {
    const m = label.match(/Mes (\w+)\.\s*Cat (BEV|PHEV)\.\s*Suma de Unidades ([\d\.]+)/);
    if (m) {
      const mes = m[1], cat = m[2], val = parseInt(m[3].replace(/\./g, ""));
      if (!parsed[mes]) parsed[mes] = { BEV: 0, PHEV: 0 };
      parsed[mes][cat] = val;
    }
  }

  const mesCount = Object.keys(parsed).length;
  console.log(`  ✓ ${mesCount} meses capturados`);

  // Deseleccionar año para volver a estado neutro
  await yearSpan.click();
  await page.waitForTimeout(1000);

  return parsed;
}

// ---------------------------------------------------------------------------
// Parchear el archivo .ts — solo reemplaza entradas AEDIVE (2022+)
// Preserva 2020/2021 estimados, historicoPre2022, y todos los tipos
// ---------------------------------------------------------------------------

function patchDataFile(dataByYear) {
  const currentContent = readFileSync(DATA_FILE, "utf8");
  const now = new Date().toISOString().split("T")[0];

  // Actualizar fecha en el header
  let result = currentContent.replace(
    /\/\/ Última actualización: .+/,
    `// Última actualización: ${now}`
  );

  // Detectar si 2026 es parcial
  const data2026 = dataByYear[2026];
  const meses2026 = data2026
    ? MES_ORDER.filter((m) => (data2026[m]?.BEV ?? 0) > 0)
    : [];
  const maxMes2026 = meses2026.length;

  // Para cada año scrapeado, reemplazar su bloque en el array
  for (const [añoStr, yearData] of Object.entries(dataByYear)) {
    const año = Number(añoStr);
    const isParcial = año === 2026 && maxMes2026 < 12;
    const mesesToUse = isParcial ? MES_ORDER.slice(0, maxMes2026) : MES_ORDER;

    const mesLines = mesesToUse
      .map((mesES) => {
        const d = yearData[mesES] ?? { BEV: 0, PHEV: 0 };
        return `      { mes: "${MES_MAP[mesES]}", bev: ${d.BEV || 0}, phev: ${d.PHEV || 0} },`;
      })
      .join("\n");

    const newBlock = `  {
    año: ${año},${isParcial ? "\n    parcial: true," : ""}
    meses: [
${mesLines}
    ],
  }`;

    // Reemplazar bloque existente para este año (entre `{ año: XXXX,` y el cierre `},`)
    const blockRegex = new RegExp(
      `  \\{[\\s\\S]*?año:\\s*${año},[\\s\\S]*?\\},`,
      "g"
    );
    if (blockRegex.test(result)) {
      result = result.replace(blockRegex, newBlock + ",");
    } else {
      // No existe todavía — insertar antes del cierre del array
      result = result.replace(
        /(\];\s*\nexport function)/,
        `${newBlock},\n];\nexport function`
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  console.log("🚀 Scraper AEDIVE — eMobility Insights");
  console.log(`   Años a scrapear: ${YEARS_TO_SCRAPE.join(", ")}`);
  if (DRY_RUN) console.log("   Modo: DRY RUN");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1400, height: 900 },
    locale: "es-ES",
  });
  const page = await context.newPage();

  const dataByYear = {};

  try {
    console.log("  Archivo de datos existente cargado.");
  } catch {
    console.log("  Archivo de datos no encontrado — se creará desde cero.");
  }

  try {
    for (const año of YEARS_TO_SCRAPE) {
      const yearData = await extractYearData(page, año);
      if (yearData && Object.keys(yearData).length > 0) {
        dataByYear[año] = yearData;
        console.log(`  ✅ ${año}: OK`);
      } else {
        console.log(`  ⚠️  ${año}: sin datos`);
      }
    }
  } finally {
    await browser.close();
  }

  if (Object.keys(dataByYear).length === 0) {
    console.error("❌ No se extrajeron datos. Revisá los screenshots.");
    process.exit(1);
  }

  // Guardar JSON de resultados brutos
  const rawPath = join(SCREENSHOTS_DIR, `aedive-data-${new Date().toISOString().split("T")[0]}.json`);
  writeFileSync(rawPath, JSON.stringify(dataByYear, null, 2));
  console.log(`\n💾 Datos brutos: ${rawPath}`);

  // Parchear el archivo .ts (solo reemplaza bloques AEDIVE, preserva estimados)
  const newContent = patchDataFile(dataByYear);

  if (!DRY_RUN) {
    writeFileSync(DATA_FILE, newContent);
    console.log(`✅ Archivo actualizado: ${DATA_FILE}`);
  } else {
    console.log("\n[DRY RUN] Contenido que se escribiría:");
    console.log(newContent.substring(0, 500) + "...");
  }

  console.log("\n✨ Scraper terminado.");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
