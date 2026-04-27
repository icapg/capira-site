#!/usr/bin/env node
/**
 * placsp-cobertura-pliego.mjs · spec §4.ter Q
 *
 * Genera un REPORTE EXHAUSTIVO de qué hay en cada archivo del slug, ANTES
 * de que la sesión Claude empiece a extraer. El objetivo es garantizar que
 * el extractor recorra TODOS los puntos de control léxicos del pliego, no
 * solo los que encuentra primero.
 *
 * Para cada archivo:
 *   - Extrae texto completo (PDF vía pdftotext, DOCX/XLSX/PPTX vía OOXML).
 *   - Cuenta líneas, palabras, páginas estimadas.
 *   - Busca patrones léxicos críticos del checklist §4.ter Q y reporta
 *     dónde aparecen (línea exacta + texto contextual).
 *   - Detecta secciones estándar del pliego (Anexos I/II/III/IV, cláusulas
 *     numeradas, modelos de oferta, etc.).
 *   - Compara ponderaciones de criterios entre Anuncio HTML, PCAP
 *     articulado y Anexo I → flag de discrepancia.
 *
 * Salida:
 *   - data/placsp-pdfs/<slug>/_cobertura.txt — reporte legible para sesión Claude.
 *   - Resumen en stdout con flags críticos.
 *
 * Uso:
 *   node scripts/placsp-cobertura-pliego.mjs --slug=<N>
 *
 * Es OBLIGATORIO ejecutar este script ANTES de empezar a escribir el
 * extraccion.json. La sesión Claude usa el reporte _cobertura.txt como
 * guía exhaustiva de "qué hay y dónde".
 */

import fs from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import AdmZip from 'adm-zip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const PDF_DIR   = path.join(ROOT, 'data', 'placsp-pdfs');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

if (!args.slug) {
  console.error('Uso: node scripts/placsp-cobertura-pliego.mjs --slug=<N>');
  process.exit(1);
}

const slug = String(args.slug);
const slugDir = path.join(PDF_DIR, slug);
if (!fs.existsSync(slugDir)) {
  console.error(`No existe ${slugDir}`);
  process.exit(1);
}

// ── Patrones léxicos críticos del checklist §4.ter Q ──────────────────────

const PATRONES = {
  // Estructura del pliego
  anexos:        /\b(Anexo|ANEXO)\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\b/g,
  clausulas:     /\b(Cl[áa]usula|Art[íi]culo|CL[ÁA]USULA|ART[ÍI]CULO)\s+(\d+|primera|segunda|tercera|cuarta|quinta|sexta|s[ée]ptima|octava|novena|d[ée]cima)/gi,
  sobres:        /\b(Sobre|SOBRE)\s+(N[º°.]\s*)?\.?\s*([1-9ABCabc])/g,
  modelosOferta: /modelo\s+de\s+(oferta|proposici[óo]n|declaraci[óo]n)/gi,
  // Criterios y ponderaciones
  ponderacion:   /\b(?:Hasta|hasta|m[áa]ximo|MAX[IÍ]MO|Ponderaci[óo]n|PONDERACI[ÓO]N)\s*[:\s]+\s*(\d+(?:[.,]\d+)?)\s*(?:puntos?|%|pts?)/g,
  cantidadMax:   /Cantidad\s+M[áa]xima\s*[:\s]+\s*(\d+(?:[.,]\d+)?)/g,
  formula:       /\b(P\s*=|Y\s*=|Pi\s*=|Puntos\s*=)\s*[^.\n]{3,80}/g,
  autoEval:      /AUTOEVALUACI[ÓO]N|PUNTUACI[ÓO]N\s+OFERTA/g,
  // Mejoras
  mejoras:       /\b(Mejora|MEJORA|mejora)s?\s+(de|del|en|al|por|—|-)/g,
  ampliacion:    /\b(Ampliaci[óo]n|incremento|adicional|m[áa]s\s+puntos)/gi,
  // Hardware / técnico
  hardware:      /\b(rec(?:arga|argas?|argas?)|cargador|kW|CCS|CHAdeMO|Mennekes|Tipo\s+2|modo\s+[34])/gi,
  potencia:      /\b\d+(?:[.,]\d+)?\s*kW\b/g,
  // Económico
  canon:         /\bcanon\b/gi,
  euros:         /\b\d+(?:[.,]\d+)?\s*€/g,
  porcentajePct: /\b(\d+(?:[.,]\d+)?)\s*%/g,
  // Plazos
  anos:          /\b(\d+)\s+(?:años?|anualidades?)/gi,
  prorroga:      /\b(pr[óo]rroga|prorrogable)/gi,
  // Garantías
  garantia:      /\b(garant[íi]a|GARANT[ÍI]A)\s+(provisional|definitiva)/gi,
  // Solvencia
  solvencia:     /\bsolvencia\s+(econ[óo]mica|t[ée]cnica|profesional|financiera)/gi,
  // Estado de la licitación
  formalizacion: /\bformalizaci[óo]n\s+del\s+contrato/gi,
  adjudicacion:  /\bresoluci[óo]n\s+de\s+adjudicaci[óo]n/gi,
  desierta:      /\b(declarada|declarar|declaro)\s+(desierta|nulo|nula)/gi,
  // Q&A
  qa:            /\b(Q&A|preguntas?\s+y\s+respuestas?|aclaraci[óo]n\s+oficial|Comunicaci[óo]n)/gi,
};

