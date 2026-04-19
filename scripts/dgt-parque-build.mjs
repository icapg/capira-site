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

  // Mapa periodo → { total, por CATELECT, por tipo }
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
    realParque.set(iso, { total, porCat, tipoBreakdown });
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
  const TIPOS_PARQUE = ['turismo','suv_todo_terreno','furgoneta_van','moto','camion','autobus','especial','quad_atv','agricola','otros'];

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
        const v = Math.max(0, curr - (matT[cat] ?? 0) + (bajaT[cat] ?? 0));
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

export type ParqueMes = {
  periodo:              string;
  fuente:               ParqueFuente;
  matriculaciones_mes:  ParqueCatEv;
  bajas_mes:            ParqueCatEv;
  total_bajas_mes:      number;
  parque_acumulado:     ParqueCatEv;
  parque_total:         number;
  parque_no_enchufable: number;
  parque_por_tipo?:     ParqueTipoGrupo;
};

export type ParqueResumenCat = {
  matriculadas:  number;
  bajas:         number;
  parque_activo: number;
  tasa_baja_pct: number;
};

export const dgtParqueMeta             = raw.meta             as typeof raw.meta;
export const dgtParqueResumen          = raw.resumen          as Record<string, ParqueResumenCat>;
export const dgtParqueResumenPorTipo   = raw.resumen_por_tipo as Record<string, any>;
export const dgtParqueMensual          = raw.mensual          as ParqueMes[];
`;
  writeFileSync(OUT_TS, ts, 'utf8');
  console.log(`✅ Escrito: ${OUT_TS}`);

  db.close();
}

main();
