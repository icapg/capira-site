/**
 * Dashboard MCP Server — Especialista en el dashboard /info de capira-site
 *
 * Qué es: servidor MCP que expone la estructura del dashboard eMobility Insights
 * (Next.js App Router en capira-site/app/info). Permite a Claude responder
 * preguntas sobre rutas, KPIs, componentes, fuentes de datos y endpoints sin
 * re-explorar el codebase cada vez.
 *
 * Diferencia con los otros MCP (DGT/ANFAC/AEDIVE):
 * - Ellos consultan datos externos (SQLite, scraping web).
 * - Este lee el codebase local (archivos .tsx/.ts) como "fuente de verdad"
 *   sobre el dashboard. Los cambios al dashboard se hacen con Edit directo
 *   de Claude Code, no a través de este MCP.
 *
 * Herramientas expuestas:
 *   get_overview           — árbol de rutas /info con estado y propósito
 *   get_page               — detalle de una ruta (KPIs, componentes, data sources)
 *   list_data_sources      — archivos de app/lib/insights con descripción
 *   list_api_endpoints     — rutas de app/api/info con método y auth
 *   get_component_source   — source de un componente por nombre
 *   search_dashboard       — grep sobre app/info para un término
 *   list_patterns          — patrones de implementación reutilizables (maps, charts, etc.)
 *   get_pattern            — detalle de un patrón (problema, solución, código de referencia)
 */

import { Server }               from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';

const REPO_ROOT = 'C:/Users/ignacio.capurro/capira-site';
const INFO_DIR  = join(REPO_ROOT, 'app/info');
const LIB_DIR   = join(REPO_ROOT, 'app/lib/insights');
const API_DIR   = join(REPO_ROOT, 'app/api/info');

// ─────────────────────────────────────────────────────────────────
// Metadata curada — lo que NO se puede inferir del codebase
// (propósito de cada ruta, audiencia, KPIs conceptuales)
// ─────────────────────────────────────────────────────────────────

