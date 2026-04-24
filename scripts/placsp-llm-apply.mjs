/**
 * placsp-llm-apply.mjs
 *
 * Aplica a la DB un JSON de extracción producido por Claude (en esta sesión o
 * en otra). Esto reemplaza a placsp-llm-analyze.mjs cuando NO queremos pagar
 * llamadas explícitas al API (Max/Pro cubre sesiones conversacionales, no API).
 *
 * Flujo esperado:
 *   1. node scripts/placsp-extract-pdfs.mjs --slug=<N>      (descarga PDFs)
 *   2. [Claude en sesión] lee los PDFs en data/placsp-pdfs/<N>/ y produce el
 *      JSON con la estructura de placsp-llm-analyze.mjs, guardándolo en
 *      data/placsp-pdfs/<N>/extraccion.json
 *   3. node scripts/placsp-llm-apply.mjs --slug=<N>          (esto escribe la DB)
 *
 * Usage:
 *   node scripts/placsp-llm-apply.mjs --slug=19140288
 *   node scripts/placsp-llm-apply.mjs --slug=19140288 --file=ruta/extraccion.json
 *   node scripts/placsp-llm-apply.mjs --slug=19140288 --modelo='claude-opus-4-7 (sesión)'
 */

import fs   from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const DB_FILE   = path.join(ROOT, 'data', 'licitaciones.db');
const PDF_DIR   = path.join(ROOT, 'data', 'placsp-pdfs');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

if (!args.slug) { console.error('Falta --slug=<num>'); process.exit(1); }

const db = new Database(DB_FILE);
const row = db.prepare(`SELECT * FROM licitaciones WHERE id LIKE ?`).get(`%/${args.slug}`);
if (!row) { console.error('Licitación no encontrada'); process.exit(1); }

const slug = row.id.split('/').pop();
const jsonPath = args.file ?? path.join(PDF_DIR, slug, 'extraccion.json');
if (!fs.existsSync(jsonPath)) { console.error(`No existe ${jsonPath}`); process.exit(1); }

const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const MODEL  = args.modelo ?? parsed._modelo ?? 'claude-session';
const now    = new Date().toISOString();
const isConcesion = row.categoria_emov === '1';

console.log(`📝 Aplicando extracción a ${slug} (${row.expediente ?? ''})`);
if (parsed.notas_pliego?.length)       console.log(`   📘 ${parsed.notas_pliego.length} notas de pliego`);
if (parsed.notas_adjudicacion?.length) console.log(`   🏆 ${parsed.notas_adjudicacion.length} notas de adjudicación`);
if (parsed.warnings?.length)           console.log(`   ⚠ ${parsed.warnings.length} warnings (legacy — re-clasificar como notas_pliego/notas_adjudicacion)`);

// ─── UPDATE licitaciones ─────────────────────────────────────────────────
const updateCols = [];
const updateVals = [];
const set = (col, v) => { if (v !== undefined) { updateCols.push(`${col} = ?`); updateVals.push(v); } };

if (parsed.criterios_valoracion) set('criterios_valoracion', JSON.stringify(parsed.criterios_valoracion));
set('peso_criterios_economicos',  parsed.peso_criterios_economicos ?? null);
set('peso_criterios_tecnicos',    parsed.peso_criterios_tecnicos ?? null);
set('peso_construccion_tiempo',   parsed.peso_construccion_tiempo ?? null);
set('peso_proyecto_tecnico',      parsed.peso_proyecto_tecnico ?? null);
set('peso_mas_hw_potencia',       parsed.peso_mas_hw_potencia ?? null);
set('peso_mas_ubicaciones',       parsed.peso_mas_ubicaciones ?? null);
set('peso_otros',                 parsed.peso_otros ?? null);
set('peso_canon_fijo',            parsed.peso_canon_fijo ?? null);
set('peso_canon_variable',        parsed.peso_canon_variable ?? null);
if (parsed.mejoras_puntuables) set('mejoras_puntuables', JSON.stringify(parsed.mejoras_puntuables));
set('tipo_adjudicacion',          parsed.tipo_adjudicacion ?? null);
set('idioma_pliego',              parsed.idioma_pliego ?? null);

