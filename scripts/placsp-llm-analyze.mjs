/**
 * placsp-llm-analyze.mjs  —  ⚠️  USA API DE PAGO
 *
 * Llama a la API de Anthropic con `ANTHROPIC_API_KEY` → consume saldo.
 * Usar SOLO cuando no hay una sesión Claude Code activa (batches grandes en
 * background, cron, CI). Durante una sesión, usar el flow gratuito:
 *     1. node scripts/placsp-extract-pdfs.mjs --slug=<N>
 *     2. [Claude lee los PDFs y escribe extraccion.json en la carpeta]
 *     3. node scripts/placsp-llm-validate.mjs --slug=<N>
 *     4. node scripts/placsp-llm-apply.mjs    --slug=<N>
 *
 * Schema canónico (compartido con validate y apply): placsp-llm-schema.mjs.
 * Spec completa: ~/.claude/.../memory/reference_placsp_extraction_spec_v2.md.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/placsp-llm-analyze.mjs --slug=19140288
 *   node scripts/placsp-llm-analyze.mjs --slug=19140288 --dry-run
 *   node scripts/placsp-llm-analyze.mjs --slug=19140288 --model=claude-opus-4-7
 *   node scripts/placsp-llm-analyze.mjs --slug=19140288 --save-only   (no escribe DB; deja extraccion.json para validate+apply)
 */

import fs   from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { buildSystemPrompt, buildUserPrompt, SCHEMA_VERSION } from './placsp-llm-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const DB_FILE   = path.join(ROOT, 'data', 'licitaciones.db');
const PDF_DIR   = path.join(ROOT, 'data', 'placsp-pdfs');

const DEFAULT_MODEL = 'claude-sonnet-4-6';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

if (!args.slug) { console.error('Falta --slug=<num>'); process.exit(1); }
const DRY       = !!args['dry-run'];
const SAVE_ONLY = !!args['save-only'];
const MODEL     = args.model ?? DEFAULT_MODEL;
const API_KEY   = process.env.ANTHROPIC_API_KEY;
if (!API_KEY && !DRY) {
  console.error('Falta ANTHROPIC_API_KEY en env. Usá --dry-run para ver el prompt sin llamar al API.');
  process.exit(1);
}

const db = new Database(DB_FILE);
const row = db.prepare(`SELECT * FROM licitaciones WHERE id LIKE ?`).get(`%/${args.slug}`);
if (!row) { console.error('Licitación no encontrada'); process.exit(1); }
const slug = row.id.split('/').pop();
const dir  = path.join(PDF_DIR, slug);
if (!fs.existsSync(dir)) { console.error(`Directorio de PDFs no existe: ${dir}`); process.exit(1); }

const pdfFiles = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf')).sort();
if (pdfFiles.length === 0) { console.error(`Sin PDFs en ${dir}`); process.exit(1); }
console.log(`📁 ${pdfFiles.length} PDFs en ${dir}`);

const isConcesion   = row.categoria_emov === '1';
const SYSTEM_PROMPT = buildSystemPrompt(row, isConcesion);
const USER_PROMPT   = buildUserPrompt(isConcesion);

if (DRY) {
  console.log(`schema ${SCHEMA_VERSION}`);
  console.log('─── SYSTEM ───');
  console.log(SYSTEM_PROMPT);
  console.log('─── USER ───');
  console.log(USER_PROMPT);
  console.log(`\n--dry-run: no se llama al API. ${pdfFiles.length} PDFs se adjuntarían.`);
  process.exit(0);
}

// ─── Llamada al API ──────────────────────────────────────────────────────
const documentBlocks = pdfFiles.map((f) => ({
  type: 'document',
  source: {
    type: 'base64',
    media_type: 'application/pdf',
    data: fs.readFileSync(path.join(dir, f)).toString('base64'),
  },
  title: f,
  cache_control: { type: 'ephemeral' },
}));

const body = {
  model: MODEL,
  max_tokens: 8000,
  system: SYSTEM_PROMPT,
  messages: [{
    role: 'user',
    content: [ ...documentBlocks, { type: 'text', text: USER_PROMPT } ],
  }],
};

