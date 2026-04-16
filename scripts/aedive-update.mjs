/**
 * aedive-update.mjs
 *
 * Scraping mensual del dashboard Power BI de AEDIVE → data/aedive-status.json
 *
 * Extrae de la pestaña "Datos Último Mes":
 *   - Período (mes y año, ej: "2026-03")
 *   - Total enchufables (BEV+PHEV)
 *   - Desglose BEV vs PHEV
 *   - Variación vs mes anterior y vs año anterior
 *   - Top 3 marcas por total enchufables
 *
 * Uso:
 *   node scripts/aedive-update.mjs
 *   node scripts/aedive-update.mjs --dry-run
 */

import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, '..');
const STATUS_FILE = join(ROOT, 'data', 'aedive-status.json');
const POWERBI_URL = 'https://app.powerbi.com/view?r=eyJrIjoiYjcwNTExMzctYzQ4Ny00YjliLTg2Y2MtMTQ1ZjQyN2Q3OWIzIiwidCI6ImJiYjEzOGJhLWZjMDYtNDM2ZS04ODhlLTAyYmVjMzFlYTIzYSIsImMiOjl9';

const DRY_RUN = process.argv.includes('--dry-run');

const MES_MAP = {
  enero:'01', febrero:'02', marzo:'03', abril:'04', mayo:'05', junio:'06',
  julio:'07', agosto:'08', septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12',
};

/** Parsea número en formato español (ej: "29.745" → 29745) */
function pn(str) {
  if (!str) return null;
  const s = String(str).trim().replace(/[^\d.]/g, '');
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseInt(s.replace(/\./g, ''), 10);
  const n = parseInt(s.replace(/\./g, ''), 10);
  return isNaN(n) ? null : n;
}