// ── Extracción de texto por archivo ───────────────────────────────────────

function extractText(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  try {
    if (ext === 'pdf') {
      return execFileSync('pdftotext', ['-enc', 'UTF-8', '-q', filePath, '-'], {
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 50 * 1024 * 1024,
        windowsHide: true,
      }).toString('utf8');
    }
    if (['docx', 'xlsx', 'pptx'].includes(ext)) {
      const zip = new AdmZip(filePath);
      const entries = zip.getEntries();
      let texto = '';
      const isDocx = ext === 'docx';
      const isXlsx = ext === 'xlsx';
      const isPptx = ext === 'pptx';
      for (const e of entries) {
        const ok =
          (isDocx && e.entryName === 'word/document.xml') ||
          (isXlsx && (e.entryName === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(e.entryName))) ||
          (isPptx && /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName));
        if (ok) texto += '\n' + e.getData().toString('utf8').replace(/<[^>]+>/g, ' ');
      }
      return texto.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    }
    return null; // formato no leíble
  } catch (e) {
    return `<<error: ${e.message}>>`;
  }
}

// ── Búsqueda de patrones con líneas exactas ───────────────────────────────

function findPatternLines(texto, regex) {
  if (!texto || typeof texto !== 'string') return [];
  const lines = texto.split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    regex.lastIndex = 0;
    if (regex.test(line)) {
      hits.push({ line: i + 1, text: line.trim().replace(/\s+/g, ' ').slice(0, 140) });
    }
  });
  return hits;
}

// ── Generar reporte ───────────────────────────────────────────────────────

const archivos = fs.readdirSync(slugDir)
  .filter((f) => !f.startsWith('_') && !f.startsWith('.') && !/^extraccion/.test(f))
  .filter((f) => /\.(pdf|docx?|xlsx?|pptx)$/i.test(f))
  .sort();

const lines = [];
const log = (s = '') => lines.push(s);

log(`# 📋 COBERTURA DEL PLIEGO · slug ${slug}`);
log(`# Generado: ${new Date().toISOString()}`);
log(`# Archivos a recorrer (${archivos.length}):`);
log('');

const reportePorArchivo = [];
const banderasGlobales = [];

