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
import { validate } from './placsp-llm-validate.mjs';

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

// ── Validar antes de aplicar (spec §4.ter O · cierre del loop) ─────────
// Si el validador devuelve errores, abortar antes de tocar la DB. Esto
// fuerza al extractor a corregir el JSON o a marcar flag_criterios_incompletos
// explícitamente. Use --skip-validate para forzar la aplicación con errores
// (NO recomendado — solo para debugging).
if (!args['skip-validate']) {
  const { errors, warnings } = validate(parsed, { isConcesion });
  if (warnings && warnings.length > 0) {
    console.log(`   ⚠ ${warnings.length} warning${warnings.length === 1 ? '' : 's'} del validador (no bloquean):`);
    warnings.forEach((w) => console.log(`     · ${w}`));
  }
  if (errors && errors.length > 0) {
    console.error(`\n❌ El validador encontró ${errors.length} error${errors.length === 1 ? '' : 'es'} BLOQUEANTES:`);
    errors.forEach((e) => console.error(`   · ${e}`));
    console.error(`\nApplier abortado. Corregir el extraccion.json y reintentar.`);
    console.error(`(O forzar con --skip-validate si sabés lo que estás haciendo.)`);
    process.exit(2);
  }
}

// ── §4.ter T · Cross-validation contra _datos_base.json ────────────────
// Si existe `_datos_base.json` (generado por placsp-extraer-datos-base.mjs),
// chequear que los números clave del extraccion.json coinciden con los
// extraídos programáticamente del pliego. Si divergen sin override
// explícito, abortar.
//
// Esto saca al LLM del path crítico para los números: la fuente de verdad
// numérica es el script determinista, no la lectura del LLM.
if (!args['skip-cross-validate']) {
  const dbPath = path.join(PDF_DIR, slug, '_datos_base.json');
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const overrides = parsed._override_datos_base ?? {};
    const xerrors = [];
    const xwarns  = [];

    // 1. Cantidades de cargadores: si hay un número del pliego CERCA del total
    //    declarado pero distinto, alertar. Si las cifras del pliego son MUY
    //    distintas (>5×), probablemente son falsos positivos del regex
    //    (presupuestos, referencias normativas, etc.) — no abortar.
    const cantNums = (db.cantidades_cargadores ?? []).map((c) => c.n).filter((n) => n > 0);
    const totalDeclarado = (parsed.num_cargadores_minimo ?? 0)
      + (parsed.ubicaciones ?? []).filter((u) => u.es_existente).reduce((s, u) => s + (u.num_cargadores_total ?? 0), 0)
      + (parsed.ubicaciones ?? []).filter((u) => u.es_opcional).reduce((s, u) => s + (u.num_cargadores_total ?? 0), 0);
    // Filtrar candidatos plausibles: dentro de un orden de magnitud del declarado
    const plausibles = totalDeclarado > 0
      ? cantNums.filter((n) => n >= totalDeclarado / 5 && n <= totalDeclarado * 5)
      : cantNums;
    const maxPlausible = plausibles.length > 0 ? Math.max(...plausibles) : null;
    if (maxPlausible != null && totalDeclarado > 0 && Math.abs(maxPlausible - totalDeclarado) > Math.max(3, maxPlausible * 0.25)) {
      if (overrides.num_cargadores) {
        xwarns.push(`Cross-validate: el pliego menciona ${maxPlausible} (cargadores/puntos/tomas plausibles) pero el extraccion declara total ${totalDeclarado}. Override justificado: "${overrides.num_cargadores}"`);
      } else {
        xerrors.push(`Cross-validate: el pliego menciona ${maxPlausible} (cargadores/puntos/tomas plausibles) pero el extraccion declara total ${totalDeclarado}. Diferencia >25%. Justificar con _override_datos_base.num_cargadores o corregir el JSON.`);
      }
    }

    // 2. Discrepancias internas detectadas por el script (ej. "5 vs 10")
    //    Independientes del flag_criterios_incompletos (que cubre erratas
    //    en suma de criterios, no contradicciones de cantidades).
    if ((db.discrepancias ?? []).length > 0 && !overrides.discrepancias) {
      const lista = db.discrepancias.map((d) => `"${d.unidad}": [${d.valores.join(', ')}]`).join(' · ');
      xerrors.push(`Cross-validate: el pliego tiene discrepancias numéricas internas (${lista}). Justificar con _override_datos_base.discrepancias = "explicación de cuál valor es correcto y por qué" + nota en notas_pliego.`);
    }

    // 3. Secciones críticas (Anexo I / AUTOEVALUACIÓN) detectadas — recordatorio
    const seccionesCriticas = (db.secciones_criticas ?? []);
    if (seccionesCriticas.length > 0) {
      const sample = seccionesCriticas[0];
      xwarns.push(`Cross-validate: ${seccionesCriticas.length} sección(es) crítica(s) detectada(s) (ej: "${sample.seccion}" en ${sample.archivo}:L${sample.linea}). Verificar que se haya leído.`);
    }

    if (xwarns.length > 0) {
      console.log(`   ⚠ ${xwarns.length} cross-validate warning${xwarns.length === 1 ? '' : 's'}:`);
      xwarns.forEach((w) => console.log(`     · ${w}`));
    }
    if (xerrors.length > 0) {
      console.error(`\n❌ Cross-validate (§4.ter T) encontró ${xerrors.length} discrepancia${xerrors.length === 1 ? '' : 's'} entre extraccion.json y _datos_base.json:`);
      xerrors.forEach((e) => console.error(`   · ${e}`));
      console.error(`\nApplier abortado. Corregir el JSON o agregar _override_datos_base con justificación.`);
      console.error(`(O forzar con --skip-cross-validate si sabés lo que estás haciendo.)`);
      process.exit(3);
    }
  } else {
    console.log(`   ⚠ No existe _datos_base.json — recomendado ejecutar 'node scripts/placsp-extraer-datos-base.mjs --slug=${slug}' antes para cross-validation`);
  }
}

