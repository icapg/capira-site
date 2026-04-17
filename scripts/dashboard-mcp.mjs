/**
 * Dashboard MCP Server — Especialista en el dashboard /insights de capira-site
 *
 * Qué es: servidor MCP que expone la estructura del dashboard eMobility Insights
 * (Next.js App Router en capira-site/app/insights). Permite a Claude responder
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
 *   get_overview           — árbol de rutas /insights con estado y propósito
 *   get_page               — detalle de una ruta (KPIs, componentes, data sources)
 *   list_data_sources      — archivos de app/lib/insights con descripción
 *   list_api_endpoints     — rutas de app/api/insights con método y auth
 *   get_component_source   — source de un componente por nombre
 *   search_dashboard       — grep sobre app/insights para un término
 */

import { Server }               from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';

const REPO_ROOT      = 'C:/Users/ignacio.capurro/capira-site';
const INSIGHTS_DIR   = join(REPO_ROOT, 'app/insights');
const LIB_DIR        = join(REPO_ROOT, 'app/lib/insights');
const API_DIR        = join(REPO_ROOT, 'app/api/insights');

// ─────────────────────────────────────────────────────────────────
// Metadata curada — lo que NO se puede inferir del codebase
// (propósito de cada ruta, audiencia, KPIs conceptuales)
// ─────────────────────────────────────────────────────────────────

