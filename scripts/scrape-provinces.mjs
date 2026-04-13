import { chromium } from "playwright";

const URL = "https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9";

async function readAriaLabels(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[aria-label]")]
      .map(e => e.getAttribute("aria-label"))
      .filter(l => l && l.length > 3)
  );
}

const b = await chromium.launch({headless: true, args: ["--no-sandbox"]});
const page = await b.newPage();
await page.setViewportSize({width: 1400, height: 900});

// Try provinces page
await page.goto(URL, {waitUntil: "networkidle", timeout: 90000});
await page.waitForTimeout(4000);
await page.getByText("Segmentación por Provincias", {exact: false}).first().click();
await page.waitForTimeout(6000);
await page.screenshot({path: "scripts/screenshots/provincias.png"});

// Enter keyboard mode on chart
await page.mouse.click(700, 500);
await page.waitForTimeout(500);
await page.keyboard.press("Enter");
await page.waitForTimeout(700);

const provLabels = new Set();
for (let i = 0; i < 60; i++) {
  (await readAriaLabels(page)).forEach(l => { if (/[0-9]/.test(l)) provLabels.add(l); });
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(150);
  (await readAriaLabels(page)).forEach(l => { if (/[0-9]/.test(l)) provLabels.add(l); });
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(150);
}

console.log("=== PROVINCIAS ARIA LABELS ===");
[...provLabels].forEach(l => console.log(l));

// Try brands page
await page.goto(URL, {waitUntil: "networkidle", timeout: 90000});
await page.waitForTimeout(4000);
await page.getByText("Segmentación por Marcas", {exact: false}).first().click();
await page.waitForTimeout(6000);
await page.screenshot({path: "scripts/screenshots/marcas.png"});

await page.mouse.click(700, 500);
await page.waitForTimeout(500);
await page.keyboard.press("Enter");
await page.waitForTimeout(700);

const marcasLabels = new Set();
for (let i = 0; i < 40; i++) {
  (await readAriaLabels(page)).forEach(l => { if (/[0-9]/.test(l)) marcasLabels.add(l); });
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
}

console.log("\n=== MARCAS ARIA LABELS ===");
[...marcasLabels].forEach(l => console.log(l));

await b.close();
