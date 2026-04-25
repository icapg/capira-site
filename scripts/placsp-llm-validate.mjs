/**
 * placsp-llm-validate.mjs
 *
 * Verifica un extraccion.json contra el schema canónico (placsp-llm-schema.mjs)
 * y la spec ~/.claude/.../memory/reference_placsp_extraction_spec_v2.md.
 *
 * Diseñado para encadenarse en flujos batch / CI:
 *   exit 0 → todo OK (puede haber warnings)
 *   exit 1 → al menos un error → no aplicar a DB
 *
 * Usage:
 *   node scripts/placsp-llm-validate.mjs --slug=19140288
 *   node scripts/placsp-llm-validate.mjs --slug=19140288 --file=ruta/extraccion.json
 *   node scripts/placsp-llm-validate.mjs --all                (valida todas las extracciones encontradas)
 *   node scripts/placsp-llm-validate.mjs --slug=19140288 --strict   (warnings cuentan como errores)
 *   node scripts/placsp-llm-validate.mjs --slug=19140288 --json     (salida JSON parseable)
 */

import fs   from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { ENUMS, VALIDATION_RULES } from './placsp-llm-schema.mjs';

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

const STRICT   = !!args.strict;
const JSON_OUT = !!args.json;

// ─── Heurística de "esto es nota de adjudicación" (réplica del regex de la UI) ─
const NOTA_ADJ_RE = [
  /única\s+licitador/i,
  /licitador[ae]s?\s+(presentad|ofertant|se\s+present)/i,
  /sin\s+competencia/i,
  /m[aá]xima\s+puntuaci/i,
  /\b(ganador|adjudicatari)/i,
  /\bsobre\s+[ab]\b/i,
  /apertura\s+(de\s+)?sobre/i,
  /\bformalizaci[oó]n\b/i,
  /\bcanon\s+(fijo\s+|variable\s+)?ofertad/i,
  /\bpenaliz/i,
  /\bexcluid/i,
  /\bexclus(i[oó]n|iones)\b/i,
  /\bincumplim/i,
  /oferta[s]?\s+(evaluad|admitid|descartad|rechazad)/i,
  /\bpuntuaci[oó]n\s+(de|del|correg|final|obten|reduc|ampli)/i,
  /\b(correg|modific|reduc|ampli)(i[oó]|ó)\s+(la\s+)?puntuaci/i,
  /\bcriterio\s+\d/i,
  /\bacta\s+de\s+(apertura|evaluaci)/i,
];
const looksLikeAdjudicacion = (s) => NOTA_ADJ_RE.some((re) => re.test(s));

