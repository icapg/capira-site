/**
 * dgt-marca-perfil-build.mjs
 *
 * Genera el dataset estático que consume el dashboard /info/marca-perfil.
 * Salidas:
 *   - data/dgt-marca-perfil-index.json         (índice de marcas, bundle)
 *   - data/dgt-marca-perfil-mercado.json       (agregados de mercado, bundle)
 *   - public/data/marca-perfil/<slug>.json     (uno por marca visible, CDN Vercel)
 *
 * Criterio de inclusión: total_hist (matriculaciones acumuladas 2014-hoy) >= 100.
 * Normalización de aliases: data/dgt-marca-aliases.json.
 *
 * Uso: node scripts/dgt-marca-perfil-build.mjs
 */

import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const DB_FILE   = join(ROOT, 'data', 'dgt-matriculaciones.db');
const ALIAS_FILE = join(ROOT, 'data', 'dgt-marca-aliases.json');
const OUT_INDEX   = join(ROOT, 'data', 'dgt-marca-perfil-index.json');
const OUT_MERCADO = join(ROOT, 'data', 'dgt-marca-perfil-mercado.json');
const OUT_RACING  = join(ROOT, 'data', 'dgt-marca-perfil-racing.json');
const OUT_DIR     = join(ROOT, 'public', 'data', 'marca-perfil');

const RACING_TOP_N = 30;

// Motivo de baja DGT: 3=desguace, 7=voluntaria, 6=transferencia, 8=exportación, otros.
const MOTIVO_LABEL = {
  '3': 'Desguace',
  '7': 'Voluntaria',
  '6': 'Transferencia',
  '8': 'Exportación',
};

const MIN_TOTAL_HIST   = 100;    // umbral matric para aparecer en el selector
const MIN_PARQUE       = 1000;   // umbral parque activo alternativo (marcas viejas sin matric)
const POCOS_DATOS      = 5000;   // bandera "pocos datos"
const DESTACADA_TOP_N  = 30;     // top-N marcas se marcan destacada
const MESES_SOCIO      = 24;     // ventana sociología + radar
const TIPO_DOMINANTE_UMBRAL = 0.60; // >60% de parque en un tipo → "dominio"

// ── Normalización (misma lógica que app/lib/insights/marcas-data.ts) ────────
const aliases = JSON.parse(readFileSync(ALIAS_FILE, 'utf8'));
const MARCAS_ALIASES = aliases.aliases ?? {};
const MARCAS_EXCLUIR = new Set((aliases.excluir ?? []).map((s) => s.toUpperCase()));

function normalizarMarca(raw) {
  if (!raw) return '';
  const upper = String(raw).trim().toUpperCase();
  if (MARCAS_EXCLUIR.has(upper)) return '';
  return MARCAS_ALIASES[upper] ?? upper;
}

