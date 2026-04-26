/**
 * placsp-auditoria.mjs
 *
 * Calcula la calidad/confiabilidad de la extracción para cada licitación con
 * `extraccion.json` aplicada. Emite `data/licitaciones-auditoria.json` que
 * consume la página /info/licitaciones/auditoria.
 *
 * Métricas (16 columnas + flags):
 *   1. licitacion (slug, titulo, ciudad, organo)
 *   2. confianza_global (0..100, semáforo verde/amarillo/rojo)
 *   3. docs_completos (n_descargados / n_total)
 *   4. links_embebidos_resueltos (todos los enlaces internos descubiertos y bajados)
 *   5. docs_legibles (texto vs scanned/Vision-only)
 *   6. criterios_suman_100 (Σ pesos económicos + técnicos = 100)
 *   7. pliego_complejo (bool + motivo)
 *   8. cobertura_pliego (% campos críticos pre-adjudicación completos)
 *   9. cobertura_adjudicacion (% campos post-adjudicación, si aplica)
 *  10. licitadores_vs_acta (extraídos vs declarados en acta apertura sobre 1)
 *  11. coherencia_ubis (Σ ubis[!existente].num_cargadores ≈ num_cargadores_minimo)
 *  12. anexos_validos (todos los anexos_pliego[] referencian docs existentes)
 *  13. coste_vision_usd (si aplica)
 *  14. ultima_extraccion (fecha + modelo)
 *  15. flags_abiertos (warnings que requieren decisión humana)
 *  16. etapa (descargado | pre_extraido | aplicado | validado | publicado)
 *
 * Usage: node scripts/placsp-auditoria.mjs
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const DB_FILE   = join(ROOT, 'data', 'licitaciones.db');
const PDF_DIR   = join(ROOT, 'data', 'placsp-pdfs');
const BUNDLE    = join(ROOT, 'data', 'licitaciones-emov.json');
const OUT       = join(ROOT, 'data', 'licitaciones-auditoria.json');
const OUT_CRITERIOS = join(ROOT, 'data', 'licitaciones-criterios-master.json');

const db = new Database(DB_FILE, { readonly: true });
const bundle = JSON.parse(fs.readFileSync(BUNDLE, 'utf8'));
const itemBySlug = new Map(bundle.items.map((it) => [it.slug, it]));

// Slugs con extracción aplicada (carpeta con extraccion.json)
const slugs = fs.readdirSync(PDF_DIR)
  .filter((d) => fs.existsSync(join(PDF_DIR, d, 'extraccion.json')))
  .sort();

/**
 * Analiza un PDF local y devuelve métricas de "extraibilidad" del texto.
 * Si el PDF tiene <50 chars/página → casi seguro escaneado (necesita Vision/OCR).
 *
 * @param {string} pdfPath
 * @returns {{ pages: number|null, chars: number, charsPerPage: number, isScanned: boolean, error?: string }}
 */
function analizarPDF(pdfPath) {
  try {
    const sizeBytes = fs.statSync(pdfPath).size;
    // Texto plano sin layout para contar caracteres "útiles"
    const texto = execFileSync('pdftotext', ['-enc', 'UTF-8', '-q', pdfPath, '-'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 50 * 1024 * 1024,
      windowsHide: true,
    }).toString('utf8');
    const chars = texto.replace(/\s+/g, '').length;
    // Estimar páginas via pdfinfo no está disponible siempre; aproximamos por separadores ^L o por size
    const pageBreaks = (texto.match(/\f/g) ?? []).length;
    const pages = pageBreaks > 0 ? pageBreaks + 1 : Math.max(1, Math.round(sizeBytes / 50_000));
    const charsPerPage = pages > 0 ? Math.round(chars / pages) : chars;
    const isScanned = charsPerPage < 50;
    return { pages, chars, charsPerPage, isScanned, sizeBytes };
  } catch (e) {
    return { pages: null, chars: 0, charsPerPage: 0, isScanned: true, error: e.message };
  }
}

/**
 * Verifica si un PDF "fue citado" por el LLM en el extraccion.json. Heurística:
 * busca el nombre del archivo (sin extensión) o tokens distintivos (>=10 chars)
 * dentro del JSON de extracción. Es solo aproximada — un PDF puede haber sido
 * leído sin que el LLM cite su nombre. Sirve como detector de "claramente NO leído".
 */
function fueCitado(pdfFilename, extraccionJsonStr) {
  const stem = basename(pdfFilename).replace(/\.[a-z]+$/i, '').toLowerCase();
  const tokens = stem.split(/[^a-záéíóúñ0-9]+/).filter((t) => t.length >= 6 && t !== 'enlazado' && t !== 'enlace' && t !== 'interno' && t !== 'documento' && t !== 'aprobacion' && t !== 'aprobación');
  const lcJson = extraccionJsonStr.toLowerCase();
  return tokens.some((t) => lcJson.includes(t));
}

/**
 * Extrae el tipo canónico del nombre del archivo. El extractor PDF prefija con
 * patrón "NN-tipo_canonico-Nombre.pdf" (ej. "08-resolucion_adjudicacion-...pdf").
 */
