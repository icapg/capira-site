/**
 * dgt-parque-build.mjs
 * Genera data/dgt-parque.json + app/lib/insights/dgt-parque-data.ts
 *
 * Dos fuentes de verdad (sin proyecciones arbitrarias):
 *   1) Reales: tabla parque_agregados_mes (snapshots mensuales ZIP DGT, mar-2025+)
 *   2) Calculados hacia atrás: parque[m-1] = parque[m] − mat[m] + baja[m]
 *      usando el primer snapshot real como ancla.
 *
 * Cada mes lleva un campo `fuente: "real" | "calculado"` que el dashboard
 * usa para marcar visualmente la serie (línea sólida vs punteada).
 *
 * Uso: node scripts/dgt-parque-build.mjs
 */

import Database         from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');
const OUT_JSON  = join(__dirname, '..', 'data', 'dgt-parque.json');
const OUT_TS    = join(__dirname, '..', 'app', 'lib', 'insights', 'dgt-parque-data.ts');

const CATS = ['BEV', 'PHEV', 'HEV', 'REEV', 'FCEV'];

function mesesRange(first, last) {
  // first y last en formato 'YYYY-MM'
  const out = [];
  let [y, m] = first.split('-').map(Number);
  const [ly, lm] = last.split('-').map(Number);
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

function periodoDgtToIso(p) {
  // '202503' → '2025-03'
  return `${p.slice(0, 4)}-${p.slice(4)}`;
}

function main() {
  const db = new Database(DB_FILE, { readonly: true });

  // 1) Snapshots reales del parque ------------------------------------------------
  const realRows = db.prepare(`SELECT periodo FROM parque_meses_procesados ORDER BY periodo`).all();
  if (!realRows.length) {
    console.error('❌ No hay snapshots en parque_meses_procesados. Ejecutá: node scripts/dgt-parque-import.mjs --all');
    process.exit(1);
  }
  const realPeriodos = realRows.map(r => periodoDgtToIso(r.periodo));
  const firstReal = realPeriodos[0];
  const lastReal  = realPeriodos[realPeriodos.length - 1];

  // Mapa periodo → { total, por CATELECT, por tipo, por provincia × tipo × cat }
  const realParque = new Map();
  for (const r of realRows) {
    const iso   = periodoDgtToIso(r.periodo);
    const total = db.prepare(`SELECT n FROM parque_agregados_mes WHERE periodo = ? AND clave = 'TOTAL'`).get(r.periodo)?.n ?? 0;
    const porCat = Object.fromEntries(
      db.prepare(`SELECT substr(clave, 10) as k, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'CATELECT:%'`).all(r.periodo)
        .map(x => [x.k, x.n])
    );
    const porTipo = Object.fromEntries(
      db.prepare(`SELECT substr(clave, 6) as k, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'TIPO:%'`).all(r.periodo)
        .map(x => [x.k, x.n])
    );
    const porCatTipo = db.prepare(`SELECT substr(clave, 15) as k, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'CATELECT_TIPO:%'`).all(r.periodo);
    const tipoBreakdown = {};
    for (const { k, n } of porCatTipo) {
      const [cat, tipo] = k.split(':');
      if (!tipoBreakdown[tipo]) tipoBreakdown[tipo] = {};
      tipoBreakdown[tipo][cat] = n;
    }
    // completar "no_enchufable" y "total" por tipo
    for (const tipo of Object.keys(tipoBreakdown)) {
      const sumCats = Object.values(tipoBreakdown[tipo]).reduce((a, b) => a + b, 0);
      const totalTipo = porTipo[tipo] ?? sumCats;
      const enchuf = (tipoBreakdown[tipo].BEV ?? 0) + (tipoBreakdown[tipo].PHEV ?? 0);
      tipoBreakdown[tipo].total = totalTipo;
      tipoBreakdown[tipo].no_enchufable = totalTipo - enchuf;
    }

    // Provincia × Tipo × Cat (solo meses reales)
    const porProvTipo = db.prepare(
      `SELECT substr(clave, 25) as k, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'PROVINCIA_CATELECT_TIPO:%'`
    ).all(r.periodo);
    const provBreakdown = {};
    for (const { k, n } of porProvTipo) {
      const [prov, cat, tipo] = k.split(':');
      if (!provBreakdown[prov]) provBreakdown[prov] = {};
      if (!provBreakdown[prov][tipo]) provBreakdown[prov][tipo] = {};
      provBreakdown[prov][tipo][cat] = n;
    }
    // completar total y no_enchufable por (prov, tipo)
    for (const prov of Object.keys(provBreakdown)) {
      for (const tipo of Object.keys(provBreakdown[prov])) {
        const cats = provBreakdown[prov][tipo];
        const tot = Object.values(cats).reduce((a, b) => a + b, 0);
        const ench = (cats.BEV ?? 0) + (cats.PHEV ?? 0);
        cats.total = tot;
        cats.no_enchufable = tot - ench;
      }
    }

    // Distintivo ambiental (DGT: 0, B, C, ECO, CERO) — solo meses reales
    const distRows = db.prepare(
      `SELECT substr(clave, 12) as etiqueta, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'DISTINTIVO:%'`
    ).all(r.periodo);
    const distintivo = Object.fromEntries(distRows.map(x => [x.etiqueta || 'Sin', x.n]));

    realParque.set(iso, { total, porCat, tipoBreakdown, provBreakdown, distintivo });
  }

  // 2) Flujos por mes POR TIPO × POR CATELECT ---------------------------------
  // Fórmula F6 (calibrada empíricamente sobre 12 meses de snapshots reales):
  //   - matriculaciones: TODAS (ind_nuevo_usado='N' y 'U'). Las 'U' son
  //     importaciones de UE re-matriculadas en España — sí amplían el parque.
  //   - bajas: motivo_baja IN ('3','7'). '3' es desguace definitivo, '7' es
  //     voluntaria (el vehículo queda fuera del parque activo). Se excluye
  //     motivo='6' (sin descripción, evidencia empírica apunta a transferencias
  //     de titular que no sacan al vehículo del parque).
  // Con F6 el error promedio de reconstrucción vs snapshots reales es ~2,85%
  // (vs ~4,48% con la fórmula anterior mat(N) − bajas(=3)).
  // Tipos que existen en el ZIP parque (y por tanto en parque_por_tipo):
  const TIPOS_PARQUE = ['turismo','furgoneta_van','moto','trimoto','microcar','camion','autobus','especial','quad_atv','agricola','remolque','otros'];

  // Flujos: matriculaciones por (periodo, tipo, cat) — cat incluye NO_EV
  const flujoMatRows = db.prepare(`
    SELECT periodo, tipo_grupo,
           COALESCE(NULLIF(cat_vehiculo_ev,''), 'NO_EV') AS cat,
           COUNT(*) AS n
    FROM matriculaciones
    WHERE tipo_grupo IN (${TIPOS_PARQUE.map(() => '?').join(',')})
    GROUP BY periodo, tipo_grupo, cat
  `).all(...TIPOS_PARQUE);
  const flujoBajaRows = db.prepare(`
    SELECT periodo, tipo_grupo,
           COALESCE(NULLIF(cat_vehiculo_ev,''), 'NO_EV') AS cat,
           COUNT(*) AS n
    FROM bajas
    WHERE motivo_baja IN ('3','7')
      AND tipo_grupo IN (${TIPOS_PARQUE.map(() => '?').join(',')})
    GROUP BY periodo, tipo_grupo, cat
  `).all(...TIPOS_PARQUE);

  // matTipoMap.get(periodo).get(tipo)[cat] = n
  const matTipoMap  = new Map();
  const bajaTipoMap = new Map();
  for (const r of flujoMatRows) {
    if (!matTipoMap.has(r.periodo)) matTipoMap.set(r.periodo, new Map());
    const byTipo = matTipoMap.get(r.periodo);
    if (!byTipo.has(r.tipo_grupo)) byTipo.set(r.tipo_grupo, {});
    byTipo.get(r.tipo_grupo)[r.cat] = r.n;
  }
  for (const r of flujoBajaRows) {
    if (!bajaTipoMap.has(r.periodo)) bajaTipoMap.set(r.periodo, new Map());
    const byTipo = bajaTipoMap.get(r.periodo);
    if (!byTipo.has(r.tipo_grupo)) byTipo.set(r.tipo_grupo, {});
    byTipo.get(r.tipo_grupo)[r.cat] = r.n;
  }

  // Agregados globales por mes/cat (suma sobre todos los tipos filtrados)
  const matMap   = new Map();      // periodo → { BEV, PHEV, HEV, REEV, FCEV }
  const bajaMap  = new Map();
  const totalMatMap  = new Map();  // periodo → total (todos tipos y cats)
  const totalBajaMap = new Map();
  for (const [periodo, byTipo] of matTipoMap) {
    const agg = {}; let tot = 0;
    for (const cats of byTipo.values()) {
      for (const [k, v] of Object.entries(cats)) {
        tot += v;
        if (k !== 'NO_EV') agg[k] = (agg[k] ?? 0) + v;
      }
    }
    matMap.set(periodo, agg);
    totalMatMap.set(periodo, tot);
  }
  for (const [periodo, byTipo] of bajaTipoMap) {
    const agg = {}; let tot = 0;
    for (const cats of byTipo.values()) {
      for (const [k, v] of Object.entries(cats)) {
        tot += v;
        if (k !== 'NO_EV') agg[k] = (agg[k] ?? 0) + v;
      }
    }
    bajaMap.set(periodo, agg);
    totalBajaMap.set(periodo, tot);
  }

  // 3) Rango completo: desde el primer mes con datos MATRABA hasta el último real
  const firstFlujo = [...totalMatMap.keys()].sort()[0]; // '2014-12'
  const todosPeriodos = mesesRange(firstFlujo, lastReal);

  // 3.5) Primera matriculación por (tipo, cat) — para categorías esporádicas
  //      (trimoto BEV/PHEV, microcar, etc) forzamos el stock a 0 antes de la
  //      primera matric registrada. Evita el "parque fantasma" que genera el
  //      backward-walk cuando bajas > matriculaciones en el histórico
  //      (vehículos matriculados pre-2014 que aparecen en bajas pero no en
  //      matriculaciones). Sin esto, trimoto PHEV mostraba 23 en 2014-12
  //      cuando no existían.
  const firstMatByTipoCat = new Map(); // `${tipo}|${cat}` → iso del primer mes con mat>0
  for (const [periodo, byTipo] of matTipoMap) {
    for (const [tipo, cats] of byTipo) {
      for (const [cat, n] of Object.entries(cats)) {
        if (n <= 0) continue;
        const key = `${tipo}|${cat}`;
        const prev = firstMatByTipoCat.get(key);
        if (!prev || periodo < prev) firstMatByTipoCat.set(key, periodo);
      }
    }
  }

  // 4) Ir hacia ATRÁS desde el ancla real ------------------------------------
  //    parque[m-1][tipo][cat] = parque[m][tipo][cat] − mat[m][tipo][cat] + baja[m][tipo][cat]
  //    Se hace por (tipo × cat) para que el filtro del dashboard cuadre.
  const ancla = realParque.get(firstReal);
  const parqueCalc = new Map(); // iso → { total, porCat, tipoBreakdown, fuente }

  // Ancla
  parqueCalc.set(firstReal, {
    total:  ancla.total,
    porCat: { ...ancla.porCat },
    tipoBreakdown: JSON.parse(JSON.stringify(ancla.tipoBreakdown)),
    fuente: 'real',
  });

  const CATS_FULL = [...CATS, 'NO_EV']; // BEV, PHEV, HEV, REEV, FCEV, NO_EV

  const idxAncla = todosPeriodos.indexOf(firstReal);
  for (let i = idxAncla - 1; i >= 0; i--) {
    const actual = todosPeriodos[i];
    const siguiente = todosPeriodos[i + 1];
    const parqueSig = parqueCalc.get(siguiente);
    const matSigByTipo  = matTipoMap.get(siguiente)  ?? new Map();
    const bajaSigByTipo = bajaTipoMap.get(siguiente) ?? new Map();

    const tipoBreakdown = {};
    let total = 0;
    const porCatGlobal = {};
    for (const c of CATS) porCatGlobal[c] = 0;
    porCatGlobal.NO_EV = 0;

    for (const tipo of TIPOS_PARQUE) {
      const prev = parqueSig.tipoBreakdown[tipo] ?? {};
      const matT  = matSigByTipo.get(tipo)  ?? {};
      const bajaT = bajaSigByTipo.get(tipo) ?? {};
      const nuevoTipo = {};
      let totalTipo = 0;
      let enchufTipo = 0;
      for (const cat of CATS_FULL) {
        const curr = prev[cat] ?? 0;
        let v = Math.max(0, curr - (matT[cat] ?? 0) + (bajaT[cat] ?? 0));
        // Freeze a 0 antes de la primera matriculación registrada para este
        // (tipo, cat). Evita parque fantasma por bajas sin mat correspondiente.
        const firstMat = firstMatByTipoCat.get(`${tipo}|${cat}`);
        if (firstMat && actual < firstMat) v = 0;
        else if (!firstMat) v = 0; // nunca hubo matriculación de esta combo
        if (v > 0) nuevoTipo[cat] = v;
        totalTipo += v;
        if (cat === 'BEV' || cat === 'PHEV') enchufTipo += v;
        porCatGlobal[cat] += v;
      }
      nuevoTipo.total = totalTipo;
      nuevoTipo.no_enchufable = Math.max(0, totalTipo - enchufTipo);
      tipoBreakdown[tipo] = nuevoTipo;
      total += totalTipo;
    }

    // porCat global (sin NO_EV fuera de las enchufables)
    const porCat = { ...porCatGlobal };
    delete porCat.NO_EV;

    parqueCalc.set(actual, { total, porCat, tipoBreakdown, fuente: 'calculado' });
  }

  // 5) Sobreescribir con datos REALES los periodos que tienen snapshot ZIP
  for (const p of realPeriodos) {
    const r = realParque.get(p);
    parqueCalc.set(p, {
      total: r.total,
      porCat: { ...r.porCat },
      tipoBreakdown: JSON.parse(JSON.stringify(r.tipoBreakdown)),
      provBreakdown: JSON.parse(JSON.stringify(r.provBreakdown)),
      distintivo:    { ...r.distintivo },
      fuente: 'real',
    });
  }

  // 6) Construir array mensual con la forma que espera el dashboard --------------
  const mensual = todosPeriodos.map(iso => {
    const parque = parqueCalc.get(iso) ?? { total: 0, porCat: {}, fuente: 'calculado' };
    const mat  = matMap.get(iso)  ?? {};
    const baja = bajaMap.get(iso) ?? {};
    const totalBajaMes = totalBajaMap.get(iso) ?? 0;

    const enchuf = (parque.porCat.BEV ?? 0) + (parque.porCat.PHEV ?? 0);
    const parque_no_enchufable = Math.max(0, parque.total - enchuf);

    const entry = {
      periodo: iso,
      fuente:  parque.fuente,
      matriculaciones_mes: {
        BEV:  mat.BEV  ?? 0,
        PHEV: mat.PHEV ?? 0,
        HEV:  mat.HEV  ?? 0,
        REEV: mat.REEV ?? 0,
        FCEV: mat.FCEV ?? 0,
      },
      bajas_mes: {
        BEV:  baja.BEV  ?? 0,
        PHEV: baja.PHEV ?? 0,
        HEV:  baja.HEV  ?? 0,
        REEV: baja.REEV ?? 0,
        FCEV: baja.FCEV ?? 0,
      },
      total_bajas_mes:      totalBajaMes,
      parque_acumulado: {
        BEV:  parque.porCat.BEV  ?? 0,
        PHEV: parque.porCat.PHEV ?? 0,
        HEV:  parque.porCat.HEV  ?? 0,
        REEV: parque.porCat.REEV ?? 0,
        FCEV: parque.porCat.FCEV ?? 0,
      },
      parque_total:          parque.total,
      parque_no_enchufable:  parque_no_enchufable,
    };

    // breakdown por tipo (real desde ZIP, calc desde flujos MATRABA por tipo×cat)
    if (parque.tipoBreakdown) entry.parque_por_tipo = parque.tipoBreakdown;
    // breakdown por provincia × tipo × cat (solo meses reales — desde ZIP DGT)
    if (parque.provBreakdown) entry.parque_por_provincia_tipo = parque.provBreakdown;
    // distintivo ambiental (solo meses reales)
    if (parque.distintivo) entry.parque_distintivo = parque.distintivo;
    return entry;
  });

  // 7) Resumen total --------------------------------------------------------------
  const lastRealData = realParque.get(lastReal);
  const totalMat = db.prepare(`SELECT cat_vehiculo_ev, COUNT(*) as n FROM matriculaciones WHERE cat_vehiculo_ev IN ('BEV','PHEV','HEV','REEV','FCEV') GROUP BY cat_vehiculo_ev`).all();
  const totalBajas = db.prepare(`SELECT cat_vehiculo_ev, COUNT(*) as n FROM bajas WHERE cat_vehiculo_ev IN ('BEV','PHEV','HEV','REEV','FCEV') GROUP BY cat_vehiculo_ev`).all();
  const matTotal  = Object.fromEntries(totalMat.map(r => [r.cat_vehiculo_ev, r.n]));
  const bajaTotal = Object.fromEntries(totalBajas.map(r => [r.cat_vehiculo_ev, r.n]));

  const resumen = {};
  for (const cat of CATS) {
    const m = matTotal[cat]  ?? 0;
    const b = bajaTotal[cat] ?? 0;
    const activo = lastRealData.porCat[cat] ?? Math.max(0, m - b);
    resumen[cat] = {
      matriculadas:  m,
      bajas:         b,
      parque_activo: activo,
      tasa_baja_pct: m > 0 ? +((b / m) * 100).toFixed(2) : 0,
    };
  }

  // Resumen por tipo (del último mes real)
  const resumenPorTipo = {};
  for (const [tipo, data] of Object.entries(lastRealData.tipoBreakdown)) {
    resumenPorTipo[tipo] = {
      BEV:  { parque_activo: data.BEV  ?? 0 },
      PHEV: { parque_activo: data.PHEV ?? 0 },
      total:         data.total,
      no_enchufable: data.no_enchufable,
    };
  }

  // ── Breakdown por MUNICIPIO del último mes real ─────────────────────────
  // Solo último snapshot — incluir todos los meses inflaría el JSON ~10×.
  // fuente: tabla `parque` cruzada por municipio × tipo_grupo × catelect.
  const lastPeriodoKeyMun = lastReal.replace('-', '');
  const munRows = db.prepare(`
    SELECT municipio, provincia, tipo_grupo,
           COALESCE(NULLIF(catelect,''), 'NO_EV') AS cat,
           COUNT(*) AS n
    FROM parque
    WHERE periodo = ?
      AND municipio IS NOT NULL AND municipio != ''
      AND tipo_grupo IN (${TIPOS_PARQUE.map(() => '?').join(',')})
    GROUP BY municipio, provincia, tipo_grupo, cat
  `).all(lastPeriodoKeyMun, ...TIPOS_PARQUE);

  const municipioBreakdown = {};
  for (const { municipio, provincia, tipo_grupo, cat, n } of munRows) {
    if (!municipioBreakdown[municipio]) {
      municipioBreakdown[municipio] = { prov: provincia, tipos: {} };
    }
    const mun = municipioBreakdown[municipio];
    if (!mun.tipos[tipo_grupo]) mun.tipos[tipo_grupo] = {};
    mun.tipos[tipo_grupo][cat] = n;
  }
  // totales por municipio × tipo
  for (const mun of Object.values(municipioBreakdown)) {
    for (const tipo of Object.keys(mun.tipos)) {
      const cats = mun.tipos[tipo];
      const tot  = Object.values(cats).reduce((a, b) => a + b, 0);
      const ench = (cats.BEV ?? 0) + (cats.PHEV ?? 0);
      cats.total = tot;
      cats.no_enchufable = Math.max(0, tot - ench);
    }
  }

  // Inyectar en el último mes real
  const lastMes = mensual.find(m => m.periodo === lastReal);
  if (lastMes) lastMes.parque_por_municipio = municipioBreakdown;

  // ── Breakdown DISTINTIVO × PROVINCIA × TIPO × [BEV/PHEV/NO_EV] ─────────
  // Solo último mes real. Usa la tabla `parque` (snapshot completo).
  // Costo: ~2.500-3.500 filas no-zero; ~30-45 KB gzipped en el bundle.
  const distBreakdownRows = db.prepare(`
    SELECT provincia,
           tipo_grupo,
           COALESCE(NULLIF(distintivo, ''), 'SIN DISTINTIVO') AS dist,
           CASE
             WHEN catelect = 'BEV'  THEN 'BEV'
             WHEN catelect = 'PHEV' THEN 'PHEV'
             ELSE 'NO_EV'
           END AS cat,
           COUNT(*) AS n
    FROM parque
    WHERE periodo = ?
      AND provincia IS NOT NULL AND provincia != ''
      AND tipo_grupo IN (${TIPOS_PARQUE.map(() => '?').join(',')})
    GROUP BY provincia, tipo_grupo, dist, cat
  `).all(lastPeriodoKeyMun, ...TIPOS_PARQUE);

  const distintivoBreakdown = {};
  for (const { provincia, tipo_grupo, dist, cat, n } of distBreakdownRows) {
    if (!distintivoBreakdown[provincia])                                 distintivoBreakdown[provincia] = {};
    if (!distintivoBreakdown[provincia][tipo_grupo])                     distintivoBreakdown[provincia][tipo_grupo] = {};
    if (!distintivoBreakdown[provincia][tipo_grupo][dist])               distintivoBreakdown[provincia][tipo_grupo][dist] = {};
    distintivoBreakdown[provincia][tipo_grupo][dist][cat] = n;
  }

  if (lastMes) lastMes.parque_distintivo_breakdown = distintivoBreakdown;

  // ── Edad del parque: distribución por año de matriculación y promedios ──
  // Fuente: tabla `parque` (último snapshot). fec_prim_matr viene como DD/MM/YYYY.
  // Usamos fec_prim_matr (primera matriculación original, incluye importaciones)
  // en lugar de fecha_matr (re-matriculación española).
  const hoyYear = new Date().getFullYear();
  const lastPeriodoKey = lastReal.replace('-', ''); // 2026-03 → 202603
  const edadRows = db.prepare(`
    SELECT substr(fec_prim_matr, 7, 4) AS anio,
           catelect,
           tipo_grupo,
           COUNT(*) AS n
    FROM parque
    WHERE periodo = ?
      AND fec_prim_matr IS NOT NULL AND fec_prim_matr != ''
      AND length(fec_prim_matr) >= 10
    GROUP BY anio, catelect, tipo_grupo
  `).all(lastPeriodoKey);

  const porAnio = {};
  // por_anio_por_tipo[anio][tipo_grupo][catelect] — permite filtrar la pirámide por tipo
  const porAnioPorTipo = {};
  const sumAgeByCat = {};
  const countByCat  = {};
  // sums_por_tipo[tipo_grupo][catelect] = { sum_age, count }
  const sumsPorTipo = {};
  for (const { anio, catelect, tipo_grupo, n } of edadRows) {
    const y = parseInt(anio, 10);
    if (!Number.isFinite(y) || y < 1950 || y > hoyYear + 1) continue; // filtrar ruido
    if (!porAnio[y]) porAnio[y] = {};
    porAnio[y][catelect] = (porAnio[y][catelect] ?? 0) + n;
    const edad = hoyYear - y;
    sumAgeByCat[catelect] = (sumAgeByCat[catelect] ?? 0) + edad * n;
    countByCat[catelect]  = (countByCat[catelect]  ?? 0) + n;
    const tg = tipo_grupo ?? 'otros';
    if (!sumsPorTipo[tg]) sumsPorTipo[tg] = {};
    if (!sumsPorTipo[tg][catelect]) sumsPorTipo[tg][catelect] = { sum_age: 0, count: 0 };
    sumsPorTipo[tg][catelect].sum_age += edad * n;
    sumsPorTipo[tg][catelect].count   += n;
    if (!porAnioPorTipo[y])     porAnioPorTipo[y]     = {};
    if (!porAnioPorTipo[y][tg]) porAnioPorTipo[y][tg] = {};
    porAnioPorTipo[y][tg][catelect] = (porAnioPorTipo[y][tg][catelect] ?? 0) + n;
  }
  const promedio = {};
  for (const cat of Object.keys(countByCat)) {
    promedio[cat] = countByCat[cat] > 0 ? +(sumAgeByCat[cat] / countByCat[cat]).toFixed(1) : 0;
  }
  const totalAge   = Object.values(sumAgeByCat).reduce((a, b) => a + b, 0);
  const totalCount = Object.values(countByCat).reduce((a, b) => a + b, 0);
  promedio.global = totalCount > 0 ? +(totalAge / totalCount).toFixed(1) : 0;

  // ── Antigüedad agregada por provincia × tipo × cat ─────────────────────
  // Permite calcular promedio de edad filtrado por provincia (y opcionalmente tipo).
  // SQLite hace sum(edad)+count directo por grupo — muy eficiente.
  const edadProvRows = db.prepare(`
    SELECT provincia,
           tipo_grupo,
           catelect,
           SUM(CAST(? AS INTEGER) - CAST(substr(fec_prim_matr, 7, 4) AS INTEGER)) AS sum_age,
           COUNT(*) AS count
    FROM parque
    WHERE periodo = ?
      AND fec_prim_matr IS NOT NULL AND fec_prim_matr != ''
      AND length(fec_prim_matr) >= 10
      AND provincia IS NOT NULL AND provincia != ''
      AND CAST(substr(fec_prim_matr, 7, 4) AS INTEGER) BETWEEN 1950 AND ?
    GROUP BY provincia, tipo_grupo, catelect
  `).all(hoyYear, lastPeriodoKey, hoyYear + 1);

  const sumsPorProvTipo = {};
  for (const { provincia, tipo_grupo, catelect, sum_age, count } of edadProvRows) {
    const prov = provincia;
    const tg = tipo_grupo ?? 'otros';
    if (!sumsPorProvTipo[prov])     sumsPorProvTipo[prov]     = {};
    if (!sumsPorProvTipo[prov][tg]) sumsPorProvTipo[prov][tg] = {};
    sumsPorProvTipo[prov][tg][catelect] = { sum_age, count };
  }

  // ── Pirámide de edad por provincia × tipo: por_anio_por_prov_tipo ───────
  // Permite que la pirámide responda a provincia (combinable con tipo).
  // Acotamos a años recientes (últimos 35) para mantener tamaño razonable.
  const cutoffAge = hoyYear - 35;
  const edadProvAnioRows = db.prepare(`
    SELECT CAST(substr(fec_prim_matr, 7, 4) AS INTEGER) AS anio,
           provincia,
           tipo_grupo,
           catelect,
           COUNT(*) AS n
    FROM parque
    WHERE periodo = ?
      AND fec_prim_matr IS NOT NULL AND fec_prim_matr != ''
      AND length(fec_prim_matr) >= 10
      AND provincia IS NOT NULL AND provincia != ''
      AND CAST(substr(fec_prim_matr, 7, 4) AS INTEGER) BETWEEN ? AND ?
    GROUP BY anio, provincia, tipo_grupo, catelect
  `).all(lastPeriodoKey, cutoffAge, hoyYear + 1);

  const porAnioPorProvTipo = {};
  for (const { anio, provincia, tipo_grupo, catelect, n } of edadProvAnioRows) {
    const y = String(anio);
    const tg = tipo_grupo ?? 'otros';
    if (!porAnioPorProvTipo[y])                    porAnioPorProvTipo[y]                    = {};
    if (!porAnioPorProvTipo[y][provincia])         porAnioPorProvTipo[y][provincia]         = {};
    if (!porAnioPorProvTipo[y][provincia][tg])     porAnioPorProvTipo[y][provincia][tg]     = {};
    porAnioPorProvTipo[y][provincia][tg][catelect] = (porAnioPorProvTipo[y][provincia][tg][catelect] ?? 0) + n;
  }

  const edadParque = {
    periodo: lastReal,
    por_anio: porAnio,
    por_anio_por_tipo: porAnioPorTipo,
    por_anio_por_prov_tipo: porAnioPorProvTipo,
    promedio,
    sums_por_tipo: sumsPorTipo,
    sums_por_provincia_tipo: sumsPorProvTipo,
  };

  const meta = {
    ultimo_periodo:       lastReal,
    ultima_actualizacion: new Date().toISOString().slice(0, 10),
    primer_periodo_real:  firstReal,
    ultimo_periodo_real:  lastReal,
    fuente_real:          'DGT Parque de Vehículos — ZIP mensual microdatos',
    fuente_calculada:     'MATRABA matriculaciones − bajas (solo periodos anteriores al primer snapshot real)',
    snapshots_reales:     realPeriodos,
    total_snapshots:      realPeriodos.length,
  };

  const output = {
    meta,
    resumen,
    resumen_por_tipo: resumenPorTipo,
    edad_parque: edadParque,
    mensual,
  };

  writeFileSync(OUT_JSON, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Escrito: ${OUT_JSON}  (${mensual.length} meses, ${realPeriodos.length} reales)`);

  // ── Archivo TS wrapper ────────────────────────────────────────────────────────
  const ts = `// ─── AUTO-GENERADO ─────────────────────────────────────────────────────────
// Genera: node scripts/dgt-parque-build.mjs
// Fuente real:      DGT Parque de Vehículos (ZIP microdatos mensual, desde ${firstReal})
// Fuente calculada: MATRABA matriculaciones − bajas (periodos anteriores a ${firstReal})
// Última actualización: ${meta.ultima_actualizacion}
// ⚠️  No editar manualmente
// ────────────────────────────────────────────────────────────────────────────
import raw from '../../../data/dgt-parque.json' assert { type: 'json' };

export type ParqueFuente = 'real' | 'calculado';

export type ParqueCatEv = {
  BEV?:           number;
  PHEV?:          number;
  HEV?:           number;
  REEV?:          number;
  FCEV?:          number;
  total?:         number;
  no_enchufable?: number;
};

export type ParqueTipoGrupo = Record<string, ParqueCatEv>;

/** Breakdown por provincia × tipo × cat. Solo se emite para meses reales (snapshot ZIP). */
export type ParqueProvinciaTipo = Record<string, ParqueTipoGrupo>;

/** Distintivo ambiental DGT: "0", "B", "C", "ECO", "CERO", "Sin" (no tiene). */
export type ParqueDistintivo = Record<string, number>;

/** Sub-breakdown por categoría EV dentro de un distintivo (solo BEV/PHEV/NO_EV relevantes). */
export type ParqueDistintivoCats = { BEV?: number; PHEV?: number; NO_EV?: number };

/**
 * Breakdown DISTINTIVO × PROVINCIA × TIPO × [BEV/PHEV/NO_EV]. Solo en el último mes real.
 * Estructura: breakdown[codProvINE][tipo_grupo][distintivo] = { BEV, PHEV, NO_EV }
 */
export type ParqueDistintivoBreakdown = Record<string, Record<string, Record<string, ParqueDistintivoCats>>>;

/** Breakdown por municipio × tipo × cat. Solo se emite en el último mes real. */
export type ParqueMunicipio = Record<string, { prov: string; tipos: ParqueTipoGrupo }>;

export type ParqueMes = {
  periodo:                      string;
  fuente:                       ParqueFuente;
  matriculaciones_mes:          ParqueCatEv;
  bajas_mes:                    ParqueCatEv;
  total_bajas_mes:              number;
  parque_acumulado:             ParqueCatEv;
  parque_total:                 number;
  parque_no_enchufable:         number;
  parque_por_tipo?:             ParqueTipoGrupo;
  parque_por_provincia_tipo?:   ParqueProvinciaTipo;
  parque_por_municipio?:        ParqueMunicipio;
  parque_distintivo?:           ParqueDistintivo;
  parque_distintivo_breakdown?: ParqueDistintivoBreakdown;
};

export type ParqueResumenCat = {
  matriculadas:  number;
  bajas:         number;
  parque_activo: number;
  tasa_baja_pct: number;
};

/** Distribución del parque por año de matriculación (último snapshot). */
export type ParqueEdad = {
  periodo:       string;
  por_anio:      Record<string, Record<string, number>>;   // { "2020": { BEV:1234, NO_EV:... }, ... }
  /** Breakdown por año × tipo_grupo × catelect — permite pirámide filtrada por tipo. */
  por_anio_por_tipo?: Record<string, Record<string, Record<string, number>>>;
  /** Breakdown por año × provincia × tipo × catelect — permite pirámide filtrada por provincia (acotado a últimos 35 años). */
  por_anio_por_prov_tipo?: Record<string, Record<string, Record<string, Record<string, number>>>>;
  promedio:      Record<string, number>;                    // { BEV:3.2, PHEV:4.1, NO_EV:14.1, global:12.8 }
  sums_por_tipo: Record<string, Record<string, { sum_age: number; count: number }>>; // [tipo_grupo][catelect]
  /** Sumas de edad por provincia × tipo_grupo × catelect — permite antigüedad filtrada por provincia. */
  sums_por_provincia_tipo?: Record<string, Record<string, Record<string, { sum_age: number; count: number }>>>;
};

export const dgtParqueMeta             = raw.meta             as typeof raw.meta;
export const dgtParqueResumen          = raw.resumen          as Record<string, ParqueResumenCat>;
export const dgtParqueResumenPorTipo   = raw.resumen_por_tipo as Record<string, any>;
export const dgtParqueEdad             = raw.edad_parque      as ParqueEdad;
export const dgtParqueMensual          = raw.mensual          as ParqueMes[];
`;
  writeFileSync(OUT_TS, ts, 'utf8');
  console.log(`✅ Escrito: ${OUT_TS}`);

  db.close();
}

main();
