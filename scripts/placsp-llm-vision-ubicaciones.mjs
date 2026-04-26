/**
 * placsp-llm-vision-ubicaciones.mjs — ⚠️ USA API DE PAGO (vision)
 *
 * Extrae las ubicaciones detalladas de un expediente PLACSP a partir de PDFs
 * que contienen planos escaneados (sin OCR), enviándolos a Claude Vision.
 *
 * Diseño:
 *   - NO sobreescribe el extraccion.json. Sólo actualiza el array `ubicaciones[]`
 *     con las direcciones, lat/lng y desgloses extraídos de los planos.
 *   - Respeta el resto del JSON (criterios, licitadores, garantías, etc.).
 *   - Guarda backup en extraccion.json.bak antes de tocar.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... node scripts/placsp-llm-vision-ubicaciones.mjs --slug=17794455 --pdf=02A-enlazado-enlace_interno_1.pdf
 *   node scripts/placsp-llm-vision-ubicaciones.mjs --slug=17794455 --pdf=... --dry-run     (solo prompt, sin llamar)
 *   node scripts/placsp-llm-vision-ubicaciones.mjs --slug=17794455 --pdf=... --model=claude-opus-4-7
 *
 * Cuando termina: correr `node scripts/placsp-llm-apply.mjs --slug=N` y
 * `node scripts/placsp-build-json.mjs` para reflejar en DB y bundle.
 */

import fs   from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const PDF_DIR   = path.join(ROOT, 'data', 'placsp-pdfs');
const DEFAULT_MODEL = 'claude-sonnet-4-6';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

if (!args.slug) { console.error('Falta --slug=<num>'); process.exit(1); }
const DRY = !!args['dry-run'];
const MODEL = args.model ?? DEFAULT_MODEL;

// Cargar API key desde process.env o .env.local (auto-discover, simple parser
// que respeta comillas).
function loadApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const m = content.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/m);
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, '');
}
const API_KEY = loadApiKey();
if (!API_KEY && !DRY) {
  console.error('Falta ANTHROPIC_API_KEY (no la encontré en .env.local ni en el env).');
  process.exit(1);
}

const slug = String(args.slug);
const dir  = path.join(PDF_DIR, slug);
if (!fs.existsSync(dir)) { console.error(`No existe ${dir}`); process.exit(1); }

const jsonPath = path.join(dir, 'extraccion.json');
if (!fs.existsSync(jsonPath)) { console.error(`No existe ${jsonPath}`); process.exit(1); }

// ─── Selección de PDFs ──────────────────────────────────────────────────
let pdfFiles;
if (args.pdf) {
  // Acepta uno o varios separados por coma
  pdfFiles = String(args.pdf).split(',').map((f) => f.trim()).filter(Boolean);
  for (const f of pdfFiles) {
    if (!fs.existsSync(path.join(dir, f))) {
      console.error(`No existe ${f} en ${dir}`); process.exit(1);
    }
  }
} else {
  // Heurística: PDFs grandes con keywords de anexo/plano en el nombre
  const KW = /(anexo|plano|dimensiones|ubicaci|pliego_tecnico|enlazado)/i;
  pdfFiles = fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .filter((f) => KW.test(f))
    .map((f) => ({ f, size: fs.statSync(path.join(dir, f)).size }))
    .sort((a, b) => b.size - a.size)
    .map((x) => x.f);
  if (pdfFiles.length === 0) {
    console.error('No detecté PDFs con anexos/planos. Pasá --pdf=<filename> explícito.');
    process.exit(1);
  }
}
console.log(`📁 ${pdfFiles.length} PDFs a procesar: ${pdfFiles.join(', ')}`);