const ROUTE_METADATA = {
  '/info': {
    proposito: 'Landing pública del dashboard. Grid con cards de acceso a cada sección.',
    audiencia: 'publico',
    estado: 'live',
    kpis: [],
  },
  '/info/matriculaciones': {
    proposito: 'Evolución mensual y anual de matriculaciones BEV/PHEV en España.',
    audiencia: 'publico',
    estado: 'live',
    kpis: [
      'Total BEV+PHEV mensual y acumulado anual',
      'Evolución 2014-presente (serie mensual y anual)',
      'Desglose por tipo de vehículo (M1 turismo, N1 furgoneta, L moto, etc.)',
      'Top marcas (BEV y PHEV)',
      'Distribución por provincia',
    ],
    fuente_datos: 'DGT MATRABA (primaria) + ANFAC (alternativa vía toggle admin)',
  },
  '/info/parque': {
    proposito: 'Flota activa de EV en España (matriculaciones menos bajas).',
    audiencia: 'publico',
    estado: 'live',
    kpis: [
      'Parque activo BEV/PHEV acumulado',
      'Evolución histórica de la flota',
      'Desglose por tipo vehículo',
    ],
    fuente_datos: 'DGT (matriculaciones + bajas)',
  },
  '/info/infraestructura': {
    proposito: 'Puntos de recarga públicos en España (56K+ puntos).',
    audiencia: 'publico',
    estado: 'live',
    kpis: [
      'Total puntos de recarga público',
      'Distribución por provincia y CCAA',
      'Ratio cargadores vs parque EV',
    ],
    fuente_datos: 'infraestructura-data.ts (dataset estático)',
  },
  '/info/marca-perfil': {
    proposito: 'Perfil individual de cada marca de vehículos en España (selector A + comparador opcional B). 8 secciones: KPIs, ADN/mix, geografía, evolución, sociología del cliente, parque activo, vista comercial y racing bar histórico.',
    audiencia: 'publico',
    estado: 'live',
    kpis: [
      'Hero: parque activo, matric YTD, cuota mercado YTD, ranking, % enchufables, edad media',
      'ADN: treemap tipo→modelo, top-5 modelos, mix tecnológico anual, radar CO2/kW/peso/autonomía vs mercado',
      'Geografía: choropleth España por provincia + top provincias con cuota y ranking',
      'Evolución: mix mensual BEV/PHEV/HEV/otro + matric marca vs mercado',
      'Sociología: persona física/jurídica, servicio (particular/empresa), renting',
      'Parque: pirámide de edad, distintivo ambiental, Sankey flujos de baja, curva supervivencia por cohorte',
      'Vista comercial: heatmap estacionalidad, renting share por provincia',
      'Racing: top-15 marcas rolling-12m desde 2015 animado',
    ],
    fuente_datos: 'DGT pre-agregado por scripts/dgt-marca-perfil-build.mjs → data/dgt-marca-perfil-{index,mercado,racing}.json + public/data/marca-perfil/<slug>.json',
    url_state: '?m=<slug>&vs=<slug_b> — marca A y comparador opcional B',
  },
  '/info/licitaciones': {
    proposito: 'Licitaciones públicas España relacionadas con e-movilidad (CPO, flotas eléctricas, puntos de recarga, servicios).',
    audiencia: 'publico',
    estado: 'en_construccion',
    kpis: [
      'Licitaciones agregadas de todo e-movilidad (no solo CPO)',
      'Taxonomía v3 de 11 categorías',
      'Benchmark = mercado observado, no valores externos',
    ],
    fuente_datos: 'PLACSP via MCP placsp-specialist (1M licitaciones, 4229 e-mov clasificadas)',
  },
  '/info/social': {
    proposito: 'Landing admin de la sección social (generador + aprobación + automatización de contenido para redes).',
    audiencia: 'admin',
    estado: 'live',
    kpis: [],
  },
  '/info/social/generador': {
    proposito: 'Playground para generar piezas de contenido (templates Matriculaciones/Bajas/Acumulado por mes).',
    audiencia: 'admin',
    estado: 'live',
    kpis: [
      'Templates: BajasMes, AcumuladoMes, MatriculacionesMes',
    ],
  },
  '/info/social/aprobacion': {
    proposito: 'Cola de aprobación de piezas generadas antes de publicar.',
    audiencia: 'admin',
    estado: 'live',
    kpis: [],
  },
  '/info/social/automatizacion': {
    proposito: 'Config de automatizaciones programadas para publicar contenido social.',
    audiencia: 'admin',
    estado: 'live',
    kpis: [],
  },
  '/info/dgt-status': {
    proposito: 'Diagnóstico técnico de ingesta DGT (estado al día de matriculaciones/bajas + comparativa AEDIVE).',
    audiencia: 'admin',
    estado: 'live',
    kpis: [
      'Último período importado (matriculaciones/bajas)',
      'Auditoría de deltas mes a mes',
      'Top 3 marcas BEV+PHEV',
      'Comparativa DGT vs AEDIVE',
    ],
  },
  '/info/login': {
    proposito: 'Form de password → cookie insights_auth (30 días).',
    audiencia: 'admin',
    estado: 'live',
    kpis: [],
  },
};

// ─────────────────────────────────────────────────────────────────
// PATTERNS — blueprints de implementación reutilizables.
// Son "cómo lo hacemos acá". Cuando Claude vaya a armar un mapa o
// chart, debe consultar estos patrones antes de inventar uno nuevo.
// ─────────────────────────────────────────────────────────────────