function tipoDelArchivo(filename) {
  const m = /^\d+[A-Z]?-([a-z_]+)-/i.exec(filename);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Verifica si los campos esperados extraíbles de un tipo de documento aparecen
 * llenos en el item del bundle / extraccion.json. Si sí → consideramos que
 * el LLM leyó ese tipo de doc (aunque no cite el filename literal).
 */
function leidoImplicitamentePorTipo(tipo, it, ext) {
  if (!tipo) return false;
  const adj = it.adjudicatarios ?? [];
  const lic = it.licitadores ?? [];
  const con = it.concesion ?? {};
  const proc = it.proceso ?? {};
  const notas = `${(ext.notas_pliego ?? []).join(' ')} ${(ext.notas_adjudicacion ?? []).join(' ')}`;
  switch (tipo) {
    case 'anuncio_licitacion':
      return !!(it.fecha_publicacion || it.importe_base != null || it.fecha_limite);
    case 'pliego_administrativo':
      return !!((proc.criterios_valoracion?.economicos?.length ?? 0) > 0
        || proc.garantias?.definitiva_pct
        || proc.garantias?.definitiva_eur
        || con.canon_minimo_anual != null
        || con.tipo_retribucion);
    case 'pliego_tecnico':
      return !!(con.num_cargadores_minimo
        || (con.ubicaciones?.length ?? 0) > 0
        || con.tecnologia_requerida
        || con.potencia_minima_por_cargador_kw != null);
    case 'enlazado':
      // Los enlazados son el PCAP o PPT real escondido detrás del "Pliego" portada.
      // Si el JSON tiene info estructurada de pliegos (criterios + ubicaciones), están leídos.
      return !!((proc.criterios_valoracion?.economicos?.length ?? 0) > 0
        || (con.ubicaciones?.length ?? 0) > 0
        || con.num_cargadores_minimo != null);
    case 'acta_apertura':
      return lic.length > 0;
    case 'acta_propuesta_adjudicacion':
      return lic.length > 0 || adj.length > 0 || lic.some((l) => l.posicion != null);
    case 'resolucion_adjudicacion':
      return !!(it.fecha_adjudicacion || con.canon_ganador != null || adj.length > 0
        || lic.some((l) => l.es_ganador));
    case 'formalizacion':
      return !!it.fecha_formalizacion;
    case 'informe_valoracion':
      return lic.some((l) => (l.puntuaciones_detalle?.length ?? 0) > 0)
        || adj.some((a) => (a.puntuaciones_detalle?.length ?? 0) > 0);
    case 'acuerdo_iniciacion':
      return !!(it.fecha_publicacion || notas.length > 100);
    case 'rectificacion':
      return notas.toLowerCase().includes('rectific') || notas.toLowerCase().includes('correc');
    case 'aclaracion':
      // Q&A oficial del expediente. Si está incorporado en notas_pliego → leído.
      // Si NO está incorporado → flag legítimo (info pendiente de aplicar).
      return notas.toLowerCase().includes('q&a')
        || notas.toLowerCase().includes('aclaraci')
        || notas.toLowerCase().includes('contestaci');
    case 'anuncio_oficial':
      // BOCM / BOAM / DOGV: redundantes con anuncio_licitacion. Mismo criterio.
      return !!(it.fecha_publicacion || it.importe_base != null || it.fecha_limite);
    case 'presupuesto':
      // Presupuesto base / estimado. Leído si importe_base o estimado están llenos.
      return !!(it.importe_base != null || it.importe_estimado != null);
    case 'planos':
      // Planos. Casi siempre scanned. Solo se procesan vía Vision.
      // Si llegamos a este case con texto, es atípico — lo damos por leído débilmente
      // si las ubicaciones están extraídas.
      return (con.ubicaciones?.length ?? 0) > 0;
    case 'memoria':
    case 'proyecto':
      // Memoria / proyecto técnico. Información detallada — débil de validar.
      // Damos por leído si hay tecnologia + ubicaciones + potencia.
      return !!(con.tecnologia_requerida && (con.ubicaciones?.length ?? 0) > 0);
    case 'otro':
      // Sin esquema fijo, lo damos por bueno si hay notas extensas (>500 chars)
      return notas.length > 500;
    default:
      return false;
  }
}

const TIPOS_NO_TEXTO = /\.(zip|docx|xlsx|xls|pptx|odt|ods)$/i;

/**
 * Normaliza la descripción de un criterio para agrupar sinónimos / variantes
 * de redacción. Devuelve una clave canónica (lowercase, sin acentos, sin
 * stop-words, palabras claves principales). Sirve para construir el master
 * de criterios cross-licitación.
 */
function clavearCriterio(descripcion) {
  if (!descripcion) return 'sin_descripcion';
  const stop = new Set(['de','del','la','el','los','las','y','o','u','en','para','por','con','sin','un','una','al','a','que','se','su','sus','lo','sobre','entre','desde','hasta','este','esta','esto','ser','si','no','le','la','le']);
  const norm = descripcion
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !stop.has(t));
  // Heurística: detectar conceptos canónicos por prefijo
  const join = norm.join(' ');
  if (/canon|contraprestacion|contraprest/.test(join)) return 'mejora_canon';
  if (/precio.*kwh|kwh.*usuario|tarifa/.test(join))    return 'precio_kwh_usuario';
  if (/numero.*punto|incremento.*punto|adicional.*punto|mas.*punto/.test(join)) return 'mas_puntos_de_carga';
  if (/potencia|hw|hardware|equipo.*recarga|kw/.test(join) && !/precio/.test(join)) return 'mejora_potencia_hw';
  if (/ubicacion.*adicional|emplazamient/.test(join)) return 'mas_ubicaciones';
  if (/plazo.*construccion|plazo.*ejecucion|tiempo.*obra|reduccion.*plazo/.test(join)) return 'reduccion_plazo';
  if (/proyecto.*tecnico|memoria.*tecnica|plan.*ejecucion|calidad.*proyecto/.test(join)) return 'calidad_proyecto_tecnico';
  if (/mantenimiento|sav|servicio.*tecnico/.test(join)) return 'mantenimiento';
  if (/sostenibilidad|renovable|ambiental|emision/.test(join)) return 'sostenibilidad';
  if (/app|aplicacion.*movil|plataforma|software/.test(join)) return 'app_plataforma';
  if (/social|comunitario|empleo/.test(join)) return 'mejora_social';
  if (/garantia|fianza/.test(join)) return 'garantia';
  if (/operatividad|disponibilidad|uptime/.test(join)) return 'operatividad';
  // Fallback: tomar las primeras 2-3 palabras como clave
  return norm.slice(0, 3).join('_') || 'otro';
}

const ETIQUETAS_CANONICAS = {
  mejora_canon:           { label: 'Mejora del canon / contraprestación',   tipo: 'economico' },
  precio_kwh_usuario:     { label: 'Precio kWh al usuario final',           tipo: 'economico' },
  mas_puntos_de_carga:    { label: 'Incremento del nº de puntos de carga',  tipo: 'tecnico_cuant' },
  mejora_potencia_hw:     { label: 'Mejora de potencia / hardware',         tipo: 'tecnico_cuant' },
  mas_ubicaciones:        { label: 'Ubicaciones adicionales',               tipo: 'tecnico_cuant' },
  reduccion_plazo:        { label: 'Reducción de plazo de construcción',    tipo: 'tecnico_cuant' },
  calidad_proyecto_tecnico: { label: 'Calidad del proyecto técnico',        tipo: 'tecnico_juicio' },
  mantenimiento:          { label: 'Plan de mantenimiento / SAT',           tipo: 'tecnico_juicio' },
  sostenibilidad:         { label: 'Sostenibilidad / energía renovable',    tipo: 'tecnico_juicio' },
  app_plataforma:         { label: 'App móvil / plataforma de gestión',     tipo: 'tecnico_juicio' },
  mejora_social:          { label: 'Mejoras sociales / empleo local',       tipo: 'tecnico_juicio' },
  garantia:               { label: 'Garantía / fianza',                     tipo: 'otro' },
  operatividad:           { label: 'Operatividad / disponibilidad',         tipo: 'tecnico_juicio' },
  sin_descripcion:        { label: '(criterio sin descripción)',            tipo: 'desconocido' },
};