console.log(`🤖 ${MODEL} · ${pdfFiles.length} PDFs adjuntos · schema ${SCHEMA_VERSION}`);
const t0 = Date.now();
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify(body),
});
if (!res.ok) {
  console.error(`HTTP ${res.status}:`, await res.text());
  process.exit(1);
}
const j = await res.json();
console.log(`   ✔ ${((Date.now() - t0) / 1000).toFixed(1)}s · ${j.usage?.input_tokens ?? '?'} in / ${j.usage?.output_tokens ?? '?'} out`);
if (j.usage?.cache_read_input_tokens) {
  console.log(`   💾 cache hit: ${j.usage.cache_read_input_tokens} tokens`);
}

const text = j.content?.find((b) => b.type === 'text')?.text ?? '';
const jsonMatch = text.match(/\{[\s\S]*\}/);
if (!jsonMatch) { console.error('No se encontró JSON en la respuesta:\n', text); process.exit(1); }
let parsed;
try { parsed = JSON.parse(jsonMatch[0]); }
catch (e) { console.error('JSON inválido:', e.message, '\n', jsonMatch[0].slice(0, 500)); process.exit(1); }
if (!parsed._modelo) parsed._modelo = MODEL;

// Guardar extraccion.json para que validate.mjs y apply.mjs lo consuman.
const outFile = path.join(dir, 'extraccion.json');
fs.writeFileSync(outFile, JSON.stringify(parsed, null, 2));
console.log(`💾 ${outFile}`);

console.log('\n─── Resumen ───');
console.log(JSON.stringify(parsed, null, 2).slice(0, 1500));
if (parsed.notas_pliego?.length)       console.log(`📘 ${parsed.notas_pliego.length} notas de pliego`);
if (parsed.notas_adjudicacion?.length) console.log(`🏆 ${parsed.notas_adjudicacion.length} notas de adjudicación`);
if (parsed.warnings?.length) console.log(`⚠ ${parsed.warnings.length} warnings (legacy — re-clasificar)`);

if (SAVE_ONLY) {
  console.log(`\n📋 --save-only: corré 'node scripts/placsp-llm-validate.mjs --slug=${slug}' y después 'node scripts/placsp-llm-apply.mjs --slug=${slug}'.`);
  db.close();
  process.exit(0);
}

// ─── Upsert directo en DB (compat con apply.mjs) ─────────────────────────
console.log(`\n📝 Escribiendo en DB...`);
const now = new Date().toISOString();
const updateCols = [];
const updateVals = [];
const set = (col, v) => { if (v !== undefined) { updateCols.push(`${col} = ?`); updateVals.push(v); } };
const bool01 = (v) => (v == null ? null : (v ? 1 : 0));

if (parsed.criterios_valoracion) set('criterios_valoracion', JSON.stringify(parsed.criterios_valoracion));
set('peso_criterios_economicos',  parsed.peso_criterios_economicos ?? null);
set('peso_criterios_tecnicos',    parsed.peso_criterios_tecnicos ?? null);
set('peso_canon_fijo',            parsed.peso_canon_fijo ?? null);
set('peso_canon_variable',        parsed.peso_canon_variable ?? null);
set('peso_construccion_tiempo',   parsed.peso_construccion_tiempo ?? null);
set('peso_proyecto_tecnico',      parsed.peso_proyecto_tecnico ?? null);
set('peso_mas_hw_potencia',       parsed.peso_mas_hw_potencia ?? null);
set('peso_mas_ubicaciones',       parsed.peso_mas_ubicaciones ?? null);
set('peso_otros',                 parsed.peso_otros ?? null);
if (parsed.mejoras_puntuables) set('mejoras_puntuables', JSON.stringify(parsed.mejoras_puntuables));
if (parsed.criterios_juicio_valor) set('criterios_juicio_valor', JSON.stringify(parsed.criterios_juicio_valor));
set('tipo_adjudicacion',          parsed.tipo_adjudicacion ?? null);
set('idioma_pliego',              parsed.idioma_pliego ?? null);

