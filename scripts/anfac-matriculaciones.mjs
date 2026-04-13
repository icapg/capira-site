/**
 * ANFAC Matriculaciones Scraper
 * ─────────────────────────────────────────────────────────────────────────────
 * Fuentes:
 *  1. Chart API live  → chartviewer-europublic.bigapis.net/3ptcJ/data.csv
 *     (turismos BEV + PHEV, últimos 13 meses, datos oficiales ANFAC/Ideauto)
 *  2. PDFs mensuales  → anfac.com/wp-content/uploads/…
 *     Disponibles desde Marzo 2022 (con algunas brechas).
 *     Cada PDF tiene el desglose de turismos BEV y PHEV del mes.
 *
 * Genera: data/anfac-matriculaciones.json
 *
 * Uso:
 *   node scripts/anfac-matriculaciones.mjs
 */

import https from 'https';
import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const TMP_DIR = 'c:/tmp/anfac-pdfs';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; capira-scraper/1.0)' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const MES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── 1. Chart API (últimos 13 meses, turismos) ─────────────────────────────────

async function fetchChartApi() {
  console.log('\n[1/2] Fetching chart API (últimos 13 meses)…');
  const r = await fetch('https://chartviewer-europublic.bigapis.net/3ptcJ/data.csv');
  if (r.status !== 200) throw new Error('Chart API error: ' + r.status);

  const text = r.body.toString('utf8');
  const lines = text.trim().split('\n');
  const header = lines[0].split(';');
  // header: Combustible;Mar-25;Abr-25;…
  const periods = header.slice(1).map(p => p.trim().replace(/\r/g, ''));

  const data = {}; // { 'YYYY-MM': { bev, phev } }

  // Parse period label like "Mar-25" → "2025-03"
  function periodToYearMonth(label) {
    const [mesShort, yr] = label.split('-');
    const mesIdx = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      .indexOf(mesShort.charAt(0).toUpperCase() + mesShort.slice(1).toLowerCase());
    if (mesIdx === -1) return null;
    const year = 2000 + parseInt(yr);
    return `${year}-${String(mesIdx + 1).padStart(2, '0')}`;
  }

  for (const period of periods) {
    const ym = periodToYearMonth(period);
    if (ym) data[ym] = { bev: 0, phev: 0 };
  }

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(';');
    const cat = cols[0].trim();
    for (let i = 1; i < cols.length; i++) {
      const ym = periodToYearMonth(periods[i - 1]);
      if (!ym) continue;
      const val = parseInt(cols[i]) || 0;
      if (cat === 'Electrico' || cat === 'Electrico (E-REV)') {
        data[ym].bev = (data[ym].bev || 0) + val;
      } else if (cat.startsWith('Hibrido Enchufable')) {
        data[ym].phev = (data[ym].phev || 0) + val;
      }
    }
  }

  console.log(`  ✓ ${Object.keys(data).length} meses desde chart API (${Object.keys(data)[0]} → ${Object.keys(data).at(-1)})`);
  return data;
}

// ── 2. PDF scraping ───────────────────────────────────────────────────────────

function buildPdfUrl(year, monthIdx) {
  // PDF uploaded the following month
  const uploadMonth = monthIdx + 2 > 12 ? 1 : monthIdx + 2;
  const uploadYear = monthIdx === 11 ? year + 1 : year;
  return `https://anfac.com/wp-content/uploads/${uploadYear}/${String(uploadMonth).padStart(2, '0')}/NP-Matriculaciones-vehiculos-electrificados-y-de-bajas-emisiones-${MONTHS_ES[monthIdx]}-${year}-COMPLETA.pdf`;
}

/**
 * Fallback for PDFs with no prose "MERCADO DE TURISMOS" section — only the data table.
 * (Seen in 2023-02.)  Parses the "MATRICULACIONES DE TURISMOS POR FUENTE DE ENERGÍA" table.
 *
 * The table renders as:
 *   HEADER: row-name list (all labels in one block, e.g. "TOTAL Gasolina Diesel … Eléctrico (BEV + E-REV) … Hibrido Enchufable (PHEV) …")
 *   DATA:   "Mes: Month  2023 Volumen %Mercado  2022 Volumen %Mercado"
 *           then tokens interleaved as [vol_cur, pct_cur, vol_prev, pct_prev] × N rows
 *   Pcts use comma decimal ("42,56%"), vols use period thousands ("74.001") or plain int.
 *   Each "row" is exactly 4 tokens.  The first 2 tokens after "Mes:" are the year labels.
 */