// ─── Prompt ─────────────────────────────────────────────────────────────
const SYSTEM = `Eres un analista experto en pliegos públicos españoles del sector de
movilidad eléctrica. Tu tarea es extraer la lista detallada de UBICACIONES de
puntos de recarga a partir de planos arquitectónicos y anexos escaneados.

GLOSARIO CRÍTICO (memorizalo):
- "Punto de carga" = toma / cable / manguera / conector individual donde se
  enchufa UN coche. En el 99% de los casos coincide con el número de plazas
  (1 plaza = 1 cable). Lo que el pliego exige como mínimo.
- "Cargador" / "equipo" / "poste" / "cabina" = unidad física que entrega
  potencia. Puede tener 1, 2 o más puntos de carga. Su número es decisión
  del licitador.

Las ubicaciones aparecen en Anexos del PPT como planos, fotos georreferenciadas,
tablas o cabeceras "PUNTO DE RECARGA N", "UBICACIÓN N", "ESTACIÓN <nombre>".

REGLAS:
- Extraé EXCLUSIVAMENTE ubicaciones físicas concretas. No inventes.
- Si una ubicación está descrita pero algún campo falta en el plano, devolvé
  ese campo como null. Mejor null que adivinar.
- Distinguí entre ubicaciones EXISTENTES (a asumir/gestionar por el adjudicatario)
  y NUEVAS (a instalar). Anexo I suele ser nuevas, Anexo II existentes — respetá
  el contexto.
- En el campo "num_cargadores_total" devolvé el número de PUNTOS DE CARGA
  (= cables individuales = plazas con cable disponible). Si el plano dice
  "1 poste con 2 mangueras para 2 plazas", num_cargadores_total = 2 (no 1).`;

const USER = `Devolveme un único objeto JSON con esta estructura exacta:

{
  "ubicaciones_nuevas": [
    {
      "nombre":      "<nombre o referencia del plano>",
      "direccion":   "<dirección literal>",
      "municipio":   "<municipio>",
      "latitud":     <number|null>,
      "longitud":    <number|null>,
      "num_cargadores_total": <number|null — puntos de carga = plazas con cable>,
      "tipo_hw":     "AC"|"DC"|"HPC"|"mixto"|null,
      "potencia_por_cargador_kw": <number|null>,
      "notas":       "<texto autocontenido o null — incluye nº de equipos físicos si aparece>"
    }
  ],
  "ubicaciones_existentes": [
    { /* misma estructura, ubicaciones que ya están operativas */ }
  ],
  "resumen": "<1-2 frases describiendo qué encontraste y de qué páginas/anexos>"
}

NO devuelvas nada más fuera del JSON. Sin markdown, sin texto envolvente.`;

if (DRY) {
  console.log('─── SYSTEM ───');
  console.log(SYSTEM);
  console.log('─── USER ───');
  console.log(USER);
  console.log(`\n--dry-run: ${pdfFiles.length} PDFs se adjuntarían (no se llama al API).`);
  process.exit(0);
}

// ─── Llamada al API ─────────────────────────────────────────────────────
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
  max_tokens: 16000,
  system: SYSTEM,
  messages: [{
    role: 'user',
    content: [...documentBlocks, { type: 'text', text: USER }],
  }],
};

console.log(`🤖 ${MODEL} · ${pdfFiles.length} PDFs adjuntos · vision`);
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
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`   ✔ ${elapsed}s · ${j.usage?.input_tokens ?? '?'} in / ${j.usage?.output_tokens ?? '?'} out`);
if (j.usage?.cache_read_input_tokens) {
  console.log(`   💾 cache hit: ${j.usage.cache_read_input_tokens} tokens`);
}