const PATTERNS = {
  'spain-choropleth-canarias-inset': {
    titulo: 'Mapa choropleth de España con Canarias como inset',
    cuando_usar: 'Cualquier mapa ECharts con datos por provincia en capira-site. Siempre que la página muestre un mapa de España, usar este patrón — no un único `registerMap` con shift manual de Canarias.',
    problema: 'ECharts auto-centra el bbox de todas las features dentro de layoutCenter/layoutSize. Si Canarias está en sus coords reales, el bbox es enorme y la península queda diminuta. Un shift manual (Canarias +7º lat) compensa pero ata la posición de Canarias al bbox — no se puede pegar al margen del card sin que la península drifte.',
    solucion: 'Registrar DOS mapas ECharts separados (península+Baleares y Canarias) y renderizar dos series `type: "map"` en el mismo chart con sus propios layoutCenter/layoutSize. Un único visualMap con seriesIndex:[0,1] aplica colores a ambas. La península conserva su encuadre y Canarias se posiciona libremente como inset.',
    geojson_requerido: 'data/spain-provinces.json con features.properties.cod_prov (INE numérico: "35"=Las Palmas, "38"=Sta Cruz Tenerife) y features.properties.name. Separar por cod_prov en dos geos.',
    codigo: [
      '// 1) Separar features y registrar dos mapas (a nivel módulo, una sola vez)',
      'const CANARIAS_CODS = new Set(["35", "38"]);',
      'const src = spainGeoJson;',
      'const peninsulaGeo = { ...src, features: src.features.filter((f) => !CANARIAS_CODS.has(f.properties.cod_prov)) };',
      'const canariasGeo  = { ...src, features: src.features.filter((f) =>  CANARIAS_CODS.has(f.properties.cod_prov)) };',
      'echarts.registerMap("spain-peninsula", peninsulaGeo);',
      'echarts.registerMap("spain-canarias",  canariasGeo);',
      '',
      '// 2) En el option del chart: una series por mapa + visualMap con seriesIndex:[0,1]',
      'const buildData = (features) => features.map((f) => {',
      '  const p = byIne.get(f.properties.cod_prov);',
      '  return { name: f.properties.name, value: p ? +p.pen.toFixed(2) : 0, _prov: p?.prov, _evs: p?.evs, _total: p?.total };',
      '});',
      'const commonStyle = {',
      '  itemStyle: { borderColor: "rgba(255,255,255,0.15)", borderWidth: 0.7, areaColor: "#1e293b" },',
      '  emphasis:  { label: { show: true, color: C.text, fontSize: 11, fontWeight: 600 },',
      '               itemStyle: { areaColor: accent, borderColor: C.text, borderWidth: 1 } },',
      '  select:    { disabled: true },',
      '};',
      'option = {',
      '  visualMap: {',
      '    min: 0, max, calculable: true, orient: "horizontal",',
      '    left: "center", top: 4, itemWidth: 8, itemHeight: 160,',
      '    inRange: { color: MAP_RAMPS[tec] },',
      '    seriesIndex: [0, 1],',
      '  },',
      '  series: [',
      '    { // península + Baleares, ocupa la mayoría del card',
      '      name: "peninsula", type: "map", map: "spain-peninsula",',
      '      layoutCenter: ["50%", "52%"], layoutSize: "96%",',
      '      aspectScale: 0.85, roam: false,',
      '      data: buildData(peninsulaGeo.features), ...commonStyle,',
      '    },',
      '    { // Canarias, inset abajo-izquierda',
      '      name: "canarias", type: "map", map: "spain-canarias",',
      '      layoutCenter: ["12%", "90%"], layoutSize: "22%",',
      '      aspectScale: 0.85, roam: false,',
      '      data: buildData(canariasGeo.features), ...commonStyle,',
      '    },',
      '  ],',
      '};',
    ].join('\n'),
    tips: [
      'Península: layoutCenter ["50%", "52%"] + layoutSize "96%" maximiza tamaño y deja gap mínimo con la barra de visualMap en top:4.',
      'layoutSize de Canarias ~22% queda bien en cards angostos; subir a 28% si el card es ancho.',
      'layoutCenter ["12%", "90%"] apoya Canarias contra el borde inferior-izquierdo. Ajustable.',
      'Compartir commonStyle entre las dos series para consistencia visual y borders idénticos.',
      'visualMap.seriesIndex:[0,1] es crítico — sin eso sólo pinta la primera serie.',
      'Tooltip único (definido a nivel option) funciona automáticamente sobre ambas series.',
      'Para compactar el card a la izquierda sin achicar el mapa: marginLeft/Right: -20 en el div para cancelar el padding del sec card.',
    ],
    contra_ejemplo: 'NO registrar un único mapa con shift manual de Canarias (CANARIAS_SHIFT_LON/LAT sobre el mismo geojson). Ata la posición de Canarias al bbox y hace imposible pegarla al margen del card sin comprimir la península.',
    referencia_codigo: 'app/info/parque/Dashboard.tsx — función ChartMapaEspana y bloque de echarts.registerMap al tope del archivo.',
  },

  'tec-filter-buttons': {
    titulo: 'Botones de filtro de tecnología (BEV+PHEV / BEV / PHEV) con label bicolor',
    cuando_usar: 'Cualquier dashboard que filtre entre enchufables combinados (ambos) y cada sub-tecnología. Siempre que haya toggle de "BEV + PHEV" activo, mantener esta codificación visual — no inventar otra.',
    problema: 'Los tres botones comparten un mismo contenedor pero representan conceptos distintos: BEV y PHEV son "singles" con color propio; "BEV + PHEV" es la suma. Cuando uno está activo hay que comunicar visualmente qué está seleccionado sin que el "combinado" se confunda con un simple "todos" neutro.',
    solucion: 'Asignar a cada opción su color (BEV=#38bdf8 azul, PHEV=#fb923c naranja, ambos=#34d399 verde). Cuando el botón está activo, el borde y el fondo translúcido se pintan del color de la opción (bg = color+"18", border = color+"44"). El texto del botón "BEV + PHEV" activo es bicolor inline: "BEV" en azul, " + " en verde, "PHEV" en naranja — refuerza que el verde es la combinación de ambos colores.',
    codigo: [
      'const BEV_COLOR   = "#38bdf8";',
      'const PHEV_COLOR  = "#fb923c";',
      'const AMBOS_COLOR = "#34d399";',
      '',
      'const tecOptions: { value: "ambos" | "bev" | "phev"; color: string }[] = [',
      '  { value: "ambos", color: AMBOS_COLOR },',
      '  { value: "bev",   color: BEV_COLOR   },',
      '  { value: "phev",  color: PHEV_COLOR  },',
      '];',
      '',
      '{tecOptions.map((opt) => {',
      '  const active = filtro === opt.value;',
      '  const col = opt.color;',
      '  const label = opt.value === "ambos"',
      '    ? (active',
      '        ? <><span style={{ color: BEV_COLOR }}>BEV</span><span style={{ color: AMBOS_COLOR }}> + </span><span style={{ color: PHEV_COLOR }}>PHEV</span></>',
      '        : "BEV + PHEV")',
      '    : opt.value === "bev" ? "BEV" : "PHEV";',
      '  return (',
      '    <button key={opt.value} onClick={() => setFiltro(opt.value)} style={{',
      '      padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,',
      '      border:     active ? `1px solid ${col}44` : "1px solid transparent",',
      '      background: active ? `${col}18`           : "transparent",',
      '      color:      active ? col                  : "rgba(241,245,249,0.55)",',
      '      transition: "all 0.15s", whiteSpace: "nowrap",',
      '    }}>',
      '      {label}',
      '    </button>',
      '  );',
      '})}',
    ].join('\n'),
    tips: [
      'El `color` del botón activo para "ambos" queda sobrescrito por los `<span>` inline del label bicolor — no hay conflicto. Igual se asigna para mantener el contrato de la interfaz uniforme.',
      'Suffixes de color: "18" = ~9% alpha (fondo muy sutil), "44" = ~27% alpha (borde visible pero no duro). Respetar estos valores para coherencia entre dashboards.',
      'AMBOS_COLOR = #34d399 debe coincidir con C.green del dashboard para que mapas/charts que usan verde al seleccionar "ambos" matcheen con el botón.',
      'El separador " + " en verde es intencional: es la mezcla aditiva azul+naranja no da verde, pero semánticamente representa "la suma" que el color verde comunica.',
      'Para charts/mapas que reciben el filtro, derivar el accent igual: `accent = tec === "bev" ? C.bev : tec === "phev" ? C.phev : C.green`.',
    ],
    contra_ejemplo: 'NO pintar el " + " en gris translúcido ni el borde/bg del "ambos" en blanco neutro — se pierde la asociación de verde = combinación.',
    referencia_codigo: 'app/info/DashboardControls.tsx — tecOptions y el bloque {tecOptions.map(...)} dentro del contenedor sticky.',
  },
};

