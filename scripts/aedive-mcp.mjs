/**
 * AEDIVE MCP Server — Especialista en datos del dashboard AEDIVE
 *
 * Fuente principal: Dashboard Power BI público de AEDIVE
 * https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9
 *
 * Fuente secundaria: Página de estadísticas de aedive.es (datos anuales agregados)
 *
 * AEDIVE = Asociación Empresarial para el Desarrollo e Impulso del Vehículo Eléctrico
 *
 * Qué datos ofrece AEDIVE:
 * - Matriculaciones mensuales BEV + PHEV (solo enchufables)
 * - Parque activo (flota acumulada) de vehículos eléctricos en España
 * - Objetivo 2030: 5.5M vehículos enchufables
 * - Desglose BEV vs PHEV en el parque y en matriculaciones
 *
 * Diferencia con DGT y ANFAC:
 * - AEDIVE solo trackea enchufables (BEV + PHEV), ignora HEV/gasolina/diesel
 * - Sus cifras son las más citadas en prensa para la "transición eléctrica en España"
 * - Pueden diferir ligeramente de DGT por criterio de registro
 *
 * Herramientas expuestas:
 *   get_annual_stats     — estadísticas anuales del sitio aedive.es (sin Playwright, rápido)
 *   get_monthly_data     — datos BEV/PHEV mensuales de un año del PowerBI (Playwright, ARIA labels)
 *   get_dashboard_data   — scraping completo del PowerBI con Playwright (texto visible)
 */

import { Server }               from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createRequire } from 'module';

