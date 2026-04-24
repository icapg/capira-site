/**
 * dgt-modelo-imputar.mjs
 *
 * Imputa el modelo probable de vehículos con modelo='¡' (basura DGT) a partir de
 * la distribución empírica de modelos conocidos con el mismo perfil técnico
 * dentro de la misma marca.
 *
 * Perfil técnico = (tipo_grupo, propulsion, decada, mma_bucket, carroceria).
 *
 * Salida: data/dgt-modelo-imputacion.json
 *   {
 *     meta: { ... },
 *     marcas: {
 *       "renault": {
 *         total_sin_clasificar: 562397,
 *         residual_no_matcheable: <n>,
 *         por_tipo: {
 *           turismo: {
 *             total: 363493,
 *             imputacion: [
 *               { modelo: "MEGANE", pct: 0.42, count_estimado: 152667 },
 *               ...
 *             ]
 *           }
 *         }
 *       }
 *     }
 *   }
 *
 * El build de marca-perfil consume este JSON y lo pega en cada perfil.marca como
 * `imputacion_sin_clasificar`. El dashboard usa este dato solo en el tooltip del
 * treemap al hacer hover sobre "— otros —" — nunca suma los counts imputados al
 * parque real.
 *
 * Uso: node scripts/dgt-modelo-imputar.mjs
 */

import Database from 'better-sqlite3';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, '..');
const DB_FILE     = join(ROOT, 'data', 'dgt-matriculaciones.db');
const INDEX_FILE  = join(ROOT, 'data', 'dgt-marca-perfil-index.json');
const MODELO_ALIAS_FILE = join(ROOT, 'data', 'dgt-modelo-aliases.json');
const OUT_FILE    = join(ROOT, 'data', 'dgt-modelo-imputacion.json');

const MIN_SIN_CLASIFICAR = 100; // marcas con menos de esto: no vale la pena
const TOP_N_IMPUTADOS    = 10;  // top N modelos a exportar por tipo

// ── Normalización de modelos (misma lógica que el build principal) ──────────
const modeloAliases = JSON.parse(readFileSync(MODELO_ALIAS_FILE, 'utf8'));
const MODELO_STRIP_PREFIJOS = (modeloAliases.strip_prefijos ?? []).map((re) => new RegExp(re));
const MODELO_STRIP_SUFIJOS  = (modeloAliases.strip_sufijos  ?? []).map((re) => new RegExp(re));
const MODELO_ALIASES_POR_MARCA = modeloAliases.aliases_por_marca ?? {};
const MODELO_ALIASES_GLOBAL    = modeloAliases.aliases_global ?? {};

function normalizarModelo(raw, marcaCanon) {
  let s = String(raw ?? '').trim().toUpperCase();
  if (!s || !/[A-Z0-9]/.test(s)) return null;
  for (const re of MODELO_STRIP_PREFIJOS) s = s.replace(re, '');
  let prev;
  do {
    prev = s;
    for (const re of MODELO_STRIP_SUFIJOS) s = s.replace(re, '').trim();
  } while (s !== prev);
  if (!s) return null;
  const porMarca = MODELO_ALIASES_POR_MARCA[marcaCanon];
  if (porMarca && porMarca[s]) return porMarca[s];
  if (MODELO_ALIASES_GLOBAL[s]) return MODELO_ALIASES_GLOBAL[s];
  return s;
}

// ── Buckets ──────────────────────────────────────────────────────────────────
function decadaDe(fecPrimMatr) {
  if (!fecPrimMatr) return 'unk';
  // Formato DGT: "DD/MM/YYYY". Año = chars 6..10.
  const año = parseInt(fecPrimMatr.slice(6, 10), 10);
  if (!año || año < 1900 || año > 2100) return 'unk';
  // Placeholder DGT "01/01/1902" para "fecha desconocida"
  if (año === 1902 || año === 1900) return 'unk';
  return `${Math.floor(año / 10) * 10}s`;
}