if (isConcesion) {
  set('fecha_inicio_concesion',          parsed.fecha_inicio_concesion ?? null);
  set('tipo_inicio_concesion',           parsed.tipo_inicio_concesion ?? null);
  set('plazo_construccion_meses',        parsed.plazo_construccion_meses ?? null);
  set('potencia_disponible_kw',          parsed.potencia_disponible_kw ?? null);
  set('potencia_disponible_garantizada', bool01(parsed.potencia_disponible_garantizada));
  set('tecnologia_requerida',            parsed.tecnologia_requerida ?? null);
  set('num_cargadores_minimo',           parsed.num_cargadores_minimo ?? null);
  set('num_cargadores_opcional_extra',   bool01(parsed.num_cargadores_opcional_extra));
  set('potencia_minima_por_cargador_kw', parsed.potencia_minima_por_cargador_kw ?? null);
  set('potencia_opcional_subible',       bool01(parsed.potencia_opcional_subible));
  set('plazo_concesion_anos',            parsed.plazo_concesion_anos ?? null);
  set('renovacion_anos',                 parsed.renovacion_anos ?? null);
  set('tipo_retribucion',                parsed.tipo_retribucion ?? null);
  if (parsed.num_ubicaciones != null) set('num_ubicaciones', parsed.num_ubicaciones);
  set('canon_minimo_anual',              parsed.canon_minimo_anual ?? null);
  set('canon_anual_ofertado_ganador',    parsed.canon_ganador ?? null);
  set('canon_por_cargador_ofertado',     parsed.canon_por_cargador ?? null);
  set('canon_por_ubicacion_anual',       parsed.canon_por_ubicacion_anual ?? null);
  set('canon_variable_pct',              parsed.canon_variable_pct ?? null);
  set('canon_variable_eur_kwh',          parsed.canon_variable_eur_kwh ?? null);
  set('canon_mix_fijo_anual',            parsed.canon_mix_fijo_anual ?? null);
  set('canon_mix_var_pct',               parsed.canon_mix_var_pct ?? null);
  set('canon_mix_var_eur_kwh',           parsed.canon_mix_var_eur_kwh ?? null);
  set('canon_mix_fijo_por_cargador',     parsed.canon_mix_fijo_por_cargador ?? null);
  set('precio_max_kwh_usuario',          parsed.precio_max_kwh_usuario ?? null);
  set('precio_kwh_ofertado_ganador',     parsed.precio_kwh_ofertado_ganador ?? null);
  set('mantenimiento_precio_anos',       parsed.mantenimiento_precio_anos ?? null);
}

if (parsed.garantias) {
  set('garantia_provisional_eur',     parsed.garantias.provisional_eur ?? null);
  set('garantia_provisional_pct',     parsed.garantias.provisional_pct ?? null);
  set('garantia_provisional_exigida', bool01(parsed.garantias.provisional_exigida));
  set('garantia_definitiva_eur',      parsed.garantias.definitiva_eur ?? null);
  set('garantia_definitiva_pct',      parsed.garantias.definitiva_pct ?? null);
  set('garantia_definitiva_base',     parsed.garantias.definitiva_base ?? null);
}

if (parsed.requisitos) {
  set('requisitos_solvencia_economica', parsed.requisitos.solvencia_economica ? JSON.stringify(parsed.requisitos.solvencia_economica) : null);
  set('requisitos_solvencia_tecnica',   parsed.requisitos.solvencia_tecnica   ? JSON.stringify(parsed.requisitos.solvencia_tecnica)   : null);
  set('requisitos_adicionales',         parsed.requisitos.adicionales         ? JSON.stringify(parsed.requisitos.adicionales)         : null);
}

set('extraccion_llm_fecha',  now);
set('extraccion_llm_modelo', MODEL);
const notasPliego       = parsed.notas_pliego       ?? (parsed.warnings ?? null);
const notasAdjudicacion = parsed.notas_adjudicacion ?? null;
set('extraccion_llm_notas_pliego',       notasPliego       ? JSON.stringify(notasPliego)       : null);
set('extraccion_llm_notas_adjudicacion', notasAdjudicacion ? JSON.stringify(notasAdjudicacion) : null);
set('extraccion_llm_warnings', parsed.warnings ? JSON.stringify(parsed.warnings) : null);