function parseTurismosFromTable(text) {
  const t = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');

  const tableIdx = t.search(/MATRICULACIONES DE TURISMOS POR FUENTE DE ENERG/i);
  if (tableIdx === -1) return null;
  const tableSection = t.slice(tableIdx, tableIdx + 6000);

  const mesIdx = tableSection.search(/\bMes:/);
  if (mesIdx === -1) return null;

  const header = tableSection.slice(0, mesIdx);

  // Ordered row-name markers to determine each row's position in the table.
  const ROW_KEYS = [
    'TOTAL',
    'Gasolina',
    'Diesel',
    'Total veh',
    /Electrico(?:\s+E-REV|\s+\(BEV)/i, // placeholder — we skip bare "Electrico"
    'Electrico E-REV',
    /El[eé]ctrico\s+\(BEV/i,           // Eléctrico (BEV + E-REV) ← BEV row
    'Hibrido Enchufable Gasolina',
    'Hibrido Enchufable Diesel',
    'Hibrido Enchufable (PHEV)',         // PHEV row
  ];

  // We actually need the ordinal position of each row based on character positions in header.
  // Redefine with distinct patterns:
  const ROW_PATTERNS = [
    { label: 'TOTAL',          re: /\bTOTAL\b/i },
    { label: 'Gasolina',       re: /\bGasolina\b/i },
    { label: 'Diesel',         re: /\bDiesel\b/i },
    { label: 'Total veh',      re: /Total veh/i },
    { label: 'Electrico bare', re: /\bElectrico\b(?!\s+E-REV|\s+\(BEV)/i },
    { label: 'E-REV',          re: /Electrico E-REV/i },
    { label: 'BEV+EREV',       re: /El[eé]ctrico\s+\(BEV/i },
    { label: 'HE Gasolina',    re: /Hibrido Enchufable Gasolina/i },
    { label: 'HE Diesel',      re: /Hibrido Enchufable Diesel/i },
    { label: 'PHEV',           re: /Hibrido Enchufable \(PHEV\)/i },
  ];

  // Find character position of each pattern in the header.
  const found = ROW_PATTERNS
    .map((p, idx) => ({ idx, label: p.label, pos: header.search(p.re) }))
    .filter(e => e.pos !== -1)
    .sort((a, b) => a.pos - b.pos);

  const bevEntry  = found.find(e => e.label === 'BEV+EREV');
  const phevEntry = found.find(e => e.label === 'PHEV');
  if (!bevEntry || !phevEntry) return null;

  // 0-based ordinal row position = rank in found list
  const bevOrdinal  = found.indexOf(bevEntry);
  const phevOrdinal = found.indexOf(phevEntry);

  // Extract all "number[,digits]%?" tokens from the data section.
  // Pattern: match complete tokens like "74.001", "42,56%", "100%", "0"
  const dataStr = tableSection.slice(mesIdx);
  // Capture complete tokens: "74.001" (vol), "42,56%" (pct with comma-decimal), "100%" (int pct)
  const tokens = [...dataStr.matchAll(/([\d.]+)(?:,\d+%|%)?/g)].map(m => m[0]);

  // Skip leading year labels (tokens like "2023", "2022")
  let firstRow = 0;
  let yearsSeen = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (/^20\d{2}$/.test(tokens[i])) { yearsSeen++; if (yearsSeen >= 2) { firstRow = i + 1; break; } }
  }

  // Take tokens from firstRow onward; each row = 4 tokens [vol_cur, pct_cur, vol_prev, pct_prev]
  const dataTokens = tokens.slice(firstRow);
  const bev  = parseInt((dataTokens[bevOrdinal  * 4] ?? '').replace(/\./g, ''));
  const phev = parseInt((dataTokens[phevOrdinal * 4] ?? '').replace(/\./g, ''));

  if (isNaN(bev) || isNaN(phev)) return null;
  return { bev, phev };
}

function parseTurismosFromText(text) {
  // Normalize: collapse whitespace but keep sentence/page structure somewhat intact
  const t = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');

  // Find the MERCADO DE TURISMOS section heading (case-SENSITIVE: the bullets at the top
  // sometimes say "mercado de turismos electrificados" in lowercase, which we must skip).
  const turismoIdx = t.search(/MERCADO DE TURISMOS/);
  if (turismoIdx === -1) return parseTurismosFromTable(text); // fallback: table-only PDFs

  // Extend further to capture data that may come after an interstitial page footer.
  // Cut ONLY at "DECLARACIONES" — NOT at "Departamento de comunicaci" (which is a repeating footer).
  const sectionRaw = t.slice(turismoIdx, turismoIdx + 4000);
  const declEnd = sectionRaw.search(/DECLARACIONES/i);
  const section = declEnd > 0 ? sectionRaw.slice(0, declEnd) : sectionRaw;

  let bev = null, phev = null;

  // ── BEV ──────────────────────────────────────────────────────────────────
  // 2022-2024a: "(BEV) ... hasta las X unidades en el mes"
  let m = section.match(/(?:bater.*?\(BEV\)|BEV\)).*?hasta\s+las\s+([\d.]+)\s+unidades?\s+en\s+el\s+mes/i);
  if (m) bev = parseInt(m[1].replace(/\./g, ''));

  // 2022 (without BEV label): "batería ... hasta las X unidades en el mes"
  if (bev === null) {
    m = section.match(/bater.*?hasta\s+las\s+([\d.]+)\s+unidades?\s+en\s+el\s+mes/i);
    if (m) bev = parseInt(m[1].replace(/\./g, ''));
  }

  // 2025+: "(BEV) ... con X unidades en el mes"
  if (bev === null) {
    m = section.match(/\(BEV\).*?con\s+([\d.]+)\s+unidades?\s+en\s+el\s+mes/i);
    if (m) bev = parseInt(m[1].replace(/\./g, ''));
  }

  // 2024+: "eléctricos puros ... hasta las X unidades" (without "en el mes")
  if (bev === null) {
    m = section.match(/puros.*?hasta\s+las\s+([\d.]+)\s+unidades?[,\s]/i);
    if (m) bev = parseInt(m[1].replace(/\./g, ''));
  }

  // 2024+: "eléctricos puros ... con X unidades vendidas"
  if (bev === null) {
    m = section.match(/puros.*?con\s+([\d.]+)\s+unidades?\s+vendidas?/i);
    if (m) bev = parseInt(m[1].replace(/\./g, ''));
  }

  // ── PHEV ─────────────────────────────────────────────────────────────────
  // Strategy: find the "(PHEV)" label (or "enchufabl" when no label) in the section
  // and extract the FIRST number followed by unidades/ventas/registros within ~350 chars.
  // This avoids greedy-span issues with cumulative totals further in the text.
  {
    const phevLabelIdx = section.indexOf('(PHEV)');
    // Fall back to the "enchufabl" position (for 2022/2024+ PDFs without the "(PHEV)" label).
    // Skip pie-chart legend entries like "Híbrido Enchufable 5,75%" where the percentage
    // follows IMMEDIATELY after the word (only spaces between word and digits+%).
    let enchufablSearch = -1;
    {
      const re = /enchufabl/gi;
      let m2;
      while ((m2 = re.exec(section)) !== null) {
        // Peek ~20 chars after the match word to detect "Enchufable 5,75%" pattern
        const peek = section.slice(m2.index, m2.index + 20);
        if (/enchufabl\w*\s{1,5}[\d,]+%/i.test(peek)) continue; // pie-chart label, skip
        enchufablSearch = m2.index;
        break;
      }
    }
    const searchFrom = phevLabelIdx !== -1 ? phevLabelIdx : enchufablSearch;

    if (searchFrom !== -1) {
      const after = section.slice(searchFrom, searchFrom + 350);
      // Match the first plausible monthly count:
      // - a number like "4.578" or "11.999" (digits + optional dots as thousands separators)
      // - followed by: nuevas? unidades / ventas / registros
      // Spanish percentages use comma ("11,5%") so they won't match [\d.]+
      // Allow an optional adjective between the number and the noun:
      // "5.204 nuevos registros" | "11.999 nuevas unidades" | "4.578 unidades" | "5.140 ventas"
      const phevMatch = after.match(/([\d.]+)\s+(?:\w+\s+)?(?:unidades?|ventas?|registros?)\b/i);
      if (phevMatch) phev = parseInt(phevMatch[1].replace(/\./g, ''));
    }
  }

  return (bev !== null && phev !== null) ? { bev, phev } : null;
}

async function scrapePdfs(chartData) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

  console.log('\n[2/2] Scraping PDFs para meses sin datos en chart API…');

  // We need data from 2022-01 (at minimum) to cover the full history
  // Chart API covers last 13 months — fill everything older
  const chartMonths = new Set(Object.keys(chartData));

  const result = { ...chartData };
  let downloaded = 0, parsed = 0, failed = 0;

  for (let year = 2022; year <= new Date().getFullYear(); year++) {
    for (let m = 0; m < 12; m++) {
      const ym = `${year}-${String(m + 1).padStart(2, '0')}`;

      // Skip if already in chart API data (more reliable)
      if (chartMonths.has(ym)) continue;

      // Don't try future months
      const now = new Date();
      if (year > now.getFullYear() || (year === now.getFullYear() && m >= now.getMonth())) continue;

      const url = buildPdfUrl(year, m);
      const tmpFile = path.join(TMP_DIR, `anfac-${ym}.pdf`);

      try {
        const r = await fetch(url);
        if (r.status !== 200) {
          console.log(`  ✗ ${ym} — PDF no encontrado (${r.status})`);
          failed++;
          continue;
        }

        writeFileSync(tmpFile, r.body);
        downloaded++;
        await sleep(300); // polite rate limiting

        // Extract text with pdftotext
        let text;
        try {
          text = execSync(`pdftotext "${tmpFile}" -`, { encoding: 'latin1', maxBuffer: 5 * 1024 * 1024 });
        } catch {
          console.log(`  ✗ ${ym} — pdftotext falló`);
          failed++;
          continue;
        }

        const vals = parseTurismosFromText(text);
        if (vals) {
          result[ym] = vals;
          parsed++;
          console.log(`  ✓ ${ym} — BEV: ${vals.bev.toLocaleString('es-ES')}, PHEV: ${vals.phev.toLocaleString('es-ES')}`);
        } else {
          console.log(`  ? ${ym} — No se pudo parsear el PDF`);
          failed++;
        }
      } catch (e) {
        console.log(`  ✗ ${ym} — Error: ${e.message}`);
        failed++;
      }
    }
  }

  console.log(`\n  Resumen PDFs: ${downloaded} descargados, ${parsed} parseados, ${failed} fallidos`);
  return result;
}

// ── 3. Build output JSON ──────────────────────────────────────────────────────

function buildOutput(monthly) {
  const byYear = {};
  for (const [ym, vals] of Object.entries(monthly)) {
    if (!vals || vals.bev == null) continue;
    const [year, month] = ym.split('-').map(Number);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push({ mes: MES_SHORT[month - 1], bev: vals.bev, phev: vals.phev });
  }

  // Sort months within each year
  const MES_ORDER = MES_SHORT;
  for (const year of Object.keys(byYear)) {
    byYear[year].sort((a, b) => MES_ORDER.indexOf(a.mes) - MES_ORDER.indexOf(b.mes));
  }

  return {
    meta: {
      fuente: 'ANFAC / Ideauto',
      descripcion: 'Matriculaciones de turismos BEV y PHEV. Solo M1 turismos nuevos. Fuente oficial ANFAC.',
      generado_en: new Date().toISOString(),
      primer_periodo: Object.keys(monthly).sort()[0],
      ultimo_periodo: Object.keys(monthly).sort().at(-1),
      nota: 'Datos desde 2022 obtenidos de PDFs mensuales ANFAC. Meses recientes del chart API oficial. 2020-2021 no disponibles en web ANFAC.',
    },
    mensual: Object.fromEntries(
      Object.entries(monthly)
        .filter(([, v]) => v && v.bev != null)
        .sort(([a], [b]) => a.localeCompare(b))
    ),
    por_año: Object.fromEntries(
      Object.entries(byYear)
        .map(([y, meses]) => [y, { meses, parcial: parseInt(y) >= new Date().getFullYear() }])
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
    ),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━━━ ANFAC Matriculaciones Scraper ━━━');

  const chartData = await fetchChartApi();
  const allData = await scrapePdfs(chartData);

  const output = buildOutput(allData);
  const outFile = path.join(DATA_DIR, 'anfac-matriculaciones.json');
  writeFileSync(outFile, JSON.stringify(output, null, 2));

  const years = Object.keys(output.por_año);
  console.log(`\n✅ Generado: data/anfac-matriculaciones.json`);
  console.log(`   Años con datos: ${years.join(', ')}`);
  console.log(`   Total meses: ${Object.keys(output.mensual).length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