const POWERBI_URL = 'https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9';
const AEDIVE_STATS_URL = 'https://www.aedive.es/estadisticas-movilidad-electrica/';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function pn(str) {
  if (!str) return null;
  const s = str.trim().replace(/[^\d.,]/g, '');
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseInt(s.replace(/\./g, ''), 10);
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d+,\d+$/.test(s)) return parseFloat(s.replace(',', '.'));
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || null;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; capira-insights-bot/1.0)',
      'Accept': 'text/html',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al acceder ${url}`);
  return res.text();
}

// ─────────────────────────────────────────────────────────────────
// Scraping con Playwright (PowerBI)
// ─────────────────────────────────────────────────────────────────

async function scrapePowerBI() {
  let chromium;
  try {
    const require = createRequire(import.meta.url);
    ({ chromium } = require('playwright'));
  } catch {
    throw new Error(
      'Playwright no disponible. Instala con: npx playwright install chromium\n' +
      'Y asegúrate de que playwright está en node_modules.'
    );
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'es-ES',
  });
  const page = await context.newPage();

  try {
    await page.goto(POWERBI_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Esperar a que el reporte cargue — Power BI tarda en renderizar
    // Buscamos elementos con datos numéricos (KPI cards, visual titles)
    await page.waitForTimeout(8000); // PowerBI necesita tiempo para renderizar

    // Intentar esperar por contenido real
    try {
      await page.waitForFunction(
        () => document.body.innerText.length > 500,
        { timeout: 15000 }
      );
    } catch {
      // continuar igualmente
    }

    // Extraer TODOS los textos visibles del DOM renderizado
    const rawTexts = await page.evaluate(() => {
      const texts = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (text && text.length > 1 && text.length < 200) {
          texts.push(text);
        }
      }
      return texts;
    });

    // Extraer títulos de visualizaciones (Power BI usa data-testid y aria-labels)
    const visualTitles = await page.evaluate(() => {
      const selectors = [
        '[data-testid="visual-title"]',
        '[class*="visualTitle"]',
        '[class*="visual-title"]',
        'h1, h2, h3',
        '[role="heading"]',
        '[aria-label]',
      ];
      const found = [];
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach(el => {
          const t = el.textContent?.trim() || el.getAttribute('aria-label') || '';
          if (t.length > 2 && t.length < 200) found.push(t);
        });
      }
      return [...new Set(found)];
    });

    // Extraer números grandes (KPI cards típicamente tienen números con K o M o miles)
    const kpiNumbers = rawTexts.filter(t =>
      /^\d[\d.,]*(?:\s*[KkMm])?$/.test(t) ||
      /^\d[\d.,]*\s*%$/.test(t) ||
      /^[\d.,]+(?:\s+(?:unidades|vehículos|puntos))?$/.test(t)
    );

    // Intentar sacar screenshot para diagnóstico
    let screenshotBase64 = null;
    try {
      const buf = await page.screenshot({ type: 'png', fullPage: false });
      screenshotBase64 = buf.toString('base64').substring(0, 100) + '...[truncado]';
    } catch {}

    // Parsear datos del texto extraído
    const data = parsePowerBITexts(rawTexts, visualTitles);

    return {
      fuente: 'powerbi',
      url: POWERBI_URL,
      timestamp: new Date().toISOString(),
      datos: data,
      kpi_numeros: kpiNumbers.slice(0, 30),
      titulos_visuales: visualTitles.slice(0, 20),
      todos_textos: rawTexts.filter(t => t.length > 3).slice(0, 100),
    };

  } finally {
    await browser.close();
  }
}

/**
 * Intenta parsear los textos extraídos del PowerBI para encontrar KPIs.
 * El Power BI de AEDIVE típicamente muestra:
 * - Total matriculaciones BEV+PHEV en el año actual
 * - Parque activo (flota acumulada)
 * - Objetivo 2030
 * - % BEV vs PHEV del parque
 */
function parsePowerBITexts(texts, titles) {
  const allText = texts.join(' ');
  const data = {};

  // Matriculaciones totales (número grande, ej: 254.783)
  const bigNums = texts.filter(t => /^\d{3}[\.,]\d{3}$/.test(t.trim()))
    .map(t => pn(t));

  // Parque activo suele ser el número más grande (800k+)
  const sorted = bigNums.sort((a, b) => b - a);
  if (sorted[0] > 400000) data.parque_activo_ev = sorted[0];
  if (sorted[1] && sorted[1] < 400000 && sorted[1] > 100000) {
    data.matriculaciones_anuales = sorted[1];
  }

  // Percentajes (BEV% vs PHEV%)
  const pcts = texts.filter(t => /^[\d,]+\s*%$/.test(t.trim())).map(t => pn(t));
  if (pcts.length >= 2) {
    const sorted_pcts = pcts.sort((a, b) => a - b);
    data.porcentajes_detectados = sorted_pcts;
  }

  // Objetivo 2030
  const obj2030 = texts.find(t => /5[\.,]?5(?:00[\.,]?000)?/.test(t));
  if (obj2030) data.objetivo_2030 = 5500000;

  // Año de referencia de los datos
  const yearMatch = allText.match(/\b(202[0-9])\b/g);
  if (yearMatch) {
    const years = [...new Set(yearMatch)].sort();
    data.años_detectados = years;
    data.año_datos = years[years.length - 1];
  }

  // Títulos de secciones
  if (titles.length > 0) data.secciones_detectadas = titles;

  return data;
}

// ─────────────────────────────────────────────────────────────────
// Estadísticas anuales (sitio web AEDIVE — sin Playwright)
// ─────────────────────────────────────────────────────────────────

async function getAnnualStats() {
  const html = await fetchPage(AEDIVE_STATS_URL);
  const text = stripHtml(html);
  const data = {};

  // Matriculaciones totales BEV+PHEV
  let m = text.match(/(\d{3}[\d.]*)\s+(?:vehículos?\s+)?(?:eléctricos?|matriculaciones?|registrados?)/i);
  if (m) data.matriculaciones_bev_phev = pn(m[1]);

  // Parque activo (flota)
  m = text.match(/(\d{3}[\d.]*)\s+(?:vehículos?\s+en\s+circulación|parque|flota)/i);
  if (!m) {
    // AEDIVE típicamente muestra "854.660" como parque activo
    const numMatch = text.match(/(\d{3}\.\d{3})/g);
    if (numMatch) {
      const nums = numMatch.map(pn).sort((a, b) => b - a);
      // El número más grande suele ser el parque activo
      if (nums[0] > 500000) data.parque_activo_estimado = nums[0];
      if (nums[1] && nums[1] > 100000 && nums[1] < 500000) data.matriculaciones_año_estimado = nums[1];
    }
  } else {
    data.parque_activo = pn(m[1]);
  }

  // % BEV vs PHEV
  m = text.match(/([\d,]+)%\s+BEV/i);
  if (m) data.pct_bev = pn(m[1]);
  m = text.match(/([\d,]+)%\s+PHEV/i);
  if (m) data.pct_phev = pn(m[1]);

  // Objetivo 2030
  m = text.match(/5[\.,]500[\.,]000|5\.5\s+millones/i);
  if (m) data.objetivo_2030 = 5500000;

  // Año de referencia
  m = text.match(/(?:al|a\s+)?31\s+de\s+diciembre\s+de\s+(\d{4})|hasta\s+(\d{4})/i);
  if (m) data.año_referencia = m[1] || m[2];

  data.fuente = 'aedive.es (estadísticas web, sin PowerBI)';
  data.url = AEDIVE_STATS_URL;
  data.timestamp = new Date().toISOString();

  // Nota sobre limitaciones
  data.nota = 'Datos anuales agregados del sitio web. Para series mensuales, usar get_dashboard_data (requiere Playwright).';

  return data;
}

// ─────────────────────────────────────────────────────────────────
// Scraping mensual con ARIA labels (lógica de scrape-aedive.mjs)
// ─────────────────────────────────────────────────────────────────

const MES_MAP_ES = {
  Enero:'Ene', Febrero:'Feb', Marzo:'Mar', Abril:'Abr',
  Mayo:'May', Junio:'Jun', Julio:'Jul', Agosto:'Ago',
  Septiembre:'Sep', Octubre:'Oct', Noviembre:'Nov', Diciembre:'Dic',
};
const MES_ORDER_ES = Object.keys(MES_MAP_ES);
const MONTHS_NUM_MAP = { '01':'Enero','02':'Febrero','03':'Marzo','04':'Abril','05':'Mayo','06':'Junio','07':'Julio','08':'Agosto','09':'Septiembre','10':'Octubre','11':'Noviembre','12':'Diciembre' };

async function scrapeLatestMonthData() {
  let chromium;
  try {
    const require = createRequire(import.meta.url);
    ({ chromium } = require('playwright'));
  } catch {
    throw new Error('Playwright no disponible. Ejecuta: cd capira-site && npx playwright install chromium');
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
    locale: 'es-ES',
  });
  const page = await context.newPage();

  try {
    await page.goto(POWERBI_URL, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(5000);

    // Navegar a "Datos Último Mes"
    try {
      await page.getByText('Datos Último Mes', { exact: false }).first().click({ timeout: 8000 });
      await page.waitForTimeout(6000);
    } catch {
      // continuar si no encuentra el tab
    }

    // Leer todos los ARIA labels disponibles
    const allAriaLabels = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-label]')]
        .map(e => e.getAttribute('aria-label'))
        .filter(l => l && l.length > 3)
    );

    // Leer todos los textos visibles
    const allTexts = await page.evaluate(() => {
      const texts = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        const t = node.textContent?.trim();
        if (t && t.length > 1 && t.length < 200) texts.push(t);
      }
      return texts;
    });

    // Intentar extraer BEV/PHEV de los textos (distintos formatos posibles)
    const result = { fuente: 'AEDIVE PowerBI - Datos Último Mes', nota: 'Año solicitado no disponible en slicer; usando pestaña Datos Último Mes' };

    // Buscar patrones de ARIA del gráfico
    const ariaDataLabels = allAriaLabels.filter(l =>
      /Mes \w+\.\s*Cat (BEV|PHEV)\.\s*Suma de Unidades/.test(l) ||
      /(BEV|PHEV).*\d{3}/.test(l) ||
      /\d{3}.*\.(BEV|PHEV)/.test(l)
    );

    const parsed = {};
    for (const label of ariaDataLabels) {
      const m = label.match(/Mes (\w+)\.\s*Cat (BEV|PHEV)\.\s*Suma de Unidades ([\d.]+)/);
      if (m) {
        const mes = m[1], cat = m[2], val = parseInt(m[3].replace(/\./g, ''));
        if (!parsed[mes]) parsed[mes] = { bev: 0, phev: 0 };
        if (cat === 'BEV') parsed[mes].bev = val;
        else parsed[mes].phev = val;
      }
    }

    // KPIs numéricos: buscar números grandes en el texto
    const bigNums = allTexts.filter(t =>
      /^\d{1,3}[.,]\d{3}$/.test(t.trim()) || /^\d{4,6}$/.test(t.trim())
    ).map(t => ({ raw: t, val: parseInt(t.replace(/[.,]/g, '')) }))
    .filter(n => n.val > 100);

    // Mes actual detectado en los textos
    const mesMatch = allTexts.join(' ').match(
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi
    );
    const mesesMencionados = mesMatch ? [...new Set(mesMatch.map(m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()))] : [];

    result.meses_en_textos = mesesMencionados;
    result.meses_con_datos = Object.keys(parsed).length > 0
      ? Object.entries(parsed).map(([mes, d]) => ({ mes, bev: d.bev, phev: d.phev, total_enchufables: d.bev + d.phev }))
      : null;
    result.kpis_numericos = bigNums.slice(0, 20);
    result.aria_labels_relevantes = ariaDataLabels.slice(0, 30);
    result.todos_textos_visibles = allTexts.filter(t => t.length > 2).slice(0, 80);

    return result;
  } finally {
    await browser.close();
  }
}

async function scrapeMonthlyData(year) {
  let chromium;
  try {
    const require = createRequire(import.meta.url);
    ({ chromium } = require('playwright'));
  } catch {
    throw new Error('Playwright no disponible. Ejecuta: cd capira-site && npx playwright install chromium');
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
    locale: 'es-ES',
  });
  const page = await context.newPage();

  async function readAriaLabels() {
    return page.evaluate(() =>
      [...document.querySelectorAll('[aria-label]')]
        .map(e => e.getAttribute('aria-label'))
        .filter(l => l && /Mes \w+\.\s*Cat (BEV|PHEV)\.\s*Suma de Unidades/.test(l))
    );
  }

  try {
    // Navegar al dashboard
    await page.goto(POWERBI_URL, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(5000);

    // Ir a "Evolución por Años"
    try {
      await page.getByText('Evolución por Años', { exact: false }).first().click({ timeout: 8000 });
      await page.waitForTimeout(6000);
    } catch {
      // continuar si no encuentra el tab
    }

    // Seleccionar año en el slicer
    const slicer = page.frameLocator('iframe.visual-sandbox').nth(0);
    const yearSpan = slicer.locator('.slicerText', { hasText: String(year) }).first();
    const yearVisible = await yearSpan.isVisible({ timeout: 5000 }).catch(() => false);
    if (!yearVisible) {
      // Marcar para fallback — cerramos browser en finally y luego llamamos a scrapeLatestMonthData
      return null; // señal de fallback; interceptado abajo
    }
    await yearSpan.click();
    await page.waitForTimeout(3000);

    // Entrar modo teclado en el chart
    await page.mouse.click(700, 530);
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);

    // Barrer el chart navegando con teclas para leer todos los ARIA labels
    const allLabels = new Set();
    const passes = 14;

    for (let i = 0; i < passes; i++) {
      (await readAriaLabels()).forEach(l => allLabels.add(l));
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(180);
      (await readAriaLabels()).forEach(l => allLabels.add(l));
      await page.keyboard.press('ArrowUp');   await page.waitForTimeout(150);
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250);
    }
    for (let i = 0; i < passes; i++) {
      (await readAriaLabels()).forEach(l => allLabels.add(l));
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(180);
      (await readAriaLabels()).forEach(l => allLabels.add(l));
      await page.keyboard.press('ArrowUp');   await page.waitForTimeout(150);
      await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(250);
    }

    // Parsear ARIA labels → { mes: { bev, phev } }
    // Formato: "Mes Enero. Cat BEV. Suma de Unidades 1.234. Total 5.678."
    const parsed = {};
    for (const label of allLabels) {
      const m = label.match(/Mes (\w+)\.\s*Cat (BEV|PHEV)\.\s*Suma de Unidades ([\d.]+)/);
      if (m) {
        const mes = m[1], cat = m[2], val = parseInt(m[3].replace(/\./g, ''));
        if (!parsed[mes]) parsed[mes] = { bev: 0, phev: 0 };
        if (cat === 'BEV') parsed[mes].bev = val;
        else parsed[mes].phev = val;
      }
    }

    // Ordenar por mes y calcular total
    const mesesOrdenados = MES_ORDER_ES
      .filter(mes => parsed[mes])
      .map(mes => ({
        mes: MES_MAP_ES[mes],
        mes_nombre: mes,
        bev: parsed[mes].bev,
        phev: parsed[mes].phev,
        total_enchufables: parsed[mes].bev + parsed[mes].phev,
      }));

    const totalAnual = mesesOrdenados.reduce((s, m) => ({ bev: s.bev + m.bev, phev: s.phev + m.phev }), { bev: 0, phev: 0 });

    return {
      fuente: 'AEDIVE PowerBI (ARIA labels)',
      año: year,
      parcial: mesesOrdenados.length < 12,
      meses_capturados: mesesOrdenados.length,
      meses: mesesOrdenados,
      total_año: {
        bev: totalAnual.bev,
        phev: totalAnual.phev,
        total_enchufables: totalAnual.bev + totalAnual.phev,
      },
    };

  } finally {
    await browser.close();
  }
}


// ─────────────────────────────────────────────────────────────────
// MCP Server
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'aedive-specialist', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_dashboard_data',
      description: `Scraping del dashboard Power BI público de AEDIVE usando Playwright.
