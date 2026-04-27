#!/usr/bin/env node
/**
 * placsp-extraer-datos-base.mjs · spec §4.ter T
 *
 * Pre-extractor PROGRAMÁTICO (no-LLM) que lee TODO el texto de TODOS los
 * archivos del slug y extrae datos numéricos + estructurales con regex/
 * heurísticas. El objetivo es sacar la lectura de números del path crítico
 * de la sesión Claude — para que NO dependa de que la sesión lea bien.
 *
 * Salidas en `data/placsp-pdfs/<slug>/`:
 *   - _datos_base.json : datos estructurados con archivo + línea + contexto.
 *   - _datos_base.txt  : reporte legible para sesión Claude.
 *
 * El applier (placsp-llm-apply.mjs) valida CRUZADO contra _datos_base.json:
 * si los números del extraccion.json divergen significativamente de los
 * encontrados aquí sin justificación explícita (_override_datos_base), el
 * applier RECHAZA la aplicación.
 *
 * Uso:
 *   node scripts/placsp-extraer-datos-base.mjs --slug=<N>
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
  console.error('Uso: node scripts/placsp-extraer-datos-base.mjs --slug=<N>');
  process.exit(1);
}

const slug = String(args.slug);
const slugDir = path.join(PDF_DIR, slug);
if (!fs.existsSync(slugDir)) {
  console.error(`No existe ${slugDir}`);
  process.exit(1);
}

// ── Lectura de texto por archivo ──────────────────────────────────────────

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
    return null;
  } catch (e) { return null; }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function lineOf(text, idx) {
  return text.slice(0, idx).split('\n').length;
}
function snippet(text, idx, len = 110) {
  return text.slice(Math.max(0, idx - 30), idx + len).replace(/\s+/g, ' ').trim();
}
function findAll(text, regex) {
  const out = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    out.push({ match: m[0], groups: m.slice(1), index: m.index, line: lineOf(text, m.index), context: snippet(text, m.index) });
    if (m.index === regex.lastIndex) regex.lastIndex++;
  }
  return out;
}

// ── Extractores específicos por categoría ─────────────────────────────────

function extraerCantidadesCargadores(text, archivo) {
  const re = /(\d+)\s+(cargadores?|puntos?\s+de\s+(?:re)?carga|estaciones?\s+de\s+(?:re)?carga|tomas?|plazas?\s+(?:dotadas?|con\s+cargador|de\s+(?:re)?carga))/gi;
  return findAll(text, re).map((h) => ({
    archivo, linea: h.line, n: parseInt(h.groups[0], 10), unidad: h.groups[1].toLowerCase(), contexto: h.context,
  }));
}

function extraerUbicaciones(text, archivo) {
  const re = /(\d+)\s+(ubicaciones?|estaciones?|emplazamientos?|porciones?|n[úu]cleos?\s+de\s+poblaci[óo]n)/gi;
  return findAll(text, re).map((h) => ({
    archivo, linea: h.line, n: parseInt(h.groups[0], 10), unidad: h.groups[1].toLowerCase(), contexto: h.context,
  }));
}

function extraerPotencias(text, archivo) {
  const re = /(\d+(?:[.,]\d+)?)\s*kW/g;
  return findAll(text, re).map((h) => ({
    archivo, linea: h.line, kw: parseFloat(h.groups[0].replace(',', '.')), contexto: h.context,
  }));
}

function extraerConectores(text, archivo) {
  const re = /\b(CCS\s*Combo\s*\d?|CCS|CHAdeMO|Mennekes|Tipo\s*2|Tipo\s*1|Schuko|Modo\s*3|Modo\s*4|m\.c\s*[34])\b/gi;
  return findAll(text, re).map((h) => ({
    archivo, linea: h.line, conector: h.match.replace(/\s+/g, ' ').trim(), contexto: h.context,
  }));
}

function extraerCriteriosPonderacion(text, archivo) {
  // Patrones típicos: "Hasta N puntos", "Cantidad Máxima: N", "Ponderación: N", "N puntos sobre M"
  const out = [];
  out.push(...findAll(text, /(?:Hasta|hasta|m[áa]ximo|MAX[IÍ]MO)\s+(\d+(?:[.,]\d+)?)\s+(?:puntos?|pts?)\b/g)
    .map((h) => ({ archivo, linea: h.line, pts: parseFloat(h.groups[0].replace(',', '.')), tipo: 'hasta', contexto: h.context })));
  out.push(...findAll(text, /Cantidad\s+M[áa]xima\s*[:\s]+\s*(\d+(?:[.,]\d+)?)/g)
    .map((h) => ({ archivo, linea: h.line, pts: parseFloat(h.groups[0].replace(',', '.')), tipo: 'cantidad_maxima', contexto: h.context })));
  out.push(...findAll(text, /Ponderaci[óo]n\s*[:\s]+\s*(\d+(?:[.,]\d+)?)/g)
    .map((h) => ({ archivo, linea: h.line, pts: parseFloat(h.groups[0].replace(',', '.')), tipo: 'ponderacion', contexto: h.context })));
  return out;
}

function extraerCanon(text, archivo) {
  const out = [];
  // "X €/m²/año", "X €/plaza/año", "X €/año", "canon mínimo X €"
  out.push(...findAll(text, /(\d+(?:[.,]\d+)?)\s*€\s*\/\s*m[²2]?[\s,/](?:s\s*)?\s*(?:y\s+)?a[ñn]o/g)
    .map((h) => ({ archivo, linea: h.line, monto: parseFloat(h.groups[0].replace(/\./g, '').replace(',', '.')), unidad: '€/m²/año', contexto: h.context })));
  out.push(...findAll(text, /(\d+(?:\.\d{3})*(?:,\d+)?)\s*€\s*\/\s*plaza\s*\/?\s*(?:y\s+)?a[ñn]o/gi)
    .map((h) => ({ archivo, linea: h.line, monto: parseFloat(h.groups[0].replace(/\./g, '').replace(',', '.')), unidad: '€/plaza/año', contexto: h.context })));
  out.push(...findAll(text, /(\d+(?:\.\d{3})*(?:,\d+)?)\s*€\s*\/\s*kWh/gi)
    .map((h) => ({ archivo, linea: h.line, monto: parseFloat(h.groups[0].replace(/\./g, '').replace(',', '.')), unidad: '€/kWh', contexto: h.context })));
  out.push(...findAll(text, /canon\s+(?:m[íi]nimo\s+)?(?:anual\s+)?(?:de\s+|a\s+satisfacer\s+)?(\d+(?:\.\d{3})*(?:,\d+)?)\s*€/gi)
    .map((h) => ({ archivo, linea: h.line, monto: parseFloat(h.groups[0].replace(/\./g, '').replace(',', '.')), unidad: '€', contexto: h.context })));
  return out;
}

function extraerSuperficie(text, archivo) {
  const out = [];
  out.push(...findAll(text, /(\d+(?:[.,]\d+)?)\s*m[²2]\b/g)
    .map((h) => ({ archivo, linea: h.line, m2: parseFloat(h.groups[0].replace(',', '.')), contexto: h.context })));
  return out;
}

function extraerPlazos(text, archivo) {
  const out = [];
  out.push(...findAll(text, /(\d+)\s+a[ñn]os?\b/g)
    .map((h) => ({ archivo, linea: h.line, anos: parseInt(h.groups[0], 10), contexto: h.context })));
  out.push(...findAll(text, /pr[óo]rroga(?:s)?\s+(?:de\s+)?(\d+)\s+a[ñn]os?/gi)
    .map((h) => ({ archivo, linea: h.line, prorroga_anos: parseInt(h.groups[0], 10), contexto: h.context })));
  return out;
}

function extraerGarantias(text, archivo) {
  const out = [];
  out.push(...findAll(text, /garant[íi]a\s+(provisional|definitiva)\s*[:\s]+\s*(\d+(?:[.,]\d+)?)\s*(?:€|EUR)/gi)
    .map((h) => ({ archivo, linea: h.line, tipo: h.groups[0].toLowerCase(), monto: parseFloat(h.groups[1].replace(/\./g, '').replace(',', '.')), unidad: '€', contexto: h.context })));
  out.push(...findAll(text, /garant[íi]a\s+(provisional|definitiva)\s+(?:del\s+)?(\d+(?:[.,]\d+)?)\s*%/gi)
    .map((h) => ({ archivo, linea: h.line, tipo: h.groups[0].toLowerCase(), pct: parseFloat(h.groups[1].replace(',', '.')), unidad: '%', contexto: h.context })));
  return out;
}

function extraerSolvencia(text, archivo) {
  const out = [];
  // "≥ X €/año", "X €/año en", "volumen de negocios..."
  out.push(...findAll(text, /(?:igual\s+o\s+superior\s+a|≥|m[íi]nimo\s+de|al\s+menos)\s+(\d+(?:\.\d{3})*(?:,\d+)?)\s*(?:€|EUR)\s*\/?\s*a[ñn]o?/gi)
    .map((h) => ({ archivo, linea: h.line, monto: parseFloat(h.groups[0].replace(/\./g, '').replace(',', '.')), unidad: '€/año', contexto: h.context })));
  return out;
}

function detectarMencionesAnexos(text, archivo) {
  const re = /\bAnexo\s+(I{1,3}|IV|V|VI{0,3}|IX|X|\d+)\b/gi;
  return findAll(text, re).map((h) => ({
    archivo, linea: h.line, anexo: h.match.replace(/\s+/g, ' ').trim(), contexto: h.context,
  }));
}

function detectarSeccionesCriticas(text, archivo) {
  const out = [];
  out.push(...findAll(text, /AUTOEVALUACI[ÓO]N|PUNTUACI[ÓO]N\s+OFERTA|Modelo\s+de\s+oferta\s+econ[óo]mica/gi)
    .map((h) => ({ archivo, linea: h.line, seccion: h.match, contexto: h.context })));
  out.push(...findAll(text, /Cl[áa]usula\s+(?:de\s+)?Criterios?\s+de\s+Adjudicaci[óo]n|Art[íi]culo\s+\d+\.?\s+Criterios?\s+de\s+(?:adjudicaci[óo]n|valoraci[óo]n)/gi)
    .map((h) => ({ archivo, linea: h.line, seccion: h.match, contexto: h.context })));
  return out;
}

function detectarDiscrepanciasNumericas(cantidades) {
  // Si hay menciones contradictorias del mismo "tipo de unidad" con números distintos.
  const grouped = {};
  for (const c of cantidades) {
    const k = c.unidad;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(c);
  }
  const conflictos = [];
  for (const [unidad, items] of Object.entries(grouped)) {
    const distintos = [...new Set(items.map((i) => i.n))];
    if (distintos.length > 1) {
      // Solo flageamos si los números más altos son significativamente distintos
      const max = Math.max(...distintos);
      const otros = distintos.filter((d) => d !== max && d > 0);
      if (otros.length > 0 && otros.some((o) => max / o > 1.5)) {
        conflictos.push({ unidad, valores: distintos.sort((a, b) => b - a), apariciones: items.length });
      }
    }
  }
  return conflictos;
}

// ── Loop principal ────────────────────────────────────────────────────────

const archivos = fs.readdirSync(slugDir)
  .filter((f) => !f.startsWith('_') && !f.startsWith('.') && !/^extraccion/.test(f))
  .filter((f) => /\.(pdf|docx?|xlsx?|pptx)$/i.test(f))
  .sort();

const datosBase = {
  slug,
  generado_en: new Date().toISOString(),
  archivos_leidos: [],
  cantidades_cargadores: [],
  ubicaciones_mencionadas: [],
  potencias_kw: [],
  conectores: [],
  criterios_ponderacion: [],
  canon: [],
  superficie_m2: [],
  plazos_anos: [],
  garantias: [],
  solvencia: [],
  anexos_mencionados: [],
  secciones_criticas: [],
  discrepancias: [],
};

for (const f of archivos) {
  const fullPath = path.join(slugDir, f);
  const texto = extractText(fullPath);
  if (!texto) {
    datosBase.archivos_leidos.push({ archivo: f, leible: false, lineas: 0 });
    continue;
  }
  const lineas = texto.split('\n').length;
  datosBase.archivos_leidos.push({ archivo: f, leible: true, lineas, chars: texto.length });

  datosBase.cantidades_cargadores.push(...extraerCantidadesCargadores(texto, f));
  datosBase.ubicaciones_mencionadas.push(...extraerUbicaciones(texto, f));
  datosBase.potencias_kw.push(...extraerPotencias(texto, f));
  datosBase.conectores.push(...extraerConectores(texto, f));
  datosBase.criterios_ponderacion.push(...extraerCriteriosPonderacion(texto, f));
  datosBase.canon.push(...extraerCanon(texto, f));
  datosBase.superficie_m2.push(...extraerSuperficie(texto, f));
  datosBase.plazos_anos.push(...extraerPlazos(texto, f));
  datosBase.garantias.push(...extraerGarantias(texto, f));
  datosBase.solvencia.push(...extraerSolvencia(texto, f));
  datosBase.anexos_mencionados.push(...detectarMencionesAnexos(texto, f));
  datosBase.secciones_criticas.push(...detectarSeccionesCriticas(texto, f));
}

datosBase.discrepancias.push(...detectarDiscrepanciasNumericas(datosBase.cantidades_cargadores));

// ── Guardar JSON + reporte legible ────────────────────────────────────────

const outJson = path.join(slugDir, '_datos_base.json');
fs.writeFileSync(outJson, JSON.stringify(datosBase, null, 2), 'utf8');

const lines = [];
const log = (s = '') => lines.push(s);

log(`# 📊 DATOS BASE EXTRAÍDOS · slug ${slug}`);
log(`# Generado: ${datosBase.generado_en}`);
log(`# Archivos leídos: ${datosBase.archivos_leidos.filter((a) => a.leible).length} de ${archivos.length}`);
log('');

log(`## Archivos`);
for (const a of datosBase.archivos_leidos) {
  log(`  · ${a.archivo} — ${a.leible ? `${a.lineas} líneas, ${a.chars} chars` : 'NO LEÍBLE'}`);
}
log('');

const renderTopN = (titulo, arr, fmt, n = 20) => {
  log(`## ${titulo} (${arr.length} ${arr.length === 1 ? 'aparición' : 'apariciones'})`);
  arr.slice(0, n).forEach((x) => log(`  L${x.linea} [${x.archivo}] · ${fmt(x)} · "${x.contexto}"`));
  if (arr.length > n) log(`  ... ${arr.length - n} más`);
  log('');
};

renderTopN('🔌 Cantidades de cargadores/puntos/tomas/plazas', datosBase.cantidades_cargadores, (x) => `${x.n} ${x.unidad}`);
renderTopN('📍 Ubicaciones mencionadas', datosBase.ubicaciones_mencionadas, (x) => `${x.n} ${x.unidad}`);
renderTopN('⚡ Potencias kW', datosBase.potencias_kw, (x) => `${x.kw} kW`, 30);
renderTopN('🔁 Conectores y modos', datosBase.conectores, (x) => x.conector, 30);
renderTopN('⚖️ Criterios y ponderaciones', datosBase.criterios_ponderacion, (x) => `${x.pts} pts (${x.tipo})`);
renderTopN('💶 Canon (todas las apariciones)', datosBase.canon, (x) => `${x.monto} ${x.unidad}`);
renderTopN('📐 Superficies m²', datosBase.superficie_m2, (x) => `${x.m2} m²`, 15);
renderTopN('📅 Plazos en años', datosBase.plazos_anos, (x) => x.anos !== undefined ? `${x.anos} años` : `prórroga ${x.prorroga_anos} años`);
renderTopN('🛡️ Garantías', datosBase.garantias, (x) => x.unidad === '%' ? `${x.tipo} ${x.pct}%` : `${x.tipo} ${x.monto} €`);
renderTopN('💼 Solvencia económica', datosBase.solvencia, (x) => `${x.monto} ${x.unidad}`);
renderTopN('📑 Anexos mencionados', datosBase.anexos_mencionados, (x) => x.anexo);
renderTopN('🚨 Secciones críticas detectadas (Anexo I / AUTOEVALUACIÓN)', datosBase.secciones_criticas, (x) => x.seccion);

if (datosBase.discrepancias.length > 0) {
  log('## ⚠️ DISCREPANCIAS NUMÉRICAS DETECTADAS (FLAG CRÍTICO)');
  for (const d of datosBase.discrepancias) {
    log(`  ❗ "${d.unidad}": valores distintos detectados [${d.valores.join(', ')}] en ${d.apariciones} apariciones — REVISAR cuál es el correcto`);
  }
  log('');
}

log('# 🧭 REGLAS PARA LA SESIÓN CLAUDE');
log('');
log('1. Los NÚMEROS del extraccion.json deben coincidir con los de _datos_base.json');
log('   (con tolerancia razonable). Si divergen, justificar con _override_datos_base.');
log('2. Si _datos_base.json reporta DISCREPANCIAS NUMÉRICAS, decidir cuál valor es');
log('   el correcto leyendo el contexto + marcar flag_criterios_incompletos:true');
log('   si el pliego es internamente contradictorio.');
log('3. Si una sección crítica (Anexo I / AUTOEVALUACIÓN) está detectada, LEERLA');
log('   ANTES de cerrar la extracción.');
log('4. Si las DISCREPANCIAS no se pueden resolver, documentar en notas_pliego.');

const outTxt = path.join(slugDir, '_datos_base.txt');
fs.writeFileSync(outTxt, lines.join('\n'), 'utf8');

console.log(`✅ ${path.relative(ROOT, outJson)}  (${(fs.statSync(outJson).size / 1024).toFixed(1)} KB)`);
console.log(`✅ ${path.relative(ROOT, outTxt)}  (${(fs.statSync(outTxt).size / 1024).toFixed(1)} KB)`);
console.log(`   ${datosBase.cantidades_cargadores.length} cantidades · ${datosBase.criterios_ponderacion.length} ponderaciones · ${datosBase.canon.length} canon · ${datosBase.discrepancias.length} discrepancias`);
if (datosBase.discrepancias.length > 0) {
  console.log('\n⚠️ DISCREPANCIAS:');
  datosBase.discrepancias.forEach((d) => console.log(`  ❗ "${d.unidad}": ${d.valores.join(' vs ')}`));
}
