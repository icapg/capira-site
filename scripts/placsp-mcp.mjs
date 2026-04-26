/**
 * PLACSP MCP Server — Especialista en licitaciones de contratación pública
 *
 * Expone la base SQLite `data/licitaciones.db` (construida por placsp-import +
 * placsp-classify) a Claude Code, siguiendo el mismo patrón que `dgt-mcp.mjs`.
 *
 * Registro en MCP: `placsp-specialist`.
 */

import { Server }       from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Database         from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync as fsReadFileSync }   from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'licitaciones.db');

const SCHEMA_DOC = `
# Base de datos PLACSP — Licitaciones de Contratación Pública de España

## Identidad de este especialista
Sos el especialista en licitaciones públicas de e-movilidad en España para Capira.
Tu propósito: responder con datos sustentados por SQL sobre el mercado de
licitaciones públicas relacionadas con vehículos eléctricos, infraestructura de
recarga, concesiones demaniales, y ecosistema de e-movilidad completo.
El dashboard en capira-site/info/licitaciones NO es CPO-céntrico: cubre todo el
universo e-mov (fabricantes VE, renting, instaladores, CPOs, concesionarias,
operadores de transporte, etc.).

## Fuente
Plataforma de Contratación del Sector Público (contrataciondelestado.es), Atom/XML UBL-CODICE.
Ventana: 2018-01 → 2026-04 (100 meses completos). Actualización: delta diaria via cabeza Atom.
Cobertura: ~98 % de licitaciones españolas. Falta ~2 % que solo aparece en portales autonómicos
(contractaciopublica.cat, contratacion.euskadi.eus, pdc_sirec JdA, contratos-publicos.comunidad.madrid)
o en TED. Esta brecha es roadmap fase 3.

## Volumen actual
- 1.020.226 licitaciones totales
- 4.229 clasificadas como e-mov (0.41 %)
- 1.642.968 CPVs asociados
- 3.208.318 filas en licitadores (mayormente adjudicatarias; no ganadores + ofertas en PDFs = fase 2)
- 2.173.037 snapshots de estado (timeline PUB→EV→ADJ→RES)

## Taxonomía v3 (11 categorías + no_emov)

La clasificación \`categoria_emov\` se aplica por precedencia top-down:

  1  Concesión demanial / arrendamiento para red de recarga    [172]
     Subtipos: demanial_puro, arrendamiento_espacio, concesion_administrativa
  2  Obra e instalación de infraestructura de recarga          [747]
  3  Ingeniería y proyectos de recarga (redacción proyecto, DF, CSS)  [12]
  4  Suministro de cargadores / hardware                       [384]
  5  Software y plataformas de gestión de recarga              [12]
  6  Compra / renting de VE                                    [2.373]
     Subtipos: 6a_turismos_furgonetas, 6b_camiones, 6c_maquinaria
  7  Bus eléctrico / autobús híbrido                           [167]
  8  Gestión y mantenimiento de red de recarga                 [31]
  9  Micromovilidad eléctrica (bici/patinete/aparcabici)       [134]
 10  Mixto FV + recarga (pérgolas FV con puntos de carga)      [117]
 11  Mantenimiento de flota eléctrica                          [80]
 no_emov  — fuera del universo                                 [1.015.997]

Total e-mov: 4.229 en 100 meses (2018-01 → 2026-04).

## Conceptos clave del dominio

### tiene_infra_recarga (bool)
Flag derivado. Separa el universo e-mov en dos líneas de interés:
  - =1: incluye infraestructura física de recarga (puntos de carga, cargadores).
    Interés CPO, instaladoras, fabricantes de cargadores.
  - =0: vehículos sin infraestructura de recarga asociada (compra de VE pura,
    buses sin cargador nuevo, mantenimiento).
    Interés concesionarias, fabricantes VE, renting.

### Estados (estado_actual)
  PUB  = publicada (ofertas abiertas)
  EV   = en evaluación
  ADJ  = adjudicada (ganador decidido)
  RES  = resuelta/formalizada (contrato firmado)
  ANUL = anulada
  PRE  = preliminar/previa

Para "cuánto pagó el mercado" usar estado IN ('ADJ','RES').
Para "qué hay publicado ahora" usar estado = 'PUB'.

### Tipo de contrato (tipo_contrato)
Suministro / Obras / Servicios / Mixto / Concesión / Administrativo especial / Privado / Gestión servicios.
Mapeado desde \`tipo_contrato_codigo\` (TypeCode UBL).
  Concesión demanial (cat 1) suele venir como tipo_contrato = 'Mixto' o 'Administrativo especial'.
  Obras de instalación (cat 2) → 'Obras'.
  Suministro cargadores (cat 4) → 'Suministro'.

### Importes
  importe_estimado   — presupuesto base del pliego (lo que el órgano espera gastar)
  importe_base       — base de licitación (importe_estimado sin IVA, o el que usan para bucket)
  importe_adjudicado — con qué importe ganó el adjudicatario (puede ser < importe_estimado)
  Los tres pueden estar NULL según estado y calidad del XML.

### Concesiones demaniales (cat 1) — campos específicos
Mayoría pendientes de fase 2 (extracción desde PDFs de pliegos/actas):
  plazo_concesion_anos        — duración (típicamente 10-15)
  renovacion_anos             — prórrogas (0-4)
  tipo_retribucion            — canon_fijo / canon_variable_pct / mixto / contraprestacion_servicios / compra_directa
  canon_minimo_anual          — mínimo exigido por el pliego
  canon_anual_ofertado_ganador — cuánto paga el que ganó (por año)
  canon_por_cargador_ofertado — normalizado por N cargadores
  num_cargadores_ac / dc / dc_plus / hpc / total
  num_ubicaciones
  quality_score_ubicacion     — poor/fair/good/very_good/excellent (derivado de población INE)
  canon_fuente                — enum que indica calidad del dato:
      'pdf_resolucion'        — extraído del PDF de adjudicación (calidad alta)
      'aedive_manual'         — curado humano desde CSVs AEDIVE (calidad alta)
      'inferido_base_pliego'  — proxy débil desde el pliego (baja)
      NULL                    — aún no extraído (fase 2 LLM)

### Benchmark de mercado (tabla benchmarks_cpo)
Vista materializada calculada desde \`licitadores\` (rol=adjudicataria) + \`licitaciones\` cat=1 adjudicadas.
Responde "¿cuánto pagó el mercado?" segmentado por:
  segmento_hw (AC/DC/DC+/HPC) × tamano_municipio × provincia × anio × tipo_retribucion × plazo_bucket

Métricas: p25 / p50 / p75 / p90 del canon anual por cargador ofertado por el ganador.

REGLA IMPORTANTE: NO usar benchmarks externos (POWY u otro CPO individual). El benchmark ES el
mercado observado. Si te preguntan "¿cuánto puede pagar un CPO?", respondé con los percentiles
observados, no con valores normativos.

Hoy la tabla está vacía (canon no poblado). Responder "pendiente de fase 2 LLM" si preguntan.

### Adjudicatarios y competencia
Hoy solo tenemos el ganador principal (rol='adjudicataria') extraído del XML TenderResult.
Los bidders no ganadores y ofertas económicas específicas están en los PDFs de actas de apertura.
Fase 2 LLM los extraerá.

Grupos matriz habituales por tipo (útil para ranking_adjudicatarios):
  CPOs puros:      Iberdrola, Wenea, Eranovum, Be Charge, Charging Together, Intelligent Real Solutions,
                   Acciona, Easycharger, Gaia Green Tech
  Utilities:       Endesa-X, Iberdrola
  Oil majors:      Repsol, Shell Recharge, GALP, Cepsa (Moeve)
  EPC/Instaladoras: Circutor, Etralux, Ingeteam, Kostal
  Renting/flotas:  ALD Automotive, Alphabet, Arval, Northgate, LeasePlan
  Fabricantes:     BYD, Solaris, Irizar, Heuliez, VDL (para buses cat 7)

### Tags frecuentes en el campo \`tags\` (JSON array)
  next_generation   — financiación NextGenerationEU / MRR
  dus5000           — Programa DUS 5000 (IDAE, descarbonización municipios pequeños)
  pstd              — Plan de Sostenibilidad Turística en Destino
  moves_iii         — Programa MOVES III (ayudas a VE y recarga)
  aena_pipra        — Plan de Implantación de Puntos de Recarga en Aeropuertos (AENA)

## Tablas (schema)

licitaciones        — 1 fila por expediente PLACSP. Campos e-mov en mismo registro.
                      PK: id (URI Atom). Cruce externo: extraer idEvl del deeplink.
licitacion_cpvs     — N:N de CPV codes
licitadores         — bidders + ganadores (hoy mayormente solo ganadores)
empresas            — maestro por NIF (hoy vacía, se populará bottom-up)
documentos          — pliegos, actas, resoluciones (URLs, parseo diferido)
snapshots_estado    — historial PUB → EV → ADJ → RES
ingest_log          — control de ficheros Atom ingestados
benchmarks_cpo      — vista materializada de mercado por bucket

## Reglas anti-error al responder

1. SIEMPRE sustentar afirmaciones con SQL. "X es el top CPO en Madrid" debe venir acompañado
   del query y N observaciones.

2. Benchmarks → devolver p25/p50/p75 + N_observaciones, NUNCA solo media.

3. Distinguir tiene_infra_recarga=1 vs 0 cuando sea relevante al usuario. Un CPO no quiere ver
   cat 6 pura (compra VE sin recarga); un renting sí.

4. Si canon_fuente IS NULL, decir "dato pendiente de parseo del pliego (fase 2 LLM)". NO inventar.

5. El CPV 34144900 es mal usado por muchos órganos (se pone en cualquier licitación de vehículos
   aunque no sean eléctricos). Nuestra clasificación ya filtra esto, pero si ves CPV 34144900 en
   un resultado \`no_emov\`, eso está correcto — significa que el órgano lo puso mal.

6. Para resultados por año usar \`substr(fecha_publicacion, 1, 4)\` o \`fecha_adjudicacion\` según
   contexto. Tener presente que PUB puede tener fecha_publicacion pero no fecha_adjudicacion.

7. Volumen de cat 6 (2.373) >> volumen de cat 1 (172). Si el usuario pregunta por "licitaciones de
   e-movilidad" sin especificar, asumir todo (cats 1-11) y ofrecer ventanas. Si pregunta por
   "concesiones" o "recarga pública" → filtrar cat 1 o tiene_infra_recarga=1.

8. Los 44 falsos negativos conocidos de la clasificación son casos borde (carros de golf eléctricos,
   drones, "motorización eléctrica" como fraseo raro). No son gap crítico. El recall vs AEDIVE
   es 98.3 %, falsos negativos críticos (concesiones, obra con cargadores=SI) = 0.

9. Para cruce con fuentes externas (AEDIVE CSVs, otros trackers) usar \`idEvl\` extraído del
   deeplink, NO el \`id\` (URI Atom) que es distinto.

10. Cuando el usuario pida "nuevas licitaciones" o "últimas" → filtrar por
    fecha_publicacion >= DATE(now, '-30 days') y estado IN ('PUB','EV','PRE').
`;