async function scrapeAediveUltimoMes() {
  let chromium;
  try {
    const require = createRequire(import.meta.url);
    ({ chromium } = require('playwright'));
  } catch {
    throw new Error('Playwright no disponible. Ejecutá: cd capira-site && npx playwright install chromium');
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
    locale: 'es-ES',
  });

  try {
    await page.goto(POWERBI_URL, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(5000);

    await page.getByText('Datos Último Mes', { exact: false }).first().click({ timeout: 8000 });
    await page.waitForTimeout(6000);

    // ARIA labels del dashboard
    const ariaLabels = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-label]')]
        .map(e => e.getAttribute('aria-label'))
        .filter(l => l && l.length > 3)
    );

    // Todos los textos visibles en el DOM
    const allTexts = await page.evaluate(() => {
      const t = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let n;
      while ((n = w.nextNode())) {
        const s = n.textContent?.trim();
        if (s && s.length > 1 && s.length < 300) t.push(s);
      }
      return t;
    });

    // ── Total enchufables (KPI card) ──────────────────────────────────────────
    // Formato ARIA: "Matriculaciones 29.745."
    let totalEnchufables = null;
    for (const l of ariaLabels) {
      const m = l.match(/Matriculaciones\s+([\d.]+)\./);
      if (m) { totalEnchufables = pn(m[1]); break; }
    }

    // ── Mes actual ────────────────────────────────────────────────────────────
    // Formato texto: "marzo 2026" o "Último informe: marzo 2026"
    let periodo = null;
    let mesNombre = null;
    const mesesRegex = new RegExp(
      `\\b(${Object.keys(MES_MAP).join('|')})\\s+(20\\d\\d)\\b`, 'i'
    );
    for (const t of allTexts) {
      const m = t.match(mesesRegex);
      if (m) {
        const mes = m[1].toLowerCase();
        const año = m[2];
        periodo = `${año}-${MES_MAP[mes]}`;
        mesNombre = `${m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()} ${año}`;
        break;
      }
    }

    // ── Variación vs mes anterior ─────────────────────────────────────────────
    // Formato ARIA: "% Variación Mes Anterior (26) 26,74 %."
    let varMesAnteriorPct = null;
    for (const l of ariaLabels) {
      // Formato: "% Variación Mes Anterior (26) 26,74 %."
      const m = l.match(/Variación Mes Anterior.*?([\d]+[.,][\d]+)\s*%/i);
      if (m) { varMesAnteriorPct = parseFloat(m[1].replace(',', '.')); break; }
    }

    // ── Variación vs año anterior ─────────────────────────────────────────────
    // Texto visible como "62,50 %" después del label "Vs Año anterior"
    let varAnioAnteriorPct = null;
    const joinedTexts = allTexts.join('\n');
    const varAnioMatch = joinedTexts.match(/Vs\s+A[ñn]o\s+anterior\n([\d,]+)\s*%/i)
      ?? joinedTexts.match(/([\d,]+)\s*%\nVs\s+A[ñn]o\s+anterior/i);
    if (varAnioMatch) {
      varAnioAnteriorPct = parseFloat(varAnioMatch[1].replace(',', '.'));
    }
    // Fallback: buscar % entre 20 y 200 que no sea varMesAnterior
    if (varAnioAnteriorPct === null) {
      for (const t of allTexts) {
        const m = t.match(/^([\d,]+)\s*%$/);
        if (m) {
          const v = parseFloat(m[1].replace(',', '.'));
          if (v > 20 && v < 250 && v !== varMesAnteriorPct) {
            varAnioAnteriorPct = v;
            break;
          }
        }
      }
    }

    // ── Top 3 marcas ──────────────────────────────────────────────────────────
    // Estructura DOM real de "Datos Último Mes":
    //   [i]   BYD
    //   [i+1] TESLA
    //   [i+2] TESLA      ← Power BI duplica algunos labels
    //   [i+3] MERCEDES
    //   [i+4] MERCEDES
    //   [i+5] 4.471      ← primer valor (en formato español con puntos)
    //   [i+6] 2.477
    //   [i+7] 2.160
    // Estrategia: encontrar el bloque de 3 valores consecutivos,
    //   luego buscar hacia atrás los nombres únicos de marca.
    const top3Marcas = [];

    // Encontrar primer bloque de 3 valores formateados consecutivos
    // que sean < totalEnchufables y > 200 (descarta KPIs y totales)
    let firstValIdx = -1;
    const marcaVals = [];
    for (let i = 0; i < allTexts.length; i++) {
      const t = allTexts[i].trim();
      if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
        const val = pn(t);
        if (val && val > 200 && val < (totalEnchufables ?? Infinity)) {
          if (firstValIdx === -1) firstValIdx = i;
          if (marcaVals.length < 3) marcaVals.push(val);
        } else if (marcaVals.length > 0) {
          // Si el número no encaja, resetear (era KPI u otro bloque)
          if (marcaVals.length < 3) { marcaVals.length = 0; firstValIdx = -1; }
        }
      } else if (marcaVals.length > 0 && marcaVals.length < 3 && firstValIdx >= 0) {
        // Texto intermedio no numérico: resetear si llevamos menos de 3
        if (!/^Presione/.test(t)) { marcaVals.length = 0; firstValIdx = -1; }
      }
    }

    if (firstValIdx >= 0 && marcaVals.length === 3) {
      // Buscar hacia atrás los nombres únicos de marca (uppercase, sin espacios, 2-20 chars)
      const uniqueBrands = [];
      const seen = new Set();
      for (let i = firstValIdx - 1; i >= Math.max(0, firstValIdx - 25); i--) {
        const t = allTexts[i].trim();
        if (/^[A-Z][A-Z0-9&\-]{1,19}$/.test(t) && !seen.has(t)) {
          seen.add(t);
          uniqueBrands.unshift(t); // mantener orden original
        }
      }
      // Asociar 1er brand → 1er valor, 2do → 2do, etc.
      for (let k = 0; k < Math.min(uniqueBrands.length, marcaVals.length, 3); k++) {
        top3Marcas.push({ marca: uniqueBrands[k], total: marcaVals[k] });
      }
    }

    // ── BEV y PHEV del mes actual ─────────────────────────────────────────────
    // En la página aparecen los valores mensuales del bar chart como enteros sin formato
    // (los meses anteriores aparecen como 7811, 10803; el mes actual como 14058).
    // La estrategia: entre todos los enteros crudos de 4-6 dígitos, encontrar
    // el par que suma exactamente al total y donde ambos valores > total/5.
    let bev = null;
    let phev = null;

    if (totalEnchufables) {
      // Enteros crudos del DOM (sin puntos ni comas) con 4-6 dígitos
      const rawInts = ariaLabels
        .filter(l => /^\d{4,6}$/.test(l.trim()))
        .map(l => parseInt(l.trim(), 10))
        .filter(v => v > totalEnchufables / 5 && v < totalEnchufables);

      // Eliminar duplicados y ordenar
      const unique = [...new Set(rawInts)].sort((a, b) => a - b);

      // Encontrar par que suma al total
      outer: for (let a = 0; a < unique.length; a++) {
        for (let b = a + 1; b < unique.length; b++) {
          if (unique[a] + unique[b] === totalEnchufables) {
            // Determinar BEV vs PHEV por posición en el array de ARIA labels
            // Los valores BEV aparecen antes que los PHEV en el DOM del chart
            const idxA = ariaLabels.findIndex(l => l.trim() === String(unique[a]));
            const idxB = ariaLabels.findIndex(l => l.trim() === String(unique[b]));
            if (idxA < idxB) {
              bev = unique[a];
              phev = unique[b];
            } else {
              bev = unique[b];
              phev = unique[a];
            }
            break outer;
          }
        }
      }

      // Fallback: BEV = menor, PHEV = mayor (tendencia España 2025-2026)
      if (bev === null) {
        const candidatos = unique.filter(v => {
          const compl = totalEnchufables - v;
          return compl > totalEnchufables / 5 && compl < totalEnchufables && unique.includes(compl);
        });
        if (candidatos.length >= 2) {
          bev  = Math.min(...candidatos);
          phev = Math.max(...candidatos);
        }
      }
    }

    return {
      generado_en:               new Date().toISOString(),
      periodo,
      mes_nombre:                mesNombre,
      bev,
      phev,
      total_enchufables:         totalEnchufables,
      variacion_mes_anterior_pct: varMesAnteriorPct,
      variacion_anio_anterior_pct: varAnioAnteriorPct,
      top3_marcas:               top3Marcas,
      fuente:                    'AEDIVE Power BI - Datos Último Mes',
    };

  } finally {
    await browser.close();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🟡 AEDIVE Update — ' + new Date().toLocaleString('es-ES'));
  if (DRY_RUN) console.log('   (modo dry-run)\n');

  const data = await scrapeAediveUltimoMes();

  console.log(`  Período:  ${data.mes_nombre ?? '(desconocido)'}`);
  console.log(`  BEV:      ${data.bev?.toLocaleString('es-ES') ?? '?'}`);
  console.log(`  PHEV:     ${data.phev?.toLocaleString('es-ES') ?? '?'}`);
  console.log(`  Total:    ${data.total_enchufables?.toLocaleString('es-ES') ?? '?'}`);
  console.log(`  Var mes:  ${data.variacion_mes_anterior_pct ?? '?'}%`);
  console.log(`  Var año:  ${data.variacion_anio_anterior_pct ?? '?'}%`);
  console.log(`  Marcas:   ${data.top3_marcas.map(m => `${m.marca}=${m.total.toLocaleString('es-ES')}`).join(', ')}`);

  if (!DRY_RUN) {
    writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
    console.log('  ✓ Guardado: data/aedive-status.json');
  } else {
    console.log('  (dry-run) aedive-status.json no escrito');
  }

  return data;
}

export { scrapeAediveUltimoMes };
export default main;

main().catch(e => { console.error('❌ AEDIVE Update error:', e.message); process.exit(1); });