function slugMarca(marca) {
  return marca
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Helpers de clasificación ────────────────────────────────────────────────
function catFromCatEv(cat) {
  // Agrupa la cat_vehiculo_ev / catelect en 4 buckets que usa el dashboard.
  //   bev, phev, hev, otro (combustión + REEV + FCEV + nulos)
  if (cat === 'BEV')  return 'bev';
  if (cat === 'PHEV') return 'phev';
  if (cat === 'HEV')  return 'hev';
  return 'otro';
}

function emptyMix() {
  return { bev: 0, phev: 0, hev: 0, otro: 0 };
}

// ── Mesado YTD ──────────────────────────────────────────────────────────────
function ytdRange(ultimoPeriodo) {
  // ultimoPeriodo = 'YYYY-MM'. Devuelve { thisYear: ['YYYY-01', ..., ultimo], prevYear: equivalente año anterior }
  const [y, m] = ultimoPeriodo.split('-').map(Number);
  const thisYear = [];
  const prevYear = [];
  for (let mm = 1; mm <= m; mm++) {
    const s = String(mm).padStart(2, '0');
    thisYear.push(`${y}-${s}`);
    prevYear.push(`${y - 1}-${s}`);
  }
  return { thisYear, prevYear };
}

function periodosHaciaAtras(ultimoPeriodo, n) {
  const out = [];
  let [y, m] = ultimoPeriodo.split('-').map(Number);
  for (let i = 0; i < n; i++) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m--; if (m === 0) { m = 12; y--; }
  }
  return out.reverse();
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📂 Abriendo DB:', DB_FILE);
  const db = new Database(DB_FILE, { readonly: true });

  mkdirSync(OUT_DIR, { recursive: true });

  // 0) Último período de matriculaciones
  const ultPer = db.prepare(`SELECT MAX(periodo) AS p FROM meses_procesados`).get().p;
  if (!ultPer) throw new Error('No hay meses_procesados');
  console.log('📅 Último período:', ultPer);

  const { thisYear: ytdPeriodos, prevYear: ytdPrevPeriodos } = ytdRange(ultPer);
  const venta24m = periodosHaciaAtras(ultPer, MESES_SOCIO);
  const venta24mMin = venta24m[0];
  const lastSnapshot = db.prepare(`SELECT MAX(periodo) AS p FROM parque_meses_procesados`).get().p; // YYYYMM
  console.log('📅 Último snapshot parque:', lastSnapshot);

  // 1) TOTAL HIST por marca (matriculaciones 2014→hoy) + sub por periodo × cat
  //    Una sola pasada a la tabla matriculaciones.
  console.log('⏳ [Q1] Matriculaciones por marca × periodo × cat...');
  let t0 = Date.now();
  const qMat = db.prepare(`
    SELECT marca,
           periodo,
           COALESCE(NULLIF(cat_vehiculo_ev,''), 'COMB') AS cat,
           COUNT(*) AS n
    FROM matriculaciones
    WHERE marca IS NOT NULL AND marca != ''
    GROUP BY marca, periodo, cat
  `);
  const marcas = new Map();   // canonical → acumulador
  function getOrCreate(canon) {
    let e = marcas.get(canon);
    if (e) return e;
    e = {
      marca: canon,
      slug:  slugMarca(canon),
      total_hist: 0,
      mat_mensual: new Map(),
      bajas_mensual: new Map(),
      mat_ytd: emptyMix(),
      mat_ytd_prev: emptyMix(),
      parque_activo: 0,
      mix_tipo_grupo: new Map(),
      top_modelos: new Map(),
      por_provincia: new Map(),
      distintivo: { CERO: 0, ECO: 0, C: 0, B: 0, SIN: 0 },
      piramide: new Map(),
      soc_persona: new Map(),  // raw values (D, X, F, J, ...) → n
      soc_renting: { S: 0, N: 0 },
      soc_servicio: new Map(),
      radar: { co2_sum:0, co2_n:0, kw_sum:0, kw_n:0, peso_sum:0, peso_n:0, auto_sum:0, auto_n:0 },
      // v2: motivos de baja (Sankey) y cohortes (curva de supervivencia)
      bajas_por_motivo: { '3':0, '7':0, '6':0, '8':0, otros:0 },
      mat_nuevas_por_año: new Map(),   // año → n (solo ind_nuevo_usado='N')
      parque_por_año_matric: new Map(), // año → n (de parque.fec_prim_matr)
    };
    marcas.set(canon, e);
    return e;
  }

  for (const row of qMat.iterate()) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const entry = getOrCreate(canon);
    const bucket = catFromCatEv(row.cat === 'COMB' ? null : row.cat);
    entry.total_hist += row.n;

    let mix = entry.mat_mensual.get(row.periodo);
    if (!mix) { mix = emptyMix(); entry.mat_mensual.set(row.periodo, mix); }
    mix[bucket] += row.n;

    if (ytdPeriodos.includes(row.periodo))     entry.mat_ytd[bucket]      += row.n;
    if (ytdPrevPeriodos.includes(row.periodo)) entry.mat_ytd_prev[bucket] += row.n;
  }
  console.log(`   ${marcas.size} marcas canónicas (${(Date.now() - t0) / 1000}s)`);

  // 2) BAJAS mensuales por marca
  console.log('⏳ [Q2] Bajas por marca × periodo...');
  t0 = Date.now();
  const qBaj = db.prepare(`
    SELECT marca, periodo, COUNT(*) AS n
    FROM bajas
    WHERE marca IS NOT NULL AND marca != ''
    GROUP BY marca, periodo
  `);
  for (const row of qBaj.iterate()) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    e.bajas_mensual.set(row.periodo, (e.bajas_mensual.get(row.periodo) ?? 0) + row.n);
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 3) PARQUE activo: marca × tipo_grupo × catelect (último snapshot)
  console.log('⏳ [Q3] Parque activo por marca × tipo × cat...');
  t0 = Date.now();
  const qParq = db.prepare(`
    SELECT marca, tipo_grupo,
           COALESCE(NULLIF(catelect,''), 'NO_EV') AS cat,
           COUNT(*) AS n
    FROM parque
    WHERE marca IS NOT NULL AND marca != ''
    GROUP BY marca, tipo_grupo, cat
  `);
  for (const row of qParq.iterate()) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    e.parque_activo += row.n;
    const tipo = row.tipo_grupo || 'otros';
    let mix = e.mix_tipo_grupo.get(tipo);
    if (!mix) { mix = { total: 0, bev: 0, phev: 0, hev: 0, no_ev: 0 }; e.mix_tipo_grupo.set(tipo, mix); }
    mix.total += row.n;
    if (row.cat === 'BEV')       mix.bev   += row.n;
    else if (row.cat === 'PHEV') mix.phev  += row.n;
    else if (row.cat === 'HEV')  mix.hev   += row.n;
    else                          mix.no_ev += row.n;
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 4) TOP MODELOS: marca × modelo × tipo × cat (parque, último snapshot)
  // Filtra modelo='¡' — placeholder DGT para "modelo sin especificar", ~7k Teslas, etc.
  console.log('⏳ [Q4] Top modelos parque...');
  t0 = Date.now();
  const qMod = db.prepare(`
    SELECT marca, modelo, tipo_grupo,
           COALESCE(NULLIF(catelect,''), 'NO_EV') AS cat,
           COUNT(*) AS n
    FROM parque
    WHERE marca IS NOT NULL AND marca != ''
      AND modelo IS NOT NULL AND modelo != '' AND modelo != '¡'
    GROUP BY marca, modelo, tipo_grupo, cat
  `);
  for (const row of qMod.iterate()) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    const key = `${row.modelo}|${row.tipo_grupo || 'otros'}`;
    let m = e.top_modelos.get(key);
    if (!m) {
      m = { modelo: row.modelo, tipo_grupo: row.tipo_grupo || 'otros', total: 0, bev: 0, phev: 0, hev: 0, no_ev: 0 };
      e.top_modelos.set(key, m);
    }
    m.total += row.n;
    if (row.cat === 'BEV')       m.bev   += row.n;
    else if (row.cat === 'PHEV') m.phev  += row.n;
    else if (row.cat === 'HEV')  m.hev   += row.n;
    else                          m.no_ev += row.n;
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 5) PARQUE POR PROVINCIA: marca × provincia (parque activo)
  console.log('⏳ [Q5] Parque por marca × provincia...');
  t0 = Date.now();
  const qProv = db.prepare(`
    SELECT marca, provincia, COUNT(*) AS n
    FROM parque
    WHERE marca IS NOT NULL AND marca != ''
      AND provincia IS NOT NULL AND provincia != ''
    GROUP BY marca, provincia
  `);
  const totalPorProvincia = new Map();  // cod → n total parque de esa prov
  for (const row of qProv.iterate()) {
    totalPorProvincia.set(row.provincia, (totalPorProvincia.get(row.provincia) ?? 0) + row.n);
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    e.por_provincia.set(row.provincia, { parque: row.n, rank: 0, cuota: 0, top_3: [] });
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 6) TOP 3 MODELOS por (marca, provincia) — window function
  console.log('⏳ [Q6] Top 3 modelos por marca × provincia...');
  t0 = Date.now();
  const qTop3 = db.prepare(`
    SELECT marca, provincia, modelo, n FROM (
      SELECT marca, provincia, modelo, COUNT(*) AS n,
             ROW_NUMBER() OVER (PARTITION BY marca, provincia ORDER BY COUNT(*) DESC, modelo) AS rn
      FROM parque
      WHERE marca IS NOT NULL AND marca != ''
        AND modelo IS NOT NULL AND modelo != '' AND modelo != '¡'
        AND provincia IS NOT NULL AND provincia != ''
      GROUP BY marca, provincia, modelo
    ) WHERE rn <= 3
    ORDER BY marca, provincia, n DESC
  `);
  for (const row of qTop3.iterate()) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    const p = e.por_provincia.get(row.provincia);
    if (!p) continue;
    p.top_3.push(row.modelo);
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 7) DISTINTIVO ambiental por marca (parque)
  console.log('⏳ [Q7] Distintivo por marca...');
  t0 = Date.now();
  const qDist = db.prepare(`
    SELECT marca,
           COALESCE(NULLIF(distintivo,''), 'SIN DISTINTIVO') AS dist,
           COUNT(*) AS n
    FROM parque
    WHERE marca IS NOT NULL AND marca != ''
    GROUP BY marca, dist
  `);
  function distKey(d) {
    const s = String(d).toUpperCase();
    if (s === 'CERO')           return 'CERO';
    if (s === 'ECO')            return 'ECO';
    if (s === 'C')              return 'C';
    if (s === 'B')              return 'B';
    return 'SIN';
  }
  for (const row of qDist.iterate()) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    e.distintivo[distKey(row.dist)] += row.n;
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 8) PIRÁMIDE DE EDAD por marca (parque): año de primera matrícula × cat
  console.log('⏳ [Q8] Pirámide de edad por marca...');
  t0 = Date.now();
  const qEdad = db.prepare(`
    SELECT marca,
           substr(fec_prim_matr, 7, 4) AS anio,
           COALESCE(NULLIF(catelect,''), 'NO_EV') AS cat,
           COUNT(*) AS n
    FROM parque
    WHERE marca IS NOT NULL AND marca != ''
      AND fec_prim_matr IS NOT NULL AND fec_prim_matr != ''
      AND length(fec_prim_matr) >= 10
    GROUP BY marca, anio, cat
  `);
  const hoyYear = Number(ultPer.slice(0, 4));
  for (const row of qEdad.iterate()) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    const y = Number(row.anio);
    if (!Number.isFinite(y) || y < 1950 || y > hoyYear + 1) continue;
    const edad = Math.max(0, hoyYear - y);
    let p = e.piramide.get(edad);
    if (!p) { p = { bev: 0, phev: 0, hev: 0, no_ev: 0 }; e.piramide.set(edad, p); }
    if (row.cat === 'BEV')       p.bev   += row.n;
    else if (row.cat === 'PHEV') p.phev  += row.n;
    else if (row.cat === 'HEV')  p.hev   += row.n;
    else                          p.no_ev += row.n;
    // Acumulado por año de primera matriculación (para cohortes / supervivencia)
    e.parque_por_año_matric.set(y, (e.parque_por_año_matric.get(y) ?? 0) + row.n);
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 9) SOCIOLOGÍA (últimos 24 meses, matriculaciones nuevas)
  console.log(`⏳ [Q9] Sociología últimos 24m (desde ${venta24mMin})...`);
  t0 = Date.now();
  const qSoc = db.prepare(`
    SELECT marca,
           COALESCE(NULLIF(persona_fisica_jur,''),'-') AS pfj,
           COALESCE(NULLIF(renting,''),'-')            AS renting,
           COALESCE(NULLIF(servicio,''),'-')           AS servicio,
           COUNT(*) AS n
    FROM matriculaciones
    WHERE marca IS NOT NULL AND marca != ''
      AND ind_nuevo_usado = 'N'
      AND periodo >= ?
    GROUP BY marca, pfj, renting, servicio
  `);
  for (const row of qSoc.iterate(venta24mMin)) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    if (row.pfj && row.pfj !== '-') e.soc_persona.set(row.pfj, (e.soc_persona.get(row.pfj) ?? 0) + row.n);
    if (row.renting === 'S') e.soc_renting.S += row.n;
    if (row.renting === 'N') e.soc_renting.N += row.n;
    if (row.servicio && row.servicio !== '-') {
      e.soc_servicio.set(row.servicio, (e.soc_servicio.get(row.servicio) ?? 0) + row.n);
    }
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 10) RADAR vs mercado (últimos 24m, turismos nuevos): promedios por marca.
  //   - co2 en g/km (incluir 0 de BEV, excluir NULL)
  //   - kw (potencia real, no CV fiscal)
  //   - masa_orden_marcha en kg
  //   - autonomia_ev en decámetros (dam). Dividir por 100 al emitir → km.
  //     ~70k registros Tesla confirman rango 45500-70200 dam (455-702 km) plausible.
  console.log('⏳ [Q10] Radar por marca (turismos nuevos, 24m)...');
  t0 = Date.now();
  const qRadar = db.prepare(`
    SELECT marca,
           SUM(CASE WHEN co2 IS NOT NULL THEN co2 ELSE 0 END) AS co2_sum,
           SUM(CASE WHEN co2 IS NOT NULL THEN 1   ELSE 0 END) AS co2_n,
           SUM(CASE WHEN kw IS NOT NULL AND kw > 0 THEN kw ELSE 0 END) AS kw_sum,
           SUM(CASE WHEN kw IS NOT NULL AND kw > 0 THEN 1  ELSE 0 END) AS kw_n,
           SUM(CASE WHEN masa_orden_marcha IS NOT NULL AND masa_orden_marcha > 0 THEN masa_orden_marcha ELSE 0 END) AS peso_sum,
           SUM(CASE WHEN masa_orden_marcha IS NOT NULL AND masa_orden_marcha > 0 THEN 1                 ELSE 0 END) AS peso_n,
           SUM(CASE WHEN cat_vehiculo_ev='BEV' AND autonomia_ev IS NOT NULL AND autonomia_ev > 0 THEN autonomia_ev ELSE 0 END) AS auto_sum,
           SUM(CASE WHEN cat_vehiculo_ev='BEV' AND autonomia_ev IS NOT NULL AND autonomia_ev > 0 THEN 1           ELSE 0 END) AS auto_n
    FROM matriculaciones
    WHERE marca IS NOT NULL AND marca != ''
      AND ind_nuevo_usado = 'N'
      AND tipo_grupo = 'turismo'
      AND periodo >= ?
    GROUP BY marca
  `);
  for (const row of qRadar.iterate(venta24mMin)) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    e.radar.co2_sum  += row.co2_sum;  e.radar.co2_n  += row.co2_n;
    e.radar.kw_sum   += row.kw_sum;   e.radar.kw_n   += row.kw_n;
    e.radar.peso_sum += row.peso_sum; e.radar.peso_n += row.peso_n;
    e.radar.auto_sum += row.auto_sum; e.radar.auto_n += row.auto_n;
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 11) MERCADO: agregados globales (sin agrupar por marca)
  console.log('⏳ [Q11] Mercado total...');
  t0 = Date.now();
  // 11a) serie mensual total
  const qMercSerie = db.prepare(`
    SELECT periodo,
           COALESCE(NULLIF(cat_vehiculo_ev,''), 'COMB') AS cat,
           COUNT(*) AS n
    FROM matriculaciones
    GROUP BY periodo, cat
  `);
  const mercadoMat = new Map(); // periodo → mix
  for (const row of qMercSerie.iterate()) {
    let mix = mercadoMat.get(row.periodo);
    if (!mix) { mix = emptyMix(); mercadoMat.set(row.periodo, mix); }
    const b = catFromCatEv(row.cat === 'COMB' ? null : row.cat);
    mix[b] += row.n;
  }
  // 11b) bajas mensuales totales
  const qMercBajas = db.prepare(`SELECT periodo, COUNT(*) AS n FROM bajas GROUP BY periodo`);
  const mercadoBajas = new Map();
  for (const row of qMercBajas.iterate()) mercadoBajas.set(row.periodo, row.n);

  // 11c) radar mercado (turismos nuevos 24m). autonomia_ev en dam → km al emitir.
  const qMercRadar = db.prepare(`
    SELECT
      SUM(CASE WHEN co2 IS NOT NULL THEN co2 ELSE 0 END) AS co2_sum,
      SUM(CASE WHEN co2 IS NOT NULL THEN 1   ELSE 0 END) AS co2_n,
      SUM(CASE WHEN kw > 0 THEN kw ELSE 0 END) AS kw_sum,
      SUM(CASE WHEN kw > 0 THEN 1  ELSE 0 END) AS kw_n,
      SUM(CASE WHEN masa_orden_marcha > 0 THEN masa_orden_marcha ELSE 0 END) AS peso_sum,
      SUM(CASE WHEN masa_orden_marcha > 0 THEN 1                 ELSE 0 END) AS peso_n,
      SUM(CASE WHEN cat_vehiculo_ev='BEV' AND autonomia_ev > 0 THEN autonomia_ev ELSE 0 END) AS auto_sum,
      SUM(CASE WHEN cat_vehiculo_ev='BEV' AND autonomia_ev > 0 THEN 1           ELSE 0 END) AS auto_n
    FROM matriculaciones
    WHERE ind_nuevo_usado = 'N'
      AND tipo_grupo = 'turismo'
      AND periodo >= ?
  `);
  const rMerc = qMercRadar.get(venta24mMin);
  const radarMercado = {
    co2:            rMerc.co2_n  > 0 ? +(rMerc.co2_sum  / rMerc.co2_n ).toFixed(1) : 0,
    kw:             rMerc.kw_n   > 0 ? +(rMerc.kw_sum   / rMerc.kw_n  ).toFixed(1) : 0,
    peso:           rMerc.peso_n > 0 ? +(rMerc.peso_sum / rMerc.peso_n).toFixed(0) : 0,
    autonomia_bev_km: rMerc.auto_n > 0 ? +((rMerc.auto_sum / rMerc.auto_n) / 100).toFixed(0) : 0,
    n_muestra:      rMerc.co2_n,
  };
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 12) MATRICULACIONES NUEVAS por marca × año (solo ind_nuevo_usado='N')
  //     Base para curva de supervivencia: de las matriculadas en año X, cuántas siguen activas.
  console.log('⏳ [Q12] Matric nuevas por marca × año...');
  t0 = Date.now();
  const qMatN = db.prepare(`
    SELECT marca, año AS anio, COUNT(*) AS n
    FROM matriculaciones
    WHERE marca IS NOT NULL AND marca != ''
      AND ind_nuevo_usado = 'N'
    GROUP BY marca, anio
  `);
  for (const row of qMatN.iterate()) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    e.mat_nuevas_por_año.set(row.anio, (e.mat_nuevas_por_año.get(row.anio) ?? 0) + row.n);
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  // 13) BAJAS POR MOTIVO por marca (para Sankey)
  console.log('⏳ [Q13] Bajas por motivo × marca...');
  t0 = Date.now();
  const qBajMotivo = db.prepare(`
    SELECT marca,
           COALESCE(NULLIF(motivo_baja,''), 'otros') AS motivo,
           COUNT(*) AS n
    FROM bajas
    WHERE marca IS NOT NULL AND marca != ''
    GROUP BY marca, motivo
  `);
  for (const row of qBajMotivo.iterate()) {
    const canon = normalizarMarca(row.marca);
    if (!canon) continue;
    const e = getOrCreate(canon);
    const bucket = ['3','7','6','8'].includes(row.motivo) ? row.motivo : 'otros';
    e.bajas_por_motivo[bucket] += row.n;
  }
  console.log(`   ok (${(Date.now() - t0) / 1000}s)`);

  db.close();

  // ── Post-procesar marcas ────────────────────────────────────────────────
  console.log('🔧 Procesando marcas...');
  const visibles = [];
  const marcasOrdenadas = [...marcas.values()].sort((a, b) => b.parque_activo - a.parque_activo);

  // Rankings YTD (sobre todas las marcas, filtradas luego al escribir)
  const rankYtd     = [...marcas.values()].map((e) => ({ s: e.slug, n: e.mat_ytd.bev + e.mat_ytd.phev + e.mat_ytd.hev + e.mat_ytd.otro }))
                         .filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const rankYtdPrev = [...marcas.values()].map((e) => ({ s: e.slug, n: e.mat_ytd_prev.bev + e.mat_ytd_prev.phev + e.mat_ytd_prev.hev + e.mat_ytd_prev.otro }))
                         .filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const rankYtdMap     = new Map(rankYtd.map((x, i) => [x.s, i + 1]));
  const rankYtdPrevMap = new Map(rankYtdPrev.map((x, i) => [x.s, i + 1]));

  // Ranking provincial (parque activo): por cada provincia, rank de marcas
  const marcaPorProv = new Map(); // cod → [{marca, parque}] ordenado desc
  for (const e of marcas.values()) {
    for (const [cod, d] of e.por_provincia) {
      if (!marcaPorProv.has(cod)) marcaPorProv.set(cod, []);
      marcaPorProv.get(cod).push({ slug: e.slug, parque: d.parque });
    }
  }
  for (const [cod, list] of marcaPorProv) {
    list.sort((a, b) => b.parque - a.parque);
    list.forEach((x, i) => { x.rank = i + 1; });
  }
  const rankingProvMap = new Map(); // `${slug}|${cod}` → rank
  for (const [cod, list] of marcaPorProv) {
    for (const x of list) rankingProvMap.set(`${x.slug}|${cod}`, x.rank);
  }

  // Totales de mercado YTD
  const mercadoYtd     = ytdPeriodos.reduce((a, p)     => a + (mercadoMat.get(p)     ? Object.values(mercadoMat.get(p)).reduce((s, v) => s + v, 0) : 0), 0);
  const mercadoYtdPrev = ytdPrevPeriodos.reduce((a, p) => a + (mercadoMat.get(p)     ? Object.values(mercadoMat.get(p)).reduce((s, v) => s + v, 0) : 0), 0);

  // ── Escribir un JSON por marca ────────────────────────────────────────
  const periodosTodos = [...mercadoMat.keys()].sort();
  let nEscritas = 0;
  const slugsEscritos = new Set();
  for (const e of marcasOrdenadas) {
    // Visible si supera el umbral de matriculaciones O tiene parque significativo
    // (marcas legacy pre-2014 como AUSTIN, MORRIS, DATSUN tienen parque y cero matric).
    if (e.total_hist < MIN_TOTAL_HIST && e.parque_activo < MIN_PARQUE) continue;
    // Slug vacío = marca basura (p.ej. solo caracteres especiales). Skip con warning.
    if (!e.slug) {
      console.warn(`⚠  Marca con slug vacío descartada: "${e.marca}" (parque=${e.parque_activo}, hist=${e.total_hist})`);
      continue;
    }
    // Colisión de slug: dos marcas canónicas distintas que slugean igual.
    // La segunda pierde los datos silenciosamente. Avisar para agregar alias.
    if (slugsEscritos.has(e.slug)) {
      console.warn(`⚠  Colisión de slug "${e.slug}" — marca descartada: "${e.marca}". Agregar alias en data/dgt-marca-aliases.json`);
      continue;
    }
    slugsEscritos.add(e.slug);

    // dominio: tipo_grupo con >60%
    let dominio = 'mixto';
    if (e.parque_activo > 0) {
      for (const [tipo, mix] of e.mix_tipo_grupo) {
        if (mix.total / e.parque_activo >= TIPO_DOMINANTE_UMBRAL) { dominio = tipo; break; }
      }
    }
    const tiene_ev = [...e.mat_mensual.values()].some((m) => (m.bev + m.phev) > 0);
    const pocosDatos = e.total_hist < POCOS_DATOS;

    // Serie mensual: emitir solo periodos con actividad
    const serie_mensual = [];
    for (const p of periodosTodos) {
      const mat = e.mat_mensual.get(p);
      const baj = e.bajas_mensual.get(p) ?? 0;
      if (!mat && !baj) continue;
      serie_mensual.push({
        periodo: p,
        bev:   mat?.bev   ?? 0,
        phev:  mat?.phev  ?? 0,
        hev:   mat?.hev   ?? 0,
        otro:  mat?.otro  ?? 0,
        bajas: baj,
      });
    }

    // Mix tecnología anual (derivado)
    const anualAcc = new Map();
    for (const { periodo, bev, phev, hev, otro } of serie_mensual) {
      const y = Number(periodo.slice(0, 4));
      let acc = anualAcc.get(y);
      if (!acc) { acc = { bev: 0, phev: 0, hev: 0, otro: 0 }; anualAcc.set(y, acc); }
      acc.bev += bev; acc.phev += phev; acc.hev += hev; acc.otro += otro;
    }
    const mix_tecnologia_anual = [...anualAcc.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([año, a]) => ({ año, ...a }));

    // Top modelos parque (top 20)
    const top_modelos_parque = [...e.top_modelos.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    // Por provincia: cuota + rank + top_3
    const por_provincia = {};
    for (const [cod, d] of e.por_provincia) {
      const totProv = totalPorProvincia.get(cod) ?? 0;
      por_provincia[cod] = {
        parque: d.parque,
        cuota_pct: totProv > 0 ? +((d.parque / totProv) * 100).toFixed(3) : 0,
        ranking:  rankingProvMap.get(`${e.slug}|${cod}`) ?? null,
        top_3:    d.top_3,
      };
    }

    // Mix por tipo_grupo: calcular no_enchufable derivable
    const mix_tipo_grupo = {};
    for (const [tipo, mix] of e.mix_tipo_grupo) {
      mix_tipo_grupo[tipo] = {
        total: mix.total,
        bev: mix.bev,
        phev: mix.phev,
        hev: mix.hev,
        no_enchufable: mix.total - mix.bev - mix.phev,
      };
    }

    // Pirámide: ordenada por edad
    const piramide_edad = [...e.piramide.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([años, mix]) => ({ años, ...mix }));

    // Edad media parque
    let edadSum = 0, edadN = 0;
    for (const [años, mix] of e.piramide) {
      const total = mix.bev + mix.phev + mix.hev + mix.no_ev;
      edadSum += años * total;
      edadN   += total;
    }
    const edad_media_parque = edadN > 0 ? +(edadSum / edadN).toFixed(1) : 0;

    // Sociología
    const sociologia = {
      persona:   Object.fromEntries([...e.soc_persona.entries()].sort((a, b) => b[1] - a[1])),
      renting:   e.soc_renting,
      servicio:  Object.fromEntries([...e.soc_servicio.entries()].sort((a, b) => b[1] - a[1])),
    };

    // Radar (solo turismos, si n>=30 muestras, sino null).
    // autonomia_ev en DGT está en decámetros → dividir /100 para km.
    const radar_vs_mercado = {
      co2_marca:              e.radar.co2_n  >= 30 ? +(e.radar.co2_sum  / e.radar.co2_n ).toFixed(1) : null,
      kw_marca:               e.radar.kw_n   >= 30 ? +(e.radar.kw_sum   / e.radar.kw_n  ).toFixed(1) : null,
      peso_marca:             e.radar.peso_n >= 30 ? +(e.radar.peso_sum / e.radar.peso_n).toFixed(0) : null,
      autonomia_bev_km_marca: e.radar.auto_n >= 30 ? +((e.radar.auto_sum / e.radar.auto_n) / 100).toFixed(0) : null,
      n_muestra_marca:        e.radar.co2_n,
      // mercado (mismo en todos los files, duplicado para conveniencia)
      co2_mercado:              radarMercado.co2,
      kw_mercado:               radarMercado.kw,
      peso_mercado:             radarMercado.peso,
      autonomia_bev_km_mercado: radarMercado.autonomia_bev_km,
    };

    // Stats
    const matYtdTotal     = e.mat_ytd.bev     + e.mat_ytd.phev     + e.mat_ytd.hev     + e.mat_ytd.otro;
    const matYtdPrevTotal = e.mat_ytd_prev.bev + e.mat_ytd_prev.phev + e.mat_ytd_prev.hev + e.mat_ytd_prev.otro;
    const bajasYtd = ytdPeriodos.reduce((a, p) => a + (e.bajas_mensual.get(p) ?? 0), 0);

    const stats = {
      parque_activo:          e.parque_activo,
      matric_ytd:             matYtdTotal,
      matric_ytd_prev:        matYtdPrevTotal,
      cuota_bevphev_ytd_pct:  matYtdTotal > 0 ? +(((e.mat_ytd.bev + e.mat_ytd.phev) / matYtdTotal) * 100).toFixed(2) : 0,
      cuota_mercado_ytd_pct:  mercadoYtd  > 0 ? +((matYtdTotal / mercadoYtd) * 100).toFixed(3) : 0,
      cuota_mercado_ytd_prev_pct: mercadoYtdPrev > 0 ? +((matYtdPrevTotal / mercadoYtdPrev) * 100).toFixed(3) : 0,
      ranking_ytd:            rankYtdMap.get(e.slug) ?? null,
      ranking_ytd_prev:       rankYtdPrevMap.get(e.slug) ?? null,
      edad_media_parque,
      ratio_bajas_matric_ytd: matYtdTotal > 0 ? +((bajasYtd / matYtdTotal) * 100).toFixed(2) : 0,
    };

    // Cohortes anuales: matriculadas nuevas vs activas hoy (por año de primera matric).
    // Emite solo años con datos (matriculadas > 0 O activas_hoy > 0).
    const cohorteAños = new Set([...e.mat_nuevas_por_año.keys(), ...e.parque_por_año_matric.keys()]);
    const cohortes = [...cohorteAños]
      .sort((a, b) => a - b)
      .filter((año) => año >= 2014) // MATRABA empieza dic-2014
      .map((año) => ({
        año,
        matriculadas: e.mat_nuevas_por_año.get(año) ?? 0,
        activas_hoy:  e.parque_por_año_matric.get(año) ?? 0,
      }))
      .filter((c) => c.matriculadas > 0 || c.activas_hoy > 0);

    const perfil = {
      slug: e.slug,
      marca: e.marca,
      total_hist: e.total_hist,
      parque_activo: e.parque_activo,
      dominio,
      tiene_ev,
      pocos_datos: pocosDatos,
      ultimo_periodo: ultPer,
      generado_en:    new Date().toISOString().slice(0, 10),
      stats,
      serie_mensual,
      mix_tipo_grupo,
      top_modelos_parque,
      mix_tecnologia_anual,
      por_provincia,
      sociologia,
      distintivo_ambiental: e.distintivo,
      piramide_edad,
      radar_vs_mercado,
      // v2
      bajas_por_motivo: e.bajas_por_motivo,
      cohortes,
    };

    writeFileSync(join(OUT_DIR, `${e.slug}.json`), JSON.stringify(perfil), 'utf8');
    visibles.push({
      slug: e.slug, marca: e.marca,
      total_hist: e.total_hist,
      parque_activo: e.parque_activo,
      dominio,
      tiene_ev,
      pocos_datos: pocosDatos,
    });
    nEscritas++;
  }
  console.log(`✅ ${nEscritas} JSONs de marca escritos en ${OUT_DIR}`);

  // ── Index ─────────────────────────────────────────────────────────────
  // Ordenar por parque_activo para asignar destacada a los top N
  visibles.sort((a, b) => b.parque_activo - a.parque_activo);
  visibles.forEach((m, i) => { m.destacada = i < DESTACADA_TOP_N; });

  const indexOut = {
    meta: {
      generado_en: new Date().toISOString().slice(0, 10),
      ultimo_periodo: ultPer,
      total_marcas_visibles: visibles.length,
      min_total_hist: MIN_TOTAL_HIST,
      min_parque_activo: MIN_PARQUE,
      pocos_datos_umbral: POCOS_DATOS,
    },
    marcas: visibles.sort((a, b) => a.marca.localeCompare(b.marca)),
  };
  writeFileSync(OUT_INDEX, JSON.stringify(indexOut, null, 2), 'utf8');
  console.log(`✅ Index escrito: ${OUT_INDEX}  (${visibles.length} marcas visibles)`);

  // ── Mercado ───────────────────────────────────────────────────────────
  const serie_mercado = periodosTodos.map((p) => {
    const mix = mercadoMat.get(p) ?? emptyMix();
    return { periodo: p, bev: mix.bev, phev: mix.phev, hev: mix.hev, otro: mix.otro, bajas: mercadoBajas.get(p) ?? 0 };
  });
  // mix tecnologia anual mercado
  const anualMerc = new Map();
  for (const { periodo, bev, phev, hev, otro } of serie_mercado) {
    const y = Number(periodo.slice(0, 4));
    let acc = anualMerc.get(y);
    if (!acc) { acc = { bev: 0, phev: 0, hev: 0, otro: 0 }; anualMerc.set(y, acc); }
    acc.bev += bev; acc.phev += phev; acc.hev += hev; acc.otro += otro;
  }
  const mix_tecnologia_anual_mercado = [...anualMerc.entries()].sort((a, b) => a[0] - b[0]).map(([año, a]) => ({ año, ...a }));

  const mercadoOut = {
    meta: {
      generado_en: new Date().toISOString().slice(0, 10),
      ultimo_periodo: ultPer,
      periodo_ini_socio: venta24mMin,
    },
    serie_mensual: serie_mercado,
    mix_tecnologia_anual: mix_tecnologia_anual_mercado,
    parque_total_por_provincia: Object.fromEntries(totalPorProvincia),
    radar_mercado: radarMercado,
    matric_ytd_total: mercadoYtd,
    matric_ytd_prev_total: mercadoYtdPrev,
  };
  writeFileSync(OUT_MERCADO, JSON.stringify(mercadoOut, null, 2), 'utf8');
  console.log(`✅ Mercado escrito: ${OUT_MERCADO}`);

  // ── Racing dataset: top N marcas × serie mensual ─────────────────────
  // Para el racing bar chart animado. Top N por total_hist.
  const racingTopMarcas = [...marcas.values()]
    .filter((e) => e.total_hist >= MIN_TOTAL_HIST || e.parque_activo >= MIN_PARQUE)
    .sort((a, b) => b.total_hist - a.total_hist)
    .slice(0, RACING_TOP_N);
  const racingOut = {
    meta: {
      generado_en: new Date().toISOString().slice(0, 10),
      ultimo_periodo: ultPer,
      top_n: RACING_TOP_N,
      periodos: periodosTodos,
    },
    marcas: racingTopMarcas.map((e) => ({
      slug: e.slug,
      marca: e.marca,
      // Para cada periodo, matriculaciones totales (bev+phev+hev+otro)
      serie: periodosTodos.map((p) => {
        const m = e.mat_mensual.get(p);
        return m ? m.bev + m.phev + m.hev + m.otro : 0;
      }),
    })),
  };
  writeFileSync(OUT_RACING, JSON.stringify(racingOut, null, 2), 'utf8');
  console.log(`✅ Racing escrito: ${OUT_RACING}  (${racingTopMarcas.length} marcas × ${periodosTodos.length} meses)`);

  console.log('🎉 Listo.');
}

main().catch((err) => { console.error(err); process.exit(1); });