// ─── Auto-completado (spec v2 §3.bis) ────────────────────────────────────
// Rellenamos campos derivables ANTES del UPDATE para que las invariantes se
// cumplan aunque el LLM/sesión no los haya emitido. NUNCA pisamos valores
// existentes — solo derivamos cuando el campo está null.
let autoFilled = 0;
if (isConcesion && Array.isArray(parsed.ubicaciones)) {
  // 1) num_ubicaciones ← ubicaciones.length si null
  if (parsed.num_ubicaciones == null && parsed.ubicaciones.length > 0) {
    parsed.num_ubicaciones = parsed.ubicaciones.length;
    autoFilled++;
  }
  // 2) Por ubicación: direccion ← nombre, google_maps_url ← search query
  for (const u of parsed.ubicaciones) {
    if (!u.direccion && u.nombre) { u.direccion = u.nombre; autoFilled++; }
    if (!u.google_maps_url) {
      if (u.latitud != null && u.longitud != null) {
        u.google_maps_url = `https://www.google.com/maps?q=${u.latitud},${u.longitud}`;
        autoFilled++;
      } else if (u.direccion) {
        const q = `${u.direccion}${u.municipio ? `, ${u.municipio}` : ''}`;
        u.google_maps_url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
        autoFilled++;
      }
    }
    // 3) num_cargadores_total ← derivar SOLO si está null. Nunca pisar.
    //    Prioridad: a) plazas (legacy 1:1), b) Σ tipos AC/DC/DC+/HPC.
    if (u.num_cargadores_total == null) {
      if (u.plazas != null) {
        u.num_cargadores_total = u.plazas;
        autoFilled++;
      } else {
        const tipos = (u.num_cargadores_ac ?? 0) + (u.num_cargadores_dc ?? 0)
                    + (u.num_cargadores_dc_plus ?? 0) + (u.num_cargadores_hpc ?? 0);
        const algunoDefinido = [u.num_cargadores_ac, u.num_cargadores_dc, u.num_cargadores_dc_plus, u.num_cargadores_hpc].some((v) => v != null);
        if (algunoDefinido && tipos > 0) {
          u.num_cargadores_total = tipos;
          autoFilled++;
        }
      }
    }
  }
}
// 3) Detectar declaración desierta EXPLÍCITA en notas_adjudicacion → estado_actual = DES
// Buscamos solo decisiones administrativas explícitas (acto formal de declarar
// desierta), no frases ambiguas como "sin licitadores presentados aún" que
// puede ocurrir mientras el plazo está abierto.
const adjText = (parsed.notas_adjudicacion ?? []).join(' \n ').toLowerCase();
const desierta = /declar[ao]da?\s+desierta|qued[oó]\s+desierta|acuerdo.{0,30}desierta|resoluci[oó]n.{0,30}desierta/i.test(adjText);
let nuevoEstado = null;
if (desierta && row.estado_actual !== 'DES' && row.estado_actual !== 'ANUL' && row.estado_actual !== 'RES') {
  nuevoEstado = 'DES';
  autoFilled++;
}
// 4) ciudad ← municipio común de ubicaciones[]
let nuevaCiudad = null;
if (isConcesion && Array.isArray(parsed.ubicaciones) && parsed.ubicaciones.length > 0 && !row.ciudad) {
  const munis = [...new Set(parsed.ubicaciones.map((u) => u.municipio).filter(Boolean))];
  if (munis.length === 1) {
    nuevaCiudad = munis[0];
    autoFilled++;
  }
}
if (autoFilled > 0) console.log(`   🪄 ${autoFilled} campos auto-completados (spec v2 §3.bis)`);

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
if (parsed.criterios_juicio_valor) set('criterios_juicio_valor', JSON.stringify(parsed.criterios_juicio_valor));
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
  if (parsed.num_ubicaciones != null) set('num_ubicaciones', parsed.num_ubicaciones);
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
  // Canon basado en €/m² del valor del suelo (spec §4.ter N)
  set('canon_eur_m2_ano',          parsed.canon_eur_m2_ano ?? null);
  set('valor_suelo_eur_m2_ano',    parsed.valor_suelo_eur_m2_ano ?? null);
  set('canon_pct_valor_suelo',     parsed.canon_pct_valor_suelo ?? null);
  set('superficie_minima_m2',      parsed.superficie_minima_m2 ?? null);
  set('superficie_maxima_m2',      parsed.superficie_maxima_m2 ?? null);
  // Explicaciones extendidas para modales de la UI (spec §4.ter P)
  set('hardware_especificaciones_json', parsed.hardware_especificaciones != null ? JSON.stringify(parsed.hardware_especificaciones) : null);
  set('canon_explicacion_json',         parsed.canon_explicacion != null ? JSON.stringify(parsed.canon_explicacion) : null);
  // Sub-peso económico no-canon (spec §4.ter O — criterios cifras tipo gratuidad/descuento/abono)
  set('peso_otros_economicos',          parsed.peso_otros_economicos ?? null);
  // Variante venta de energía al usuario
  set('precio_max_kwh_usuario',      parsed.precio_max_kwh_usuario ?? null);
  set('precio_kwh_ofertado_ganador', parsed.precio_kwh_ofertado_ganador ?? null);
  set('mantenimiento_precio_anos',   parsed.mantenimiento_precio_anos ?? null);
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
if (nuevoEstado)  set('estado_actual', nuevoEstado);
if (nuevaCiudad)  set('ciudad', nuevaCiudad);

