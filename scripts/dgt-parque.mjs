/**
 * dgt-parque.mjs
 * Calcula el parque activo de vehículos electrificados en España.
 *
 * Parque activo = matriculaciones acumuladas - bajas acumuladas
 * Desglosado por: BEV, PHEV, HEV, REEV, FCEV y también por tipo_grupo (turismo, moto, furgoneta, etc.)
 *
 * Genera:
 *   data/dgt-parque.json
 *   app/lib/insights/dgt-parque-data.ts
 *
 * Uso:
 *   node scripts/dgt-parque.mjs
 */

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE  = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const OUT_FILE = join(__dirname, '..', 'data', 'dgt-parque.json');
const TS_FILE  = join(__dirname, '..', 'app', 'lib', 'insights', 'dgt-parque-data.ts');

const EV_CATS = ['BEV', 'PHEV', 'HEV', 'REEV', 'FCEV'];
const TIPO_GRUPOS = ['turismo', 'suv_todo_terreno', 'furgoneta_van', 'moto', 'camion', 'autobus', 'especial', 'otros'];

const db = new Database(DB_FILE, { readonly: true });

console.log('Leyendo períodos disponibles...');

// Obtener todos los períodos en orden cronológico
const periodos = db.prepare(`
  SELECT DISTINCT periodo FROM matriculaciones
  UNION
  SELECT DISTINCT periodo FROM bajas
  ORDER BY periodo
`).all().map(r => r.periodo);

console.log(`Períodos: ${periodos[0]} → ${periodos[periodos.length - 1]} (${periodos.length} meses)`);

// ─── Matriculaciones por período y cat_vehiculo_ev ───────────────────────────
console.log('Calculando matriculaciones mensuales por categoría EV...');
const matPorPeriodoCat = db.prepare(`
  SELECT periodo, cat_vehiculo_ev, COUNT(*) as n
  FROM matriculaciones
  WHERE cat_vehiculo_ev IN ('BEV','PHEV','HEV','REEV','FCEV')
  GROUP BY periodo, cat_vehiculo_ev
  ORDER BY periodo
`).all();

// ─── Bajas por período y cat_vehiculo_ev ─────────────────────────────────────
console.log('Calculando bajas mensuales por categoría EV...');
const bajasPorPeriodoCat = db.prepare(`
  SELECT periodo, cat_vehiculo_ev, COUNT(*) as n
  FROM bajas
  WHERE cat_vehiculo_ev IN ('BEV','PHEV','HEV','REEV','FCEV')
  GROUP BY periodo, cat_vehiculo_ev
  ORDER BY periodo
`).all();

// ─── Matriculaciones EV por período y tipo_grupo ─────────────────────────────
console.log('Calculando matriculaciones mensuales BEV+PHEV+HEV por tipo_grupo...');
const matPorPeriodoTipo = db.prepare(`
  SELECT periodo, tipo_grupo, cat_vehiculo_ev, COUNT(*) as n
  FROM matriculaciones
  WHERE cat_vehiculo_ev IN ('BEV','PHEV','HEV')
  AND tipo_grupo IN ('turismo','suv_todo_terreno','furgoneta_van','moto','camion','autobus','especial','otros')
  GROUP BY periodo, tipo_grupo, cat_vehiculo_ev
  ORDER BY periodo
`).all();

// ─── Bajas EV por período y tipo_grupo ───────────────────────────────────────
console.log('Calculando bajas mensuales BEV+PHEV+HEV por tipo_grupo...');
const bajasPorPeriodoTipo = db.prepare(`
  SELECT periodo, tipo_grupo, cat_vehiculo_ev, COUNT(*) as n
  FROM bajas
  WHERE cat_vehiculo_ev IN ('BEV','PHEV','HEV')
  AND tipo_grupo IN ('turismo','suv_todo_terreno','furgoneta_van','moto','camion','autobus','especial','otros')
  GROUP BY periodo, tipo_grupo, cat_vehiculo_ev
  ORDER BY periodo
`).all();

db.close();

// ─── Indexar por periodo ──────────────────────────────────────────────────────
function indexar(rows, keyFn, valFn) {
  const idx = {};
  for (const row of rows) {
    const k = keyFn(row);
    if (!idx[k]) idx[k] = {};
    valFn(idx[k], row);
  }
  return idx;
}

const matCatIdx   = indexar(matPorPeriodoCat,   r => r.periodo, (o, r) => { o[r.cat_vehiculo_ev] = r.n; });
const bajasCatIdx = indexar(bajasPorPeriodoCat, r => r.periodo, (o, r) => { o[r.cat_vehiculo_ev] = r.n; });

