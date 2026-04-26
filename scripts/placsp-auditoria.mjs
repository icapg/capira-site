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
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const DB_FILE   = join(ROOT, 'data', 'licitaciones.db');
const PDF_DIR   = join(ROOT, 'data', 'placsp-pdfs');
const BUNDLE    = join(ROOT, 'data', 'licitaciones-emov.json');
const OUT       = join(ROOT, 'data', 'licitaciones-auditoria.json');

const db = new Database(DB_FILE, { readonly: true });
const bundle = JSON.parse(fs.readFileSync(BUNDLE, 'utf8'));
const itemBySlug = new Map(bundle.items.map((it) => [it.slug, it]));

// Slugs con extracción aplicada (carpeta con extraccion.json)
const slugs = fs.readdirSync(PDF_DIR)
  .filter((d) => fs.existsSync(join(PDF_DIR, d, 'extraccion.json')))
  .sort();

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

  // ── 3. Documentos descargados / total ──────────────────────────────────
  const docs = it.documentos ?? [];
  const docsRealesCount = docs.filter((d) => !String(d.tipo).startsWith('anexo_')).length;
  const docsDescargados = docs.filter((d) => d.descargado === true && !String(d.tipo).startsWith('anexo_')).length;
  const docsCompletos = docsRealesCount > 0 ? `${docsDescargados}/${docsRealesCount}` : '—';

  // ── 4. Links embebidos resueltos ───────────────────────────────────────
  // Heurística: si hay un doc tipo "pliego_administrativo" con URL que NO contiene
  // "DocumentIdParam=" sino "cifrado=" (= portada que sólo agrupa enlaces),
  // y existen los pliegos canónicos (pliego_tecnico, segundo pliego_administrativo
  // específico), entonces los enlaces internos sí se resolvieron.
  const tienePliegoTecnico = docs.some((d) => d.tipo === 'pliego_tecnico');
  const tienePCAPCanonico  = docs.some((d) => d.tipo === 'pliego_administrativo' && d.nombre?.toLowerCase().includes('cláusulas'));
  const linksEmbebidos = tienePliegoTecnico && tienePCAPCanonico ? '✅' : (docs.some((d) => d.tipo === 'pliego_tecnico' || d.tipo === 'pliego_administrativo') ? '⚠️ parcial' : '❌');

  // ── 5. Docs legibles vs Vision ──────────────────────────────────────────
  // Inferimos por presencia de archivos vision-*.raw.txt en la carpeta del slug.
  const slugDir = join(PDF_DIR, slug);
  const visionFiles = fs.existsSync(slugDir)
    ? fs.readdirSync(slugDir).filter((f) => /^vision-.*\.raw\.txt$/.test(f))
    : [];
  const usoVision = visionFiles.length > 0;
  const docsLegibles = usoVision ? `Texto + Vision (${visionFiles.length} call${visionFiles.length === 1 ? '' : 's'})` : 'Texto puro';

  // ── 6. Σ pesos = 100 ────────────────────────────────────────────────────
  const peso_econ  = it.proceso?.peso_economico ?? 0;
  const peso_tec   = it.proceso?.peso_tecnico   ?? 0;
  const sumaPesos  = peso_econ + peso_tec;
  const criteriosSuman100 = Math.abs(sumaPesos - 100) < 0.5;
  if (!criteriosSuman100 && (peso_econ > 0 || peso_tec > 0)) {
    flags.push(`Σ pesos = ${sumaPesos} ≠ 100 (econ ${peso_econ} + tec ${peso_tec})`);
  }

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
  }

  // ── 10. Licitadores vs acta ────────────────────────────────────────────
  const licitadoresExtraidos = it.licitadores?.length ?? 0;
  // Si no podemos verificar contra el acta, dejamos null
  const licitadoresVsActa = licitadoresExtraidos > 0 ? `${licitadoresExtraidos} extraídos` : '—';

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

  // ── 13. Coste Vision ───────────────────────────────────────────────────
  // Aprox: $0.20 por archivo vision-*.raw.txt detectado (Sonnet 4.6 con cache)
  const costeVisionUsd = usoVision ? Number((visionFiles.length * 0.2).toFixed(2)) : 0;

  // ── 14. Última extracción ──────────────────────────────────────────────
  const ultimaExtraccion = {
    fecha: it.proceso?.extraccion_llm?.fecha ?? null,
    modelo: it.proceso?.extraccion_llm?.modelo ?? ext?._modelo ?? null,
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

  // ── Etapa ──────────────────────────────────────────────────────────────
  // En el bundle = publicado. Si tiene extraccion pero no aparece en bundle
  // sería 'aplicado' (no llega aquí porque skipeamos arriba).
  const etapa = 'publicado';

  // ── 2. Confianza global (combina cobertura + coherencia + flags) ───────
  let confianza = cobPliego;
  if (cobAdj != null) confianza = Math.round((cobPliego + cobAdj) / 2);
  // Penalizaciones
  if (!criteriosSuman100 && (peso_econ + peso_tec) > 0) confianza -= 8;
  if (coherenciaUbis.startsWith('⚠️')) confianza -= 5;
  if (coherenciaUbis.startsWith('❌')) confianza -= 15;
  if (linksEmbebidos === '⚠️ parcial') confianza -= 5;
  if (linksEmbebidos === '❌')           confianza -= 10;
  // Pliego complejo penaliza si NO está incorporado el override
  if (pliegoComplejo && !notasTexto.includes('q&a') && !notasTexto.includes('aclaraci')) confianza -= 12;
  confianza = Math.max(0, Math.min(100, confianza));

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

    criterios_suman_100: criteriosSuman100 ? '✅ 100' : `❌ ${sumaPesos}`,
    suma_pesos:          sumaPesos,
    peso_economico:      peso_econ,
    peso_tecnico:        peso_tec,

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
