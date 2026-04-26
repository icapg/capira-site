/**
 * placsp-build-json.mjs
 *
 * Genera los datasets estáticos que consume el dashboard /info/licitaciones.
 * Salidas:
 *   - data/licitaciones-emov.json         (4.229 e-mov con campos para overview + detalle)
 *   - data/licitaciones-cat-summary.json  (agregados precomputados: KPIs, series, rankings)
 *
 * Uso: node scripts/placsp-build-json.mjs
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT         = join(__dirname, '..');
const DB_FILE      = join(ROOT, 'data', 'licitaciones.db');
const PDF_DIR      = join(ROOT, 'data', 'placsp-pdfs');
const OUT_ITEMS    = join(ROOT, 'data', 'licitaciones-emov.json');
const OUT_SUMMARY  = join(ROOT, 'data', 'licitaciones-cat-summary.json');

// ── Taxonomía v3 ────────────────────────────────────────────────────────────
const CATEGORIAS = {
  '1':  { label: 'Concesión demanial / arrendamiento', short: 'Concesión demanial',     color: '#a78bfa' },
  '2':  { label: 'Obra e instalación de infraestructura', short: 'Obra infraestructura', color: '#38bdf8' },
  '3':  { label: 'Ingeniería y proyectos de recarga',  short: 'Ingeniería',             color: '#06b6d4' },
  '4':  { label: 'Suministro de cargadores / hardware', short: 'Hardware cargadores',    color: '#34d399' },
  '5':  { label: 'Software y plataformas de gestión',  short: 'Software',               color: '#10b981' },
  '6':  { label: 'Compra / renting de VE',             short: 'Compra/renting VE',      color: '#fbbf24' },
  '7':  { label: 'Bus eléctrico / autobús híbrido',    short: 'Bus eléctrico',          color: '#fb923c' },
  '8':  { label: 'Gestión y mantenimiento red',        short: 'Gestión red',            color: '#f87171' },
  '9':  { label: 'Micromovilidad eléctrica',           short: 'Micromovilidad',         color: '#e879f9' },
  '10': { label: 'Mixto FV + recarga',                 short: 'FV + recarga',           color: '#facc15' },
  '11': { label: 'Mantenimiento flota eléctrica',      short: 'Mantto flota',           color: '#c084fc' },
};

// ── Normalización provincia ─────────────────────────────────────────────────
// PLACSP devuelve provincias en forma bilingüe, con islas como provincias, y
// a veces con CCAA/país cuando es un órgano central.
// Mapeo a las 50 provincias + Ceuta + Melilla. null = ámbito supra-provincial.
const PROV_MAP = {
  // Bilingües y acentos
  'Valencia/València':        'Valencia',
  'Valencia':                 'Valencia',
  'València':                 'Valencia',
  'Alicante/Alacant':         'Alicante',
  'Alicante':                 'Alicante',
  'Alacant':                  'Alicante',
  'Castellón/Castelló':       'Castellón',
  'Castelló':                 'Castellón',
  'Castellón':                'Castellón',
  'Castellón de la Plana':    'Castellón',
  'Illes Balears':            'Islas Baleares',
  'Islas Baleares':           'Islas Baleares',
  'Baleares':                 'Islas Baleares',
  'A Coruña':                 'A Coruña',
  'La Coruña':                'A Coruña',
  'Coruña, A':                'A Coruña',
  'Ourense':                  'Ourense',
  'Orense':                   'Ourense',
  'Lugo':                     'Lugo',
  'Pontevedra':               'Pontevedra',
  'Girona':                   'Girona',
  'Gerona':                   'Girona',
  'Lleida':                   'Lleida',
  'Lérida':                   'Lleida',
  'Barcelona':                'Barcelona',
  'Tarragona':                'Tarragona',
  'Vizcaya':                  'Vizcaya',
  'Bizkaia':                  'Vizcaya',
  'Gipuzkoa':                 'Gipuzkoa',
  'Guipúzcoa':                'Gipuzkoa',
  'Álava':                    'Álava',
  'Araba':                    'Álava',
  'Araba/Álava':              'Álava',

  // Islas → provincia
  'Mallorca':                 'Islas Baleares',
  'Menorca':                  'Islas Baleares',
  'Eivissa y Formentera':     'Islas Baleares',
  'Ibiza':                    'Islas Baleares',
  'Formentera':               'Islas Baleares',
  'Gran Canaria':             'Las Palmas',
  'Lanzarote':                'Las Palmas',
  'Fuerteventura':            'Las Palmas',
  'Tenerife':                 'Santa Cruz de Tenerife',
  'La Palma':                 'Santa Cruz de Tenerife',
  'La Gomera':                'Santa Cruz de Tenerife',
  'El Hierro':                'Santa Cruz de Tenerife',

  // Ceuta y Melilla
  'Ceuta':                    'Ceuta',
  'Melilla':                  'Melilla',
};

// Ámbitos supra-provinciales → null (agrupan en "Nacional / plurinacional")
const AMBITO_NACIONAL = new Set([
  'España', 'ESPAÑA', 'ESPANA', 'Canarias', 'Castilla y León', 'Castilla - La Mancha',
  'Castilla-La Mancha', 'Comunidad de Madrid', 'Región de Murcia', 'Principado de Asturias',
  'Comunidad Foral de Navarra', 'Cataluña', 'Andalucía', 'País Vasco', 'Galicia',
  'Aragón', 'Extremadura', 'Cantabria', 'La Rioja', 'Comunitat Valenciana',
  'Unión Europea', 'Extranjero',
]);

// CCAA por provincia
const CCAA_BY_PROV = {
  'Madrid':                   'Com. de Madrid',
  'Barcelona':                'Cataluña',
  'Girona':                   'Cataluña',
  'Lleida':                   'Cataluña',
  'Tarragona':                'Cataluña',
  'Valencia':                 'Com. Valenciana',
  'Alicante':                 'Com. Valenciana',
  'Castellón':                'Com. Valenciana',
  'Sevilla':                  'Andalucía',
  'Málaga':                   'Andalucía',
  'Cádiz':                    'Andalucía',
  'Córdoba':                  'Andalucía',
  'Granada':                  'Andalucía',
  'Huelva':                   'Andalucía',
  'Jaén':                     'Andalucía',
  'Almería':                  'Andalucía',
  'Islas Baleares':           'Islas Baleares',
  'Las Palmas':               'Canarias',
  'Santa Cruz de Tenerife':   'Canarias',
  'A Coruña':                 'Galicia',
  'Lugo':                     'Galicia',
  'Ourense':                  'Galicia',
  'Pontevedra':               'Galicia',
  'Vizcaya':                  'País Vasco',
  'Gipuzkoa':                 'País Vasco',
  'Álava':                    'País Vasco',
  'Navarra':                  'Navarra',
  'Asturias':                 'Asturias',
  'Cantabria':                'Cantabria',
  'La Rioja':                 'La Rioja',
  'Zaragoza':                 'Aragón',
  'Huesca':                   'Aragón',
  'Teruel':                   'Aragón',
  'Valladolid':               'Castilla y León',
  'Burgos':                   'Castilla y León',
  'León':                     'Castilla y León',
  'Salamanca':                'Castilla y León',
  'Segovia':                  'Castilla y León',
  'Ávila':                    'Castilla y León',
  'Palencia':                 'Castilla y León',
  'Soria':                    'Castilla y León',
  'Zamora':                   'Castilla y León',
  'Toledo':                   'Castilla-La Mancha',
  'Ciudad Real':              'Castilla-La Mancha',
  'Albacete':                 'Castilla-La Mancha',
  'Cuenca':                   'Castilla-La Mancha',
  'Guadalajara':              'Castilla-La Mancha',
  'Cáceres':                  'Extremadura',
  'Badajoz':                  'Extremadura',
  'Murcia':                   'Región de Murcia',
  'Ceuta':                    'Ceuta',
  'Melilla':                  'Melilla',
};

function normProv(raw) {
  if (!raw) return null;
  const v = String(raw).trim();
  if (AMBITO_NACIONAL.has(v)) return null;
  return PROV_MAP[v] ?? v;
}

// ── Slug desde el id URI ────────────────────────────────────────────────────
// id: "https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/19534703"
// slug: "19534703"
function slugFromId(id) {
  const m = /(\d+)\s*$/.exec(id ?? '');
  return m ? m[1] : null;
}

// ── idEvl desde el deeplink ─────────────────────────────────────────────────
function idEvlFromDeeplink(deeplink) {
  if (!deeplink) return null;
  const m = /idEvl=([^&]+)/.exec(deeplink);
  return m ? decodeURIComponent(m[1]) : null;
}

function parseTags(s) {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function parseAnio(fecha) {
  if (!fecha) return null;
  const m = /^(\d{4})/.exec(fecha);
  return m ? +m[1] : null;
}
function parseMes(fecha) {
  if (!fecha) return null;
  const m = /^(\d{4})-(\d{2})/.exec(fecha);
  return m ? `${m[1]}-${m[2]}` : null;
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────
// ─── Normalizador de nombre comercial ───────────────────────────────────
// Limpia la razón social y devuelve el nombre comercial / marca.
//
// Reglas:
// 1. Si hay texto entre paréntesis al inicio y se ve como marca, usarlo: "(ZUNDER) X" → "Zunder"
// 2. Quitar sufijos corporativos: S.L., S.L.U., SA, S.A., SAU, SAU, etc.
// 3. Quitar palabras-ruido comunes: CLIENTES, SERVICIOS, RECARGA, SOLUCIONES ENERGÉTICAS, ENERGÍA, SOLUTIONS, ESPAÑA, SPAIN, IBERIA
// 4. Aplicar Title Case
const SUFIJOS_CORP = [
  'S\\.?A\\.?U\\.?', 'S\\.?L\\.?U\\.?', 'S\\.?L\\.?', 'S\\.?A\\.?', 'SAU', 'SLU', 'SA', 'SL',
  'SCA', 'SL U', 'SAS',
];
const RUIDO = [
  'CLIENTES', 'SOLUCIONES ENERGETICAS', 'SOLUCIONES ENERGÉTICAS', 'SOLUTIONS', 'SOLUCIONES',
  'SERVICIOS DE MOVILIDAD', 'SERVICIOS', 'SERVEIS', 'SERVICES',
  'E-MOBILITY', 'EMOBILITY', 'MOBILITY',
  'RECARGA', 'CHARGING', 'CHARGERS', 'CHARGE',
  'ENERGÍA', 'ENERGIA', 'ENERGY',
  'ESPAÑA', 'ESPANA', 'SPAIN', 'IBERIA',
  'URBAN',
];
function limpiarNombreComercial(raw) {
  if (!raw) return null;
  let s = raw.trim();
  // 1) texto entre paréntesis al inicio: "(ZUNDER) ..."
  const m = /^\(([A-ZÁÉÍÓÚÑ][A-Z0-9ÁÉÍÓÚÑ\- ]{1,24})\)\s*/i.exec(s);
  if (m) return toTitleCase(m[1].trim());
  // 2) quitar sufijos corporativos
  for (const suf of SUFIJOS_CORP) {
    s = s.replace(new RegExp(`[,\\s]+${suf}\\s*\\.?$`, 'i'), '');
  }
  // 3) quitar palabras-ruido (al final o medio, preservando inicio)
  for (const r of RUIDO) {
    s = s.replace(new RegExp(`[,\\s]+${r}(?=$|[,\\s])`, 'gi'), '');
  }
  s = s.replace(/\s{2,}/g, ' ').trim();
  return toTitleCase(s);
}
function toTitleCase(s) {
  if (!s) return s;
  return s.split(/\s+/).map((w) => {
    if (w.length <= 2) return w.toUpperCase();
    const lower = w.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

// ─── Cargar mapping NIF → nombre comercial desde infraestructura.db ─────
function cargarMapaComercial() {
  const INFRA_DB = join(ROOT, 'data', 'infraestructura.db');
  const ALIAS_FILE = join(ROOT, 'data', 'empresas-aliases.json');
  const mapa = new Map();
  let fromInfra = 0, fromAlias = 0;

  // 1) Fuente primaria: tabla `cpos` de infraestructura.db (datos OCPI vía mapareve)
  try {
    const infraDb = new Database(INFRA_DB, { readonly: true });
    const rows = infraDb.prepare(`SELECT cif, name, party_id FROM cpos WHERE cif IS NOT NULL AND cif != ''`).all();
    for (const r of rows) {
      const nif = r.cif.trim().toUpperCase();
      const comercial = limpiarNombreComercial(r.name);
      if (comercial) { mapa.set(nif, { comercial, party_id: r.party_id, razon_social: r.name, fuente: 'mapareve_ocpi' }); fromInfra++; }
    }
    infraDb.close();
    console.log(`   ← ${fromInfra} CPOs leídos de infraestructura.db`);
  } catch (e) {
    console.log(`   ⚠ infraestructura.db no disponible (${e.message})`);
  }

  // 2) Overrides manuales: data/empresas-aliases.json
  try {
    if (fs.existsSync(ALIAS_FILE)) {
      const aliases = JSON.parse(fs.readFileSync(ALIAS_FILE, 'utf8'));
      for (const [nif, info] of Object.entries(aliases)) {
        const N = nif.trim().toUpperCase();
        const prev = mapa.get(N) ?? {};
        mapa.set(N, { ...prev, ...info, fuente: 'alias_manual' });
        fromAlias++;
      }
      console.log(`   ← ${fromAlias} overrides de empresas-aliases.json`);
    }
  } catch (e) {
    console.log(`   ⚠ empresas-aliases.json no leído (${e.message})`);
  }

  return mapa;
}

function main() {
  console.log(`⏳ Abriendo DB ${DB_FILE}...`);
  const db = new Database(DB_FILE, { readonly: true });

  // Cargar mapa NIF → nombre comercial (desde infraestructura.db + aliases manuales)
  const mapaComercial = cargarMapaComercial();

  // Totales de contexto (universo completo)
  const totalUniverso = db.prepare(`SELECT COUNT(*) AS n FROM licitaciones`).get().n;

  // Traer todas las e-mov
  console.log(`⏳ Extrayendo e-mov de licitaciones...`);
  const t0 = Date.now();
  const rows = db.prepare(`
    SELECT
      id, expediente, deeplink, titulo, resumen,
      organo_nombre, organo_nif,
      tipo_contrato, procedimiento,
      importe_estimado, importe_base, importe_adjudicado,
      plazo_ejecucion_meses,
      provincia_codigo, provincia_nombre, ciudad,
      fecha_publicacion, fecha_limite_ofertas, fecha_adjudicacion, fecha_formalizacion, fecha_ultima_actualizacion,
      dias_aviso, estado_actual,
      financiacion_ue, programa_ue,
      tiene_infra_recarga,
      categoria_emov, subcategoria, confianza_clasificacion, tags,
      plazo_concesion_anos, renovacion_anos, tipo_retribucion,
      canon_minimo_anual, canon_anual_ofertado_ganador, canon_por_cargador_ofertado,
      num_ubicaciones, num_cargadores_ac, num_cargadores_dc, num_cargadores_dc_plus, num_cargadores_hpc, num_cargadores_total,
      quality_score_ubicacion,
      -- Fase 2 LLM: bloque común
      criterios_valoracion, peso_criterios_economicos, peso_criterios_tecnicos,
      mejoras_puntuables, criterios_juicio_valor, tipo_adjudicacion, idioma_pliego,
      extraccion_llm_fecha, extraccion_llm_modelo, extraccion_llm_warnings,
      extraccion_llm_notas_pliego, extraccion_llm_notas_adjudicacion,
      -- Fase 2 LLM: bloque cat=1
      fecha_inicio_concesion, tipo_inicio_concesion, plazo_construccion_meses,
      potencia_disponible_kw, potencia_disponible_garantizada,
      tecnologia_requerida,
      num_cargadores_minimo, num_cargadores_opcional_extra,
      potencia_minima_por_cargador_kw, potencia_opcional_subible,
      canon_por_ubicacion_anual,
      canon_variable_pct, canon_variable_eur_kwh,
      canon_mix_fijo_anual, canon_mix_var_pct, canon_mix_var_eur_kwh, canon_mix_fijo_por_cargador,
      precio_max_kwh_usuario, precio_kwh_ofertado_ganador, mantenimiento_precio_anos,
      peso_construccion_tiempo, peso_proyecto_tecnico, peso_mas_hw_potencia, peso_mas_ubicaciones, peso_otros,
      peso_canon_fijo, peso_canon_variable,
      garantia_provisional_eur, garantia_provisional_pct, garantia_provisional_exigida,
      garantia_definitiva_eur, garantia_definitiva_pct, garantia_definitiva_base,
      requisitos_solvencia_economica, requisitos_solvencia_tecnica, requisitos_adicionales
    FROM licitaciones
    WHERE categoria_emov IS NOT NULL AND categoria_emov != 'no_emov'
    ORDER BY fecha_publicacion DESC, id DESC
  `).all();
  console.log(`   ${rows.length} filas (${((Date.now()-t0)/1000).toFixed(1)}s)`);

  // Licitadores (todos los roles: adjudicataria / participante / excluida) con ofertas y puntuaciones
  console.log(`⏳ Cruzando licitadores...`);
  const licitadoresByLic = new Map();
  const qLicit = db.prepare(`
    SELECT l.licitacion_id, l.empresa_nif, l.empresa_nombre, l.rol, l.es_ute, l.miembros_ute,
           l.oferta_economica, l.oferta_canon_anual, l.oferta_canon_por_cargador,
           l.oferta_canon_variable_eur_kwh, l.oferta_canon_variable_pct, l.oferta_descuento_residentes_pct,
           l.oferta_precio_kwh_usuario, l.oferta_mantenimiento_precio_anos,
           l.inversion_comprometida,
           l.puntuacion_economica, l.puntuacion_tecnica, l.puntuacion_total,
           l.puntuaciones_detalle,
           l.rank_position, l.motivo_exclusion, l.mejoras_ofertadas
    FROM licitadores l
    JOIN licitaciones li ON li.id = l.licitacion_id
    WHERE li.categoria_emov IS NOT NULL AND li.categoria_emov != 'no_emov'
    ORDER BY l.licitacion_id, l.id
  `);
  const safeJson = (s) => { if (!s) return null; try { return JSON.parse(s); } catch { return null; } };
  for (const r of qLicit.iterate()) {
    if (!licitadoresByLic.has(r.licitacion_id)) licitadoresByLic.set(r.licitacion_id, []);
    licitadoresByLic.get(r.licitacion_id).push({
      nif:    r.empresa_nif,
      nombre: r.empresa_nombre,
      rol:    r.rol,
      es_ute: !!r.es_ute,
      miembros_ute:             safeJson(r.miembros_ute),
      oferta_economica:         r.oferta_economica,
      oferta_canon_anual:       r.oferta_canon_anual,
      oferta_canon_por_cargador: r.oferta_canon_por_cargador,
      oferta_canon_variable_eur_kwh: r.oferta_canon_variable_eur_kwh,
      oferta_canon_variable_pct:     r.oferta_canon_variable_pct,
      oferta_descuento_residentes_pct: r.oferta_descuento_residentes_pct,
      oferta_precio_kwh_usuario: r.oferta_precio_kwh_usuario,
      oferta_mantenimiento_precio_anos: r.oferta_mantenimiento_precio_anos,
      inversion_comprometida:   r.inversion_comprometida,
      puntuacion_economica:     r.puntuacion_economica,
      puntuacion_tecnica:       r.puntuacion_tecnica,
      puntuacion_total:         r.puntuacion_total,
      puntuaciones_detalle:     safeJson(r.puntuaciones_detalle),
      rank_position:            r.rank_position,
      motivo_exclusion:         r.motivo_exclusion,
      mejoras_ofertadas:        safeJson(r.mejoras_ofertadas),
    });
  }

  // Ubicaciones por concesión (cat=1) — fase 2 LLM
  console.log(`⏳ Cruzando ubicaciones_concesion...`);
  const ubicacionesByLic = new Map();
  try {
    const qUbic = db.prepare(`
      SELECT licitacion_id, nombre, direccion, municipio, ciudad_ine, latitud, longitud,
             plazas, num_cargadores_ac, num_cargadores_dc, num_cargadores_dc_plus, num_cargadores_hpc, num_cargadores_total,
             potencia_total_kw, potencia_por_cargador_kw, tipo_hw, plazo_pem_meses, google_maps_url, notas, es_opcional, es_existente, plano_url, plano_label
      FROM ubicaciones_concesion
      ORDER BY licitacion_id, id
    `);
    for (const u of qUbic.iterate()) {
      if (!ubicacionesByLic.has(u.licitacion_id)) ubicacionesByLic.set(u.licitacion_id, []);
      const ubic = {
        nombre:    u.nombre,
        direccion: u.direccion,
        municipio: u.municipio,
        plazas:    u.plazas,
        cargadores_ac:     u.num_cargadores_ac,
        cargadores_dc:     u.num_cargadores_dc,
        cargadores_dc_plus: u.num_cargadores_dc_plus,
        cargadores_hpc:    u.num_cargadores_hpc,
        cargadores_total:  u.num_cargadores_total,
        potencia_total_kw:        u.potencia_total_kw,
        potencia_por_cargador_kw: u.potencia_por_cargador_kw,
        tipo_hw:          u.tipo_hw,
        plazo_pem_meses:  u.plazo_pem_meses,
        google_maps_url:  u.google_maps_url,
        notas:            u.notas,
        es_opcional:      !!u.es_opcional,
      };
      if (u.es_existente) ubic.es_existente = true;
      if (u.plano_url)    ubic.plano_url    = u.plano_url;
      if (u.plano_label)  ubic.plano_label  = u.plano_label;
      if (u.latitud != null && u.longitud != null) { ubic.latitud = u.latitud; ubic.longitud = u.longitud; }
      ubicacionesByLic.get(u.licitacion_id).push(ubic);
    }
  } catch (e) {
    console.log(`   ⚠ ubicaciones_concesion no disponible (${e.message})`);
  }

  // Documentos (URLs a PDFs del expediente)
  console.log(`⏳ Cruzando documentos...`);
  const docsByLic = new Map();
  const qDoc = db.prepare(`
    SELECT d.licitacion_id, d.tipo, d.nombre_original, d.url, d.fecha_subida, d.descargado, d.resumen_ia
    FROM documentos d
    JOIN licitaciones li ON li.id = d.licitacion_id
    WHERE li.categoria_emov IS NOT NULL AND li.categoria_emov != 'no_emov'
    ORDER BY d.licitacion_id, d.id
  `);
  for (const d of qDoc.iterate()) {
    if (!docsByLic.has(d.licitacion_id)) docsByLic.set(d.licitacion_id, []);
    const doc = {
      tipo: d.tipo, url: d.url, fecha: d.fecha_subida,
      descargado: !!d.descargado, resumen_ia: d.resumen_ia,
    };
    if (d.nombre_original) doc.nombre = d.nombre_original;
    docsByLic.get(d.licitacion_id).push(doc);
  }

  // CPVs por licitación
  console.log(`⏳ Cruzando CPVs...`);
  const cpvsByLic = new Map();
  const qCpv = db.prepare(`
    SELECT c.licitacion_id, c.cpv_code
    FROM licitacion_cpvs c
    JOIN licitaciones li ON li.id = c.licitacion_id
    WHERE li.categoria_emov IS NOT NULL AND li.categoria_emov != 'no_emov'
  `);
  for (const r of qCpv.iterate()) {
    if (!cpvsByLic.has(r.licitacion_id)) cpvsByLic.set(r.licitacion_id, []);
    cpvsByLic.get(r.licitacion_id).push(r.cpv_code);
  }

  // Snapshots (historial de estados)
  console.log(`⏳ Cruzando snapshots de estado...`);
  const snapsByLic = new Map();
  const qSnap = db.prepare(`
    SELECT s.licitacion_id, s.estado, s.fecha
    FROM snapshots_estado s
    JOIN licitaciones li ON li.id = s.licitacion_id
    WHERE li.categoria_emov IS NOT NULL AND li.categoria_emov != 'no_emov'
    ORDER BY s.licitacion_id, s.fecha ASC
  `);
  for (const r of qSnap.iterate()) {
    if (!snapsByLic.has(r.licitacion_id)) snapsByLic.set(r.licitacion_id, []);
    snapsByLic.get(r.licitacion_id).push({ estado: r.estado, fecha: r.fecha });
  }

  db.close();

  // ── Compactar items + normalizar (omitir nulls/defaults para achicar JSON) ─
  console.log(`⏳ Compactando items...`);
  // Reconstrucción en frontend:
  //   id       = `https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/${slug}`
  //   deeplink = `https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=${encodeURIComponent(idEvl)}`
  const put = (obj, k, v) => { if (v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) obj[k] = v; };
  const items = [];
  for (const r of rows) {
    const slug = slugFromId(r.id);
    if (!slug) continue;
    const provincia = normProv(r.provincia_nombre);
    const ccaa      = provincia ? (CCAA_BY_PROV[provincia] ?? null) : null;
    const tags      = parseTags(r.tags);
    const licitadores = licitadoresByLic.get(r.id) ?? [];
    const adjudicatarios = licitadores.filter((l) => l.rol === 'adjudicataria');

    const it = { slug, categoria: r.categoria_emov, titulo: r.titulo };
    put(it, 'expediente',   r.expediente);
    put(it, 'idEvl',        idEvlFromDeeplink(r.deeplink));
    put(it, 'organo',       r.organo_nombre);
    put(it, 'organo_nif',   r.organo_nif);
    put(it, 'tipo_contrato', r.tipo_contrato);
    put(it, 'importe_base', r.importe_base);
    put(it, 'importe_estimado', r.importe_estimado !== r.importe_base ? r.importe_estimado : null);
    put(it, 'importe_adjudicado', r.importe_adjudicado);
    put(it, 'plazo_meses',  r.plazo_ejecucion_meses);
    put(it, 'provincia',    provincia);
    put(it, 'ccaa',         ccaa);
    if (r.provincia_nombre && r.provincia_nombre !== provincia) put(it, 'provincia_raw', r.provincia_nombre);
    put(it, 'ciudad',       r.ciudad);
    put(it, 'fecha_publicacion',   r.fecha_publicacion);
    put(it, 'fecha_limite',        r.fecha_limite_ofertas);
    put(it, 'fecha_adjudicacion',  r.fecha_adjudicacion);
    put(it, 'fecha_formalizacion', r.fecha_formalizacion);
    put(it, 'dias_aviso',   r.dias_aviso);
    put(it, 'estado',       r.estado_actual);
    // Última actualización del item: el max entre la última extracción LLM y
    // la fecha que viene del feed XML del PLACSP. Permite mostrarle al usuario
    // qué tan "fresca" está la info y si conviene refrescar el expediente.
    const fechaActualizacion = [r.extraccion_llm_fecha, r.fecha_ultima_actualizacion]
      .filter(Boolean)
      .sort()
      .pop();
    put(it, 'fecha_actualizacion', fechaActualizacion);
    if (r.financiacion_ue) it.financiacion_ue = true;
    put(it, 'programa_ue',  r.programa_ue);
    put(it, 'subcategoria', r.subcategoria);
    put(it, 'confianza',    r.confianza_clasificacion);
    if (r.tiene_infra_recarga) it.tiene_infra = true;
    put(it, 'tags', tags);

    if (r.categoria_emov === '1') {
      const concesion = {};
      // Del pliego (XML)
      put(concesion, 'plazo_anos',         r.plazo_concesion_anos);
      put(concesion, 'renovacion_anos',    r.renovacion_anos);
      put(concesion, 'tipo_retribucion',   r.tipo_retribucion);
      put(concesion, 'canon_minimo_anual', r.canon_minimo_anual);
      put(concesion, 'canon_ganador',      r.canon_anual_ofertado_ganador);
      put(concesion, 'canon_por_cargador', r.canon_por_cargador_ofertado);
      put(concesion, 'num_ubicaciones',    r.num_ubicaciones);
      // HW real por tecnología (pueden estar null hasta fase 2)
      put(concesion, 'num_cargadores',     r.num_cargadores_total);
      put(concesion, 'num_cargadores_ac',  r.num_cargadores_ac);
      put(concesion, 'num_cargadores_dc',  r.num_cargadores_dc);
      put(concesion, 'num_cargadores_dc_plus', r.num_cargadores_dc_plus);
      put(concesion, 'num_cargadores_hpc', r.num_cargadores_hpc);
      put(concesion, 'quality_ubicacion',  r.quality_score_ubicacion);
      // Fase 2 LLM
      put(concesion, 'fecha_inicio',                r.fecha_inicio_concesion);
      put(concesion, 'tipo_inicio',                 r.tipo_inicio_concesion);
      put(concesion, 'plazo_construccion_meses',    r.plazo_construccion_meses);
      put(concesion, 'potencia_disponible_kw',      r.potencia_disponible_kw);
      if (r.potencia_disponible_garantizada) concesion.potencia_garantizada = true;
      put(concesion, 'tecnologia_requerida',        r.tecnologia_requerida);
      put(concesion, 'num_cargadores_minimo',       r.num_cargadores_minimo);
      if (r.num_cargadores_opcional_extra) concesion.num_cargadores_opcional = true;
      put(concesion, 'potencia_minima_por_cargador_kw', r.potencia_minima_por_cargador_kw);
      if (r.potencia_opcional_subible) concesion.potencia_opcional_subible = true;
      // Breakdown canon detallado
      put(concesion, 'canon_por_ubicacion_anual',       r.canon_por_ubicacion_anual);
      put(concesion, 'canon_variable_pct',              r.canon_variable_pct);
      put(concesion, 'canon_variable_eur_kwh',          r.canon_variable_eur_kwh);
      put(concesion, 'canon_mix_fijo_anual',            r.canon_mix_fijo_anual);
      put(concesion, 'canon_mix_var_pct',               r.canon_mix_var_pct);
      put(concesion, 'canon_mix_var_eur_kwh',           r.canon_mix_var_eur_kwh);
      put(concesion, 'canon_mix_fijo_por_cargador',     r.canon_mix_fijo_por_cargador);
      // Variante venta de energía al usuario
      put(concesion, 'precio_max_kwh_usuario',          r.precio_max_kwh_usuario);
      put(concesion, 'precio_kwh_ofertado_ganador',     r.precio_kwh_ofertado_ganador);
      put(concesion, 'mantenimiento_precio_anos',       r.mantenimiento_precio_anos);
      // Ubicaciones detalladas
      put(concesion, 'ubicaciones',                 ubicacionesByLic.get(r.id));
      if (Object.keys(concesion).length) it.concesion = concesion;
    }

    // Proceso de licitación (fase 2 LLM · común a todas las cats)
    const proceso = {};
    const criterios = safeJson(r.criterios_valoracion);
    const mejoras   = safeJson(r.mejoras_puntuables);
    const criteriosJV = safeJson(r.criterios_juicio_valor);
    const warnings        = safeJson(r.extraccion_llm_warnings);
    const notasPliego       = safeJson(r.extraccion_llm_notas_pliego);
    const notasAdjudicacion = safeJson(r.extraccion_llm_notas_adjudicacion);
    if (criterios) proceso.criterios_valoracion = criterios;
    put(proceso, 'peso_economico', r.peso_criterios_economicos);
    put(proceso, 'peso_tecnico',   r.peso_criterios_tecnicos);
    put(proceso, 'peso_construccion_tiempo', r.peso_construccion_tiempo);
    put(proceso, 'peso_proyecto_tecnico',    r.peso_proyecto_tecnico);
    put(proceso, 'peso_mas_hw_potencia',     r.peso_mas_hw_potencia);
    put(proceso, 'peso_mas_ubicaciones',     r.peso_mas_ubicaciones);
    put(proceso, 'peso_otros',               r.peso_otros);
    put(proceso, 'peso_canon_fijo',          r.peso_canon_fijo);
    put(proceso, 'peso_canon_variable',      r.peso_canon_variable);

    // Garantías
    const garantias = {};
    put(garantias, 'provisional_eur', r.garantia_provisional_eur);
    put(garantias, 'provisional_pct', r.garantia_provisional_pct);
    if (r.garantia_provisional_exigida != null) garantias.provisional_exigida = !!r.garantia_provisional_exigida;
    put(garantias, 'definitiva_eur',  r.garantia_definitiva_eur);
    put(garantias, 'definitiva_pct',  r.garantia_definitiva_pct);
    put(garantias, 'definitiva_base', r.garantia_definitiva_base);
    if (Object.keys(garantias).length) proceso.garantias = garantias;

    // Requisitos / must-haves
    const reqEco = safeJson(r.requisitos_solvencia_economica);
    const reqTec = safeJson(r.requisitos_solvencia_tecnica);
    const reqAdi = safeJson(r.requisitos_adicionales);
    const requisitos = {};
    if (reqEco) requisitos.solvencia_economica = reqEco;
    if (reqTec) requisitos.solvencia_tecnica   = reqTec;
    if (reqAdi) requisitos.adicionales         = reqAdi;
    if (Object.keys(requisitos).length) proceso.requisitos = requisitos;
    if (mejoras)  proceso.mejoras_puntuables = mejoras;
    if (criteriosJV) proceso.criterios_juicio_valor = criteriosJV;
    put(proceso, 'tipo_adjudicacion', r.tipo_adjudicacion);
    put(proceso, 'idioma_pliego',     r.idioma_pliego);
    if (r.extraccion_llm_fecha) {
      proceso.extraccion_llm = {
        fecha:  r.extraccion_llm_fecha,
        modelo: r.extraccion_llm_modelo,
        notas_pliego:       notasPliego       ?? undefined,
        notas_adjudicacion: notasAdjudicacion ?? undefined,
        warnings:           warnings          ?? undefined,  // legacy
      };
    }
    if (Object.keys(proceso).length) it.proceso = proceso;

    // Licitadores (TODOS los roles) con ofertas y puntuaciones para tabla comparativa
    const allLicit = licitadoresByLic.get(r.id) ?? [];
    if (allLicit.length) {
      it.licitadores = allLicit.map((l) => {
        const o = { nombre: l.nombre, rol: l.rol };
        const marca = l.nif ? mapaComercial.get(l.nif.trim().toUpperCase()) : null;
        if (marca?.comercial) {
          o.nombre_comercial = marca.comercial;
          if (marca.party_id) o.party_id = marca.party_id;
        }
        put(o, 'nif',    l.nif);
        if (l.es_ute) o.es_ute = true;
        put(o, 'miembros_ute',              l.miembros_ute);
        put(o, 'oferta_economica',          l.oferta_economica);
        put(o, 'oferta_canon_anual',        l.oferta_canon_anual);
        put(o, 'oferta_canon_por_cargador', l.oferta_canon_por_cargador);
        put(o, 'oferta_canon_variable_eur_kwh', l.oferta_canon_variable_eur_kwh);
        put(o, 'oferta_canon_variable_pct',     l.oferta_canon_variable_pct);
        put(o, 'oferta_descuento_residentes_pct', l.oferta_descuento_residentes_pct);
        put(o, 'oferta_precio_kwh_usuario', l.oferta_precio_kwh_usuario);
        put(o, 'oferta_mantenimiento_precio_anos', l.oferta_mantenimiento_precio_anos);
        put(o, 'inversion_comprometida',    l.inversion_comprometida);
        put(o, 'puntuacion_economica',      l.puntuacion_economica);
        put(o, 'puntuacion_tecnica',        l.puntuacion_tecnica);
        put(o, 'puntuacion_total',          l.puntuacion_total);
        put(o, 'puntuaciones_detalle',      l.puntuaciones_detalle);
        put(o, 'rank_position',             l.rank_position);
        put(o, 'motivo_exclusion',          l.motivo_exclusion);
        put(o, 'mejoras_ofertadas',         l.mejoras_ofertadas);
        return o;
      });
    }
    // Atajo `adjudicatarios` para las listas rápidas de overview
    if (adjudicatarios.length) {
      it.adjudicatarios = adjudicatarios.map((l) => {
        const o = { nombre: l.nombre };
        const marca = l.nif ? mapaComercial.get(l.nif.trim().toUpperCase()) : null;
        if (marca?.comercial) {
          o.nombre_comercial = marca.comercial;
          if (marca.party_id) o.party_id = marca.party_id;
        }
        put(o, 'nif', l.nif);
        if (l.es_ute) o.es_ute = true;
        return o;
      });
    }

    put(it, 'cpvs',       cpvsByLic.get(r.id));
    put(it, 'snapshots',  snapsByLic.get(r.id));
    put(it, 'documentos', docsByLic.get(r.id));

    // ── Anexos de pliegos: deep-links #page=N (spec §4.ter regla H) ──
    // Los anexos no son docs separados en PLACSP — están dentro del PCAP/PPT.
    // Si extraccion.json tiene `anexos_pliego[]`, los expandimos a entradas
    // Documento adicionales con la URL del padre + sufijo #page=N.
    const slugAnexos = it.slug;
    if (slugAnexos) {
      const extPath = join(PDF_DIR, slugAnexos, 'extraccion.json');
      if (fs.existsSync(extPath)) {
        try {
          const ext = JSON.parse(fs.readFileSync(extPath, 'utf8'));
          const anexos = Array.isArray(ext?.anexos_pliego) ? ext.anexos_pliego : [];
          if (anexos.length > 0 && Array.isArray(it.documentos)) {
            for (const ax of anexos) {
              if (!ax?.label || !ax?.doc_tipo || !ax?.page_inicio) continue;
              const padre = it.documentos.find((d) => d.tipo === ax.doc_tipo);
              if (!padre || !padre.url) continue;
              const baseUrl = padre.url.split('#')[0];
              const docVirtual = {
                tipo:        `anexo_${ax.doc_tipo}`,
                nombre:      ax.label,
                url:         `${baseUrl}#page=${ax.page_inicio}`,
                parent_tipo: ax.doc_tipo,
                page_inicio: ax.page_inicio,
              };
              if (ax.page_fin)     docVirtual.page_fin    = ax.page_fin;
              if (ax.descripcion)  docVirtual.resumen_ia  = ax.descripcion;
              it.documentos.push(docVirtual);
            }
          }
        } catch (e) {
          console.log(`   ⚠ ${slugAnexos}: no se pudieron leer anexos_pliego (${e.message})`);
        }
      }
    }

    items.push(it);
  }

  // ── Escribir licitaciones-emov.json ─────────────────────────────────────
  const bundleItems = {
    generated_at: new Date().toISOString(),
    fuente:       'PLACSP — contrataciondelestado.es',
    taxonomia:    'v3',
    ventana: {
      desde: items.reduce((m, it) => (it.fecha_publicacion && (!m || it.fecha_publicacion < m) ? it.fecha_publicacion : m), null),
      hasta: items.reduce((m, it) => (it.fecha_publicacion && (!m || it.fecha_publicacion > m) ? it.fecha_publicacion : m), null),
    },
    count: items.length,
    total_universo: totalUniverso,
    categorias: CATEGORIAS,
    items,
  };
  writeFileSync(OUT_ITEMS, JSON.stringify(bundleItems));
  console.log(`✅ ${OUT_ITEMS}  (${(JSON.stringify(bundleItems).length / 1024 / 1024).toFixed(2)} MB)`);

  // ── Agregados para summary ──────────────────────────────────────────────
  console.log(`⏳ Calculando agregados...`);

  // Por categoría
  const porCat = {};
  for (const cat of Object.keys(CATEGORIAS)) {
    porCat[cat] = { n: 0, importe_base_total: 0, importe_base_n: 0, adjudicadas: 0 };
  }
  for (const it of items) {
    const c = porCat[it.categoria];
    if (!c) continue;
    c.n++;
    if (it.importe_base != null) { c.importe_base_total += it.importe_base; c.importe_base_n++; }
    if (it.estado === 'RES' || it.estado === 'ADJ') c.adjudicadas++;
  }
  const por_categoria = Object.entries(CATEGORIAS).map(([cat, meta]) => ({
    cat,
    label: meta.label,
    short: meta.short,
    color: meta.color,
    ...porCat[cat],
  }));

  // Por estado
  const estadoMap = new Map();
  for (const it of items) {
    const k = it.estado ?? '—';
    estadoMap.set(k, (estadoMap.get(k) ?? 0) + 1);
  }
  const por_estado = [...estadoMap.entries()]
    .map(([estado, n]) => ({ estado, n }))
    .sort((a, b) => b.n - a.n);

  // Por tipo de contrato
  const tipoMap = new Map();
  for (const it of items) {
    const k = it.tipo_contrato ?? '—';
    tipoMap.set(k, (tipoMap.get(k) ?? 0) + 1);
  }
  const por_tipo_contrato = [...tipoMap.entries()]
    .map(([tipo, n]) => ({ tipo, n }))
    .sort((a, b) => b.n - a.n);

  // Serie mensual por categoría (2018-01 → hoy)
  const mesMap = new Map(); // key = "YYYY-MM", val = { total, por_cat: { '1':n, ... } }
  for (const it of items) {
    const mes = parseMes(it.fecha_publicacion);
    if (!mes) continue;
    if (!mesMap.has(mes)) mesMap.set(mes, { total: 0, por_cat: {} });
    const e = mesMap.get(mes);
    e.total++;
    e.por_cat[it.categoria] = (e.por_cat[it.categoria] ?? 0) + 1;
  }
  const serie_mensual = [...mesMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, v]) => ({ mes, total: v.total, por_cat: v.por_cat }));

  // Serie anual por categoría
  const anioMap = new Map();
  for (const it of items) {
    const anio = parseAnio(it.fecha_publicacion);
    if (!anio) continue;
    if (!anioMap.has(anio)) anioMap.set(anio, { total: 0, por_cat: {}, importe_base_total: 0 });
    const e = anioMap.get(anio);
    e.total++;
    e.por_cat[it.categoria] = (e.por_cat[it.categoria] ?? 0) + 1;
    if (it.importe_base != null) e.importe_base_total += it.importe_base;
  }
  const serie_anual = [...anioMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([anio, v]) => ({ anio, total: v.total, por_cat: v.por_cat, importe_base_total: v.importe_base_total }));

  // Por provincia (ámbito nacional/plurinacional agrupa las que no tienen provincia)
  const provMap = new Map();
  for (const it of items) {
    const k = it.provincia ?? '__nacional__';
    if (!provMap.has(k)) provMap.set(k, {
      provincia: it.provincia ?? null,
      ccaa:      it.ccaa ?? null,
      nacional:  !it.provincia,
      n: 0, importe_base_total: 0, por_cat: {},
    });
    const e = provMap.get(k);
    e.n++;
    if (it.importe_base != null) e.importe_base_total += it.importe_base;
    e.por_cat[it.categoria] = (e.por_cat[it.categoria] ?? 0) + 1;
  }
  const por_provincia = [...provMap.values()].sort((a, b) => b.n - a.n);

  // Top adjudicatarios
  const adjMap = new Map(); // key = nif||nombre
  for (const it of items) {
    for (const a of (it.adjudicatarios ?? [])) {
      const k = a.nif || a.nombre;
      if (!k) continue;
      if (!adjMap.has(k)) adjMap.set(k, { nombre: a.nombre, nif: a.nif, n: 0, importe_base_total: 0, por_cat: {} });
      const e = adjMap.get(k);
      e.n++;
      if (it.importe_base != null) e.importe_base_total += it.importe_base;
      e.por_cat[it.categoria] = (e.por_cat[it.categoria] ?? 0) + 1;
    }
  }
  const top_adjudicatarios = [...adjMap.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 60);

  // Top órganos
  const organoMap = new Map();
  for (const it of items) {
    const k = it.organo_nif || it.organo;
    if (!k) continue;
    if (!organoMap.has(k)) organoMap.set(k, { nombre: it.organo, nif: it.organo_nif, n: 0, importe_base_total: 0, por_cat: {} });
    const e = organoMap.get(k);
    e.n++;
    if (it.importe_base != null) e.importe_base_total += it.importe_base;
    e.por_cat[it.categoria] = (e.por_cat[it.categoria] ?? 0) + 1;
  }
  const top_organos = [...organoMap.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 60);

  // Programa UE (tags)
  const programaMap = new Map();
  for (const it of items) {
    for (const tag of (it.tags ?? [])) {
      programaMap.set(tag, (programaMap.get(tag) ?? 0) + 1);
    }
  }
  const por_programa_ue = [...programaMap.entries()]
    .map(([programa, n]) => ({ programa, n }))
    .sort((a, b) => b.n - a.n);

  // Totales
  let importe_base_total = 0, importe_base_n = 0;
  for (const it of items) if (it.importe_base != null) { importe_base_total += it.importe_base; importe_base_n++; }

  const summary = {
    generated_at: new Date().toISOString(),
    fuente:       'PLACSP — contrataciondelestado.es',
    taxonomia:    'v3',
    ventana: bundleItems.ventana,
    total_emov:      items.length,
    total_universo:  totalUniverso,
    pct_emov:        +((items.length / totalUniverso) * 100).toFixed(3),
    importe_base_total,
    importe_base_n,
    categorias: CATEGORIAS,
    por_categoria,
    por_estado,
    por_tipo_contrato,
    serie_mensual,
    serie_anual,
    por_provincia,
    por_programa_ue,
    top_adjudicatarios,
    top_organos,
  };
  writeFileSync(OUT_SUMMARY, JSON.stringify(summary));
  console.log(`✅ ${OUT_SUMMARY}  (${(JSON.stringify(summary).length / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`🎉 Done`);
}

main();