if (!existsSync(DB_FILE)) {
  console.error(`[placsp-mcp] Database not found at ${DB_FILE}. Run placsp-import.mjs first.`);
  process.exit(1);
}

const db = new Database(DB_FILE, { readonly: true });

const server = new Server(
  { name: 'placsp-specialist', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

// ─── tools ───────────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'get_schema',
    description: 'Devuelve el esquema completo y contexto de dominio de la base PLACSP. LLAMALO SIEMPRE al iniciar análisis.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'query_sql',
    description: 'Ejecuta SELECT/WITH arbitrario contra la base (read-only). Limitado a 1000 filas de resultado.',
    inputSchema: {
      type: 'object',
      properties: { sql: { type: 'string' } },
      required: ['sql'],
    },
  },
  {
    name: 'search_licitaciones',
    description: 'Busca licitaciones por keyword en título/resumen, con filtros opcionales por categoría, estado, provincia, fechas y flag de infra de recarga.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword:          { type: 'string' },
        categoria_emov:   { type: 'string', description: '1..11 o "no_emov"' },
        subcategoria:     { type: 'string', description: 'ej: demanial_puro / 6a_turismos_furgonetas / autobus_electrico' },
        estado:           { type: 'string', description: 'PUB/EV/ADJ/RES/ANUL/PRE' },
        tipo_contrato:    { type: 'string', description: 'Suministro/Obras/Servicios/Mixto/Concesión' },
        provincia:        { type: 'string' },
        organo_nombre:    { type: 'string', description: 'LIKE match — ej "Ayuntamiento Madrid"' },
        tiene_infra:      { type: 'boolean' },
        tag:              { type: 'string', description: 'next_generation / dus5000 / pstd / moves_iii / aena_pipra' },
        importe_min:      { type: 'number' },
        importe_max:      { type: 'number' },
        desde_fecha:      { type: 'string', description: 'YYYY-MM-DD, aplicado a fecha_publicacion' },
        hasta_fecha:      { type: 'string', description: 'YYYY-MM-DD, aplicado a fecha_publicacion' },
        order_by:         { type: 'string', description: 'fecha_pub_desc (default) / importe_desc / importe_asc / fecha_adj_desc' },
        limit:            { type: 'integer', default: 50 },
      },
    },
  },
  {
    name: 'benchmark_canon',
    description: 'Devuelve p25/p50/p75/p90 del canon anual por cargador ofertado por el ganador, en un bucket del mercado. Hoy vacío (fase 2 LLM pendiente) — devuelve N=0 hasta que se pueblen canones.',
    inputSchema: {
      type: 'object',
      properties: {
        segmento_hw:      { type: 'string', description: 'AC/DC/DC+/HPC' },
        tamano_municipio: { type: 'string', description: 'poor/fair/good/very_good/excellent' },
        provincia:        { type: 'string' },
        anio:             { type: 'integer' },
      },
    },
  },
  {
    name: 'ranking_adjudicatarios',
    description: 'Top N empresas adjudicatarias por N° de licitaciones ganadas y por importe total. Filtrable por categoría, provincia, año.',
    inputSchema: {
      type: 'object',
      properties: {
        top:              { type: 'integer', default: 20 },
        categoria_emov:   { type: 'string' },
        provincia:        { type: 'string' },
        desde_anio:       { type: 'integer' },
        hasta_anio:       { type: 'integer' },
      },
    },
  },
  {
    name: 'ranking_organos',
    description: 'Top N órganos contratantes (ayuntamientos/entidades) por N° de licitaciones emitidas y por importe total. Filtrable.',
    inputSchema: {
      type: 'object',
      properties: {
        top:              { type: 'integer', default: 20 },
        categoria_emov:   { type: 'string' },
        provincia:        { type: 'string' },
        desde_anio:       { type: 'integer' },
      },
    },
  },
  {
    name: 'distribucion_temporal',
    description: 'Serie mensual de N° de licitaciones e importe por categoría. Útil para charts.',
    inputSchema: {
      type: 'object',
      properties: {
        categoria_emov: { type: 'string', description: 'Si se omite, agrega todas las e-mov (cats 1..11)' },
        granularidad:   { type: 'string', description: 'mes (default) / anio / trimestre' },
        desde_anio:     { type: 'integer', default: 2018 },
        hasta_anio:     { type: 'integer' },
      },
    },
  },
  {
    name: 'distribucion_geografica',
    description: 'Distribución de licitaciones e-mov por provincia / CCAA. Útil para mapas.',
    inputSchema: {
      type: 'object',
      properties: {
        categoria_emov: { type: 'string' },
        desde_anio:     { type: 'integer' },
        incluir_importes: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'get_licitacion',
    description: 'Devuelve el detalle COMPLETO de una licitación (con CPVs, licitadores, documentos y snapshots de estado). Por id, expediente o idEvl.',
    inputSchema: {
      type: 'object',
      properties: {
        id:         { type: 'string', description: 'URI Atom (nuestro id interno)' },
        expediente: { type: 'string' },
        idEvl:      { type: 'string', description: 'idEvl del deeplink PLACSP (útil para cruce externo)' },
      },
    },
  },
  {
    name: 'get_stats',
    description: 'Estadísticas globales: total por categoría, estado, año. Útil para KPIs del dashboard.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_capabilities',
    description: 'Resumen de lo que sabe este especialista: dataset, cobertura, limitaciones, fuentes externas, roadmap. Llamá esto antes de trabajos grandes.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'expectativa_criterio',
    description: 'Devuelve estadísticas cross-licitación de un criterio canónico de adjudicación: peso típico (min, max, promedio), frecuencia de aparición, descripciones observadas. Útil para detectar pliegos atípicos o validar que la extracción no perdió un criterio esperable.',
    inputSchema: {
      type: 'object',
      properties: {
        clave: { type: 'string', description: 'Clave canónica del criterio (ej. "mejora_canon", "precio_kwh_usuario", "mejora_potencia_hw"). Si se omite, devuelve el listado completo de claves disponibles.' },
      },
    },
  },
  {
    name: 'ejemplos_correcciones',
    description: 'Devuelve casos resueltos previos donde la extracción detectó pliegos complejos, contradicciones internas, Q&A oficial como override, o variantes raras de retribución. Cada ejemplo trae las lecciones aplicables a futuras extracciones. Llamá a esto al inicio de una corrida masiva para nutrir el contexto del extractor con few-shot examples.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Slug específico (opcional). Si se omite, devuelve TODOS los casos resueltos.' },
      },
    },
  },
  {
    name: 'sugerencias_normalizacion',
    description: 'Devuelve sugerencias automáticas de nuevas claves canónicas detectadas en el master de criterios — claves fallback con prefijo común que conviene fusionar bajo un único concepto. Ayuda a mantener limpia la taxonomía de criterios cuando crece el dataset.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const CAPABILITIES_DOC = `
# Capabilities de placsp-specialist

## Qué puedo responder AHORA (fase 1 completa)

- Conteos, rankings, distribuciones temporales y geográficas de licitaciones públicas de e-mov
  en España, con recall 98.3 % vs AEDIVE sobre el universo PLACSP.
- Detalle de cualquier licitación por id/expediente/idEvl: título, órgano, fechas, importes,
  CPVs, estado actual y timeline PUB→EV→ADJ→RES.
- Ganadores de cada licitación adjudicada (extraídos del XML; no participantes ni ofertas
  competidoras hasta fase 2).
- Filtrado y búsqueda por categoría e-mov, subcategoría, provincia, tags de financiación
  (next_generation, dus5000, pstd, moves_iii, aena_pipra), tipo de contrato, importe, fechas.

## Qué NO puedo responder todavía (fase 2 LLM)

- Canon ofertado ganador en concesiones demaniales (canon_anual_ofertado_ganador) — está en los
  PDFs de pliegos/actas, no en el XML. La tabla benchmarks_cpo está vacía hasta que se pueblen.
- Quiénes compitieron y cuánto ofertaron (además del ganador). Mismo motivo.
- Criterios de valoración de cada licitación, puntuaciones técnicas, mejoras ofertadas.
- Estimaciones de % de voto económico vs técnico por tipo de concesión.
- Análisis tipo "¿le conviene a mi cliente esta licitación?" que requiere leer el pliego.

## Cobertura de datos

Fuente: PLACSP (contrataciondelestado.es) Atom feed oficial.
Ventana: 2018-01 → 2026-04 (100 meses).
Total: 1.020.226 licitaciones.
E-mov clasificadas: 4.229 en 11 categorías + 1.015.997 no_emov.

Brechas conocidas:
- ~2 % de licitaciones españolas solo aparece en portales autonómicos (contractaciopublica.cat,
  Euskadi, JdA, Comunidad Madrid) o en TED → fase 3.
- 44 falsos negativos de clasificación por redacciones no estándar (diminishing returns).

## Datos de apoyo externos

- AEDIVE CSVs (locales, no commiteados): tracker manual de e-mov en España, útil para
  validación puntual. NO fuente primaria. Recall = 98.3 % de sus entradas con link PLACSP
  están en nuestra DB.
- POWY (CPO): NO se usa como benchmark normativo. El benchmark de mercado se calcula
  solo desde adjudicaciones reales.

## Roadmap

- Fase 2: parseo LLM de PDFs de pliegos/actas/resoluciones → poblar canon, participantes,
  criterios. Habilita benchmarks_cpo real.
- Fase 3: sumar TED + portales autonómicos para cerrar brecha de cobertura.
- Fase 4: cron diario de delta para alertas de nuevas licitaciones.
- Fase 5: análisis LLM por licitación → "¿le conviene a mi cliente?".

## Reglas de conversación

1. Siempre sustentar con SQL + N observaciones.
2. Si preguntan por canon específico y \`canon_fuente IS NULL\`, decir
   "dato pendiente de fase 2 LLM" en vez de inventar.
3. Benchmark = mercado observado. NUNCA citar valores normativos externos.
4. Distinguir tiene_infra_recarga=1 vs 0 cuando cambie la respuesta.
5. Para cruces externos usar \`idEvl\` (extraído del deeplink), no \`id\` interno.
`;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  try {
    if (name === 'get_schema') {
      return { content: [{ type: 'text', text: SCHEMA_DOC }] };
    }

    if (name === 'query_sql') {
      const sql = String(args.sql || '').trim();
      if (!/^\s*(select|with)\b/i.test(sql)) throw new Error('Only SELECT/WITH queries allowed.');
      const rows = db.prepare(sql).all();
      const truncated = rows.slice(0, 1000);
      return { content: [{ type: 'text', text: JSON.stringify({ rows: truncated, total: rows.length }, null, 2) }] };
    }

    if (name === 'search_licitaciones') {
      const {
        keyword, categoria_emov, subcategoria, estado, tipo_contrato, provincia,
        organo_nombre, tiene_infra, tag, importe_min, importe_max,
        desde_fecha, hasta_fecha, order_by = 'fecha_pub_desc', limit = 50,
      } = args;
      const where = [];
      const params = {};
      if (keyword) { where.push(`(titulo LIKE @kw OR resumen LIKE @kw)`); params.kw = `%${keyword}%`; }
      if (categoria_emov) { where.push(`categoria_emov = @cat`); params.cat = categoria_emov; }
      if (subcategoria)   { where.push(`subcategoria = @sub`); params.sub = subcategoria; }
      if (estado)         { where.push(`estado_actual = @est`); params.est = estado; }
      if (tipo_contrato)  { where.push(`tipo_contrato = @tc`); params.tc = tipo_contrato; }
      if (provincia)      { where.push(`provincia_nombre LIKE @prov`); params.prov = `%${provincia}%`; }
      if (organo_nombre)  { where.push(`organo_nombre LIKE @org`); params.org = `%${organo_nombre}%`; }
      if (tiene_infra !== undefined) { where.push(`tiene_infra_recarga = @infra`); params.infra = tiene_infra ? 1 : 0; }
      if (tag)            { where.push(`tags LIKE @tag`); params.tag = `%"${tag}"%`; }
      if (importe_min !== undefined) { where.push(`importe_estimado >= @imin`); params.imin = importe_min; }
      if (importe_max !== undefined) { where.push(`importe_estimado <= @imax`); params.imax = importe_max; }
      if (desde_fecha)    { where.push(`fecha_publicacion >= @d1`); params.d1 = desde_fecha; }
      if (hasta_fecha)    { where.push(`fecha_publicacion <= @d2`); params.d2 = hasta_fecha; }

      const orderMap = {
        fecha_pub_desc: 'fecha_publicacion DESC',
        fecha_pub_asc:  'fecha_publicacion ASC',
        fecha_adj_desc: 'fecha_adjudicacion DESC',
        importe_desc:   'importe_estimado DESC',
        importe_asc:    'importe_estimado ASC',
      };
      const order = orderMap[order_by] ?? 'fecha_publicacion DESC';

      const sql = `
        SELECT id, expediente, titulo, tipo_contrato, estado_actual,
               importe_estimado, importe_adjudicado, organo_nombre,
               ciudad, provincia_nombre, fecha_publicacion, fecha_adjudicacion,
               categoria_emov, subcategoria, tiene_infra_recarga, tags, deeplink
        FROM licitaciones
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY ${order}
        LIMIT @limit
      `;
      const rows = db.prepare(sql).all({ ...params, limit });
      return { content: [{ type: 'text', text: JSON.stringify({ n: rows.length, rows }, null, 2) }] };
    }

    if (name === 'benchmark_canon') {
      const { segmento_hw, tamano_municipio, provincia, anio } = args;
      const where = [];
      const params = {};
      if (segmento_hw)      { where.push(`segmento_hw = @seg`);      params.seg  = segmento_hw; }
      if (tamano_municipio) { where.push(`tamano_municipio = @tam`); params.tam  = tamano_municipio; }
      if (provincia)        { where.push(`provincia = @prov`);       params.prov = provincia; }
      if (anio)             { where.push(`anio_adjudicacion = @a`);  params.a    = anio; }
      const sql = `SELECT * FROM benchmarks_cpo ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY n_concesiones DESC`;
      const rows = db.prepare(sql).all(params);
      return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
    }

    if (name === 'ranking_adjudicatarios') {
      const { top = 20, categoria_emov, provincia, desde_anio, hasta_anio } = args;
      const needsJoin = categoria_emov || provincia || desde_anio || hasta_anio;
      const joinCat = needsJoin ? 'JOIN licitaciones l ON l.id = li.licitacion_id' : '';
      const where = [`li.rol = 'adjudicataria'`];
      const params = { top };
      if (categoria_emov) { where.push(`l.categoria_emov = @cat`); params.cat = categoria_emov; }
      if (provincia)      { where.push(`l.provincia_nombre LIKE @prov`); params.prov = `%${provincia}%`; }
      if (desde_anio)     { where.push(`strftime('%Y', l.fecha_adjudicacion) >= @a1`); params.a1 = String(desde_anio); }
      if (hasta_anio)     { where.push(`strftime('%Y', l.fecha_adjudicacion) <= @a2`); params.a2 = String(hasta_anio); }
      const sql = `
        SELECT li.empresa_nombre,
               li.empresa_nif,
               COUNT(*) AS n_ganadas,
               SUM(COALESCE(li.oferta_economica, 0)) AS importe_total,
               AVG(COALESCE(li.oferta_economica, 0)) AS importe_medio
        FROM licitadores li
        ${joinCat}
        WHERE ${where.join(' AND ')}
        GROUP BY li.empresa_nombre, li.empresa_nif
        ORDER BY n_ganadas DESC
        LIMIT @top
      `;
      const rows = db.prepare(sql).all(params);
      return { content: [{ type: 'text', text: JSON.stringify({ n: rows.length, rows }, null, 2) }] };
    }

    if (name === 'ranking_organos') {
      const { top = 20, categoria_emov, provincia, desde_anio } = args;
      const where = [];
      const params = { top };
      if (categoria_emov) { where.push(`categoria_emov = @cat`); params.cat = categoria_emov; }
      if (provincia)      { where.push(`provincia_nombre LIKE @prov`); params.prov = `%${provincia}%`; }
      if (desde_anio)     { where.push(`substr(fecha_publicacion,1,4) >= @a1`); params.a1 = String(desde_anio); }
      const sql = `
        SELECT organo_nombre, organo_nif,
               COUNT(*) AS n_licitaciones,
               SUM(COALESCE(importe_estimado, 0)) AS importe_total_estimado,
               SUM(COALESCE(importe_adjudicado, 0)) AS importe_total_adjudicado
        FROM licitaciones
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        GROUP BY organo_nombre, organo_nif
        ORDER BY n_licitaciones DESC
        LIMIT @top
      `;
      const rows = db.prepare(sql).all(params);
      return { content: [{ type: 'text', text: JSON.stringify({ n: rows.length, rows }, null, 2) }] };
    }

    if (name === 'distribucion_temporal') {
      const { categoria_emov, granularidad = 'mes', desde_anio = 2018, hasta_anio } = args;
      const groupExpr = granularidad === 'anio'     ? `substr(fecha_publicacion,1,4)`
                     : granularidad === 'trimestre' ? `substr(fecha_publicacion,1,4) || '-Q' || CAST((CAST(substr(fecha_publicacion,6,2) AS INTEGER)-1)/3 + 1 AS TEXT)`
                     : `substr(fecha_publicacion,1,7)`;
      const where = [`fecha_publicacion IS NOT NULL`, `substr(fecha_publicacion,1,4) >= @a1`];
      const params = { a1: String(desde_anio) };
      if (hasta_anio) { where.push(`substr(fecha_publicacion,1,4) <= @a2`); params.a2 = String(hasta_anio); }
      if (categoria_emov) {
        where.push(`categoria_emov = @cat`);
        params.cat = categoria_emov;
      } else {
        where.push(`categoria_emov != 'no_emov'`);
      }
      const sql = `
        SELECT ${groupExpr} AS periodo,
               categoria_emov,
               COUNT(*) AS n,
               SUM(COALESCE(importe_estimado,0)) AS importe_total
        FROM licitaciones
        WHERE ${where.join(' AND ')}
        GROUP BY periodo, categoria_emov
        ORDER BY periodo, categoria_emov
      `;
      const rows = db.prepare(sql).all(params);
      return { content: [{ type: 'text', text: JSON.stringify({ n: rows.length, rows }, null, 2) }] };
    }

    if (name === 'distribucion_geografica') {
      const { categoria_emov, desde_anio, incluir_importes = true } = args;
      const where = [`provincia_nombre IS NOT NULL`];
      const params = {};
      if (categoria_emov) {
        where.push(`categoria_emov = @cat`); params.cat = categoria_emov;
      } else {
        where.push(`categoria_emov != 'no_emov'`);
      }
      if (desde_anio) { where.push(`substr(fecha_publicacion,1,4) >= @a1`); params.a1 = String(desde_anio); }
      const importesExpr = incluir_importes
        ? `, SUM(COALESCE(importe_estimado,0)) AS importe_total, SUM(COALESCE(importe_adjudicado,0)) AS importe_adjudicado_total`
        : '';
      const sql = `
        SELECT provincia_nombre AS provincia,
               COUNT(*) AS n
               ${importesExpr}
        FROM licitaciones
        WHERE ${where.join(' AND ')}
        GROUP BY provincia_nombre
        ORDER BY n DESC
      `;
      const rows = db.prepare(sql).all(params);
      return { content: [{ type: 'text', text: JSON.stringify({ n: rows.length, rows }, null, 2) }] };
    }

    if (name === 'get_licitacion') {
      const { id, expediente, idEvl } = args;
      let row;
      if (id) {
        row = db.prepare(`SELECT * FROM licitaciones WHERE id = ?`).get(id);
      } else if (expediente) {
        row = db.prepare(`SELECT * FROM licitaciones WHERE expediente = ? LIMIT 1`).get(expediente);
      } else if (idEvl) {
        row = db.prepare(`SELECT * FROM licitaciones WHERE deeplink LIKE ? LIMIT 1`).get(`%idEvl=${idEvl}%`);
      }
      if (!row) return { content: [{ type: 'text', text: 'not found' }] };
      row.cpvs        = db.prepare(`SELECT cpv_code FROM licitacion_cpvs WHERE licitacion_id = ?`).all(row.id).map((r) => r.cpv_code);
      row.licitadores = db.prepare(`SELECT * FROM licitadores WHERE licitacion_id = ? ORDER BY rank_position`).all(row.id);
      row.documentos  = db.prepare(`SELECT * FROM documentos WHERE licitacion_id = ?`).all(row.id);
      row.snapshots   = db.prepare(`SELECT estado, fecha, fuente_atom FROM snapshots_estado WHERE licitacion_id = ? ORDER BY fecha`).all(row.id);
      return { content: [{ type: 'text', text: JSON.stringify(row, null, 2) }] };
    }

    if (name === 'get_stats') {
      const total   = db.prepare(`SELECT COUNT(*) AS n FROM licitaciones`).get().n;
      const porCat  = db.prepare(`SELECT categoria_emov, COUNT(*) AS n FROM licitaciones GROUP BY categoria_emov ORDER BY n DESC`).all();
      const porEst  = db.prepare(`SELECT estado_actual,  COUNT(*) AS n FROM licitaciones GROUP BY estado_actual  ORDER BY n DESC`).all();
      const porTipo = db.prepare(`SELECT tipo_contrato,  COUNT(*) AS n FROM licitaciones GROUP BY tipo_contrato ORDER BY n DESC`).all();
      const porAnio = db.prepare(`
        SELECT substr(fecha_publicacion, 1, 4) AS anio, COUNT(*) AS n
        FROM licitaciones WHERE fecha_publicacion IS NOT NULL
        GROUP BY anio ORDER BY anio
      `).all();
      const emovPorAnio = db.prepare(`
        SELECT substr(fecha_publicacion, 1, 4) AS anio, categoria_emov, COUNT(*) AS n
        FROM licitaciones
        WHERE fecha_publicacion IS NOT NULL AND categoria_emov != 'no_emov'
        GROUP BY anio, categoria_emov ORDER BY anio, categoria_emov
      `).all();
      const ingested = db.prepare(`SELECT COUNT(*) AS n FROM ingest_log`).get().n;
      return { content: [{ type: 'text', text: JSON.stringify({
        total, ingested_atom_files: ingested,
        por_categoria: porCat, por_estado: porEst, por_tipo_contrato: porTipo,
        por_anio: porAnio, emov_por_anio: emovPorAnio,
      }, null, 2) }] };
    }

    if (name === 'get_capabilities') {
      return { content: [{ type: 'text', text: CAPABILITIES_DOC }] };
    }

    // ── Tools de aprendizaje cross-licitación ──────────────────────────────
    if (name === 'expectativa_criterio') {
      const masterPath = join(__dirname, '..', 'data', 'licitaciones-criterios-master.json');
      if (!existsSync(masterPath)) {
        return { content: [{ type: 'text', text: 'master de criterios no generado todavía. Ejecutá: node scripts/placsp-auditoria.mjs' }] };
      }
      const master = JSON.parse(fsReadFileSync(masterPath, 'utf8'));
      if (!args.clave) {
        return { content: [{ type: 'text', text: JSON.stringify({
          generado_en: master.generado_en,
          total_criterios_unicos: master.total_criterios_unicos,
          claves_disponibles: master.criterios.map((c) => ({
            clave:       c.clave,
            label:       c.label,
            tipo:        c.tipo,
            frecuencia:  c.frecuencia,
            peso_promedio: c.peso_promedio,
          })),
        }, null, 2) }] };
      }
      const c = master.criterios.find((x) => x.clave === args.clave);
      if (!c) return { content: [{ type: 'text', text: `clave "${args.clave}" no encontrada en el master. Disponibles: ${master.criterios.map((x) => x.clave).join(', ')}` }] };
      return { content: [{ type: 'text', text: JSON.stringify(c, null, 2) }] };
    }

    if (name === 'ejemplos_correcciones') {
      const apPath = join(__dirname, '..', 'data', 'placsp-correcciones-aprendidas.json');
      if (!existsSync(apPath)) {
        return { content: [{ type: 'text', text: 'no hay correcciones aprendidas todavía. Ejecutá: node scripts/placsp-auditoria.mjs' }] };
      }
      const ap = JSON.parse(fsReadFileSync(apPath, 'utf8'));
      if (args.slug) {
        const e = ap.ejemplos.find((x) => x.slug === args.slug);
        if (!e) return { content: [{ type: 'text', text: `slug "${args.slug}" no tiene caso aprendido` }] };
        return { content: [{ type: 'text', text: JSON.stringify(e, null, 2) }] };
      }
      return { content: [{ type: 'text', text: JSON.stringify(ap, null, 2) }] };
    }

    if (name === 'sugerencias_normalizacion') {
      const sugPath = join(__dirname, '..', 'data', 'placsp-criterios-sugerencias.json');
      if (!existsSync(sugPath)) {
        return { content: [{ type: 'text', text: 'no hay sugerencias generadas. Ejecutá: node scripts/placsp-auditoria.mjs' }] };
      }
      return { content: [{ type: 'text', text: fsReadFileSync(sugPath, 'utf8') }] };
    }

    throw new Error(`unknown tool ${name}`);
  } catch (e) {
    return { content: [{ type: 'text', text: `ERROR: ${e.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[placsp-mcp] ready');