// Estimación de costo en USD (Sonnet 4.6 default)
const COSTS = {
  'claude-sonnet-4-6': { input: 3, output: 15, cache_write: 3.75, cache_read: 0.30 },
  'claude-opus-4-7':   { input: 15, output: 75, cache_write: 18.75, cache_read: 1.50 },
  'claude-haiku-4-5':  { input: 1, output: 5, cache_write: 1.25, cache_read: 0.10 },
};
const c = COSTS[MODEL] ?? COSTS['claude-sonnet-4-6'];
const u = j.usage ?? {};
const cost = (
  ((u.input_tokens ?? 0) - (u.cache_read_input_tokens ?? 0) - (u.cache_creation_input_tokens ?? 0)) * c.input +
  (u.cache_read_input_tokens ?? 0) * c.cache_read +
  (u.cache_creation_input_tokens ?? 0) * c.cache_write +
  (u.output_tokens ?? 0) * c.output
) / 1_000_000;
console.log(`   💰 ~$${cost.toFixed(3)} USD`);

const text = j.content?.find((b) => b.type === 'text')?.text ?? '';

// Guardar respuesta cruda PRIMERO (antes de cualquier parsing/console.log
// largo, que en Node 24 + Windows puede crashear con UV_HANDLE_CLOSING).
const rawDest = path.join(dir, 'vision-response.raw.txt');
fs.writeFileSync(rawDest, text);
console.log(`💾 Raw response: ${rawDest}`);

const jsonMatch = text.match(/\{[\s\S]*\}/);
if (!jsonMatch) { console.error('No se encontró JSON en la respuesta'); process.exit(1); }
let parsed;
try { parsed = JSON.parse(jsonMatch[0]); }
catch (e) { console.error('JSON inválido:', e.message); process.exit(1); }

console.log(`📍 ${parsed.ubicaciones_nuevas?.length ?? 0} nuevas · ${parsed.ubicaciones_existentes?.length ?? 0} existentes`);

// ─── Merge en extraccion.json ───────────────────────────────────────────
const original = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
fs.writeFileSync(jsonPath + '.bak', JSON.stringify(original, null, 2));
console.log(`\n💾 Backup: ${jsonPath}.bak`);

// Construir array final de ubicaciones: nuevas primero (es_existente: false),
// existentes después (es_existente: true). Auto-completar google_maps_url
// desde lat/lng o desde dirección + municipio.
function buildUbicacion(u, esExistente) {
  const out = {
    nombre:      u.nombre ?? null,
    direccion:   u.direccion ?? u.nombre ?? null,
    municipio:   u.municipio ?? null,
    es_opcional: false,
  };
  if (esExistente) out.es_existente = true;
  if (u.latitud != null && u.longitud != null) {
    out.latitud = u.latitud;
    out.longitud = u.longitud;
    out.google_maps_url = `https://www.google.com/maps?q=${u.latitud},${u.longitud}`;
  } else if (out.direccion) {
    const q = `${out.direccion}${out.municipio ? `, ${out.municipio}` : ''}`;
    out.google_maps_url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
  // No emitimos `plazas` (deprecado, ver spec v2). El campo num_cargadores_total
  // representa los puntos de carga = plazas con cable disponible.
  if (u.num_cargadores_total != null) out.num_cargadores_total = u.num_cargadores_total;
  if (u.tipo_hw) out.tipo_hw = u.tipo_hw;
  if (u.potencia_por_cargador_kw != null) out.potencia_por_cargador_kw = u.potencia_por_cargador_kw;
  if (u.notas) out.notas = u.notas;
  return out;
}

const nuevas = (parsed.ubicaciones_nuevas ?? []).map((u) => buildUbicacion(u, false));
const existentes = (parsed.ubicaciones_existentes ?? []).map((u) => buildUbicacion(u, true));
const merged = [...nuevas, ...existentes];

if (merged.length === 0) {
  console.error('Sin ubicaciones extraídas. extraccion.json sin cambios.');
  process.exit(0);
}

original.ubicaciones = merged;
original.num_ubicaciones = merged.length;
original._modelo = `${original._modelo ?? 'sesión Max'} + vision ${MODEL} para ubicaciones`;

fs.writeFileSync(jsonPath, JSON.stringify(original, null, 2));
console.log(`OK · ${merged.length} ubicaciones · ${jsonPath}`);