// tipo_grupo+cat nested: idx[periodo][tipo_grupo][cat] = n
const matTipoIdx = {};
for (const row of matPorPeriodoTipo) {
  if (!matTipoIdx[row.periodo]) matTipoIdx[row.periodo] = {};
  if (!matTipoIdx[row.periodo][row.tipo_grupo]) matTipoIdx[row.periodo][row.tipo_grupo] = {};
  matTipoIdx[row.periodo][row.tipo_grupo][row.cat_vehiculo_ev] = row.n;
}
const bajasTipoIdx = {};
for (const row of bajasPorPeriodoTipo) {
  if (!bajasTipoIdx[row.periodo]) bajasTipoIdx[row.periodo] = {};
  if (!bajasTipoIdx[row.periodo][row.tipo_grupo]) bajasTipoIdx[row.periodo][row.tipo_grupo] = {};
  bajasTipoIdx[row.periodo][row.tipo_grupo][row.cat_vehiculo_ev] = row.n;
}

// ─── Calcular parque acumulado mes a mes ──────────────────────────────────────
console.log('Calculando parque acumulado...');

const cumMat  = Object.fromEntries(EV_CATS.map(c => [c, 0]));
const cumBaja = Object.fromEntries(EV_CATS.map(c => [c, 0]));

// tipo_grupo cumulative: { turismo: { BEV: 0, ... }, ... }
const cumMatTipo  = {};
const cumBajaTipo = {};
for (const tg of TIPO_GRUPOS) {
  cumMatTipo[tg]  = Object.fromEntries(['BEV','PHEV','HEV'].map(c => [c, 0]));
  cumBajaTipo[tg] = Object.fromEntries(['BEV','PHEV','HEV'].map(c => [c, 0]));
}

const mensual = [];

for (const periodo of periodos) {
  const matCat  = matCatIdx[periodo]  || {};
  const bajaCat = bajasCatIdx[periodo] || {};

  // Acumular cat_vehiculo_ev
  for (const cat of EV_CATS) {
    cumMat[cat]  += matCat[cat]  || 0;
    cumBaja[cat] += bajaCat[cat] || 0;
  }

  // Acumular tipo_grupo
  for (const tg of TIPO_GRUPOS) {
    for (const cat of ['BEV','PHEV','HEV']) {
      cumMatTipo[tg][cat]  += matTipoIdx[periodo]?.[tg]?.[cat]  || 0;
      cumBajaTipo[tg][cat] += bajasTipoIdx[periodo]?.[tg]?.[cat] || 0;
    }
  }

  // Parque activo por cat
  const parque_cat = {};
  for (const cat of EV_CATS) {
    const p = cumMat[cat] - cumBaja[cat];
    if (p > 0 || cumMat[cat] > 0) parque_cat[cat] = p;
  }

  // Parque activo por tipo_grupo
  const parque_tipo = {};
  for (const tg of TIPO_GRUPOS) {
    const tgData = {};
    let hayDatos = false;
    for (const cat of ['BEV','PHEV','HEV']) {
      const p = cumMatTipo[tg][cat] - cumBajaTipo[tg][cat];
      if (cumMatTipo[tg][cat] > 0) {
        tgData[cat] = p;
        hayDatos = true;
      }
    }
    if (hayDatos) parque_tipo[tg] = tgData;
  }

  const entrada = {
    periodo,
    matriculaciones_mes: {},
    bajas_mes: {},
    parque_acumulado: parque_cat,
  };

  // Solo incluir cats con datos en el mes
  for (const cat of EV_CATS) {
    if (matCat[cat]) entrada.matriculaciones_mes[cat] = matCat[cat];
    if (bajaCat[cat]) entrada.bajas_mes[cat] = bajaCat[cat];
  }

  // Añadir desglose por tipo si hay datos relevantes
  if (Object.keys(parque_tipo).length > 0) {
    entrada.parque_por_tipo = parque_tipo;
  }

  mensual.push(entrada);
}

// ─── Resumen final ────────────────────────────────────────────────────────────
const ultimoPeriodo = periodos[periodos.length - 1];
const resumen = {};
for (const cat of EV_CATS) {
  const mat  = cumMat[cat];
  const baja = cumBaja[cat];
  if (mat > 0) {
    resumen[cat] = {
      matriculadas:  mat,
      bajas:         baja,
      parque_activo: mat - baja,
      tasa_baja_pct: +((baja / mat) * 100).toFixed(2),
    };
  }
}