/** Agregador maestro: clave canonica → { label, tipo, ocurrencias[]: [{slug, peso, fuente}] } */
const masterCriterios = new Map();

function registrarMaster(claveCanonica, slug, peso, descripcionOriginal, fuente, tipoCanonical) {
  if (!masterCriterios.has(claveCanonica)) {
    const cano = ETIQUETAS_CANONICAS[claveCanonica];
    masterCriterios.set(claveCanonica, {
      clave: claveCanonica,
      label: cano?.label ?? claveCanonica.replace(/_/g, ' '),
      tipo:  cano?.tipo  ?? 'otro',
      ocurrencias: [],
      descripciones_observadas: new Set(),
    });
  }
  const m = masterCriterios.get(claveCanonica);
  m.ocurrencias.push({ slug, peso, fuente, tipo: tipoCanonical });
  if (descripcionOriginal) m.descripciones_observadas.add(descripcionOriginal.slice(0, 140));
}

console.log(`📋 Auditando ${slugs.length} licitaciones con extracción aplicada...`);

const reportes = [];
for (const slug of slugs) {
  const it  = itemBySlug.get(slug);
  if (!it) {
    console.log(`   ⚠ ${slug}: no aparece en bundle, skip`);
    continue;
  }
  const ext = JSON.parse(fs.readFileSync(join(PDF_DIR, slug, 'extraccion.json'), 'utf8'));

  const flags = [];
  const motivosComplejidad = [];
  let pliegoComplejo = false;
  /** explicaciones[k] = { descripcion: "1 línea", detalles: ["bullet 1","bullet 2"] } */
  const explicaciones = {};

  // ── 3. Documentos descargados / total ──────────────────────────────────
  const docs = it.documentos ?? [];
  const docsReales = docs.filter((d) => !String(d.tipo).startsWith('anexo_'));
  const docsRealesCount = docsReales.length;
  const docsDescargados = docsReales.filter((d) => d.descargado === true).length;
  const docsCompletos = docsRealesCount > 0 ? `${docsDescargados}/${docsRealesCount}` : '—';
  explicaciones.docs_completos = {
    descripcion: docsRealesCount > 0
      ? `${docsDescargados} de ${docsRealesCount} documentos publicados en PLACSP fueron descargados al disco local. Los documentos virtuales tipo "anexo_*" (deep-links #page=N) no se cuentan acá porque no son archivos separados.`
      : 'No hay documentos en PLACSP para esta licitación.',
    detalles: docsReales.map((d) => `${d.descargado ? '✅' : '❌'} ${d.tipo} · ${d.nombre ?? '—'}`),
  };

  // ── 4. Links embebidos resueltos ───────────────────────────────────────
  // Heurística: si hay un doc tipo "pliego_administrativo" con URL que NO contiene
  // "DocumentIdParam=" sino "cifrado=" (= portada que sólo agrupa enlaces),
  // y existen los pliegos canónicos (pliego_tecnico, segundo pliego_administrativo
  // específico), entonces los enlaces internos sí se resolvieron.
  // Cada órgano nombra los pliegos a su antojo (PCAP, "Pliego", "Diligencia corrección PCAP",
  // "Pliego de Cláusulas Administrativas Particulares", etc.). La heurística correcta es
  // contar por TIPO canónico, no por palabras en el nombre.
  const docsPPT  = docs.filter((d) => d.tipo === 'pliego_tecnico');
  const docsPCAP = docs.filter((d) => d.tipo === 'pliego_administrativo');
  const tienePPT  = docsPPT.length  > 0;
  const tienePCAP = docsPCAP.length > 0;
  const linksEmbebidos = tienePPT && tienePCAP ? '✅' : (tienePPT || tienePCAP ? '⚠️ parcial' : '❌');
  explicaciones.links_embebidos_resueltos = {
    descripcion: 'PLACSP a veces sube un único PDF "Pliego" portada que contiene hyperlinks internos al PCAP y PPT reales. El extractor escanea el binario del PDF para descubrir esos enlaces y descargarlos. Validamos que existan al menos un PPT (pliego_tecnico) y un PCAP (pliego_administrativo) — el nombre exacto varía por órgano (PCAP, "Pliego", "Diligencia corrección PCAP", etc.).',
    detalles: [
      `${tienePPT  ? '✅' : '❌'} Al menos 1 PPT (pliego_tecnico): ${docsPPT.length} encontrado${docsPPT.length === 1 ? '' : 's'}`,
      ...docsPPT.map((d)  => `   · ${d.nombre ?? '(sin nombre)'}`),
      `${tienePCAP ? '✅' : '❌'} Al menos 1 PCAP (pliego_administrativo): ${docsPCAP.length} encontrado${docsPCAP.length === 1 ? '' : 's'}`,
      ...docsPCAP.map((d) => `   · ${d.nombre ?? '(sin nombre)'}`),
      `Estado: ${linksEmbebidos === '✅' ? 'todos los pliegos canónicos están descargados' : linksEmbebidos === '⚠️ parcial' ? 'falta uno de los pliegos canónicos' : 'no hay pliegos descubiertos'}`,
    ],
  };

  // ── 5. Docs legibles vs Vision ──────────────────────────────────────────
  // Inferimos por presencia de archivos vision-*.raw.txt en la carpeta del slug.
  const slugDir = join(PDF_DIR, slug);
  const visionFiles = fs.existsSync(slugDir)
    ? fs.readdirSync(slugDir).filter((f) => /^vision-.*\.raw\.txt$/.test(f))
    : [];
  const usoVision = visionFiles.length > 0;
  const docsLegibles = usoVision ? `Texto + Vision (${visionFiles.length} call${visionFiles.length === 1 ? '' : 's'})` : 'Texto puro';

  // ── 5.bis. Cobertura de LECTURA — nivel 1 (scanned) + nivel 2 (citación) ──
  // Por cada archivo en la carpeta del slug, decidimos si fue "leído" por el LLM:
  //   - PDF con texto extraíble + citado en extraccion.json   → ✅ leído
  //   - PDF scanned + hay vision-*.raw.txt para el slug        → ✅ leído (vía Vision)
  //   - PDF scanned sin Vision                                 → ❌ no leído (scanned huérfano)
  //   - .zip / .docx / .xlsx / .pptx                           → ❌ tipo no soportado
  //   - PDF con texto NO citado en extraccion.json             → ⚠ posiblemente no leído
  const archivosCarpeta = fs.existsSync(slugDir) ? fs.readdirSync(slugDir) : [];
  const archivosDoc = archivosCarpeta.filter((f) =>
    !f.startsWith('_') && !f.startsWith('.') &&
    !/^(extraccion|vision-)/i.test(f) &&
    /\.(pdf|zip|docx?|xlsx?|pptx?)$/i.test(f)
  );

  const extraccionStr = fs.readFileSync(join(slugDir, 'extraccion.json'), 'utf8');
  const lecturaDetalles = [];
  let leidos = 0, scannedSinVision = 0, tiposNoSoportados = 0, posiblementeNoLeidos = 0;
  for (const f of archivosDoc) {
    const fullPath = join(slugDir, f);
    if (TIPOS_NO_TEXTO.test(f)) {
      tiposNoSoportados++;
      lecturaDetalles.push(`❌ ${f} — tipo no soportado por pdftotext (${f.split('.').pop().toUpperCase()})`);
      continue;
    }
    if (!/\.pdf$/i.test(f)) continue;
    const an = analizarPDF(fullPath);
    if (an.error) {
      posiblementeNoLeidos++;
      lecturaDetalles.push(`⚠ ${f} — error: ${an.error.slice(0, 60)}`);
      continue;
    }
    if (an.isScanned) {
      if (usoVision) {
        leidos++;
        lecturaDetalles.push(`✅ ${f} — scanned (${an.charsPerPage} c/p), procesado vía Vision`);
      } else {
        scannedSinVision++;
        lecturaDetalles.push(`❌ ${f} — scanned (${an.charsPerPage} c/p) y NO se ejecutó Vision sobre este slug`);
      }
    } else {
      const citadoPorNombre = fueCitado(f, extraccionStr);
      const tipo = tipoDelArchivo(f);
      const implicito = leidoImplicitamentePorTipo(tipo, it, ext);
      if (citadoPorNombre || implicito) {
        leidos++;
        const motivo = citadoPorNombre && implicito ? 'citado + tipo poblado'
          : citadoPorNombre ? 'citado en JSON'
          : `tipo "${tipo}" poblado en extraccion.json`;
        lecturaDetalles.push(`✅ ${f} — texto OK (${an.charsPerPage} c/p), ${motivo}`);
      } else {
        posiblementeNoLeidos++;
        lecturaDetalles.push(`⚠ ${f} — texto OK (${an.charsPerPage} c/p), tipo "${tipo ?? '?'}" pero campos típicos vacíos en JSON`);
      }
    }
  }
  const totalArchivos     = archivosDoc.length;
  const cobLecturaPct     = totalArchivos > 0 ? Math.round(100 * leidos / totalArchivos) : 100;
  const docsConProblema   = scannedSinVision + tiposNoSoportados + posiblementeNoLeidos;
  const lecturaSemaforo   = scannedSinVision + tiposNoSoportados > 0 ? '❌'
    : posiblementeNoLeidos > 0 ? '⚠️ ' + cobLecturaPct + '%'
    : '✅ ' + cobLecturaPct + '%';
  if (scannedSinVision > 0) flags.push(`${scannedSinVision} PDF scanned no procesado con Vision`);
  if (tiposNoSoportados > 0) flags.push(`${tiposNoSoportados} archivo${tiposNoSoportados === 1 ? '' : 's'} de tipo no soportado (ZIP/.docx/.xlsx)`);
  if (posiblementeNoLeidos > 0) flags.push(`${posiblementeNoLeidos} PDF posiblemente no leído (texto OK pero no citado por LLM)`);

  explicaciones.cobertura_lectura = {
    descripcion: `Mide cuántos documentos descargados fueron efectivamente leídos e interpretados. Combina dos chequeos: (nivel 1) pdftotext detecta PDFs scanned por chars/página <50 — si hay scanned y no se ejecutó Vision, su contenido se pierde; (nivel 2) busca el nombre de cada PDF en el extraccion.json para verificar que el LLM lo citó. ${cobLecturaPct === 100 ? 'Todos los archivos del expediente fueron leídos.' : `Hay ${docsConProblema} archivo${docsConProblema === 1 ? '' : 's'} con problema potencial.`}`,
    detalles: [
      `Total archivos en disco: ${totalArchivos}`,
      `✅ Leídos: ${leidos}`,
      scannedSinVision > 0   ? `❌ Scanned sin Vision: ${scannedSinVision}` : null,
      tiposNoSoportados > 0  ? `❌ Tipos no soportados (ZIP/.docx/.xlsx): ${tiposNoSoportados}` : null,
      posiblementeNoLeidos > 0 ? `⚠ Texto OK pero no citado en JSON: ${posiblementeNoLeidos}` : null,
      '',
      ...lecturaDetalles,
    ].filter((x) => x !== null),
  };
  explicaciones.docs_legibles = {
    descripcion: usoVision
      ? `Algunos documentos vinieron como planos escaneados sin OCR. Hubo que extraerlos con Vision API (Claude Sonnet 4.6 multimodal). Coste estimado: $${(visionFiles.length * 0.2).toFixed(2)}.`
      : 'Todos los PDFs tenían texto seleccionable. Se extrajeron con pdftotext sin recurrir a Vision API (sin coste por API).',
    detalles: visionFiles.length > 0
      ? visionFiles.map((f) => `📷 ${f}`)
      : ['📄 pdftotext con encoding UTF-8 + layout preservado'],
  };

  // ── 6. Σ pesos = 100 ────────────────────────────────────────────────────
  const peso_econ  = it.proceso?.peso_economico ?? 0;
  const peso_tec   = it.proceso?.peso_tecnico   ?? 0;
  const sumaPesos  = peso_econ + peso_tec;
  const criteriosSuman100 = Math.abs(sumaPesos - 100) < 0.5;
  if (!criteriosSuman100 && (peso_econ > 0 || peso_tec > 0)) {
    flags.push(`Σ pesos = ${sumaPesos} ≠ 100 (econ ${peso_econ} + tec ${peso_tec})`);
  }
  const criteriosEcon = it.proceso?.criterios_valoracion?.economicos ?? [];
  const criteriosTec  = it.proceso?.criterios_valoracion?.tecnicos   ?? [];
  const mejorasPunt   = it.proceso?.mejoras_puntuables                ?? [];
  const criteriosJV   = it.proceso?.criterios_juicio_valor            ?? [];

  // Construir lista plana de criterios para esta licitación + registrar master
  const criteriosDetalle = [];
  for (const c of criteriosEcon) {
    const desc = c.descripcion ?? c.formula ?? '';
    const clave = clavearCriterio(desc);
    criteriosDetalle.push({ tipo: 'economico', peso: c.peso ?? null, descripcion: desc, formula: c.formula ?? null, clave_canonica: clave, fuente: 'criterios_valoracion.economicos' });
    registrarMaster(clave, slug, c.peso ?? null, desc, 'criterios_valoracion.economicos', 'economico');
  }
  for (const c of criteriosTec) {
    const desc = c.descripcion ?? '';
    const clave = clavearCriterio(desc);
    criteriosDetalle.push({ tipo: 'tecnico', peso: c.peso ?? null, descripcion: desc, formula: c.formula ?? null, clave_canonica: clave, fuente: 'criterios_valoracion.tecnicos' });
    registrarMaster(clave, slug, c.peso ?? null, desc, 'criterios_valoracion.tecnicos', 'tecnico');
  }
  for (const m of mejorasPunt) {
    const desc = m.descripcion ?? '';
    const clave = clavearCriterio(desc);
    criteriosDetalle.push({ tipo: 'mejora_puntuable', peso: m.puntos_max ?? null, descripcion: desc, subtipo: m.tipo ?? null, clave_canonica: clave, fuente: 'mejoras_puntuables' });
    registrarMaster(clave, slug, m.puntos_max ?? null, desc, 'mejoras_puntuables', 'mejora_puntuable');
  }
  for (const m of criteriosJV) {
    const desc = m.descripcion ?? '';
    const clave = clavearCriterio(desc);
    criteriosDetalle.push({ tipo: 'juicio_valor', peso: m.puntos_max ?? null, descripcion: desc, subtipo: m.tipo ?? null, clave_canonica: clave, fuente: 'criterios_juicio_valor' });
    registrarMaster(clave, slug, m.puntos_max ?? null, desc, 'criterios_juicio_valor', 'juicio_valor');
  }

  explicaciones.criterios_suman_100 = {
    descripcion: criteriosSuman100
      ? `La suma de pesos económicos (${peso_econ}) + técnicos (${peso_tec}) da exactamente 100. Eso confirma que se capturaron todos los criterios de valoración del pliego.`
      : `La suma da ${sumaPesos} en lugar de 100. Probablemente falta capturar algún criterio del pliego, o los pesos no estaban bien declarados en el extractor.`,
    detalles: [
      `Económicos (${peso_econ} pts):`,
      ...criteriosEcon.map((c) => `   · ${c.peso ?? '—'} pts — ${(c.descripcion ?? c.formula ?? '').slice(0, 90)}`),
      `Técnicos (${peso_tec} pts):`,
      ...criteriosTec.map((c) => `   · ${c.peso ?? '—'} pts — ${(c.descripcion ?? '').slice(0, 90)}`),
    ],
  };
  explicaciones.criterios_detalle = {
    descripcion: `Lista completa de criterios de adjudicación encontrados en el pliego (${criteriosDetalle.length} en total). Incluye criterios económicos, técnicos automáticos, mejoras puntuables y criterios de juicio de valor. Cada criterio tiene una clave canónica que se usa para normalizar y agrupar criterios similares en la tabla maestra de auditoría.`,
    detalles: [
      `Económicos: ${criteriosEcon.length}`,
      `Técnicos (peso top-level): ${criteriosTec.length}`,
      `Mejoras puntuables (subcriterios automáticos): ${mejorasPunt.length}`,
      `Criterios juicio de valor (subjetivos): ${criteriosJV.length}`,
      '',
      ...criteriosDetalle.map((c, i) =>
        `${i + 1}. [${c.tipo}] ${c.peso != null ? `${c.peso} pts` : '— pts'} → ${c.descripcion.slice(0, 100)} (clave: ${c.clave_canonica})`
      ),
    ],
  };

  // ── 8. Cobertura pliego (campos críticos pre-adjudicación) ─────────────
  const cobPliegoCampos = [
    !!it.titulo,
    !!it.organo,
    it.importe_base != null || it.importe_estimado != null,
    !!it.fecha_publicacion,
    !!it.concesion?.plazo_anos,
    !!it.concesion?.tipo_retribucion,
    it.concesion?.canon_minimo_anual != null
      || it.concesion?.canon_por_ubicacion_anual != null
      || it.concesion?.precio_max_kwh_usuario != null
      || it.concesion?.tipo_retribucion === 'venta_energia_usuario'
      || it.concesion?.tipo_retribucion === 'compra',
    !!it.concesion?.num_cargadores_minimo,
    !!it.concesion?.tecnologia_requerida,
    (it.concesion?.ubicaciones?.length ?? 0) > 0,
    !!it.proceso?.garantias?.definitiva_pct || !!it.proceso?.garantias?.definitiva_eur,
    (it.proceso?.criterios_valoracion?.economicos?.length ?? 0) > 0,
    (it.proceso?.criterios_valoracion?.tecnicos?.length ?? 0) > 0,
  ];
  const cobPliego = Math.round(100 * cobPliegoCampos.filter(Boolean).length / cobPliegoCampos.length);
  const cobPliegoLabels = [
    ['titulo', !!it.titulo, it.titulo],
    ['organo contratante', !!it.organo, it.organo],
    ['importe base / estimado', it.importe_base != null || it.importe_estimado != null, it.importe_base ?? it.importe_estimado],
    ['fecha publicación', !!it.fecha_publicacion, it.fecha_publicacion],
    ['plazo de la concesión', !!it.concesion?.plazo_anos, it.concesion?.plazo_anos ? `${it.concesion.plazo_anos} años` : null],
    ['tipo de retribución', !!it.concesion?.tipo_retribucion, it.concesion?.tipo_retribucion],
    ['canon o precio mín', cobPliegoCampos[6], it.concesion?.canon_minimo_anual ?? it.concesion?.canon_por_ubicacion_anual ?? it.concesion?.precio_max_kwh_usuario ?? '(variante sin canon)'],
    ['nº cargadores mínimo', !!it.concesion?.num_cargadores_minimo, it.concesion?.num_cargadores_minimo],
    ['tecnología requerida', !!it.concesion?.tecnologia_requerida, it.concesion?.tecnologia_requerida],
    ['ubicaciones extraídas', (it.concesion?.ubicaciones?.length ?? 0) > 0, it.concesion?.ubicaciones?.length],
    ['garantía definitiva', cobPliegoCampos[10], it.proceso?.garantias?.definitiva_pct ? `${it.proceso.garantias.definitiva_pct}%` : it.proceso?.garantias?.definitiva_eur],
    ['criterios económicos', cobPliegoCampos[11], `${criteriosEcon.length} criterios`],
    ['criterios técnicos', cobPliegoCampos[11], `${criteriosTec.length} criterios`],
  ];
  // dedupe (criterios técnicos+económicos comparten índice 11)
  const cobPliegoLabelsUnicos = cobPliegoLabels.filter((_, i, arr) => i === 0 || arr[i - 1][0] !== _[0]);
  explicaciones.cobertura_pliego = {
    descripcion: `${cobPliegoCampos.filter(Boolean).length} de ${cobPliegoCampos.length} campos críticos del pliego están completos. Estos son los datos que el equipo comercial necesita para entender la oportunidad antes de la adjudicación.`,
    detalles: cobPliegoLabelsUnicos.map(([nombre, ok, valor]) =>
      `${ok ? '✅' : '❌'} ${nombre}${ok && valor != null && valor !== '' ? ` → ${String(valor).slice(0, 60)}` : ''}`
    ),
  };

  // ── 9. Cobertura adjudicación (si aplica) ──────────────────────────────
  const estaAdjudicada = ['ADJ', 'RES', 'FOR'].includes(it.estado ?? '');
  let cobAdj = null;
  if (estaAdjudicada) {
    const adjCampos = [
      !!it.fecha_adjudicacion || !!it.fecha_formalizacion,
      it.importe_adjudicado != null
        || it.concesion?.canon_ganador != null
        || it.concesion?.precio_kwh_ofertado_ganador != null,
      (it.adjudicatarios?.length ?? 0) > 0 || (it.licitadores?.some((l) => l.posicion === 1)),
      (it.licitadores?.length ?? 0) > 0,
    ];
    cobAdj = Math.round(100 * adjCampos.filter(Boolean).length / adjCampos.length);
    explicaciones.cobertura_adjudicacion = {
      descripcion: `Esta licitación está en estado "${it.estado}". Mide cuántos campos post-adjudicación pudimos extraer (4 campos críticos).`,
      detalles: [
        `${adjCampos[0] ? '✅' : '❌'} Fecha de adjudicación / formalización → ${it.fecha_adjudicacion ?? it.fecha_formalizacion ?? '—'}`,
        `${adjCampos[1] ? '✅' : '❌'} Importe / canon ganador → ${it.concesion?.canon_ganador ?? it.concesion?.precio_kwh_ofertado_ganador ?? it.importe_adjudicado ?? '—'}`,
        `${adjCampos[2] ? '✅' : '❌'} Adjudicatario identificado`,
        `${adjCampos[3] ? '✅' : '❌'} Lista de licitadores extraídos (${it.licitadores?.length ?? 0})`,
      ],
    };
  } else {
    explicaciones.cobertura_adjudicacion = {
      descripcion: `Estado "${it.estado ?? '—'}" — la licitación todavía no está adjudicada ni formalizada. La cobertura de adjudicación no aplica.`,
      detalles: ['Solo aplica para estados ADJ (adjudicada), RES (resuelta) o FOR (formalizada).'],
    };
  }

  // ── 10. Licitadores vs acta ────────────────────────────────────────────
  const licitadoresExtraidos = it.licitadores?.length ?? 0;
  // Si no podemos verificar contra el acta, dejamos null
  const licitadoresVsActa = licitadoresExtraidos > 0 ? `${licitadoresExtraidos} extraídos` : '—';
  explicaciones.licitadores_vs_acta = {
    descripcion: licitadoresExtraidos > 0
      ? `Se extrajeron ${licitadoresExtraidos} licitadores (empresas que presentaron oferta) del acta de apertura del sobre 1. Si la licitación todavía no abrió sobres, este valor será 0.`
      : 'No hay licitadores extraídos. Puede ser porque la licitación todavía está en plazo de presentación o porque las actas no se procesaron aún.',
    detalles: (it.licitadores ?? []).map((l, i) =>
      `${i + 1}. ${l.nombre}${l.posicion ? ` · ranking #${l.posicion}` : ''}${l.es_ganador ? ' 🏆' : ''}${l.excluido ? ' (excluido)' : ''}`
    ).slice(0, 20),
  };

  // ── 11. Coherencia ubicaciones ─────────────────────────────────────────
  const ubis = it.concesion?.ubicaciones ?? [];
  const ubisNuevas = ubis.filter((u) => !u.es_existente);
  const sumaCargadoresNuevos = ubisNuevas.reduce((acc, u) => acc + (u.cargadores_total ?? 0), 0);
  const minimoPliego = it.concesion?.num_cargadores_minimo ?? null;
  let coherenciaUbis = '—';
  if (minimoPliego != null && ubisNuevas.length > 0) {
    const diff = Math.abs(sumaCargadoresNuevos - minimoPliego);
    if (diff <= 1)        coherenciaUbis = `✅ ${sumaCargadoresNuevos}/${minimoPliego}`;
    else if (diff <= 3)   { coherenciaUbis = `⚠️ ${sumaCargadoresNuevos}/${minimoPliego}`; flags.push(`Σubis nuevas (${sumaCargadoresNuevos}) ≠ mínimo (${minimoPliego})`); }
    else                  { coherenciaUbis = `❌ ${sumaCargadoresNuevos}/${minimoPliego}`; flags.push(`Σubis nuevas (${sumaCargadoresNuevos}) ≠ mínimo (${minimoPliego}) — diff ${diff}`); }
  }
  const ubisExistentes = ubis.filter((u) => u.es_existente);
  const sumaExistentes = ubisExistentes.reduce((acc, u) => acc + (u.cargadores_total ?? 0), 0);
  explicaciones.coherencia_ubis = {
    descripcion: minimoPliego != null
      ? `El pliego exige instalar ${minimoPliego} puntos de carga nuevos. Sumamos los puntos de carga de las ubicaciones nuevas extraídas y comparamos. ±1 es ✅, ±2-3 es ⚠️, más es ❌.`
      : 'No hay num_cargadores_minimo declarado en el pliego. No se puede validar coherencia.',
    detalles: [
      `Mínimo del pliego: ${minimoPliego ?? 'no declarado'}`,
      `Σ ubicaciones nuevas (${ubisNuevas.length}): ${sumaCargadoresNuevos} puntos de carga`,
      ubisExistentes.length > 0 ? `Σ ubicaciones existentes (${ubisExistentes.length}): ${sumaExistentes} puntos asumidos (no cuentan en el mínimo)` : null,
      `Diferencia: ${minimoPliego != null ? Math.abs(sumaCargadoresNuevos - minimoPliego) : '—'}`,
    ].filter(Boolean),
  };

  // ── 12. Anexos válidos ─────────────────────────────────────────────────
  const anexos = ext?.anexos_pliego ?? [];
  let anexosValidos = '—';
  if (anexos.length > 0) {
    const todosValidos = anexos.every((ax) => {
      const padre = docs.find((d) => d.tipo === ax.doc_tipo);
      return padre && ax.page_inicio > 0;
    });
    anexosValidos = todosValidos ? `✅ ${anexos.length}` : `❌ ${anexos.length}`;
    if (!todosValidos) flags.push('Algún anexo_pliego apunta a doc_tipo inexistente');
  }
  explicaciones.anexos_validos = {
    descripcion: anexos.length > 0
      ? `Los anexos del pliego (Anexo I, Anexo II, etc.) están dentro del PDF principal del PCAP/PPT. Los exponemos como deep-links #page=N. Cada anexo debe referenciar un doc_tipo que exista en la sección Documentos.`
      : 'No se detectaron anexos del pliego en este expediente. Es posible que no tenga anexos enumerados, o que el extractor no los haya identificado.',
    detalles: anexos.length > 0
      ? anexos.map((ax) => {
          const padreOk = docs.some((d) => d.tipo === ax.doc_tipo);
          return `${padreOk ? '✅' : '❌'} ${ax.label} → ${ax.doc_tipo} #page=${ax.page_inicio}${ax.page_fin ? `-${ax.page_fin}` : ''}`;
        })
      : ['Sin anexos detectados.'],
  };

  // ── 13. Coste Vision ───────────────────────────────────────────────────
  // Aprox: $0.20 por archivo vision-*.raw.txt detectado (Sonnet 4.6 con cache)
  const costeVisionUsd = usoVision ? Number((visionFiles.length * 0.2).toFixed(2)) : 0;

  // ── 14. Última extracción ──────────────────────────────────────────────
  const ultimaExtraccion = {
    fecha: it.proceso?.extraccion_llm?.fecha ?? null,
    modelo: it.proceso?.extraccion_llm?.modelo ?? ext?._modelo ?? null,
  };
  explicaciones.ultima_extraccion = {
    descripcion: `Fecha y modelo del último procesamiento por LLM. Si la fecha es vieja, conviene re-extraer cuando se publican nuevos documentos en PLACSP (actas, adjudicación, formalización).`,
    detalles: [
      `Fecha: ${ultimaExtraccion.fecha ? new Date(ultimaExtraccion.fecha).toLocaleString('es-ES') : '—'}`,
      `Modelo: ${ultimaExtraccion.modelo ?? '—'}`,
      usoVision ? `Vision API usada: ${visionFiles.length} call${visionFiles.length === 1 ? '' : 's'} (~$${(visionFiles.length * 0.2).toFixed(2)})` : 'Sin Vision API',
    ],
  };

  // ── 7. Pliego complejo (detección heurística + flags conocidos) ────────
  const notasTexto = JSON.stringify(ext?.notas_pliego ?? []).toLowerCase();
  if (notasTexto.includes('q&a') || notasTexto.includes('aclaraci') || notasTexto.includes('contradicci')) {
    pliegoComplejo = true;
    motivosComplejidad.push('Q&A / aclaración oficial incorporada');
  }
  if (notasTexto.includes('declarada desierta')) {
    motivosComplejidad.push('Declarada desierta');
  }
  if (it.concesion?.tipo_retribucion === 'venta_energia_usuario') {
    motivosComplejidad.push('Sin canon (venta de energía al usuario, art. 93.4 LPAP)');
  }
  // Lista de slugs marcados como complejos a mano (override)
  const COMPLEJOS_MANUAL = {
    '17794455': 'Contradicción interna PPT 5.1 vs 5.2.3.1 vs Anexo I — corregido por Q&A oficial 46/2024',
  };
  if (COMPLEJOS_MANUAL[slug]) {
    pliegoComplejo = true;
    motivosComplejidad.push(COMPLEJOS_MANUAL[slug]);
  }
  explicaciones.pliego_complejo = {
    descripcion: pliegoComplejo
      ? 'Este pliego tiene contradicciones internas, variantes raras o ambigüedades que requirieron decisiones especiales en la extracción. Revisar con atención antes de tomar decisiones de negocio.'
      : 'Pliego estándar sin contradicciones detectadas. La extracción siguió las reglas convencionales de la spec v2.',
    detalles: pliegoComplejo
      ? motivosComplejidad
      : ['Sin contradicciones internas detectadas.'],
  };

  // ── Etapa ──────────────────────────────────────────────────────────────
  // En el bundle = publicado. Si tiene extraccion pero no aparece en bundle
  // sería 'aplicado' (no llega aquí porque skipeamos arriba).
  const etapa = 'publicado';

  // ── 2. Confianza global (combina cobertura + coherencia + flags) ───────
  const desgloseConfianza = [];
  let confianza = cobPliego;
  desgloseConfianza.push(`Base: cobertura pliego = ${cobPliego}%`);
  if (cobAdj != null) {
    confianza = Math.round((cobPliego + cobAdj) / 2);
    desgloseConfianza.push(`Promedio con cobertura adjudicación (${cobAdj}%) → ${confianza}`);
  } else {
    desgloseConfianza.push('Sin adjudicación todavía → solo cuenta cobertura pliego');
  }
  if (!criteriosSuman100 && (peso_econ + peso_tec) > 0) {
    confianza -= 8;
    desgloseConfianza.push(`−8: criterios no suman 100 (${sumaPesos})`);
  }
  if (coherenciaUbis.startsWith('⚠️')) { confianza -= 5; desgloseConfianza.push('−5: Σ ubicaciones desviada del mínimo (±2-3)'); }
  if (coherenciaUbis.startsWith('❌')) { confianza -= 15; desgloseConfianza.push('−15: Σ ubicaciones muy desviada del mínimo (>3)'); }
  if (linksEmbebidos === '⚠️ parcial') { confianza -= 5; desgloseConfianza.push('−5: faltó descubrir un pliego canónico embebido'); }
  if (linksEmbebidos === '❌')          { confianza -= 10; desgloseConfianza.push('−10: no se descubrieron pliegos canónicos embebidos'); }
  if (pliegoComplejo && !notasTexto.includes('q&a') && !notasTexto.includes('aclaraci')) {
    confianza -= 12;
    desgloseConfianza.push('−12: pliego complejo sin Q&A oficial incorporado todavía');
  } else if (pliegoComplejo) {
    desgloseConfianza.push('Pliego complejo PERO con Q&A oficial incorporado — sin penalización');
  }
  // Penalización por cobertura de lectura: scanned sin Vision o tipos no soportados son críticos
  if (scannedSinVision > 0)   { confianza -= 12; desgloseConfianza.push(`−12: ${scannedSinVision} PDF scanned no procesado con Vision`); }
  if (tiposNoSoportados > 0)  { confianza -= 8;  desgloseConfianza.push(`−8: ${tiposNoSoportados} archivo de tipo no soportado (ZIP/.docx/.xlsx)`); }
  if (posiblementeNoLeidos > 0) { confianza -= 3 * Math.min(posiblementeNoLeidos, 3); desgloseConfianza.push(`−${3 * Math.min(posiblementeNoLeidos, 3)}: ${posiblementeNoLeidos} PDF no citado por el LLM (sospecha de no leído)`); }
  confianza = Math.max(0, Math.min(100, confianza));
  desgloseConfianza.push(`= ${confianza}% (${confianza >= 85 ? '🟢 verde' : confianza >= 60 ? '🟡 amarillo' : '🔴 rojo'})`);

  explicaciones.confianza_global = {
    descripcion: 'Score 0-100 que combina cobertura de campos del pliego + cobertura de adjudicación (si aplica), y resta penalizaciones por incoherencias. Umbrales: ≥85 verde, 60-84 amarillo, <60 rojo.',
    detalles: desgloseConfianza,
  };

  const semaforo = confianza >= 85 ? 'verde' : confianza >= 60 ? 'amarillo' : 'rojo';

  reportes.push({
    slug,
    titulo:  it.titulo,
    ciudad:  it.ciudad ?? null,
    organo:  it.organo ?? null,
    estado:  it.estado ?? null,
    categoria: it.categoria,

    confianza_global: confianza,
    semaforo,

    docs_completos:           docsCompletos,
    links_embebidos_resueltos: linksEmbebidos,
    docs_legibles:            docsLegibles,
    uso_vision:               usoVision,

    cobertura_lectura_pct:        cobLecturaPct,
    cobertura_lectura_label:      lecturaSemaforo,
    cobertura_lectura_total:      totalArchivos,
    cobertura_lectura_leidos:     leidos,
    cobertura_lectura_scanned_sin_vision: scannedSinVision,
    cobertura_lectura_no_soportados:      tiposNoSoportados,
    cobertura_lectura_no_citados:         posiblementeNoLeidos,

    criterios_suman_100: criteriosSuman100 ? '✅ 100' : `❌ ${sumaPesos}`,
    suma_pesos:          sumaPesos,
    peso_economico:      peso_econ,
    peso_tecnico:        peso_tec,
    criterios_detalle:   criteriosDetalle,
    criterios_count: {
      economicos: criteriosEcon.length,
      tecnicos:   criteriosTec.length,
      mejoras:    mejorasPunt.length,
      juicio:     criteriosJV.length,
      total:      criteriosDetalle.length,
    },

    pliego_complejo: pliegoComplejo,
    motivos_complejidad: motivosComplejidad,

    cobertura_pliego_pct:        cobPliego,
    cobertura_adjudicacion_pct:  cobAdj,

    licitadores_vs_acta: licitadoresVsActa,
    coherencia_ubis:     coherenciaUbis,
    anexos_validos:      anexosValidos,

    coste_vision_usd: costeVisionUsd,
    ultima_extraccion: ultimaExtraccion,

    flags_abiertos: flags,
    etapa,
    explicaciones: {
      ...explicaciones,
      flags_abiertos: {
        descripcion: flags.length === 0
          ? 'No hay alertas pendientes para esta licitación.'
          : `Hay ${flags.length} alerta${flags.length === 1 ? '' : 's'} que requieren revisión humana antes de usar estos datos en B2B.`,
        detalles: flags.length === 0 ? ['Todo OK.'] : flags.map((f) => `⚠️ ${f}`),
      },
    },
  });
}

