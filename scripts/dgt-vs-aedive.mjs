/**
 * dgt-vs-aedive.mjs
 * Coteja matriculaciones BEV/PHEV mensuales entre DGT (MATRABA) y AEDIVE.
 *
 * AEDIVE usa año fiscal Mayo→Abril (ej: "2022" = May-2022 → Apr-2023)
 * excepto "2020" que es año calendario (Ene-Dic 2020).
 *
 * Uso: node scripts/dgt-vs-aedive.mjs
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');

// ─── Cargar datos AEDIVE ──────────────────────────────────────────────────────
const aedive2019_2021 = JSON.parse(readFileSync(join(__dirname, 'screenshots', 'aedive-2019-2021.json'), 'utf8'));
const aedive2022_2025 = JSON.parse(readFileSync(join(__dirname, 'screenshots', 'aedive-data-2026-04-10.json'), 'utf8'));

const aedive = { ...aedive2019_2021, ...aedive2022_2025 };

// Mapeo mes español → número
const MES = {
  'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
  'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
  'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12',
};

// Convertir AEDIVE a mapa { 'YYYY-MM': { BEV, PHEV } }
const aediveFlat = {};
for (const [year, meses] of Object.entries(aedive)) {
  const y = parseInt(year);
  for (const [mesNombre, datos] of Object.entries(meses)) {
    const mm = MES[mesNombre];
    // 2020 es año calendario; resto es año fiscal Mayo(y)→Abril(y+1)
    let yyyymm;
    if (year === '2020') {
      yyyymm = `${y}-${mm}`;
    } else {
      // Mayo-Diciembre del año base; Enero-Abril del año siguiente
      const mesNum = parseInt(mm);
      yyyymm = mesNum >= 5
        ? `${y}-${mm}`
        : `${y + 1}-${mm}`;
    }
    aediveFlat[yyyymm] = datos;
  }
}

// ─── Cargar DGT ───────────────────────────────────────────────────────────────
const db = new Database(DB_FILE, { readonly: true });

const dgtRows = db.prepare(`
  SELECT periodo, cat_vehiculo_ev, COUNT(*) as n
  FROM matriculaciones
  WHERE cat_vehiculo_ev IN ('BEV', 'PHEV')
  GROUP BY periodo, cat_vehiculo_ev
  ORDER BY periodo
`).all();

db.close();

// Indexar DGT por periodo
const dgtFlat = {};
for (const row of dgtRows) {
  if (!dgtFlat[row.periodo]) dgtFlat[row.periodo] = {};
  dgtFlat[row.periodo][row.cat_vehiculo_ev] = row.n;
}

// ─── Comparar ─────────────────────────────────────────────────────────────────
const periodos = [...new Set([...Object.keys(aediveFlat), ...Object.keys(dgtFlat)])]
  .filter(p => aediveFlat[p] && dgtFlat[p])  // solo meses con ambos datos
  .sort();

console.log('\n=== COTEJO DGT vs AEDIVE — Matriculaciones BEV/PHEV ===\n');
console.log('Período   │  Cat │ AEDIVE │   DGT  │  Dif  │  Dif%');
console.log('──────────┼──────┼────────┼────────┼───────┼──────');

let totalBEV_aedive = 0, totalBEV_dgt = 0;
let totalPHEV_aedive = 0, totalPHEV_dgt = 0;
let nBEV = 0, nPHEV = 0;
let maxDifBEV = 0, maxDifPHEV = 0;
let bigDiffMonths = [];

for (const periodo of periodos) {
  for (const cat of ['BEV', 'PHEV']) {
    const aVal = aediveFlat[periodo]?.[cat];
    const dVal = dgtFlat[periodo]?.[cat];
    if (aVal == null || dVal == null) continue;

    const dif    = dVal - aVal;
    const difPct = aVal > 0 ? ((dif / aVal) * 100).toFixed(1) : 'N/A';
    const absPct = Math.abs(parseFloat(difPct));

    const flag = absPct > 5 ? ' ⚠️' : '';

    console.log(
      `${periodo}  │ ${cat.padEnd(4)} │ ${String(aVal).padStart(6)} │ ${String(dVal).padStart(6)} │ ${String(dif >= 0 ? '+'+dif : dif).padStart(5)} │ ${difPct}%${flag}`
    );

    if (cat === 'BEV')  { totalBEV_aedive  += aVal; totalBEV_dgt  += dVal; nBEV++;  maxDifBEV  = Math.max(maxDifBEV,  absPct); }
    if (cat === 'PHEV') { totalPHEV_aedive += aVal; totalPHEV_dgt += dVal; nPHEV++; maxDifPHEV = Math.max(maxDifPHEV, absPct); }
    if (absPct > 5) bigDiffMonths.push({ periodo, cat, aedive: aVal, dgt: dVal, difPct });
  }
}

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log('\n=== RESUMEN ===\n');

const bevDifTotal    = totalBEV_dgt  - totalBEV_aedive;
const phevDifTotal   = totalPHEV_dgt - totalPHEV_aedive;
const bevDifPct      = ((bevDifTotal  / totalBEV_aedive)  * 100).toFixed(2);
const phevDifPct     = ((phevDifTotal / totalPHEV_aedive) * 100).toFixed(2);

console.log(`BEV  — Meses comparados: ${nBEV}`);
console.log(`       AEDIVE total: ${totalBEV_aedive.toLocaleString()}  |  DGT total: ${totalBEV_dgt.toLocaleString()}  |  Dif global: ${bevDifTotal >= 0 ? '+' : ''}${bevDifTotal.toLocaleString()} (${bevDifPct}%)`);
console.log(`       Máx desviación mensual: ${maxDifBEV.toFixed(1)}%`);

console.log(`\nPHEV — Meses comparados: ${nPHEV}`);
console.log(`       AEDIVE total: ${totalPHEV_aedive.toLocaleString()}  |  DGT total: ${totalPHEV_dgt.toLocaleString()}  |  Dif global: ${phevDifTotal >= 0 ? '+' : ''}${phevDifTotal.toLocaleString()} (${phevDifPct}%)`);
console.log(`       Máx desviación mensual: ${maxDifPHEV.toFixed(1)}%`);

if (bigDiffMonths.length > 0) {
  console.log(`\n⚠️  Meses con desviación > 5%: ${bigDiffMonths.length}`);
  for (const m of bigDiffMonths) {
    console.log(`   ${m.periodo} ${m.cat}: AEDIVE=${m.aedive} DGT=${m.dgt} (${m.difPct}%)`);
  }
} else {
  console.log('\n✅ Ningún mes supera el 5% de desviación');
}

const bevOk  = Math.abs(parseFloat(bevDifPct))  < 2 && maxDifBEV  < 5;
const phevOk = Math.abs(parseFloat(phevDifPct)) < 2 && maxDifPHEV < 5;
console.log(`\n${bevOk  ? '✅' : '❌'} BEV:  DGT ${bevOk  ? 'puede reemplazar' : 'NO reemplaza directamente'} a AEDIVE`);
console.log(`${phevOk ? '✅' : '❌'} PHEV: DGT ${phevOk ? 'puede reemplazar' : 'NO reemplaza directamente'} a AEDIVE`);