// Resumen por tipo_grupo
const resumen_por_tipo = {};
for (const tg of TIPO_GRUPOS) {
  const tgData = {};
  let total_ev = 0;
  for (const cat of ['BEV','PHEV','HEV']) {
    const mat  = cumMatTipo[tg][cat];
    const baja = cumBajaTipo[tg][cat];
    if (mat > 0) {
      tgData[cat] = { matriculadas: mat, bajas: baja, parque_activo: mat - baja };
      total_ev += mat - baja;
    }
  }
  if (total_ev > 0) resumen_por_tipo[tg] = tgData;
}

const output = {
  generado_en: new Date().toISOString(),
  ultimo_periodo: ultimoPeriodo,
  resumen,
  resumen_por_tipo,
  mensual,
};

mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');

// ─── Generar TypeScript ───────────────────────────────────────────────────────
const hoy = new Date().toISOString().slice(0, 10);
const tsLines = [
  `// ─── AUTO-GENERADO ─────────────────────────────────────────────────────────`,
  `// Genera: node scripts/dgt-parque.mjs`,
  `// Fuente: DGT - Microdatos de Matriculaciones + Bajas (MATRABA)`,
  `// Última actualización: ${hoy}`,
  `// ⚠️  No editar manualmente`,
  `// ────────────────────────────────────────────────────────────────────────────`,
  ``,
  `export type ParqueCatEv = {`,
  `  BEV?:  number;`,
  `  PHEV?: number;`,
  `  HEV?:  number;`,
  `  REEV?: number;`,
  `  FCEV?: number;`,
  `};`,
  ``,
  `export type ParqueTipoGrupo = {`,
  `  turismo?:         ParqueCatEv;`,
  `  suv_todo_terreno?: ParqueCatEv;`,
  `  furgoneta_van?:   ParqueCatEv;`,
  `  moto?:            ParqueCatEv;`,
  `  camion?:          ParqueCatEv;`,
  `  autobus?:         ParqueCatEv;`,
  `  especial?:        ParqueCatEv;`,
  `  otros?:           ParqueCatEv;`,
  `};`,
  ``,
  `export type ParqueMes = {`,
  `  periodo:           string;`,
  `  matriculaciones_mes: ParqueCatEv;`,
  `  bajas_mes:           ParqueCatEv;`,
  `  parque_acumulado:    ParqueCatEv;`,
  `  parque_por_tipo?:    ParqueTipoGrupo;`,
  `};`,
  ``,
  `export type ParqueResumenCat = {`,
  `  matriculadas:  number;`,
  `  bajas:         number;`,
  `  parque_activo: number;`,
  `  tasa_baja_pct: number;`,
  `};`,
  ``,
  `export const dgtParqueMeta = {`,
  `  ultimo_periodo:       "${output.ultimo_periodo}",`,
  `  ultima_actualizacion: "${hoy}",`,
  `} as const;`,
  ``,
  `export const dgtParqueResumen: Record<string, ParqueResumenCat> = ${JSON.stringify(output.resumen, null, 2)};`,
  ``,
  `export const dgtParqueResumenPorTipo: Record<string, Record<string, { matriculadas: number; bajas: number; parque_activo: number }>> = ${JSON.stringify(output.resumen_por_tipo, null, 2)};`,
  ``,
  `export const dgtParqueMensual: ParqueMes[] = ${JSON.stringify(output.mensual, null, 2)};`,
  ``,
];
writeFileSync(TS_FILE, tsLines.join('\n'), 'utf8');

// ─── Print resumen ────────────────────────────────────────────────────────────
console.log('\n=== PARQUE ACTIVO EV EN ESPAÑA ===');
console.log(`Último período: ${ultimoPeriodo}\n`);
for (const [cat, d] of Object.entries(resumen)) {
  console.log(`${cat.padEnd(5)}: parque=${d.parque_activo.toLocaleString().padStart(10)}  (mats=${d.matriculadas.toLocaleString()}, bajas=${d.bajas.toLocaleString()}, tasa_baja=${d.tasa_baja_pct}%)`);
}
console.log('\n--- Por tipo_grupo ---');
for (const [tg, cats] of Object.entries(resumen_por_tipo)) {
  const bev  = cats.BEV?.parque_activo  || 0;
  const phev = cats.PHEV?.parque_activo || 0;
  const hev  = cats.HEV?.parque_activo  || 0;
  console.log(`${tg.padEnd(15)}: BEV=${bev.toLocaleString().padStart(8)}  PHEV=${phev.toLocaleString().padStart(8)}  HEV=${hev.toLocaleString().padStart(8)}`);
}

console.log(`\n✅ Generado: data/dgt-parque.json (${mensual.length} meses)`);
console.log(`✅ Generado: app/lib/insights/dgt-parque-data.ts`);
