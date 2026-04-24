/**
 * placsp-extract-pdfs.mjs  —  v2
 *
 * Scrapea la página HTML pública del expediente PLACSP (via `idEvl`) y extrae
 * TODOS los documentos del expediente (Anuncio, Pliego, Adjudicación,
 * Formalización, Memoria, Planos, Actas, Informes de baremación, etc.).
 *
 * A diferencia del enfoque anterior que solo leía el Atom XML (2-3 docs),
 * el HTML público suele contener 20-30+ documentos completos del expediente.
 *
 * Usage:
 *   node scripts/placsp-extract-pdfs.mjs --slug=19140288
 *   node scripts/placsp-extract-pdfs.mjs --slug=19140288 --no-download
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

if (!args.slug && !args.id) {
  console.error('Uso: node scripts/placsp-extract-pdfs.mjs --slug=<num>  | --id=<uri>');
  process.exit(1);
}

const db = new Database(DB_FILE);
const row = args.id
  ? db.prepare(`SELECT id, expediente, fecha_publicacion, deeplink FROM licitaciones WHERE id = ?`).get(args.id)
  : db.prepare(`SELECT id, expediente, fecha_publicacion, deeplink FROM licitaciones WHERE id LIKE ?`).get(`%/${args.slug}`);

if (!row) { console.error('No encontrado.'); process.exit(1); }
const slug = row.id.split('/').pop();
console.log(`📄 Expediente: ${row.expediente ?? slug}`);
console.log(`   id:     ${row.id}`);
console.log(`   deeplink: ${row.deeplink}`);

if (!row.deeplink) { console.error('Sin deeplink'); process.exit(1); }

// ─── Decodificar entidades HTML ─────────────────────────────────────────
const HTML_ENTITIES = {
  '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
  '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
  '&ntilde;': 'ñ', '&Ntilde;': 'Ñ', '&uuml;': 'ü', '&Uuml;': 'Ü',
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  '&nbsp;': ' ',
};
function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&[a-zA-Z]+;/g, (m) => HTML_ENTITIES[m] ?? m);
}

// ─── Clasificar tipo de documento por nombre ────────────────────────────
function guessTipo(nombre) {
  const n = (nombre ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/anuncio\s+de\s+licit/.test(n)) return 'anuncio_licitacion';
  if (/\bpliego\s+administrativ/.test(n) || n === 'pliego' || /pcap/.test(n)) return 'pliego_administrativo';
  if (/pliego\s+tecnic/.test(n) || /\bppt\b/.test(n) || /prescripciones\s+tecnic/.test(n)) return 'pliego_tecnico';
  if (/condiciones\s+tecnic/.test(n)) return 'pliego_tecnico';
  if (/^adjudicacion$/.test(n) || /resolucion\s+adjudic/.test(n)) return 'resolucion_adjudicacion';
  if (/formalizac/.test(n)) return 'formalizacion';
  if (/acta.*apertura.*sobre\s*(a|administrativ)/.test(n)) return 'acta_apertura_sobre_a';
  if (/acta.*apertura.*sobre\s*(b|tecnic)/.test(n)) return 'acta_apertura_sobre_b';
  if (/acta.*apertura.*sobre\s*(c|economic)/.test(n)) return 'acta_apertura_sobre_c';
  if (/acta.*apertura/.test(n)) return 'acta_apertura';
  if (/anuncio\s+apertura/.test(n)) return 'anuncio_apertura';
  if (/actos\s+publicos|apertura\s+de\s+ofertas/.test(n)) return 'apertura_publica';
  if (/informe.*baremaci/.test(n) || /baremaci.*ofertas/.test(n)) return 'informe_baremacion';
  if (/acta.*propuesta.*adjud/.test(n)) return 'acta_propuesta_adjudicacion';
  if (/anuncio.*otorgamiento/.test(n) || /anuncio.*adjudicaci/.test(n)) return 'anuncio_adjudicacion';
  if (/memoria.*econom/.test(n)) return 'memoria_economica';
  if (/^memoria$/.test(n) || /^memoria\b/.test(n)) return 'memoria';
  if (/^planos$/.test(n) || /^plano\s/.test(n) || /^plano\b/.test(n)) return 'planos';
  if (/acuerdo\s+de\s+iniciac/.test(n)) return 'acuerdo_iniciacion';
  if (/proyecto/.test(n)) return 'proyecto';
  if (/presupuesto/.test(n)) return 'presupuesto';
  if (/anuncio\s+boam|anuncio\s+bocm|anuncio\s+boe|anuncio\s+dou/.test(n)) return 'anuncio_oficial';
  if (/contestacion.*pregunta|aclaracion|f\.?a\.?q\.?/.test(n)) return 'aclaracion';
  if (/replanteo/.test(n)) return 'replanteo';
  if (/modificaci/.test(n)) return 'modificacion';
  if (/rectificaci|corregid/.test(n)) return 'rectificacion';
  if (/desistimiento|renuncia/.test(n)) return 'desistimiento';
  if (/anulaci/.test(n)) return 'anulacion';
  return 'otro';
}

// ─── Scrape HTML del deeplink ───────────────────────────────────────────
console.log(`⏳ Descargando HTML público del expediente...`);
const res = await fetch(row.deeplink, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept-Language': 'es-ES,es;q=0.9' },
});
if (!res.ok) { console.error(`HTTP ${res.status} al bajar HTML`); process.exit(1); }
const html = await res.text();
console.log(`   ${html.length} bytes HTML`);

// Extraer todas las <tr> que contengan enlaces a documentos.
const normalized = html.replace(/&amp;/g, '&');
const trs = [...normalized.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/g)]
  .map((m) => m[0])
  .filter((tr) => /GetDocumentByIdServlet/.test(tr));

// Para cada fila, buscamos todas las anchor-tags con URL de documento y elegimos
// preferentemente la que tenga <img alt="Documento pdf"> o el link único ("Ver").
function pickPdfUrl(tr) {
  // Extraer todos los <a href="...">...</a> que contengan GetDocumentByIdServlet
  const anchorRe = /<a\s[^>]*href="([^"]+GetDocumentByIdServlet[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const anchors = [];
  let m;
  while ((m = anchorRe.exec(tr)) !== null) {
    anchors.push({ url: m[1].replace(/&amp;/g, '&'), inner: m[2] });
  }
  if (anchors.length === 0) return null;
  // Preferir el que tenga 'Documento pdf'
  const pdf = anchors.find((a) => /Documento\s*pdf|pdf-icon/i.test(a.inner));
  if (pdf) return pdf.url;
  // Preferir el que tenga 'Documento' sin html/xml
  const nonHtml = anchors.find((a) => !/Documento\s*(html|xml)|html-icon|xml-icon/i.test(a.inner));
  if (nonHtml) return nonHtml.url;
  // Como último recurso, devolver el primero (aunque sea html)
  return anchors[0].url;
}

const seen = new Set();
const docs = [];
for (const tr of trs) {
  const url = pickPdfUrl(tr);
  if (!url) continue;
  if (seen.has(url)) continue;
  seen.add(url);

  const cleanText = tr.replace(/<[^>]+>/g, ' | ').replace(/\s+/g, ' ').trim();
  const fecha = (cleanText.match(/(\d{2})\/(\d{2})\/(\d{4})\s+\d{2}:\d{2}:\d{2}/) || []);
  const fechaIso = fecha.length ? `${fecha[3]}-${fecha[2]}-${fecha[1]}` : null;
  const parts = cleanText
    .split('|').map((p) => p.trim())
    .filter((p) => p && !/^(Documento (html|xml|pdf)|Sello de Tiempo|Ver(\s+documentos?)?|Publicaci.n en plataforma|https?:)/i.test(p));
  const nombreRaw = parts.find((p) => !/\d{2}\/\d{2}\/\d{4}/.test(p)) ?? parts[0] ?? '';
  const nombre    = decodeEntities(nombreRaw);
  docs.push({ nombre, fecha: fechaIso, tipo: guessTipo(nombre), url });
}

// Ordenar por fecha asc
docs.sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''));

console.log(`📎 ${docs.length} documentos encontrados en HTML:`);
for (const d of docs) {
  const label = `${d.tipo}`.padEnd(32);
  console.log(`   · ${d.fecha ?? '          '}  ${label}  ${d.nombre.slice(0, 60)}`);
}

// ─── Upsert en tabla `documentos` ───────────────────────────────────────
const upsert = db.prepare(`
  INSERT INTO documentos (licitacion_id, tipo, url, fecha_subida, descargado)
  VALUES (?, ?, ?, ?, 0)
  ON CONFLICT(licitacion_id, url) DO UPDATE SET
    tipo         = excluded.tipo,
    fecha_subida = COALESCE(excluded.fecha_subida, documentos.fecha_subida)
`);
let inserted = 0;
for (const d of docs) {
  const r = upsert.run(row.id, d.tipo, d.url, d.fecha);
  if (r.changes) inserted++;
}
console.log(`📝 ${inserted} filas upsert en documentos (total encontrados: ${docs.length})`);

// ─── Descargar PDFs ─────────────────────────────────────────────────────
if (args['no-download']) {
  console.log(`⏭  --no-download: skip descarga`);
  process.exit(0);
}

const destDir = path.join(PDF_DIR, slug);
fs.mkdirSync(destDir, { recursive: true });

let ok = 0, fail = 0;
for (let i = 0; i < docs.length; i++) {
  const d = docs[i];
  // Slug seguro para filename: fecha + tipo + nombre
  const safe = d.nombre.replace(/[^\w\sÁÉÍÓÚáéíóúÑñüÜ.-]/g, '_').replace(/\s+/g, '_').slice(0, 60);
  const filename = `${String(i + 1).padStart(2, '0')}-${d.tipo}-${safe}.pdf`;
  const dest = path.join(destDir, filename);
  if (fs.existsSync(dest)) { console.log(`   ✔ (cache) ${filename}`); ok++; continue; }
  try {
    const r = await fetch(d.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`   ⬇ ${filename}  (${(buf.length / 1024).toFixed(1)} KB)`);
    db.prepare(`UPDATE documentos SET descargado = 1 WHERE licitacion_id = ? AND url = ?`).run(row.id, d.url);
    ok++;
  } catch (e) {
    console.log(`   ✖ ${filename}  ${e.message}`);
    fail++;
  }
}
console.log(`\n✅ ${ok} PDFs descargados · ${fail} fallos · destino: ${destDir}`);