// ─── Validador puro (no toca FS/DB) ─────────────────────────────────────
export function validate(parsed, ctx = {}) {
  const errors   = [];
  const warnings = [];
  const isConcesion = ctx.isConcesion ?? false;

  const err  = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  if (!parsed || typeof parsed !== 'object') {
    err('extraccion.json no es un objeto');
    return { errors, warnings };
  }

  // ── Enums ──────────────────────────────────────────────────────────────
  const checkEnum = (campo, valoresPermitidos) => {
    const v = parsed[campo];
    if (v != null && !valoresPermitidos.includes(v)) {
      err(`${campo}="${v}" no está en el dominio permitido [${valoresPermitidos.join(', ')}]`);
    }
  };
  checkEnum('tipo_adjudicacion',    ENUMS.tipo_adjudicacion);
  checkEnum('idioma_pliego',        ENUMS.idioma_pliego);
  if (isConcesion) {
    checkEnum('tipo_inicio_concesion', ENUMS.tipo_inicio_concesion);
    checkEnum('tipo_retribucion',      ENUMS.tipo_retribucion);
    checkEnum('tecnologia_requerida',  ENUMS.tecnologia_requerida);
  }

  // ── Comunes esperados (warning si null) ────────────────────────────────
  for (const c of VALIDATION_RULES.comunesEsperados) {
    if (parsed[c] == null) warn(`${c} es null (recomendable rellenarlo)`);
  }

  // ── Cat=1: al menos uno de los críticos no-null ────────────────────────
  if (isConcesion) {
    const algunoNoNull = VALIDATION_RULES.cat1RequiredAtLeastOne.some((c) => parsed[c] != null);
    if (!algunoNoNull) {
      err(`Cat=1: ninguno de [${VALIDATION_RULES.cat1RequiredAtLeastOne.join(', ')}] está presente — la extracción está prácticamente vacía`);
    }
    if (!Array.isArray(parsed.ubicaciones) || parsed.ubicaciones.length === 0) {
      warn('Cat=1: ubicaciones[] vacío o ausente');
    }
  }

  // ── Coherencia ubicaciones (spec v2 §3.bis) ──────────────────────────
  if (isConcesion && Array.isArray(parsed.ubicaciones) && parsed.ubicaciones.length > 0) {
    const nUbic = parsed.ubicaciones.length;

    // num_ubicaciones >= length (auto-completado en applier)
    if (parsed.num_ubicaciones != null && parsed.num_ubicaciones < nUbic) {
      err(`num_ubicaciones (${parsed.num_ubicaciones}) < ubicaciones.length (${nUbic})`);
    }
    if (parsed.num_ubicaciones == null) {
      warn(`num_ubicaciones es null (será auto-completado a ${nUbic})`);
    }

    // Suma cargadores por ubicación NO debe exceder num_cargadores_minimo
    // (excluyendo ubicaciones existentes, que no cuentan en el mínimo del pliego)
    const sumaNuevos = parsed.ubicaciones
      .filter((u) => !u.es_existente)
      .reduce((s, u) => s + (u.num_cargadores_total ?? 0), 0);
    if (parsed.num_cargadores_minimo != null && sumaNuevos > parsed.num_cargadores_minimo + 0.5) {
      err(`Σ(ubicaciones nuevas[].num_cargadores_total) = ${sumaNuevos} > num_cargadores_minimo = ${parsed.num_cargadores_minimo}`);
    }
    if (parsed.num_cargadores_minimo != null && sumaNuevos > 0 && sumaNuevos < parsed.num_cargadores_minimo) {
      warn(`Desglose por ubicación incompleto: Σ(nuevas) = ${sumaNuevos} < num_cargadores_minimo = ${parsed.num_cargadores_minimo}`);
    }

    // Cada ubicación debe tener algún anchor de localización (auto-completado en applier)
    parsed.ubicaciones.forEach((u, i) => {
      if (!u.google_maps_url && !u.direccion && u.latitud == null) {
        warn(`ubicaciones[${i}] (${u.nombre}): sin google_maps_url ni direccion ni lat/lng (será auto-completado)`);
      }
      // es_existente && es_opcional → contradictorio
      if (u.es_existente && u.es_opcional) {
        err(`ubicaciones[${i}] (${u.nombre}): es_existente=true y es_opcional=true son incompatibles`);
      }
    });

    // tecnologia_requerida == "mixto" pero todas tipo_hw iguales
    if (parsed.tecnologia_requerida === 'mixto') {
      const tipos = new Set(parsed.ubicaciones.map((u) => u.tipo_hw).filter(Boolean));
      if (tipos.size === 1) {
        warn(`tecnologia_requerida="mixto" pero todas las ubicaciones tienen tipo_hw="${[...tipos][0]}" — revisar coherencia`);
      }
    }
  }

  // ── Pesos: top-level suman ~100 ───────────────────────────────────────
  const pe = parsed.peso_criterios_economicos;
  const pt = parsed.peso_criterios_tecnicos;
  if (pe != null && pt != null) {
    const sum = pe + pt;
    if (Math.abs(sum - 100) > VALIDATION_RULES.toleranciaPct) {
      err(`peso_criterios_economicos (${pe}) + peso_criterios_tecnicos (${pt}) = ${sum}, esperado ~100`);
    }
  }
  // Sub-pesos económicos suman peso_economico
  if (pe != null) {
    const subEco = ['peso_canon_fijo', 'peso_canon_variable']
      .map((c) => parsed[c]).filter((v) => v != null);
    if (subEco.length > 0) {
      const s = subEco.reduce((a, b) => a + b, 0);
      if (s > pe + VALIDATION_RULES.toleranciaPct) {
        err(`Sub-pesos económicos (${s}) exceden peso_criterios_economicos (${pe})`);
      }
    }
  }
  // Sub-pesos técnicos suman peso_tecnico
  if (pt != null) {
    const subTec = ['peso_construccion_tiempo', 'peso_proyecto_tecnico', 'peso_mas_hw_potencia', 'peso_mas_ubicaciones', 'peso_otros']
      .map((c) => parsed[c]).filter((v) => v != null);
    if (subTec.length > 0) {
      const s = subTec.reduce((a, b) => a + b, 0);
      if (s > pt + VALIDATION_RULES.toleranciaPct) {
        err(`Sub-pesos técnicos (${s}) exceden peso_criterios_tecnicos (${pt})`);
      }
    }
  }

  // ── tipo_retribucion="mixto" → exige fijo + variable ──────────────────
  if (isConcesion && parsed.tipo_retribucion === 'mixto') {
    const tieneFijo = VALIDATION_RULES.mixtoFijoCampos.some((c) => parsed[c] != null);
    const tieneVar  = VALIDATION_RULES.mixtoVariableCampos.some((c) => parsed[c] != null);
    if (!tieneFijo) err(`tipo_retribucion="mixto" pero ningún componente fijo presente (${VALIDATION_RULES.mixtoFijoCampos.join(', ')})`);
    if (!tieneVar)  err(`tipo_retribucion="mixto" pero ningún componente variable presente (${VALIDATION_RULES.mixtoVariableCampos.join(', ')})`);
  }

  // ── Licitadores ───────────────────────────────────────────────────────
  const licitadores = Array.isArray(parsed.licitadores) ? parsed.licitadores : [];
  const adjudicatarias = licitadores.filter((l) => l.rol === 'adjudicataria');
  const noExcluidos    = licitadores.filter((l) => l.rol !== 'excluida');

  // Si el estado del XML era ADJ/RES y tenemos winner esperado, debe haber adjudicataria.
  if (ctx.winnerEsperado && adjudicatarias.length === 0) {
    err(`Estado=${ctx.estado} pero no hay licitador con rol="adjudicataria"`);
  }

  for (const [i, l] of licitadores.entries()) {
    if (!l.nombre || typeof l.nombre !== 'string') err(`licitadores[${i}]: nombre vacío`);
    if (l.rol && !ENUMS.rol_licitador.includes(l.rol)) {
      err(`licitadores[${i}]: rol="${l.rol}" no permitido`);
    }
    if (l.es_ute && (!Array.isArray(l.miembros_ute) || l.miembros_ute.length === 0)) {
      warn(`licitadores[${i}] (${l.nombre}): es_ute=true pero miembros_ute vacío`);
    }
    // Suma puntuación económica + técnica ≈ total
    if (l.puntuacion_economica != null && l.puntuacion_tecnica != null && l.puntuacion_total != null) {
      const s = l.puntuacion_economica + l.puntuacion_tecnica;
      if (Math.abs(s - l.puntuacion_total) > VALIDATION_RULES.toleranciaPuntos) {
        err(`licitadores[${i}] (${l.nombre}): puntuacion_economica (${l.puntuacion_economica}) + puntuacion_tecnica (${l.puntuacion_tecnica}) = ${s}, pero puntuacion_total = ${l.puntuacion_total}`);
      }
    }
    if (l.puntuacion_total != null && (l.puntuacion_economica == null || l.puntuacion_tecnica == null)) {
      warn(`licitadores[${i}] (${l.nombre}): puntuacion_total presente pero faltan parciales`);
    }
    if (l.rol === 'excluida' && !l.motivo_exclusion) {
      warn(`licitadores[${i}] (${l.nombre}): rol="excluida" sin motivo_exclusion`);
    }
    if (l.rol === 'adjudicataria' && isConcesion) {
      const tieneOferta = l.oferta_canon_anual != null
        || l.oferta_canon_variable_eur_kwh != null
        || l.oferta_canon_variable_pct != null
        || l.oferta_canon_por_cargador != null
        || l.oferta_economica != null
        || l.oferta_precio_kwh_usuario != null;
      if (!tieneOferta) warn(`licitadores[${i}] (${l.nombre}): adjudicataria sin oferta_* — ¿es contraprestación/compra?`);
    }
  }

  // Consistencia de "puntuaciones_detalle[].nombre" entre no-excluidos
  if (noExcluidos.length >= 2) {
    const labelsByLic = noExcluidos.map((l) => new Set((l.puntuaciones_detalle ?? []).map((d) => d.nombre)));
    const allLabels = new Set(labelsByLic.flatMap((s) => [...s]));
    for (const label of allLabels) {
      const presentEn = labelsByLic.filter((s) => s.has(label)).length;
      // Si el label aparece en al menos uno pero no en todos, alertar.
      if (presentEn !== 0 && presentEn !== labelsByLic.length) {
        warn(`puntuaciones_detalle: label "${label}" aparece en ${presentEn}/${labelsByLic.length} licitadores no excluidos — la UI espera labels consistentes`);
      }
    }
  }

  // ── Notas: deben existir las dos listas (no warnings legacy) ──────────
  const tieneNotasNuevas = Array.isArray(parsed.notas_pliego) || Array.isArray(parsed.notas_adjudicacion);
  if (!tieneNotasNuevas) {
    if (Array.isArray(parsed.warnings) && parsed.warnings.length > 0) {
      warn(`Usa el campo legacy "warnings" (${parsed.warnings.length} items) en lugar de notas_pliego/notas_adjudicacion`);
    } else {
      warn('No hay notas_pliego ni notas_adjudicacion (ni warnings legacy) — esperable que haya al menos algo narrativo');
    }
  }
  // Heurística: notas que parecen de adjudicación pero están en pliego
  if (Array.isArray(parsed.notas_pliego)) {
    for (const n of parsed.notas_pliego) {
      if (looksLikeAdjudicacion(n)) {
        warn(`notas_pliego contiene una nota que parece de adjudicación: "${String(n).slice(0, 100)}..."`);
      }
    }
  }

  // ── Garantías / requisitos vacíos (warning) ───────────────────────────
  if (!parsed.garantias || Object.keys(parsed.garantias).length === 0) warn('garantias vacío o ausente');
  if (!parsed.requisitos || Object.keys(parsed.requisitos).length === 0) warn('requisitos vacío o ausente');

  return { errors, warnings };
}