const ROUTE_METADATA = {
  '/insights': {
    proposito: 'Landing pública del dashboard. Grid con 4 cards de acceso.',
    audiencia: 'publico',
    estado: 'live',
    kpis: [],
  },
  '/insights/matriculaciones': {
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
  '/insights/parque': {
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
  '/insights/infraestructura': {
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
  '/insights/social': {
    proposito: 'Landing de sección social (kanban mensual + anual).',
    audiencia: 'admin',
    estado: 'live',
    kpis: [],
  },
  '/insights/social/mensual': {
    proposito: 'Kanban mensual para generar contenido de redes sociales.',
    audiencia: 'admin',
    estado: 'live',
    kpis: [
      'Cards por mes con matriculaciones, bajas y parque activo',
      'Templates: BajasMes, AcumuladoMes, MatriculacionesMes',
    ],
  },
  '/insights/dgt-status': {
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
  '/insights/login': {
    proposito: 'Form de password → cookie insights_auth (30 días).',
    audiencia: 'admin',
    estado: 'live',
    kpis: [],
  },
  '/insights/bajas': {
    proposito: 'Carpeta reservada, sin contenido todavía.',
    audiencia: 'publico',
    estado: 'vacio',
    kpis: [],
  },
};

const DATA_SOURCE_DESC = {
  'dgt-data.ts':                 'Histórico DGT matriculaciones 2014-presente (auto-gen por scripts/dgt-matriculaciones.mjs).',
  'dgt-bev-phev-data.ts':        'Clasificación BEV/PHEV por cod_propulsion + cod_tipo DGT.',
  'dgt-parque-data.ts':          'Parque activo mensual: real desde 2025-03 (ZIP DGT) + calculado hacia atrás (matric − bajas). Consumido por /insights/parque.',
  'dgt-marcas-provincias-data.ts':'Agregaciones DGT por marca y provincia.',
  'anfac-data.ts':               'Datos ANFAC (mercado total turismos/VCL/industriales).',
  'infraestructura-data.ts':     'Puntos de recarga públicos por provincia y CCAA.',
  'matriculaciones-data.ts':     'Agregaciones por año/mes para UI de matriculaciones.',
  'marcas-data.ts':              'Lista de marcas y normalización.',
  'provincias-data.ts':          'Lista de provincias y códigos DGT.',
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
  const files = await listDirRecursive(INSIGHTS_DIR);
  const routes = [];

  // page.tsx de cada subfolder → ruta
  const pageFiles = files.filter(f => f.endsWith('page.tsx') || f.endsWith('layout.tsx'));
  const routeSet = new Set(['/insights']);
  for (const f of pageFiles) {
    if (f === 'page.tsx') routeSet.add('/insights');
    else if (f.endsWith('/page.tsx')) {
      routeSet.add('/insights/' + f.replace(/\/page\.tsx$/, ''));
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

  // detectar rutas con carpeta pero sin page.tsx (ej: bajas)
  const dirs = new Set(files.map(f => f.split('/')[0]).filter(d => !d.endsWith('.tsx')));
  for (const dir of dirs) {
    const route = '/insights/' + dir;
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
    dashboard: 'eMobility Insights',
    base_path: relative(REPO_ROOT, INSIGHTS_DIR).replace(/\\/g, '/'),
    total_rutas: routes.length,
    routes,
    componentes_compartidos: [
      'InsightsContext.tsx', 'InsightsProvider', 'InsightsNav.tsx',
      'DashboardControls.tsx', 'InsightsFuente.tsx', 'layout.tsx',
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
  if (!route || !route.startsWith('/insights')) {
    throw new Error('route debe empezar con /insights (ej: /insights/matriculaciones)');
  }

  const subPath = route === '/insights' ? '' : route.replace(/^\/insights\//, '');
  const pageFile = join(INSIGHTS_DIR, subPath, 'page.tsx');
  const dir = join(INSIGHTS_DIR, subPath);

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
  const apiCalls = [...source.matchAll(/['"](\/api\/insights\/[^'"\s]+)['"]/g)]
    .map(m => m[1]);

  return {
    route,
    metadata: ROUTE_METADATA[route] || null,
    page_file: relative(REPO_ROOT, pageFile).replace(/\\/g, '/'),
    page_lines: source.split('\n').length,
    componentes_referenciados: components,
    archivos_vecinos: siblings,
    imports_destacados: imports.filter(i => !i.startsWith('.') || i.includes('insights')).slice(0, 20),
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
      route: '/api/insights/' + f.replace(/\/route\.tsx?$/, ''),
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

  // Buscar en insights y en components
  const searchDirs = [
    INSIGHTS_DIR,
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

async function searchDashboard(query) {
  if (!query) throw new Error('query es requerido');
  const needle = query.toLowerCase();
  const files = await listDirRecursive(INSIGHTS_DIR);
  const hits = [];

  for (const f of files) {
    const full = join(INSIGHTS_DIR, f);
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
        file: 'app/insights/' + f.replace(/\\/g, '/'),
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
  { name: 'dashboard-specialist', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_overview',
      description: `Árbol de rutas del dashboard /insights de capira-site.
Retorna: lista de todas las rutas detectadas (de page.tsx), con estado (live/wip/vacio),
audiencia (publico/admin), propósito y KPIs conceptuales de cada una.
También lista componentes compartidos y stack técnico.
Usar cuando se pregunte qué secciones tiene el dashboard o qué hay en /insights.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_page',
      description: `Detalle de una ruta concreta del dashboard.
Retorna: metadata curada (propósito, KPIs), path del page.tsx, componentes JSX referenciados,
archivos vecinos (Dashboard.tsx, Charts.tsx, etc.), imports, data sources detectados y
llamadas a /api/insights.
Usar cuando se pregunte "qué hace/muestra/usa la página X".
Parámetro: route (string, ej: "/insights/matriculaciones")`,
      inputSchema: {
        type: 'object',
        properties: {
          route: { type: 'string', description: 'Ruta completa, ej: /insights/matriculaciones' },
        },
        required: ['route'],
      },
    },
    {
      name: 'list_data_sources',
      description: `Lista archivos de app/lib/insights/*.ts con descripción, líneas y bytes.
Son los datasets estáticos que alimentan los dashboards (agregaciones DGT/ANFAC,
clasificación BEV/PHEV, infraestructura).
Usar cuando se pregunte de dónde vienen los datos o qué data files existen.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_api_endpoints',
      description: `Lista rutas de app/api/insights/** con métodos HTTP, si requieren auth admin,
líneas y TODOs encontrados en el código.
Usar cuando se pregunte por endpoints, APIs o qué se puede consultar desde el cliente.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_component_source',
      description: `Source completo de un componente por nombre (busca en app/insights y app/components).
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
      description: `Grep case-insensitive sobre todos los archivos de app/insights.
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