if (isConcesion) {
  set('fecha_inicio_concesion',    parsed.fecha_inicio_concesion ?? null);
  set('tipo_inicio_concesion',     parsed.tipo_inicio_concesion ?? null);
  set('plazo_construccion_meses',  parsed.plazo_construccion_meses ?? null);
  set('potencia_disponible_kw',    parsed.potencia_disponible_kw ?? null);
  set('potencia_disponible_garantizada', parsed.potencia_disponible_garantizada == null ? null : (parsed.potencia_disponible_garantizada ? 1 : 0));
  set('tecnologia_requerida',      parsed.tecnologia_requerida ?? null);
  set('num_cargadores_minimo',     parsed.num_cargadores_minimo ?? null);
  set('num_cargadores_opcional_extra', parsed.num_cargadores_opcional_extra == null ? null : (parsed.num_cargadores_opcional_extra ? 1 : 0));
  set('potencia_minima_por_cargador_kw', parsed.potencia_minima_por_cargador_kw ?? null);
  set('potencia_opcional_subible', parsed.potencia_opcional_subible == null ? null : (parsed.potencia_opcional_subible ? 1 : 0));
  set('plazo_concesion_anos',      parsed.plazo_concesion_anos ?? null);
  set('renovacion_anos',           parsed.renovacion_anos ?? null);
  set('tipo_retribucion',          parsed.tipo_retribucion ?? null);
  set('canon_minimo_anual',           parsed.canon_minimo_anual ?? null);
  set('canon_anual_ofertado_ganador', parsed.canon_ganador ?? null);
  set('canon_por_cargador_ofertado',  parsed.canon_por_cargador ?? null);
  set('canon_por_ubicacion_anual',    parsed.canon_por_ubicacion_anual ?? null);
  set('canon_variable_pct',        parsed.canon_variable_pct ?? null);
  set('canon_variable_eur_kwh',    parsed.canon_variable_eur_kwh ?? null);
  set('canon_mix_fijo_anual',      parsed.canon_mix_fijo_anual ?? null);
  set('canon_mix_var_pct',         parsed.canon_mix_var_pct ?? null);
  set('canon_mix_var_eur_kwh',     parsed.canon_mix_var_eur_kwh ?? null);
  set('canon_mix_fijo_por_cargador', parsed.canon_mix_fijo_por_cargador ?? null);
}

// Garantías
if (parsed.garantias) {
  set('garantia_provisional_eur',     parsed.garantias.provisional_eur ?? null);
  set('garantia_provisional_pct',     parsed.garantias.provisional_pct ?? null);
  set('garantia_provisional_exigida', parsed.garantias.provisional_exigida == null ? null : (parsed.garantias.provisional_exigida ? 1 : 0));
  set('garantia_definitiva_eur',      parsed.garantias.definitiva_eur ?? null);
  set('garantia_definitiva_pct',      parsed.garantias.definitiva_pct ?? null);
  set('garantia_definitiva_base',     parsed.garantias.definitiva_base ?? null);
}

// Requisitos must-have
if (parsed.requisitos) {
  set('requisitos_solvencia_economica', parsed.requisitos.solvencia_economica ? JSON.stringify(parsed.requisitos.solvencia_economica) : null);
  set('requisitos_solvencia_tecnica',   parsed.requisitos.solvencia_tecnica   ? JSON.stringify(parsed.requisitos.solvencia_tecnica)   : null);
  set('requisitos_adicionales',         parsed.requisitos.adicionales         ? JSON.stringify(parsed.requisitos.adicionales)         : null);
}

set('extraccion_llm_fecha',   now);
set('extraccion_llm_modelo',  MODEL);
// Nuevas columnas separadas. Si sólo viene "warnings" legacy, lo guardamos
// en notas_pliego como fallback (no perder el contenido).
const notasPliego       = parsed.notas_pliego       ?? (parsed.warnings ?? null);
const notasAdjudicacion = parsed.notas_adjudicacion ?? null;
set('extraccion_llm_notas_pliego',       notasPliego       ? JSON.stringify(notasPliego)       : null);
set('extraccion_llm_notas_adjudicacion', notasAdjudicacion ? JSON.stringify(notasAdjudicacion) : null);
// Legacy: mantener warnings plano para compatibilidad hacia atrás del builder.
set('extraccion_llm_warnings', parsed.warnings ? JSON.stringify(parsed.warnings) : null);

if (updateCols.length) {
  updateVals.push(row.id);
  db.prepare(`UPDATE licitaciones SET ${updateCols.join(', ')} WHERE id = ?`).run(...updateVals);
  console.log(`   ✔ ${updateCols.length} campos en licitaciones`);
}