// ─── CLI ────────────────────────────────────────────────────────────────
function loadCtxFromDb(slug) {
  if (!fs.existsSync(DB_FILE)) return { isConcesion: false };
  const db = new Database(DB_FILE, { readonly: true });
  try {
    const row = db.prepare(`SELECT categoria_emov, estado_actual FROM licitaciones WHERE id LIKE ?`).get(`%/${slug}`);
    if (!row) return { isConcesion: false };
    return {
      isConcesion: row.categoria_emov === '1',
      estado: row.estado_actual,
      winnerEsperado: row.estado_actual === 'ADJ' || row.estado_actual === 'RES',
    };
  } finally { db.close(); }
}

function validateOne(slug, file) {
  const filePath = file ?? path.join(PDF_DIR, slug, 'extraccion.json');
  if (!fs.existsSync(filePath)) {
    return { slug, ok: false, errors: [`No existe ${filePath}`], warnings: [] };
  }
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (e) { return { slug, ok: false, errors: [`JSON inválido: ${e.message}`], warnings: [] }; }
  const ctx = loadCtxFromDb(slug);
  const { errors, warnings } = validate(parsed, ctx);
  return { slug, ok: errors.length === 0, errors, warnings, file: filePath };
}

function listAllSlugs() {
  if (!fs.existsSync(PDF_DIR)) return [];
  return fs.readdirSync(PDF_DIR)
    .filter((d) => fs.existsSync(path.join(PDF_DIR, d, 'extraccion.json')));
}

const slugs = args.all
  ? listAllSlugs()
  : (args.slug ? [String(args.slug)] : []);

if (slugs.length === 0) {
  console.error('Falta --slug=<num> o --all');
  process.exit(1);
}

const results = slugs.map((s) => validateOne(s, args.slug && args.file ? args.file : null));

if (JSON_OUT) {
  console.log(JSON.stringify(results, null, 2));
} else {
  let totalErr = 0, totalWarn = 0;
  for (const r of results) {
    const head = `── ${r.slug}${r.file ? ` (${path.relative(ROOT, r.file)})` : ''}`;
    console.log(head);
    if (r.errors.length === 0 && r.warnings.length === 0) {
      console.log('   ✅ OK');
    } else {
      for (const e of r.errors)   console.log(`   ❌ ${e}`);
      for (const w of r.warnings) console.log(`   ⚠ ${w}`);
    }
    totalErr  += r.errors.length;
    totalWarn += r.warnings.length;
  }
  console.log(`\n${results.length} extracciones · ${totalErr} errores · ${totalWarn} warnings`);
}

const failed = results.some((r) => r.errors.length > 0 || (STRICT && r.warnings.length > 0));
process.exit(failed ? 1 : 0);