for (const f of archivos) {
  const fullPath = path.join(slugDir, f);
  const sizeKb = (fs.statSync(fullPath).size / 1024).toFixed(1);
  const texto = extractText(fullPath);
  if (texto == null) {
    log(`## ⚠ ${f} (${sizeKb} KB) — formato no leíble (omitido)`);
    log('');
    continue;
  }
  if (typeof texto === 'string' && texto.startsWith('<<error')) {
    log(`## ❌ ${f} (${sizeKb} KB) — ${texto}`);
    log('');
    continue;
  }
  const totalLines = texto.split('\n').length;
  const totalWords = texto.split(/\s+/).filter(Boolean).length;
  const pageBreaks = (texto.match(/\f/g) ?? []).length;
  const pages = pageBreaks > 0 ? pageBreaks + 1 : Math.max(1, Math.round(totalLines / 50));

  log(`## 📄 ${f}`);
  log(`   - tamaño:   ${sizeKb} KB`);
  log(`   - líneas:   ${totalLines}`);
  log(`   - palabras: ${totalWords}`);
  log(`   - páginas:  ~${pages}`);
  log('');

  const stats = {};
  for (const [name, re] of Object.entries(PATRONES)) {
    const hits = findPatternLines(texto, re);
    stats[name] = hits.length;
    if (hits.length > 0) {
      const sample = hits.slice(0, 5);
      log(`   🔍 ${name} (${hits.length} ${hits.length === 1 ? 'aparición' : 'apariciones'}):`);
      for (const h of sample) {
        log(`      L${h.line}: ${h.text}`);
      }
      if (hits.length > 5) log(`      ... ${hits.length - 5} más`);
    }
  }
  log('');

  reportePorArchivo.push({ archivo: f, paginas: pages, lineas: totalLines, stats });

  // Flags por archivo
  if (stats.anexos > 0) {
    banderasGlobales.push(`⚠️  ${f} contiene ${stats.anexos} mención(es) a Anexos — RECORRER esos Anexos enteros`);
  }
  if (stats.autoEval > 0) {
    banderasGlobales.push(`⚠️  ${f} contiene una sección "AUTOEVALUACIÓN / PUNTUACIÓN OFERTA" — típicamente Anexo I con criterios extra. LEER esa sección entera`);
  }
  if (stats.qa > 0) {
    banderasGlobales.push(`⚠️  ${f} menciona Q&A / aclaraciones — verificar si hay overrides al articulado`);
  }
  if (stats.desierta > 0) {
    banderasGlobales.push(`🚨 ${f} contiene "DESIERTA / nula" — la licitación pudo haberse declarado desierta`);
  }
}

log('');
log('# 🧭 GUÍA OBLIGATORIA PARA LA SESIÓN CLAUDE');
log('');
log('Antes de cerrar el extraccion.json, confirmar EXPLÍCITAMENTE:');
log('');
log(' [ ] He leído de inicio a fin TODOS los archivos listados arriba (líneas 1 a N).');
log(' [ ] He recorrido TODOS los Anexos del PCAP (I, II, III, IV…) — no solo el articulado.');
log(' [ ] He recorrido la cláusula 6 del PPT (especificaciones técnicas) hasta el final.');
log(' [ ] He leído todas las notas/aclaraciones (.docx) presentes en el slug.');
log(' [ ] He comparado las ponderaciones de criterios entre 3 fuentes:');
log('       (a) Anuncio PLACSP HTML  (b) PCAP cláusula articulada  (c) PCAP Anexo I modelo de oferta');
log('     Si hay discrepancias → marcar flag_criterios_incompletos:true + nota explicativa.');
log(' [ ] He verificado que Σ pesos top-level (peso_economico + peso_tecnico) = lo que dice el pliego.');
log('     Si el pliego tiene errata (suma ≠ 100), preservar la suma LITERAL — NO normalizar.');
log(' [ ] He verificado coherencia entre num_cargadores_minimo y Σ ubicaciones[!es_existente && !es_opcional].num_cargadores_total.');
log(' [ ] He documentado todos los flags pendientes en notas_pliego con texto narrativo claro.');
log('');

if (banderasGlobales.length > 0) {
  log('# 🚨 ATENCIÓN PARTICULAR EN ESTE SLUG');
  log('');
  for (const b of banderasGlobales) log(b);
  log('');
}

log('# 📊 TABLA RESUMEN PATRONES POR ARCHIVO');
log('');
const cols = ['archivo', 'lns', 'pgs', ...Object.keys(PATRONES)];
log(cols.map((c) => c.padEnd(c === 'archivo' ? 56 : 4)).join(' '));
log('-'.repeat(cols.reduce((s, c) => s + (c === 'archivo' ? 56 : 5), 0)));
for (const r of reportePorArchivo) {
  const row = [
    r.archivo.slice(0, 56).padEnd(56),
    String(r.lineas).padEnd(4),
    String(r.paginas).padEnd(4),
    ...Object.keys(PATRONES).map((k) => String(r.stats[k] || '·').padEnd(4)),
  ];
  log(row.join(' '));
}

const out = path.join(slugDir, '_cobertura.txt');
fs.writeFileSync(out, lines.join('\n'), 'utf8');

console.log(`✅ Reporte generado · ${out}`);
console.log(`   ${archivos.length} archivos analizados`);
console.log(`   ${banderasGlobales.length} banderas críticas`);
if (banderasGlobales.length > 0) {
  console.log('\n🚨 ATENCIÓN:');
  banderasGlobales.forEach((b) => console.log('  ' + b));
}
console.log(`\nLeer ${path.relative(ROOT, out)} antes de empezar la extracción.`);