const DATA_SOURCE_DESC = {
  'dgt-data.ts':                 'Histórico DGT matriculaciones 2014-presente (auto-gen por scripts/dgt-matriculaciones.mjs).',
  'dgt-bev-phev-data.ts':        'Clasificación BEV/PHEV por cod_propulsion + cod_tipo DGT.',
  'dgt-parque-data.ts':          'Parque activo mensual: real desde 2025-03 (ZIP DGT) + calculado hacia atrás (matric − bajas). Consumido por /info/parque.',
  'dgt-marcas-provincias-data.ts':'Agregaciones DGT por marca y provincia.',
  'anfac-data.ts':               'Datos ANFAC (mercado total turismos/VCL/industriales).',
  'infraestructura-data.ts':     'Puntos de recarga públicos por provincia y CCAA.',
  'matriculaciones-data.ts':     'Agregaciones por año/mes para UI de matriculaciones.',
  'marcas-data.ts':              'Lista de marcas y normalización (aliases, exclusiones).',
  'provincias-data.ts':          'Lista de provincias y códigos DGT.',
  'licitaciones-data.ts':        'Agregaciones de licitaciones públicas (PLACSP) para /info/licitaciones.',
};

// ─────────────────────────────────────────────────────────────────
// Helpers de filesystem
// ─────────────────────────────────────────────────────────────────