Extrae datos del panel interactivo: matriculaciones BEV+PHEV, parque activo, objetivo 2030, desglose por año.
⚠️ Tarda ~15-20 segundos (lanza un navegador headless para renderizar el JavaScript de Power BI).
Requiere: Playwright instalado y chromium disponible (npx playwright install chromium).
Úsalo cuando necesites datos en tiempo real o series mensuales del dashboard AEDIVE.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_annual_stats',
      description: `Obtiene estadísticas anuales agregadas desde la página web de AEDIVE (sin Playwright, rápido).
Datos típicos: total BEV+PHEV matriculados en el año, parque activo total, % BEV vs PHEV, objetivo 2030.
Limitación: solo datos anuales, no series mensuales. Para detalle mensual usar get_monthly_data.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_monthly_data',
      description: `Extrae datos BEV/PHEV mensuales de un año concreto del dashboard Power BI de AEDIVE.
Navega el chart interactivo leyendo ARIA labels para obtener unidades exactas por mes.
Retorna: array de meses con bev, phev, total_enchufables + total anual acumulado.
⚠️ Requiere Playwright (npx playwright install chromium). Tarda ~30-60 segundos.
Parámetro: año (número, ej: 2026). Disponible desde 2020.`,
      inputSchema: {
        type: 'object',
        properties: {
          anio: { type: 'number', description: 'Año a consultar (ej: 2026). Disponible desde 2020.' },
        },
        required: ['anio'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'get_monthly_data') {
      const year = args?.anio;
      if (!year || isNaN(year)) throw new Error('anio debe ser un número, ej: 2026');
      let data = await scrapeMonthlyData(Number(year));
      // null = año no disponible en slicer → fallback a Datos Último Mes
      if (data === null) data = await scrapeLatestMonthData();
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }

    if (name === 'get_dashboard_data') {
      const data = await scrapePowerBI();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_annual_stats') {
      const data = await getAnnualStats();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    throw new Error(`Herramienta desconocida: ${name}`);

  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: err.message,
          sugerencia: name === 'get_dashboard_data'
            ? 'Si Playwright no está disponible, ejecuta: cd capira-site && npx playwright install chromium'
            : undefined,
        }),
      }],
      isError: true,
    };
  }
});

// ─────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