function mmaBucketDe(mma) {
  if (mma == null || mma === 0) return 'unk';
  if (mma < 1200) return '<1200';
  if (mma < 1500) return '1200-1500';
  if (mma < 1800) return '1500-1800';
  if (mma < 2200) return '1800-2200';
  return '>2200';
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📂 Abriendo DB:', DB_FILE);
  const db = new Database(DB_FILE, { readonly: true });

  const idx = JSON.parse(readFileSync(INDEX_FILE, 'utf8'));
  const marcas = idx.marcas;
  console.log(`📋 ${marcas.length} marcas en el index`);

  // Para cada marca, buscamos:
  //   1) Distribución de modelos CONOCIDOS por perfil técnico
  //   2) Conteo de SIN CLASIFICAR (modelo='¡') por perfil técnico
  // Y combinamos para imputar.

  const stmt = db.prepare(`
    SELECT tipo_grupo, propulsion, fec_prim_matr, mma, carroceria, modelo, COUNT(*) AS n
    FROM parque
    WHERE marca = ?
      AND marca != ''
    GROUP BY tipo_grupo, propulsion, fec_prim_matr, mma, carroceria, modelo
  `);

  const out = {
    meta: {
      generado_en: new Date().toISOString().slice(0, 10),
      fuente: 'parque (último snapshot)',
      metodologia: 'Para cada vehículo con modelo=¡, se asigna la distribución de modelos conocidos de la misma marca con perfil técnico idéntico (tipo_grupo, propulsion, decada primera matric, mma_bucket, carroceria). Si no hay match exacto, entra en residual_no_matcheable. confianza_top1/top3 = accuracy esperada de predecir el modelo más frecuente (analítica, ponderada por vehículos), asumiendo que los \'¡\' siguen la misma distribución de modelos que los conocidos en el perfil.',
      perfil_tecnico: ['tipo_grupo', 'propulsion', 'decada', 'mma_bucket', 'carroceria'],
      mma_buckets: ['<1200', '1200-1500', '1500-1800', '1800-2200', '>2200', 'unk'],
      min_sin_clasificar: MIN_SIN_CLASIFICAR,
      top_n_imputados: TOP_N_IMPUTADOS,
    },
    marcas: {},
  };

  let procesadas = 0;
  let conImputacion = 0;

  for (const m of marcas) {
    procesadas++;
    if (procesadas % 100 === 0) console.log(`  ${procesadas}/${marcas.length}...`);

    const rows = stmt.all(m.marca);
    if (rows.length === 0) continue;

    // Agrupar por perfil técnico.
    // conocidos: Map<perfilKey, Map<modeloNorm, count>>
    // basura:    Map<perfilKey, count>
    const conocidos = new Map();
    const basura = new Map();

    for (const r of rows) {
      const key = [
        r.tipo_grupo ?? 'otros',
        r.propulsion ?? '',
        decadaDe(r.fec_prim_matr),
        mmaBucketDe(r.mma),
        r.carroceria ?? '',
      ].join('|');

      if (r.modelo === '¡') {
        basura.set(key, (basura.get(key) ?? 0) + r.n);
      } else {
        const modelo = normalizarModelo(r.modelo, m.marca);
        if (!modelo) continue;
        let inner = conocidos.get(key);
        if (!inner) { inner = new Map(); conocidos.set(key, inner); }
        inner.set(modelo, (inner.get(modelo) ?? 0) + r.n);
      }
    }

    let totalSinClasificar = 0;
    for (const n of basura.values()) totalSinClasificar += n;

    if (totalSinClasificar < MIN_SIN_CLASIFICAR) continue; // no vale la pena

    // Imputar + medir accuracy esperada (analítica, sin holdout).
    // Por cada perfil técnico con vehículos conocidos, la accuracy esperada de
    // "predecir el modelo más frecuente" para un vehículo aleatorio de ese perfil
    // es simplemente la concentración del dominante: max(counts) / total.
    // El top-3 es análogo. El promedio ponderado por n_basura sobre todos los
    // perfiles da una métrica de confianza por marca × tipo, asumiendo que los
    // vehículos con modelo='¡' siguen la misma distribución que los conocidos
    // (hipótesis no verificable sin ground truth).
    const porTipo = new Map();
    // Por tipo: acumuladores para confianza.
    //   sum_top1 = Σ (n_basura × max_share_perfil)
    //   sum_top3 = Σ (n_basura × top3_share_perfil)
    //   sum_weight = Σ n_basura (solo basura con match en conocidos)
    const confianzaAcc = new Map();
    let residual = 0;

    for (const [key, nBasura] of basura) {
      const tipo = key.split('|')[0];
      const inner = conocidos.get(key);
      if (!inner || inner.size === 0) {
        residual += nBasura;
        continue;
      }
      let totalConocidos = 0;
      for (const v of inner.values()) totalConocidos += v;

      // Top-1 y top-3 shares de este perfil.
      const counts = [...inner.values()].sort((a, b) => b - a);
      const top1Share = counts[0] / totalConocidos;
      const top3Sum = counts.slice(0, 3).reduce((a, b) => a + b, 0);
      const top3Share = top3Sum / totalConocidos;

      let acc = confianzaAcc.get(tipo);
      if (!acc) { acc = { sum_top1: 0, sum_top3: 0, sum_weight: 0 }; confianzaAcc.set(tipo, acc); }
      acc.sum_top1 += nBasura * top1Share;
      acc.sum_top3 += nBasura * top3Share;
      acc.sum_weight += nBasura;

      let tipoMap = porTipo.get(tipo);
      if (!tipoMap) { tipoMap = new Map(); porTipo.set(tipo, tipoMap); }
      for (const [modelo, cnt] of inner) {
        const prob = cnt / totalConocidos;
        const imputado = nBasura * prob;
        tipoMap.set(modelo, (tipoMap.get(modelo) ?? 0) + imputado);
      }
    }

    const porTipoOut = {};
    for (const [tipo, tipoMap] of porTipo) {
      let totalTipo = 0;
      for (const v of tipoMap.values()) totalTipo += v;
      const ranking = [...tipoMap.entries()]
        .map(([modelo, cnt]) => ({
          modelo,
          count_estimado: Math.round(cnt),
          pct: +(cnt / totalTipo).toFixed(4),
        }))
        .sort((a, b) => b.count_estimado - a.count_estimado)
        .slice(0, TOP_N_IMPUTADOS);
      const acc = confianzaAcc.get(tipo);
      porTipoOut[tipo] = {
        total: Math.round(totalTipo),
        imputacion: ranking,
        confianza_top1: acc ? +(acc.sum_top1 / acc.sum_weight).toFixed(3) : null,
        confianza_top3: acc ? +(acc.sum_top3 / acc.sum_weight).toFixed(3) : null,
      };
    }

    out.marcas[m.slug] = {
      marca: m.marca,
      total_sin_clasificar: totalSinClasificar,
      residual_no_matcheable: residual,
      cobertura: totalSinClasificar > 0 ? +((totalSinClasificar - residual) / totalSinClasificar).toFixed(3) : 0,
      por_tipo: porTipoOut,
    };
    conImputacion++;
  }

  writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log(`✅ Imputación escrita: ${OUT_FILE}`);
  console.log(`   ${conImputacion} marcas con imputación (${marcas.length - conImputacion} sin suficientes sin_clasificar)`);

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