async function listDirRecursive(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await listDirRecursive(full, baseDir));
    } else {
      out.push(relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return out;
}

async function fileExists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function fileLinesInfo(path) {
  if (!(await fileExists(path))) return null;
  const content = await readFile(path, 'utf8');
  return {
    path: relative(REPO_ROOT, path).replace(/\\/g, '/'),
    lines: content.split('\n').length,
    bytes: Buffer.byteLength(content),
  };
}

function extractImports(source) {
  const imports = [];
  const re = /import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(source)) !== null) imports.push(m[1]);
  return imports;
}

function extractComponentRefs(source) {
  // JSX opening tags con PascalCase
  const refs = new Set();
  const re = /<([A-Z][A-Za-z0-9_]+)[\s/>]/g;
  let m;
  while ((m = re.exec(source)) !== null) refs.add(m[1]);
  return [...refs];
}

// ─────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────

async function getOverview() {
  const files = await listDirRecursive(INFO_DIR);
  const routes = [];

  // page.tsx de cada subfolder → ruta (soporta rutas anidadas como /info/social/generador)
  const pageFiles = files.filter(f => f.endsWith('page.tsx') || f.endsWith('layout.tsx'));
  const routeSet = new Set();
  for (const f of pageFiles) {
    if (f === 'page.tsx') routeSet.add('/info');
    else if (f.endsWith('/page.tsx')) {
      routeSet.add('/info/' + f.replace(/\/page\.tsx$/, ''));
    }
  }

  for (const route of [...routeSet].sort()) {
    const meta = ROUTE_METADATA[route] || {
      proposito: '(sin metadata curada)',
      audiencia: 'publico',
      estado: 'live',
      kpis: [],
    };
    routes.push({ route, ...meta });
  }

  // detectar rutas con carpeta pero sin page.tsx (carpetas vacías / WIP)
  const topDirs = new Set(files.map(f => f.split('/')[0]).filter(d => !d.endsWith('.tsx') && !d.endsWith('.ts')));
  for (const dir of topDirs) {
    const route = '/info/' + dir;
    const hasPage = files.some(f => f === dir + '/page.tsx');
    if (!hasPage && !routeSet.has(route)) {
      routes.push({
        route,
        proposito: ROUTE_METADATA[route]?.proposito || '(carpeta sin page.tsx)',
        audiencia: 'publico',
        estado: 'vacio',
        kpis: [],
      });
    }
  }

  return {
    dashboard: 'capira info (eMobility Insights)',
    base_path: relative(REPO_ROOT, INFO_DIR).replace(/\\/g, '/'),
    total_rutas: routes.length,
    routes,
    componentes_compartidos: [
      'InsightsContext.tsx', 'InsightsProvider', 'InsightsNav.tsx',
      'DashboardControls.tsx', 'InsightsFuente.tsx', 'layout.tsx',
      '_components/Card.tsx', '_components/KPI.tsx', '_components/SectionTitle.tsx',
      '_components/InsightCard.tsx', '_components/NoData.tsx',
    ],
    stack: {
      framework: 'Next.js 16.1.1 + React 19 + TS 5',
      charts: 'ECharts 6',
      styling: 'Tailwind 4',
      auth: 'cookie insights_auth comparada contra ADMIN_TOKEN env',
    },
  };
}