// ─── Ubicaciones ─────────────────────────────────────────────────────────
if (isConcesion && Array.isArray(parsed.ubicaciones) && parsed.ubicaciones.length > 0) {
  db.prepare(`DELETE FROM ubicaciones_concesion WHERE licitacion_id = ?`).run(row.id);
  const ins = db.prepare(`
    INSERT INTO ubicaciones_concesion
      (licitacion_id, nombre, direccion, municipio, latitud, longitud,
       plazas, num_cargadores_ac, num_cargadores_dc, num_cargadores_dc_plus, num_cargadores_hpc, num_cargadores_total,
       potencia_total_kw, potencia_por_cargador_kw, tipo_hw, plazo_pem_meses, google_maps_url, notas, es_opcional, extraccion_llm_fecha)
    VALUES (@licitacion_id,@nombre,@direccion,@municipio,@latitud,@longitud,
            @plazas,@num_cargadores_ac,@num_cargadores_dc,@num_cargadores_dc_plus,@num_cargadores_hpc,@num_cargadores_total,
            @potencia_total_kw,@potencia_por_cargador_kw,@tipo_hw,@plazo_pem_meses,@google_maps_url,@notas,@es_opcional,@extraccion_llm_fecha)
  `);
  for (const u of parsed.ubicaciones) {
    ins.run({
      licitacion_id: row.id,
      nombre:    u.nombre ?? null,
      direccion: u.direccion ?? null,
      municipio: u.municipio ?? null,
      latitud:   u.latitud ?? null,
      longitud:  u.longitud ?? null,
      plazas:    u.plazas ?? null,
      num_cargadores_ac:      u.num_cargadores_ac ?? null,
      num_cargadores_dc:      u.num_cargadores_dc ?? null,
      num_cargadores_dc_plus: u.num_cargadores_dc_plus ?? null,
      num_cargadores_hpc:     u.num_cargadores_hpc ?? null,
      num_cargadores_total:   u.num_cargadores_total ?? null,
      potencia_total_kw:        u.potencia_total_kw ?? null,
      potencia_por_cargador_kw: u.potencia_por_cargador_kw ?? null,
      tipo_hw:         u.tipo_hw ?? null,
      plazo_pem_meses: u.plazo_pem_meses ?? null,
      google_maps_url: u.google_maps_url ?? null,
      notas:           u.notas ?? null,
      es_opcional:     u.es_opcional ? 1 : 0,
      extraccion_llm_fecha: now,
    });
  }
  console.log(`   ✔ ${parsed.ubicaciones.length} ubicaciones`);
}

// ─── Licitadores ─────────────────────────────────────────────────────────
if (Array.isArray(parsed.licitadores) && parsed.licitadores.length > 0) {
  db.prepare(`DELETE FROM licitadores WHERE licitacion_id = ?`).run(row.id);
  const insL = db.prepare(`
    INSERT INTO licitadores
      (licitacion_id, empresa_nif, empresa_nombre, rol, es_ute, miembros_ute,
       oferta_economica, oferta_canon_anual, oferta_canon_por_cargador,
       oferta_canon_variable_eur_kwh, oferta_canon_variable_pct, oferta_descuento_residentes_pct,
       inversion_comprometida,
       puntuacion_economica, puntuacion_tecnica, puntuacion_total, puntuaciones_detalle,
       rank_position, motivo_exclusion, mejoras_ofertadas)
    VALUES (@lid,@nif,@nombre,@rol,@ute,@miembros,
            @oe,@oca,@ocp,@ocv,@ocvp,@odr,
            @inv,@pe,@pt,@pto,@pd,@rank,@mx,@mj)
  `);
  for (const l of parsed.licitadores) {
    insL.run({
      lid: row.id,
      nif: l.nif ?? null,
      nombre: l.nombre,
      rol: l.rol ?? 'participante',
      ute: l.es_ute ? 1 : 0,
      miembros: l.miembros_ute ? JSON.stringify(l.miembros_ute) : null,
      oe: l.oferta_economica ?? null,
      oca: l.oferta_canon_anual ?? null,
      ocp: l.oferta_canon_por_cargador ?? null,
      ocv: l.oferta_canon_variable_eur_kwh ?? null,
      ocvp: l.oferta_canon_variable_pct ?? null,
      odr: l.oferta_descuento_residentes_pct ?? null,
      inv: l.inversion_comprometida ?? null,
      pe: l.puntuacion_economica ?? null,
      pt: l.puntuacion_tecnica ?? null,
      pto: l.puntuacion_total ?? null,
      pd: l.puntuaciones_detalle ? JSON.stringify(l.puntuaciones_detalle) : null,
      rank: l.rank_position ?? null,
      mx: l.motivo_exclusion ?? null,
      mj: l.mejoras_ofertadas ? JSON.stringify(l.mejoras_ofertadas) : null,
    });
  }
  console.log(`   ✔ ${parsed.licitadores.length} licitadores`);
}

console.log(`\n🎉 Aplicado. Ahora: node scripts/placsp-build-json.mjs`);
db.close();