// Fechas que el LLM puede haber extraído de los PDFs (más precisas que las del
// XML del Atom, que a veces vienen incompletas o desactualizadas). Solo las
// aplicamos si la DB tiene null — no pisamos lo que ya hay del feed XML.
// Aceptamos el campo `fechas: { publicacion, limite_ofertas, adjudicacion, formalizacion }`
// y también campos sueltos al top-level por compatibilidad.
const fechas = parsed.fechas ?? {};
const fechaMap = {
  fecha_publicacion:    fechas.publicacion    ?? parsed.fecha_publicacion    ?? null,
  fecha_limite_ofertas: fechas.limite_ofertas ?? parsed.fecha_limite_ofertas ?? null,
  fecha_adjudicacion:   fechas.adjudicacion   ?? parsed.fecha_adjudicacion   ?? null,
  fecha_formalizacion:  fechas.formalizacion  ?? parsed.fecha_formalizacion  ?? null,
};
for (const [col, val] of Object.entries(fechaMap)) {
  if (val && row[col] == null) set(col, val);
}
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

// ─── Licitadores ─────────────────────────────────────────────────────────
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
      oe: l.oferta_economica ?? null,
      oca: l.oferta_canon_anual ?? null,
      ocp: l.oferta_canon_por_cargador ?? null,
      ocv: l.oferta_canon_variable_eur_kwh ?? null,
      ocvp: l.oferta_canon_variable_pct ?? null,
      odr: l.oferta_descuento_residentes_pct ?? null,
      opku: l.oferta_precio_kwh_usuario ?? null,
      omp:  l.oferta_mantenimiento_precio_anos ?? null,
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
