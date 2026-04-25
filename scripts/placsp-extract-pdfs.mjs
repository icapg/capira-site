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
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import AdmZip   from 'adm-zip';

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
  INSERT INTO documentos (licitacion_id, tipo, nombre_original, url, fecha_subida, descargado)
  VALUES (?, ?, ?, ?, ?, 0)
  ON CONFLICT(licitacion_id, url) DO UPDATE SET
    tipo            = excluded.tipo,
    nombre_original = COALESCE(excluded.nombre_original, documentos.nombre_original),
    fecha_subida    = COALESCE(excluded.fecha_subida, documentos.fecha_subida)
`);
let inserted = 0;
for (const d of docs) {
  const r = upsert.run(row.id, d.tipo, d.nombre, d.url, d.fecha);
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

// PLACSP a veces sirve un ZIP con extensión .pdf cuando un "documento"
// agrupa varios anexos (planos, fotos, etc.). Detectamos por magic bytes
// `PK\x03\x04` y descomprimimos los PDFs internos en la misma carpeta.
function isZipBuffer(buf) {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

// Algunos PDFs (típicamente el "Pliego" estructurado de PLACSP) tienen
// hyperlinks a otros documentos del expediente embebidos como anotaciones.
// Esos enlaces no aparecen en el HTML del listado, pero sí en el binario
// del PDF. Los extraemos con regex sobre la representación textual cruda.
const PLACSP_DOC_URL_RE = /https?:\/\/contrataciondelestado\.es\/FileSystem\/servlet\/GetDocumentByIdServlet\?[^\s<>"\\)]+/g;
function findEmbeddedDocUrls(buf) {
  // Las URLs aparecen en el stream sin codificación, así que basta con leer el
  // buffer como latin1 (preserva bytes 1:1) y buscar el patrón.
  const txt = buf.toString('latin1');
  const found = [...txt.matchAll(PLACSP_DOC_URL_RE)].map((m) => m[0]);
  // Normalizar entidades (&amp;) y deduplicar.
  return [...new Set(found.map((u) => u.replace(/&amp;/g, '&').trim()))];
}

// Cuando descubrimos un PDF embebido en otro, intentamos inferir su `tipo`
// (pliego_administrativo, pliego_tecnico, etc.) leyendo las primeras páginas
// del PDF descargado y matcheando keywords en el título. Si no lo logramos,
// caemos al tipo del padre con sufijo "_anexo" o a 'enlazado'.
function inferTipoFromText(head, fallback) {
  if (!head) return fallback ?? 'enlazado';
  const t = head.toUpperCase();
  if (/PLIEGO\s+DE\s+CONDICIONES\s+ECON[ÓO]MICO[\s-]?ADMINISTRATIVAS|PLIEGO\s+DE\s+CL[ÁA]USULAS\s+ADMINISTRATIVAS|\bPCAP\b/.test(t)) return 'pliego_administrativo';
  if (/PLIEGO\s+DE\s+PRESCRIPCIONES\s+T[ÉE]CNICAS|PRESCRIPCIONES\s+T[ÉE]CNICAS\s+PARTICULARES|\bPPT\b/.test(t)) return 'pliego_tecnico';
  if (/MEMORIA\s+(JUSTIFICATIVA|ECON[ÓO]MICA|EXPLICATIVA)/.test(t)) return 'memoria';
  if (/PROYECTO\s+(DE|T[ÉE]CNICO|UNIFICADO)/.test(t)) return 'proyecto';
  if (/INFORME\s+(DE\s+)?BAREMACI/.test(t)) return 'informe_baremacion';
  if (/RESOLUCI[ÓO]N\s+DE\s+ADJUDICACI/.test(t)) return 'resolucion_adjudicacion';
  if (/FORMALIZACI[ÓO]N/.test(t)) return 'formalizacion';
  if (/RECTIFICACI[ÓO]N|CORRECCI[ÓO]N/.test(t)) return 'rectificacion';
  if (/PRESUPUESTO/.test(t)) return 'presupuesto';
  if (/\bPLANO\b|PLANTA|ALZADO|SECCI[ÓO]N\s+CONSTRUCT/.test(t)) return 'planos';
  if (/ACTA\s+DE\s+APERTURA/.test(t)) return 'acta_apertura';
  if (/ANUNCIO\s+DE\s+LICITACI/.test(t)) return 'anuncio_licitacion';
  return fallback ?? 'enlazado';
}
function inferTipoFromPdfFile(filePath, fallback) {
  try {
    const head = execSync(`pdftotext -enc UTF-8 -l 2 "${filePath}" -`, {
      encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'],
    }).slice(0, 3000);
    return inferTipoFromText(head, fallback);
  } catch {
    return fallback ?? 'enlazado';
  }
}
function expandZip(zipPath, baseFilename, destDir) {
  const baseNoExt = baseFilename.replace(/\.pdf$/i, '');
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().filter((e) => !e.isDirectory && /\.pdf$/i.test(e.entryName));
  if (entries.length === 0) {
    console.log(`     ⚠ ZIP sin PDFs internos`);
    return [];
  }
  const extracted = [];
  entries.forEach((e, idx) => {
    const innerName = path.basename(e.entryName).replace(/[^\w\sÁÉÍÓÚáéíóúÑñüÜ.-]/g, '_');
    const letter = String.fromCharCode(97 + idx); // a,b,c…
    const outName = `${baseNoExt}_${letter}-${innerName}`;
    const outPath = path.join(destDir, outName);
    if (!fs.existsSync(outPath)) fs.writeFileSync(outPath, e.getData());
    extracted.push(outName);
  });
  console.log(`     📦 ZIP descomprimido → ${extracted.length} PDFs internos`);
  // Renombrar el archivo original a .zip para que pdftotext no lo procese.
  const zipDest = path.join(destDir, `${baseNoExt}.zip`);
  if (zipPath !== zipDest && !fs.existsSync(zipDest)) fs.renameSync(zipPath, zipDest);
  else if (zipPath !== zipDest) fs.unlinkSync(zipPath);
  return extracted;
}

// Cola FIFO: primero los docs detectados en el HTML del expediente, después
// se irán agregando los enlaces internos descubiertos al escanear cada PDF
// (el "Pliego" estructurado de PLACSP suele incluir hyperlinks al PCAP y PPT
// reales subidos por el órgano contratante).
const queue = docs.map((d, i) => ({ ...d, idx: i + 1, parent: null, subIdx: 0 }));
const seenUrls = new Set(queue.map((d) => d.url));
let ok = 0, fail = 0, zipExpanded = 0, embeddedFound = 0;

function enqueueEmbedded(buf, parent) {
  const found = findEmbeddedDocUrls(buf);
  for (const innerUrl of found) {
    if (seenUrls.has(innerUrl)) continue;
    seenUrls.add(innerUrl);
    parent.subCount = (parent.subCount ?? 0) + 1;
    queue.push({
      nombre: `enlace_interno_${parent.subCount}`,
      // Heredamos la fecha del padre como fecha_subida estimada del hijo
      // (PLACSP no expone una fecha distinta para los enlaces embebidos).
      fecha:  parent.fecha ?? null,
      tipo:   'enlazado',
      url:    innerUrl,
      parent,
      subIdx: parent.subCount,
    });
    embeddedFound++;
  }
}

// Registra un PDF embebido en la tabla `documentos` para que aparezca en el
// dashboard como documento del expediente, igual que los del listado HTML.
// Idempotente vía ON CONFLICT del upsert.
// Nombres canónicos cuando el tipo inferido es claro (más legibles que la
// primera línea cruda del PDF, que suele estar truncada o ser ambigua).
const NOMBRE_CANONICO = {
  pliego_administrativo:    'Pliego de Cláusulas Administrativas Particulares (PCAP)',
  pliego_tecnico:           'Pliego de Prescripciones Técnicas Particulares (PPT)',
  memoria:                  'Memoria',
  proyecto:                 'Proyecto técnico',
  informe_baremacion:       'Informe de baremación',
  resolucion_adjudicacion:  'Resolución de adjudicación',
  formalizacion:            'Acta de formalización',
  rectificacion:            'Rectificación',
  presupuesto:              'Presupuesto',
  planos:                   'Planos',
  acta_apertura:            'Acta de apertura',
  anuncio_licitacion:       'Anuncio de licitación',
};
function registerEmbeddedDoc(d, dest) {
  const tipoInferido = inferTipoFromPdfFile(dest, 'enlazado');
  d.tipo = tipoInferido;
  // Para los embebidos, el nombre canónico por tipo inferido suele ser más
  // claro que el título crudo extraído del PDF (que viene truncado a 1 línea).
  let nombreInferido = NOMBRE_CANONICO[tipoInferido]
    ?? inferNombreFromPdfFile(dest)
    ?? `Anexo del ${d.parent?.tipo ?? 'expediente'}`;
  d.nombre = nombreInferido;
  upsert.run(row.id, tipoInferido, nombreInferido, d.url, d.fecha ?? d.parent?.fecha ?? null);
  db.prepare(`UPDATE documentos SET descargado = 1 WHERE licitacion_id = ? AND url = ?`).run(row.id, d.url);
  return tipoInferido;
}

// Extrae el título del PDF embebido a partir de las primeras líneas. Útil para
// que el dashboard muestre "Pliego de Cláusulas Administrativas Particulares"
// en lugar de "enlace_interno_1".
function inferNombreFromPdfFile(filePath) {
  try {
    const head = execSync(`pdftotext -enc UTF-8 -layout -l 1 "${filePath}" -`, {
      encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'],
    });
    const lines = head.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    // Buscar la primera línea que parezca un título (mayúsculas o "PLIEGO ...")
    for (const line of lines.slice(0, 20)) {
      if (line.length < 10 || line.length > 200) continue;
      if (/^(EXPTE|CSV|D\.E|HASH|Fecha|Firmado|Documento|Cód|Verificación|Información|Página)/i.test(line)) continue;
      // Línea con ≥ 60% de letras mayúsculas suele ser título
      const upperRatio = (line.match(/[A-ZÁÉÍÓÚÑ]/g) ?? []).length / line.length;
      if (upperRatio > 0.5) return line.replace(/\s+/g, ' ').slice(0, 160);
    }
    return null;
  } catch { return null; }
}

while (queue.length > 0) {
  const d = queue.shift();
  const safe = d.nombre.replace(/[^\w\sÁÉÍÓÚáéíóúÑñüÜ.-]/g, '_').replace(/\s+/g, '_').slice(0, 60);
  const prefix = d.parent
    ? `${String(d.parent.idx).padStart(2, '0')}${String.fromCharCode(64 + d.subIdx)}` // 02A, 02B, ...
    : `${String(d.idx).padStart(2, '0')}`;
  const filename = `${prefix}-${d.tipo}-${safe}.pdf`;
  const dest = path.join(destDir, filename);
  const zipDest = dest.replace(/\.pdf$/i, '.zip');
  // Cache: ya bajado como .pdf o ya renombrado a .zip
  if (fs.existsSync(dest) || fs.existsSync(zipDest)) {
    console.log(`   ✔ (cache) ${filename}`);
    ok++;
    // Si el archivo en cache es un PDF embebido (tiene parent), asegurarse de
    // que esté registrado en la tabla `documentos` con el tipo correcto.
    if (d.parent && fs.existsSync(dest)) {
      const tipoInf = registerEmbeddedDoc(d, dest);
      console.log(`     ↳ registrado como '${tipoInf}' en tabla documentos`);
    }
    // Aún en cache, escanear enlaces internos para descubrir docs nuevos.
    try {
      const buf = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
      if (buf && !isZipBuffer(buf)) enqueueEmbedded(buf, d);
    } catch {}
    continue;
  }
  try {
    const r = await fetch(d.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    // Si la URL devuelve HTML/XML (versiones alternas del mismo doc), saltarla.
    const head4 = buf.slice(0, 4).toString();
    const head4hex = buf.slice(0, 4).toString('hex');
    if (head4 !== '%PDF' && head4hex !== '504b0304') {
      console.log(`   ↪ skip ${filename}  (no es PDF/ZIP, magic=${head4hex})`);
      continue;
    }
    fs.writeFileSync(dest, buf);
    const note = d.parent ? ` ← anidado bajo ${String(d.parent.idx).padStart(2, '0')}` : '';
    console.log(`   ⬇ ${filename}  (${(buf.length / 1024).toFixed(1)} KB)${note}`);
    if (isZipBuffer(buf)) {
      const innerCount = expandZip(dest, filename, destDir).length;
      if (innerCount > 0) zipExpanded++;
    } else {
      enqueueEmbedded(buf, d);
      // Registrar el PDF embebido en `documentos` con tipo inferido del título
      if (d.parent) {
        const tipoInf = registerEmbeddedDoc(d, dest);
        console.log(`     ↳ registrado como '${tipoInf}' en tabla documentos`);
      }
    }
    db.prepare(`UPDATE documentos SET descargado = 1 WHERE licitacion_id = ? AND url = ?`).run(row.id, d.url);
    ok++;
  } catch (e) {
    console.log(`   ✖ ${filename}  ${e.message}`);
    fail++;
  }
}
console.log(`\n✅ ${ok} PDFs descargados · ${fail} fallos${zipExpanded ? ` · ${zipExpanded} ZIPs descomprimidos` : ''}${embeddedFound ? ` · ${embeddedFound} enlaces internos seguidos` : ''} · destino: ${destDir}`);