async function getPage(route) {
  if (!route || !route.startsWith('/info')) {
    throw new Error('route debe empezar con /info (ej: /info/matriculaciones)');
  }

  const subPath = route === '/info' ? '' : route.replace(/^\/info\//, '');
  const pageFile = join(INFO_DIR, subPath, 'page.tsx');
  const dir = join(INFO_DIR, subPath);

  if (!(await fileExists(pageFile))) {
    return {
      route,
      error: 'No existe page.tsx para esa ruta',
      metadata: ROUTE_METADATA[route] || null,
    };
  }

  const source = await readFile(pageFile, 'utf8');
  const imports = extractImports(source);
  const components = extractComponentRefs(source);

  // archivos hermanos (Dashboard.tsx, etc.)
  const siblings = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name !== 'page.tsx') {
        const info = await fileLinesInfo(join(dir, e.name));
        if (info) siblings.push(info);
      }
    }
  } catch {}

  // identificar data sources consumidos (imports que apuntan a lib/insights)
  const dataSources = imports
    .filter(i => i.includes('lib/insights') || i.includes('/lib/insights'))
    .map(i => i.split('/').pop() + '.ts');

  // identificar API calls en el source
  const apiCalls = [...source.matchAll(/['"](\/api\/info\/[^'"\s]+)['"]/g)]
    .map(m => m[1]);

  return {
    route,
    metadata: ROUTE_METADATA[route] || null,
    page_file: relative(REPO_ROOT, pageFile).replace(/\\/g, '/'),
    page_lines: source.split('\n').length,
    componentes_referenciados: components,
    archivos_vecinos: siblings,
    imports_destacados: imports.filter(i => !i.startsWith('.') || i.includes('insights') || i.includes('info')).slice(0, 20),
    data_sources_detectados: [...new Set(dataSources)],
    api_calls_detectados: [...new Set(apiCalls)],
  };
}

async function listDataSources() {
  const files = await readdir(LIB_DIR);
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.ts')) continue;
    const info = await fileLinesInfo(join(LIB_DIR, f));
    out.push({
      archivo: f,
      path: info.path,
      lineas: info.lines,
      bytes: info.bytes,
      descripcion: DATA_SOURCE_DESC[f] || '(sin descripcion curada)',
    });
  }
  return {
    total: out.length,
    base_path: relative(REPO_ROOT, LIB_DIR).replace(/\\/g, '/'),
    sources: out,
  };
}

