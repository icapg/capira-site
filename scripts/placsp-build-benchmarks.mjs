/**
 * PLACSP benchmarks builder
 *
 * Regenera la tabla `benchmarks_cpo` (vista materializada) calculando percentiles
 * del canon anual por cargador desde `licitaciones` + `licitadores` (rol=adjudicataria),
 * agrupado por bucket (segmento_hw × tamano_municipio × provincia × anio × tipo_retribucion).
 *
 * Fuente del dato: lo que efectivamente pagó el mercado (no benchmarks externos).
 *
 * Prerequisito: tabla licitaciones con campos enriquecidos por:
 *   - placsp-classify.mjs (categoria_emov=1, tiene_infra_recarga=1)
 *   - placsp-enrich-municipios.mjs (tamano_municipio)
 *   - placsp-parse-pliegos (fase 2, canon_anual_ofertado_ganador, num_cargadores_*)
 *
 * Mientras canon_* sean NULL masivamente, la tabla va a estar casi vacía — es lo esperado.
 * Re-ejecutar cuando se pueblen canones desde pliegos/AEDIVE seed.
 *
 * Usage:
 *   node scripts/placsp-build-benchmarks.mjs
 */

import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = path.join(__dirname, '..', 'data', 'licitaciones.db');

const db = new Database(DB_FILE);

// ─── SELECT adjudicadas con canon conocido, cat=1 (concesiones) ─────────
const rows = db.prepare(`
  SELECT
    l.id,
    l.provincia_nombre            AS provincia,
    l.quality_score_ubicacion     AS tamano_municipio,
    l.tipo_retribucion,
    l.plazo_concesion_anos,
    l.canon_anual_ofertado_ganador AS canon_anual,
    l.num_cargadores_ac,
    l.num_cargadores_dc,
    l.num_cargadores_dc_plus,
    l.num_cargadores_hpc,
    l.num_cargadores_total,
    strftime('%Y', l.fecha_adjudicacion) AS anio
  FROM licitaciones l
  WHERE l.categoria_emov = '1'
    AND l.estado_actual IN ('ADJ','RES')
    AND l.canon_anual_ofertado_ganador IS NOT NULL
    AND l.num_cargadores_total > 0
`).all();

console.log(`Rows for benchmark: ${rows.length}`);
if (!rows.length) {
  console.log('No adjudicated concessions with canon data yet. Populate canon_anual_ofertado_ganador first.');
  process.exit(0);
}

// ─── expandir a observaciones por segmento_hw ──────────────────────────
const observations = [];
for (const r of rows) {
  const segments = [
    { seg: 'AC',   n: r.num_cargadores_ac ?? 0 },
    { seg: 'DC',   n: r.num_cargadores_dc ?? 0 },
    { seg: 'DC+',  n: r.num_cargadores_dc_plus ?? 0 },
    { seg: 'HPC',  n: r.num_cargadores_hpc ?? 0 },
  ];
  const activeSegments = segments.filter((s) => s.n > 0);
  // Atribución proporcional del canon por tipo de cargador
  for (const s of activeSegments) {
    const share = s.n / r.num_cargadores_total;
    const canonAnualSegmento = r.canon_anual * share;
    observations.push({
      segmento_hw: s.seg,
      tamano_municipio: r.tamano_municipio,
      provincia: r.provincia,
      anio: r.anio ? Number(r.anio) : null,
      tipo_retribucion: r.tipo_retribucion,
      plazo_bucket: bucketPlazo(r.plazo_concesion_anos),
      canon_por_cargador: canonAnualSegmento / s.n,
      canon_anual_total: r.canon_anual,
      n_cargadores: r.num_cargadores_total,
    });
  }
}

function bucketPlazo(p) {
  if (p == null) return null;
  if (p <= 5)    return '5';
  if (p <= 10)   return '10';
  if (p <= 15)   return '15';
  return '20+';
}

function percentile(arr, p) {
  const s = [...arr].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

// ─── Agrupar por bucket ────────────────────────────────────────────────
const buckets = new Map();
for (const o of observations) {
  const key = JSON.stringify([o.segmento_hw, o.tamano_municipio, o.provincia, o.anio, o.tipo_retribucion, o.plazo_bucket]);
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key).push(o);
}

// ─── Limpiar tabla y repoblar ──────────────────────────────────────────
db.prepare(`DELETE FROM benchmarks_cpo`).run();

const ins = db.prepare(`
  INSERT INTO benchmarks_cpo (
    segmento_hw, tamano_municipio, provincia, anio_adjudicacion,
    tipo_retribucion, plazo_concesion_bucket, n_concesiones,
    canon_anual_por_cargador_min, canon_anual_por_cargador_p25,
    canon_anual_por_cargador_p50, canon_anual_por_cargador_p75,
    canon_anual_por_cargador_p90, canon_anual_por_cargador_max,
    canon_anual_total_min, canon_anual_total_p50, canon_anual_total_max,
    num_cargadores_medio, regenerated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const tx = db.transaction(() => {
  for (const [key, obs] of buckets) {
    const [seg, tam, prov, anio, tipoRet, plazoBucket] = JSON.parse(key);
    const canonesCargador = obs.map((o) => o.canon_por_cargador).filter(Number.isFinite);
    const canonesTotales  = obs.map((o) => o.canon_anual_total).filter(Number.isFinite);
    const n_cargs = obs.map((o) => o.n_cargadores).filter(Number.isFinite);
    if (!canonesCargador.length) continue;
    ins.run(
      seg, tam, prov, anio, tipoRet, plazoBucket, obs.length,
      Math.min(...canonesCargador),
      percentile(canonesCargador, 0.25),
      percentile(canonesCargador, 0.50),
      percentile(canonesCargador, 0.75),
      percentile(canonesCargador, 0.90),
      Math.max(...canonesCargador),
      Math.min(...canonesTotales),
      percentile(canonesTotales, 0.50),
      Math.max(...canonesTotales),
      n_cargs.reduce((a, b) => a + b, 0) / n_cargs.length,
    );
  }
});
tx();

const total = db.prepare(`SELECT COUNT(*) AS n FROM benchmarks_cpo`).get().n;
console.log(`Buckets written: ${total}`);
