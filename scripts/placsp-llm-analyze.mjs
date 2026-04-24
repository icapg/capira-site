/**
 * placsp-llm-analyze.mjs  —  ⚠️  USA API DE PAGO
 *
 * Llama a la API de Anthropic con `ANTHROPIC_API_KEY` → consume saldo de la key.
 * Usar SOLO cuando no hay una sesión de Claude Code activa (batches grandes
 * en background, cron, CI). Durante una sesión, usar el flow gratuito:
 *     1. node scripts/placsp-extract-pdfs.mjs --slug=<N>
 *     2. [Claude lee los PDFs y escribe extraccion.json en la carpeta]
 *     3. node scripts/placsp-llm-apply.mjs --slug=<N>
 *
 * Dada una licitación con PDFs descargados en data/placsp-pdfs/<slug>/,
 * los envía a la API de Claude con un prompt estructurado que devuelve JSON
 * estricto, y puebla los campos fase 2 de `licitaciones` + `licitadores` +
 * `ubicaciones_concesion`.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/placsp-llm-analyze.mjs --slug=19140288
 *   node scripts/placsp-llm-analyze.mjs --slug=19140288 --dry-run    (no escribe DB)
 *   node scripts/placsp-llm-analyze.mjs --slug=19140288 --model=claude-opus-4-7
 *
 * Requisitos:
 *   - PDFs ya descargados (correr antes placsp-extract-pdfs.mjs)
 *   - ANTHROPIC_API_KEY en env
 *   - La licitación debe ser cat=1 (concesión demanial) para llenar campos
 *     específicos. Para otras categorías sólo se llenan los comunes.
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

const DEFAULT_MODEL = 'claude-sonnet-4-6';   // balance costo/calidad para extracción estructurada

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

if (!args.slug) { console.error('Falta --slug=<num>'); process.exit(1); }
const DRY = !!args['dry-run'];
const MODEL = args.model ?? DEFAULT_MODEL;
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY && !DRY) {
  console.error('Falta ANTHROPIC_API_KEY en env. Usá --dry-run para probar el prompt sin llamar al API.');
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

// ─── Prompt estructurado ─────────────────────────────────────────────────
const isConcesion = row.categoria_emov === '1';

const SCHEMA_INSTRUCCIONES = `
Devuelve SOLO un objeto JSON con esta estructura exacta. Si un campo no aparece
en los pliegos/actas, usa null. NO inventes. Si hay contradicción entre PDFs,
usa el más autoritativo (resolución > pliego > anuncio) y añade una línea en
"notas_pliego" o "notas_adjudicacion" según corresponda.

Todos los importes en EUR sin IVA cuando sea posible. Porcentajes 0..100.

REGLA DE CLASIFICACIÓN DE NOTAS (muy importante):
La salida tiene DOS listas separadas de notas narrativas: "notas_pliego" y
"notas_adjudicacion". NO uses "warnings" genérico — clasifica cada observación:

• "notas_pliego"  → todo lo que la Administración FIJA ANTES de que alguien
                    se presente. Cosas que un potencial licitador leería para
                    decidir si le interesa participar. Ejemplos:
                      · Plazo de concesión y prórroga (si existe o no)
                      · Cuándo arranca el cómputo (adjudicación/formalización/
                        puesta en marcha) y plazo de construcción
                      · Modelo de retribución (canon fijo/variable/mixto) y
                        mínimos del pliego (canon/año, canon/kWh, canon/
                        ubicación, canon/cargador)
                      · Infraestructura exigida: n.º ubicaciones, mínimo de
                        puntos de carga, mix AC/DC/DC+/HPC, potencia mínima
                        por cargador, potencia disponible por punto
                        (garantizada o no)
                      · Garantías exigidas (provisional sí/no, definitiva %
                        y sobre qué base)
                      · Requisitos de solvencia económica, técnica y adicional
                        (habilitaciones, plan de igualdad, etc.) con umbrales
                      · Criterios de valoración y pesos (% económico / técnico,
                        subdesgloses si existen)
                      · Régimen tarifario (libre o regulado), amortización
                        prevista, rescate/reversión
                      · Importe base de convocatoria, financiación UE, idioma

• "notas_adjudicacion" → todo lo que ocurre DURANTE o DESPUÉS de abrir
                         ofertas. Hechos que no existían hasta que los
                         licitadores se presentaron. Ejemplos:
                      · Quiénes se presentaron (nombres, número) y si hubo
                        competencia efectiva o fue única licitadora
                      · Canon fijo/variable OFERTADO por cada licitador (no
                        confundir con canon mínimo del pliego)
                      · Puntuaciones obtenidas y correcciones que hizo el
                        órgano de contratación sobre las puntuaciones
                      · Criterios donde se penalizó a un licitador concreto
                        y por qué (ej: "IBERDROLA penalizada en criterio 2
                        porque el proyecto eléctrico no soporta la potencia
                        prometida")
                      · Licitadores excluidos y motivo de exclusión (ej:
                        "EASYCHARGER excluida por documentación incompleta")
                      · Fechas de apertura Sobre A, Sobre B, adjudicación y
                        formalización del contrato
                      · TIEMPOS del proceso, expresados en días o meses
                        calendario. Incluir al menos:
                          - Plazo de presentación (desde publicación hasta
                            cierre de ofertas)
                          - Duración de la evaluación (desde cierre de
                            ofertas hasta adjudicación)
                          - Tiempo total desde anuncio del pliego hasta
                            adjudicación
                          - Tiempo entre adjudicación y formalización
                        Ej.: "Desde el anuncio del pliego hasta la
                        adjudicación pasaron 3 meses (92 días)."

REGLA DECISIVA: si el hecho existe ANTES de que se abran sobres → notas_pliego.
Si existe DESPUÉS de que se abran sobres → notas_adjudicacion.

Cada nota debe ser una frase autocontenida, en español, que un lector externo
entienda sin leer el PDF. No uses bullet chars al inicio (la UI los agrega).

{
  "criterios_valoracion": {
    "economicos": [{ "peso": <number>, "formula": "<string o null>" }],
    "tecnicos":   [{ "peso": <number>, "descripcion": "<string>" }]
  },
  "peso_criterios_economicos": <number 0..100 o null>,
  "peso_criterios_tecnicos":   <number 0..100 o null>,
  "peso_construccion_tiempo":  <number o null>,
  "peso_proyecto_tecnico":     <number o null>,
  "peso_mas_hw_potencia":      <number o null>,
  "peso_mas_ubicaciones":      <number o null>,
  "peso_otros":                <number o null>,
  "mejoras_puntuables": [
    { "descripcion": "<string>", "puntos_max": <number o null>,
      "tipo": "descuento"|"app"|"ampliacion_hw"|"sostenibilidad"|"mantenimiento"|"otro" }
  ],
  "tipo_adjudicacion": "subasta"|"concurso"|"concurso_multicriterio"|"acuerdo_marco"|null,
  "idioma_pliego":     "es"|"ca"|"gl"|"eu"|"mixto"|null,

  ${isConcesion ? `
  "fecha_inicio_concesion":       "YYYY-MM-DD o null",
  "tipo_inicio_concesion":        "adjudicacion"|"formalizacion"|"puesta_en_marcha"|null,
  "plazo_construccion_meses":     <number o null>,
  "potencia_disponible_kw":       <number o null>,
  "potencia_disponible_garantizada": <bool o null>,
  "tecnologia_requerida":         "AC"|"DC"|"HPC"|"mixto"|null,
  "num_cargadores_minimo":        <number o null>,
  "num_cargadores_opcional_extra": <bool o null>,
  "potencia_minima_por_cargador_kw": <number o null>,
  "potencia_opcional_subible":    <bool o null>,
  "plazo_concesion_anos":         <number o null>,
  "renovacion_anos":              <number o null>,
  "tipo_retribucion":             "canon_fijo"|"canon_variable_pct"|"mixto"|"contraprestacion"|"compra"|null,
  "canon_minimo_anual":           <number o null>,
  "canon_por_ubicacion_anual":    <number o null>,
  "canon_variable_pct":           <number o null>,
  "canon_variable_eur_kwh":       <number o null>,
  "canon_mix_fijo_anual":         <number o null>,
  "canon_mix_var_pct":            <number o null>,
  "canon_mix_var_eur_kwh":        <number o null>,
  "canon_mix_fijo_por_cargador":  <number o null>,

  "ubicaciones": [
    {
      "nombre":       "<string>",
      "direccion":    "<string o null>",
      "municipio":    "<string o null>",
      "latitud":      <number o null>,
      "longitud":     <number o null>,
      "plazas":       <number o null>,
      "num_cargadores_ac":      <number o null>,
      "num_cargadores_dc":      <number o null>,
      "num_cargadores_dc_plus": <number o null>,
      "num_cargadores_hpc":     <number o null>,
      "num_cargadores_total":   <number o null>,
      "potencia_total_kw":        <number o null>,
      "potencia_por_cargador_kw": <number o null>,
      "tipo_hw":       "AC"|"DC"|"HPC"|"mixto"|null,
      "plazo_pem_meses": <number o null>,
      "notas":         "<string o null>",
      "es_opcional":   <bool o null>
    }
  ],
  ` : ''}

  "licitadores": [
    {
      "nombre":   "<string>",
      "nif":      "<string o null>",
      "rol":      "adjudicataria"|"participante"|"excluida",
      "es_ute":   <bool>,
      "miembros_ute": [{ "nombre": "<string>", "nif": "<string o null>" }] | null,
      "oferta_economica":          <number o null>,
      "oferta_canon_anual":        <number o null>,
      "oferta_canon_por_cargador": <number o null>,
      "inversion_comprometida":    <number o null>,
      "puntuacion_economica":      <number o null>,
      "puntuacion_tecnica":        <number o null>,
      "puntuacion_total":          <number o null>,
      "rank_position":             <number o null>,
      "motivo_exclusion":          "<string o null>",
      "mejoras_ofertadas":         ["<string>", ...] | null
    }
  ],

  "notas_pliego":       ["<string>", ...],
  "notas_adjudicacion": ["<string>", ...]
}
`.trim();

const SYSTEM_PROMPT = `Eres un analista experto en licitaciones públicas españolas del sector
e-movilidad. Trabajas con pliegos (PPT, PCAP), actas de apertura, resoluciones
de adjudicación y anuncios del PLACSP.

Extraé la información solicitada con estricta fidelidad. No inventes ni infieras
más allá de lo escrito. Si algo no está, devolvé null. Si hay ambigüedad,
apuntá el issue en "notas_pliego" o "notas_adjudicacion" según corresponda
(ver regla de clasificación más abajo). NUNCA uses un array "warnings" plano.

Contexto de esta licitación:
- Expediente: ${row.expediente ?? '(sin expediente)'}
- Título: ${row.titulo}
- Órgano: ${row.organo_nombre ?? '(sin órgano)'}
- Categoría e-mov: ${row.categoria_emov} (${isConcesion ? 'concesión demanial' : 'otra'})
- Estado: ${row.estado_actual}
- Deeplink PLACSP: ${row.deeplink}

El canon puede ser FIJO (EUR/año), VARIABLE (% sobre facturación, o EUR/kWh
dispensado) o MIXTO (parte fija + parte variable). Registrá en los campos
correspondientes según el tipo.

En los criterios de valoración, separá económicos (canon) de técnicos. Dentro
de técnicos identificá los buckets típicos (plazo de construcción, calidad del
proyecto técnico, oferta de más HW/potencia, oferta de más ubicaciones, otros).`;

const USER_PROMPT = `Analizá los siguientes PDFs y devolvé el JSON con la estructura indicada.

${SCHEMA_INSTRUCCIONES}`;

if (DRY) {
  console.log('─── SYSTEM ───');
  console.log(SYSTEM_PROMPT);
  console.log('─── USER ───');
  console.log(USER_PROMPT);
  console.log(`\n--dry-run: no se llama al API. ${pdfFiles.length} PDFs se adjuntarían.`);
  process.exit(0);
}

// ─── Armar mensajes con PDFs adjuntos ────────────────────────────────────
// Anthropic API: los PDFs van como content blocks type "document" con base64.
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

console.log(`🤖 Llamando a ${MODEL} con ${pdfFiles.length} PDFs adjuntos...`);
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
// Extraer JSON (puede venir envuelto en backticks)
const jsonMatch = text.match(/\{[\s\S]*\}/);
if (!jsonMatch) { console.error('No se encontró JSON en la respuesta:\n', text); process.exit(1); }
let parsed;
try { parsed = JSON.parse(jsonMatch[0]); }
catch (e) { console.error('JSON inválido:', e.message, '\n', jsonMatch[0].slice(0, 500)); process.exit(1); }

console.log('\n─── Respuesta LLM ───');
console.log(JSON.stringify(parsed, null, 2).slice(0, 2000));
if (parsed.notas_pliego?.length)       console.log(`\n📘 ${parsed.notas_pliego.length} notas de pliego`);
if (parsed.notas_adjudicacion?.length) console.log(`🏆 ${parsed.notas_adjudicacion.length} notas de adjudicación`);
if (parsed.warnings?.length) console.log(`⚠ ${parsed.warnings.length} warnings (legacy — re-clasificar como notas_pliego/notas_adjudicacion)`);

// ─── Upsert en DB ────────────────────────────────────────────────────────
console.log(`\n📝 Escribiendo en DB...`);
const now = new Date().toISOString();

// 1) Campos de `licitaciones`
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
  set('canon_minimo_anual',        parsed.canon_minimo_anual ?? null);
  set('canon_por_ubicacion_anual', parsed.canon_por_ubicacion_anual ?? null);
  set('canon_variable_pct',        parsed.canon_variable_pct ?? null);
  set('canon_variable_eur_kwh',    parsed.canon_variable_eur_kwh ?? null);
  set('canon_mix_fijo_anual',      parsed.canon_mix_fijo_anual ?? null);
  set('canon_mix_var_pct',         parsed.canon_mix_var_pct ?? null);
  set('canon_mix_var_eur_kwh',     parsed.canon_mix_var_eur_kwh ?? null);
  set('canon_mix_fijo_por_cargador', parsed.canon_mix_fijo_por_cargador ?? null);
}

set('extraccion_llm_fecha',   now);
set('extraccion_llm_modelo',  MODEL);
// Nuevas columnas separadas. Si el LLM devolvió un array legacy "warnings",
// lo guardamos en notas_pliego como fallback (mejor que perderlo).
const notasPliego       = parsed.notas_pliego       ?? (parsed.warnings ?? null);
const notasAdjudicacion = parsed.notas_adjudicacion ?? null;
set('extraccion_llm_notas_pliego',       notasPliego       ? JSON.stringify(notasPliego)       : null);
set('extraccion_llm_notas_adjudicacion', notasAdjudicacion ? JSON.stringify(notasAdjudicacion) : null);
// Legacy: mantener warnings plano para compatibilidad hacia atrás del builder.
set('extraccion_llm_warnings', parsed.warnings ? JSON.stringify(parsed.warnings) : null);

if (updateCols.length) {
  updateVals.push(row.id);
  db.prepare(`UPDATE licitaciones SET ${updateCols.join(', ')} WHERE id = ?`).run(...updateVals);
  console.log(`   ✔ ${updateCols.length} campos actualizados en licitaciones`);
}

// 2) Ubicaciones (cat=1)
if (isConcesion && Array.isArray(parsed.ubicaciones) && parsed.ubicaciones.length > 0) {
  db.prepare(`DELETE FROM ubicaciones_concesion WHERE licitacion_id = ?`).run(row.id);
  const ins = db.prepare(`
    INSERT INTO ubicaciones_concesion
      (licitacion_id, nombre, direccion, municipio, latitud, longitud,
       plazas, num_cargadores_ac, num_cargadores_dc, num_cargadores_dc_plus, num_cargadores_hpc, num_cargadores_total,
       potencia_total_kw, potencia_por_cargador_kw, tipo_hw, plazo_pem_meses, notas, es_opcional, extraccion_llm_fecha)
    VALUES (@licitacion_id,@nombre,@direccion,@municipio,@latitud,@longitud,
            @plazas,@num_cargadores_ac,@num_cargadores_dc,@num_cargadores_dc_plus,@num_cargadores_hpc,@num_cargadores_total,
            @potencia_total_kw,@potencia_por_cargador_kw,@tipo_hw,@plazo_pem_meses,@notas,@es_opcional,@extraccion_llm_fecha)
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
      notas:           u.notas ?? null,
      es_opcional:     u.es_opcional ? 1 : 0,
      extraccion_llm_fecha: now,
    });
  }
  console.log(`   ✔ ${parsed.ubicaciones.length} ubicaciones insertadas`);
}

// 3) Licitadores (borramos los extraídos del XML si la LLM devuelve una lista
// autoritativa; conservamos adjudicatarios crudos si no hay info nueva).
if (Array.isArray(parsed.licitadores) && parsed.licitadores.length > 0) {
  db.prepare(`DELETE FROM licitadores WHERE licitacion_id = ?`).run(row.id);
  const insL = db.prepare(`
    INSERT INTO licitadores
      (licitacion_id, empresa_nif, empresa_nombre, rol, es_ute, miembros_ute,
       oferta_economica, oferta_canon_anual, oferta_canon_por_cargador, inversion_comprometida,
       puntuacion_economica, puntuacion_tecnica, puntuacion_total, rank_position,
       motivo_exclusion, mejoras_ofertadas)
    VALUES (@lid,@nif,@nombre,@rol,@ute,@miembros,
            @oe,@oca,@ocp,@inv,@pe,@pt,@pto,@rank,@mx,@mj)
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
      inv: l.inversion_comprometida ?? null,
      pe: l.puntuacion_economica ?? null,
      pt: l.puntuacion_tecnica ?? null,
      pto: l.puntuacion_total ?? null,
      rank: l.rank_position ?? null,
      mx: l.motivo_exclusion ?? null,
      mj: l.mejoras_ofertadas ? JSON.stringify(l.mejoras_ofertadas) : null,
    });
  }
  console.log(`   ✔ ${parsed.licitadores.length} licitadores insertados`);
}

console.log(`\n🎉 Piloto LLM completo. Ahora corré: node scripts/placsp-build-json.mjs`);
db.close();