async function listApiEndpoints() {
  const files = await listDirRecursive(API_DIR);
  const routeFiles = files.filter(f => f.endsWith('route.ts') || f.endsWith('route.tsx'));
  const endpoints = [];

  for (const f of routeFiles) {
    const full = join(API_DIR, f);
    const source = await readFile(full, 'utf8');
    const methods = [];
    for (const verb of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      const re = new RegExp(`export\\s+async\\s+function\\s+${verb}\\b`);
      if (re.test(source)) methods.push(verb);
    }
    const hasAuth = /insights_auth|ADMIN_TOKEN|cookies\(\)/.test(source);
    const todos = [...source.matchAll(/\/\/\s*TODO[:\s].{0,120}/gi)].map(m => m[0].trim());

    endpoints.push({
      route: '/api/info/' + f.replace(/\/route\.tsx?$/, ''),
      file: relative(REPO_ROOT, full).replace(/\\/g, '/'),
      metodos: methods,
      auth_admin: hasAuth,
      lineas: source.split('\n').length,
      todos,
    });
  }

  return {
    total: endpoints.length,
    base_path: relative(REPO_ROOT, API_DIR).replace(/\\/g, '/'),
    endpoints,
  };
}

async function getComponentSource(name) {
  if (!name) throw new Error('name es requerido (ej: DashboardControls, InsightsNav)');

  // Buscar en info y en components
  const searchDirs = [
    INFO_DIR,
    join(REPO_ROOT, 'app/components'),
  ];

  const candidates = [];
  for (const dir of searchDirs) {
    if (!(await fileExists(dir))) continue;
    const files = await listDirRecursive(dir);
    for (const f of files) {
      const bn = basename(f);
      if (bn === `${name}.tsx` || bn === `${name}.ts`) {
        candidates.push(join(dir, f));
      }
    }
  }

  if (candidates.length === 0) {
    return { name, found: false, sugerencia: 'Probá con search_dashboard para encontrar el nombre exacto.' };
  }

  const results = [];
  for (const path of candidates) {
    const source = await readFile(path, 'utf8');
    results.push({
      path: relative(REPO_ROOT, path).replace(/\\/g, '/'),
      lineas: source.split('\n').length,
      source,
    });
  }

  return { name, found: true, matches: results };
}

async function listPatterns() {
  return {
    total: Object.keys(PATTERNS).length,
    patrones: Object.entries(PATTERNS).map(([id, p]) => ({
      id,
      titulo:      p.titulo,
      cuando_usar: p.cuando_usar,
    })),
    nota: 'Llamar a get_pattern con el id para obtener solución completa (código + tips + contra-ejemplos).',
  };
}

async function getPattern(id) {
  const p = PATTERNS[id];
  if (!p) {
    return {
      error: `Patrón no encontrado: ${id}`,
      disponibles: Object.keys(PATTERNS),
    };
  }
  return { id, ...p };
}

async function searchDashboard(query) {
  if (!query) throw new Error('query es requerido');
  const needle = query.toLowerCase();
  const files = await listDirRecursive(INFO_DIR);
  const hits = [];

  for (const f of files) {
    const full = join(INFO_DIR, f);
    const source = await readFile(full, 'utf8');
    const lines = source.split('\n');
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(needle)) {
        matches.push({ line: i + 1, text: lines[i].trim().slice(0, 180) });
      }
    }
    if (matches.length > 0) {
      hits.push({
        file: 'app/info/' + f.replace(/\\/g, '/'),
        matches: matches.slice(0, 10),
        total_matches: matches.length,
      });
    }
  }

  return {
    query,
    archivos_con_coincidencias: hits.length,
    total_coincidencias: hits.reduce((s, h) => s + h.total_matches, 0),
    resultados: hits,
  };
}

