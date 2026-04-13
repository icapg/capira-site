/**
 * diagnose-picker2.mjs
 * Finds the dialog/listbox HTML after clicking "Selecciona Marca"
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
await slicer0.locator(".slicerText", { hasText: "2025" }).first().click({ timeout: 5000 });
await page.waitForTimeout(3000);

// Click "Selecciona Marca"
const btn = page.locator('[aria-label="Selecciona Marca "]').first();
await btn.click();
await page.waitForTimeout(3000);

await page.screenshot({ path: join(SS, "picker2-after.png") });

// 1. Get the dialog/listbox HTML
console.log("\n=== DIALOG HTML ===");
const dialogHtml = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return "NO DIALOG FOUND";
  return dialog.outerHTML.slice(0, 5000);
});
console.log(dialogHtml);

// 2. Get listbox items
console.log("\n=== LISTBOX HTML ===");
const listboxHtml = await page.evaluate(() => {
  const listbox = document.querySelector('[role="listbox"]');
  if (!listbox) return "NO LISTBOX FOUND";
  return listbox.outerHTML.slice(0, 5000);
});
console.log(listboxHtml);

// 3. Find elements with brand text using innerText
console.log("\n=== ELEMENTS WITH BRAND TEXT (innerText) ===");
const brandElements = await page.evaluate(() => {
  const brands = ["BMW", "KIA", "BYD", "TOYOTA", "TESLA", "FORD", "RENAULT", "VOLKSWAGEN", "MERCEDES", "MG"];
  const found = [];
  for (const brand of brands) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim() === brand || node.textContent.trim().includes(brand)) {
        const el = node.parentElement;
        found.push({
          brand,
          tag: el.tagName,
          role: el.getAttribute("role"),
          class: el.className?.toString().slice(0, 50),
          parentTag: el.parentElement?.tagName,
          parentRole: el.parentElement?.getAttribute("role"),
          outerHTML: el.outerHTML.slice(0, 200),
        });
        break; // one per brand
      }
    }
  }
  return found;
});
brandElements.forEach(b => {
  console.log(`\n  ${b.brand}:`);
  console.log(`    tag=${b.tag} role=${b.role} class="${b.class}"`);
  console.log(`    parentTag=${b.parentTag} parentRole=${b.parentRole}`);
  console.log(`    html: ${b.outerHTML}`);
});

// 4. What are the direct children of the listbox?
console.log("\n=== LISTBOX CHILDREN DETAIL ===");
const listboxChildren = await page.evaluate(() => {
  const listbox = document.querySelector('[role="listbox"]');
  if (!listbox) return [];
  return [...listbox.querySelectorAll('[role="option"]')].slice(0, 5).map(opt => ({
    role: opt.getAttribute("role"),
    ariaLabel: opt.getAttribute("aria-label"),
    innerText: opt.innerText?.slice(0, 100),
    textContent: opt.textContent?.slice(0, 100),
    html: opt.outerHTML.slice(0, 300),
  }));
});
listboxChildren.forEach((c, i) => {
  console.log(`\n  option[${i}]:`);
  console.log(`    ariaLabel: ${c.ariaLabel}`);
  console.log(`    innerText: "${c.innerText}"`);
  console.log(`    textContent: "${c.textContent}"`);
  console.log(`    html: ${c.html}`);
});

// 5. Search for ALL text nodes inside dialog
console.log("\n=== ALL TEXT NODES IN DIALOG ===");
const dialogTexts = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]') || document.querySelector('[role="listbox"]');
  if (!dialog) return [];
  const texts = [];
  const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (t.length > 0 && t.length < 50) texts.push(t);
  }
  return [...new Set(texts)];
});
console.log(dialogTexts.join("\n"));

await br.close();
console.log("\n✅ Done");