if (updateCols.length) {
  updateVals.push(row.id);
  db.prepare(`UPDATE licitaciones SET ${updateCols.join(', ')} WHERE id = ?`).run(...updateVals);
  console.log(`   ✔ ${updateCols.length} campos actualizados en licitaciones`);
}

// Ubicaciones
if (isConcesion && Array.isArray(parsed.ubicaciones) && parsed.ubicaciones.length > 0) {
  db.prepare(`DELETE FROM ubicaciones_concesion WHERE licitacion_id = ?`).run(row.id);
  const ins = db.prepare(`
    INSERT INTO ubicaciones_concesion
      (licitacion_id, nombre, direccion, municipio, latitud, longitud,
       plazas, num_cargadores_ac, num_cargadores_dc, num_cargadores_dc_plus, num_cargadores_hpc, num_cargadores_total,
       potencia_total_kw, potencia_por_cargador_kw, tipo_hw, plazo_pem_meses, google_maps_url, notas, es_opcional, es_existente, plano_url, plano_label, extraccion_llm_fecha)
    VALUES (@licitacion_id,@nombre,@direccion,@municipio,@latitud,@longitud,
            @plazas,@num_cargadores_ac,@num_cargadores_dc,@num_cargadores_dc_plus,@num_cargadores_hpc,@num_cargadores_total,
            @potencia_total_kw,@potencia_por_cargador_kw,@tipo_hw,@plazo_pem_meses,@google_maps_url,@notas,@es_opcional,@es_existente,@plano_url,@plano_label,@extraccion_llm_fecha)
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
      es_existente:    u.es_existente ? 1 : 0,
      plano_url:       u.plano_url ?? null,
      plano_label:     u.plano_label ?? null,
      extraccion_llm_fecha: now,
    });
  }
  console.log(`   ✔ ${parsed.ubicaciones.length} ubicaciones`);
}

// Licitadores
if (Array.isArray(parsed.licitadores) && parsed.licitadores.length > 0) {
  db.prepare(`DELETE FROM licitadores WHERE licitacion_id = ?`).run(row.id);
  const insL = db.prepare(`
    INSERT INTO licitadores
      (licitacion_id, empresa_nif, empresa_nombre, rol, es_ute, miembros_ute,
       oferta_economica, oferta_canon_anual, oferta_canon_por_cargador,
       oferta_canon_variable_eur_kwh, oferta_canon_variable_pct, oferta_descuento_residentes_pct,
       oferta_precio_kwh_usuario, oferta_mantenimiento_precio_anos,
       inversion_comprometida,
       puntuacion_economica, puntuacion_tecnica, puntuacion_total, puntuaciones_detalle,
       rank_position, motivo_exclusion, mejoras_ofertadas)
    VALUES (@lid,@nif,@nombre,@rol,@ute,@miembros,
            @oe,@oca,@ocp,@ocv,@ocvp,@odr,
            @opku,@omp,
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
      oe:   l.oferta_economica ?? null,
      oca:  l.oferta_canon_anual ?? null,
      ocp:  l.oferta_canon_por_cargador ?? null,
      ocv:  l.oferta_canon_variable_eur_kwh ?? null,
      ocvp: l.oferta_canon_variable_pct ?? null,
      odr:  l.oferta_descuento_residentes_pct ?? null,
      opku: l.oferta_precio_kwh_usuario ?? null,
      omp:  l.oferta_mantenimiento_precio_anos ?? null,
      inv:  l.inversion_comprometida ?? null,
      pe:   l.puntuacion_economica ?? null,
      pt:   l.puntuacion_tecnica ?? null,
      pto:  l.puntuacion_total ?? null,
      pd:   l.puntuaciones_detalle ? JSON.stringify(l.puntuaciones_detalle) : null,
      rank: l.rank_position ?? null,
      mx:   l.motivo_exclusion ?? null,
      mj:   l.mejoras_ofertadas ? JSON.stringify(l.mejoras_ofertadas) : null,
    });
  }
  console.log(`   ✔ ${parsed.licitadores.length} licitadores`);
}

console.log(`\n🎉 Extracción completa. Ahora corré: node scripts/placsp-build-json.mjs`);
db.close();