// ─────────────────────────────────────────────────────────────────
// MCP Server
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'dashboard-specialist', version: '1.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_overview',
      description: `Árbol de rutas del dashboard /info de capira-site.
Retorna: lista de todas las rutas detectadas (de page.tsx), con estado (live/wip/vacio),
audiencia (publico/admin), propósito y KPIs conceptuales de cada una.
También lista componentes compartidos y stack técnico.
Usar cuando se pregunte qué secciones tiene el dashboard o qué hay en /info.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_page',
      description: `Detalle de una ruta concreta del dashboard.
Retorna: metadata curada (propósito, KPIs), path del page.tsx, componentes JSX referenciados,
archivos vecinos (Dashboard.tsx, Charts.tsx, etc.), imports, data sources detectados y
llamadas a /api/info.
Usar cuando se pregunte "qué hace/muestra/usa la página X".
Parámetro: route (string, ej: "/info/matriculaciones")`,
      inputSchema: {
        type: 'object',
        properties: {
          route: { type: 'string', description: 'Ruta completa, ej: /info/matriculaciones' },
        },
        required: ['route'],
      },
    },
    {
      name: 'list_data_sources',
      description: `Lista archivos de app/lib/insights/*.ts con descripción, líneas y bytes.
Son los datasets estáticos que alimentan los dashboards (agregaciones DGT/ANFAC,
clasificación BEV/PHEV, infraestructura, licitaciones).
Usar cuando se pregunte de dónde vienen los datos o qué data files existen.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_api_endpoints',
      description: `Lista rutas de app/api/info/** con métodos HTTP, si requieren auth admin,
líneas y TODOs encontrados en el código.
Usar cuando se pregunte por endpoints, APIs o qué se puede consultar desde el cliente.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_component_source',
      description: `Source completo de un componente por nombre (busca en app/info y app/components).
Retorna: path y contenido del archivo.
Usar cuando se pregunte cómo está implementado un componente concreto.
Parámetro: name (string, ej: "DashboardControls", "InsightsNav", "MatriculacionesCharts")`,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre del componente sin extensión' },
        },
        required: ['name'],
      },
    },
    {
      name: 'search_dashboard',
      description: `Grep case-insensitive sobre todos los archivos de app/info.
Retorna: archivos con matches, número de línea y texto de cada coincidencia (hasta 10 por archivo).
Usar para localizar dónde aparece un string, variable, clase CSS o concepto.
Parámetro: query (string a buscar)`,
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Término a buscar' },
        },
        required: ['query'],
      },
    },
    {
      name: 'list_patterns',
      description: `Lista los patrones de implementación reutilizables de capira-site.
Son "cómo lo hacemos acá" para ciertos tipos de componentes (mapas, charts, filtros).
Retorna: id + título + cuándo usar cada uno.
IMPORTANTE: antes de armar un mapa, chart o filtro nuevo, llamar primero a list_patterns
y luego a get_pattern sobre el id relevante. No inventar patrones nuevos si ya existe uno.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_pattern',
      description: `Detalle completo de un patrón: problema que resuelve, solución, código de referencia,
tips de ajuste y contra-ejemplos (lo que NO hay que hacer).
Usar antes de escribir código para una feature que encaje con algún patrón.
Parámetro: id (string, ej: "spain-choropleth-canarias-inset")`,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID del patrón (ver list_patterns)' },
        },
        required: ['id'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let data;
    switch (name) {
      case 'get_overview':         data = await getOverview(); break;
      case 'get_page':             data = await getPage(args?.route); break;
      case 'list_data_sources':    data = await listDataSources(); break;
      case 'list_api_endpoints':   data = await listApiEndpoints(); break;
      case 'get_component_source': data = await getComponentSource(args?.name); break;
      case 'search_dashboard':     data = await searchDashboard(args?.query); break;
      case 'list_patterns':        data = await listPatterns(); break;
      case 'get_pattern':          data = await getPattern(args?.id); break;
      default: throw new Error(`Herramienta desconocida: ${name}`);
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