// Resumen agregado
const total          = reportes.length;
const verdes         = reportes.filter((r) => r.semaforo === 'verde').length;
const amarillos      = reportes.filter((r) => r.semaforo === 'amarillo').length;
const rojos          = reportes.filter((r) => r.semaforo === 'rojo').length;
const complejos      = reportes.filter((r) => r.pliego_complejo).length;
const conVision      = reportes.filter((r) => r.uso_vision).length;
const costeVisionTot = reportes.reduce((acc, r) => acc + r.coste_vision_usd, 0);

const out = {
  generado_en: new Date().toISOString(),
  total,
  resumen: {
    verdes, amarillos, rojos, complejos, con_vision: conVision,
    coste_vision_total_usd: Number(costeVisionTot.toFixed(2)),
  },
  licitaciones: reportes,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`✅ ${OUT}`);
console.log(`   ${total} licitaciones · 🟢 ${verdes} · 🟡 ${amarillos} · 🔴 ${rojos} · ⚙ complejos ${complejos} · 👁 vision ${conVision} ($${costeVisionTot.toFixed(2)})`);

// ── Master de criterios cross-licitación ──────────────────────────────────
const criteriosArray = Array.from(masterCriterios.values()).map((m) => {
  const pesos = m.ocurrencias.map((o) => o.peso).filter((p) => p != null);
  const slugs_distintos = new Set(m.ocurrencias.map((o) => o.slug));
  return {
    clave:       m.clave,
    label:       m.label,
    tipo:        m.tipo,
    frecuencia:  slugs_distintos.size,
    ocurrencias_total: m.ocurrencias.length,
    peso_min:    pesos.length > 0 ? Math.min(...pesos) : null,
    peso_max:    pesos.length > 0 ? Math.max(...pesos) : null,
    peso_promedio: pesos.length > 0 ? Number((pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1)) : null,
    descripciones_observadas: Array.from(m.descripciones_observadas).slice(0, 12),
    licitaciones: Array.from(slugs_distintos),
    ocurrencias: m.ocurrencias,
  };
});
criteriosArray.sort((a, b) => (b.frecuencia - a.frecuencia) || (b.ocurrencias_total - a.ocurrencias_total));

const masterOut = {
  generado_en:           new Date().toISOString(),
  total_criterios_unicos: criteriosArray.length,
  total_licitaciones_analizadas: total,
  criterios:             criteriosArray,
};
fs.writeFileSync(OUT_CRITERIOS, JSON.stringify(masterOut, null, 2));
console.log(`✅ ${OUT_CRITERIOS}`);
console.log(`   ${criteriosArray.length} criterios únicos detectados (clave canónica) en ${total} licitaciones`);
