/**
 * Diagnóstico específico para "Acumulado por marcas" y "Acumulado por modelos"
 * Vuelca todos los ARIA labels después de keyboard sweep exhaustivo
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, "..");
const SS_DIR  = join(ROOT, "scripts/screenshots");
const OUT_DIR = join(ROOT, "scripts/scrape-output");
mkdirSync(SS_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const URL = "https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  viewport: { width: 1600, height: 900 },
  locale: "es-ES",
});
const page = await ctx.newPage();

async function allAria() {
  const main = await page.evaluate(() =>
    [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
  );
  const frames = [];
  for (const f of page.frames()) {
    try {
      const ls = await f.evaluate(() =>
        [...document.querySelectorAll("[aria-label]")].map(e => e.getAttribute("aria-label")).filter(Boolean)
      );
      frames.push(...ls);
    } catch {}
  }
  return [...new Set([...main, ...frames])];
}

async function sweep(x, y, steps = 80) {
  const labels = new Set();
  await page.mouse.click(x, y);
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  for (let i = 0; i < steps; i++) {
    (await allAria()).forEach(l => labels.add(l));
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(120);
  }
  for (let i = 0; i < steps; i++) {
    (await allAria()).forEach(l => labels.add(l));
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(120);
  }
  for (let i = 0; i < steps; i++) {
    (await allAria()).forEach(l => labels.add(l));
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(120);
  }
  return [...labels];
}

const results = {};

for (const tab of ["Acumulado por marcas", "Acumulado por modelos", "Datos Último Mes"]) {
  console.log(`\n── ${tab} ──`);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(5000);
  try {
    await page.getByText(tab, { exact: false }).first().click({ timeout: 8000 });
    await page.waitForTimeout(8000);
  } catch { console.log("  ⚠ Tab no encontrado"); continue; }

  await page.screenshot({ path: join(SS_DIR, `diag2-${tab.replace(/ /g,"-")}.png`) });

  // Barrer múltiples zonas del gráfico
  const allLabels = new Set();
  for (const [x, y] of [[400,300],[700,300],[700,450],[700,550],[900,400],[1100,400]]) {
    const ls = await sweep(x, y, 80);
    ls.forEach(l => allLabels.add(l));
  }

  const arr = [...allLabels].filter(l => l.length > 3);
  results[tab] = arr;
  console.log(`  Total labels únicos: ${arr.length}`);

  // Mostrar solo los que parecen datos (tienen números o nombres de marcas conocidas)
  const dataLabels = arr.filter(l =>
    /\d/.test(l) ||
    /tesla|toyota|renault|volkswagen|hyundai|kia|bmw|mercedes|ford|byd|mg|volvo|peugeot|seat|cupra|audi|skoda|opel|nissan|mitsubishi/i.test(l)
  );
  console.log(`  Labels con datos (${dataLabels.length}):`);
  dataLabels.slice(0, 50).forEach(l => console.log("   ", JSON.stringify(l)));
}

await browser.close();

const out = join(OUT_DIR, `diagnose-acumulado-${new Date().toISOString().split("T")[0]}.json`);
writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`\n✅ Guardado: ${out}`);
