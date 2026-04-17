/**
 * Social Copy Specialist MCP — Reglas y spec para generar posts DGT de CAPIRA
 *
 * Expone la especificación completa de cómo generar los textos mensuales
 * (long para LinkedIn+Instagram, short para X), incluyendo estructura,
 * hashtags fijos, detección de récords y ejemplos.
 *
 * Uso (registrado vía .claude.json):
 *   node scripts/social-copy-mcp.mjs
 */

import { Server }                 from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport }   from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ─────────────────────────────────────────────────────────────────
// DATA — Especificación completa
// ─────────────────────────────────────────────────────────────────

const SPEC = {
  version:    '1.0.0',
  audiencia:  'CPOs, inversores en infraestructura de carga, industria EV en España',
  tono:       'profesional, directo, con datos concretos, sin exageraciones',
  idioma:     'Español de España',
  formatoNumerico: {
    miles:    'punto (31.295, 621.000)',
    decimal:  'coma (58,2%, 1,63%)',
  },
  plataformas: {
    linkedin:  { limite: 3000, version: 'long'  },
    instagram: { limite: 2200, version: 'long'  },
    x:         { limite: 280,  version: 'short' },
  },
  hashtagsFijos: [
    '#MovilidadElectrica',
    '#CocheElectrico',
    '#VehiculoElectrico',
    '#DGT',
    '#EV',
    '#ESPAÑA',
  ],
  hashtagsReglas: [
    'Son EXACTAMENTE estos 6, en ese orden, siempre al final del post',
    'No se agregan ni se quitan hashtags; tampoco se reordenan',
    'Se repiten igual en la versión long (LinkedIn/Instagram) y short (X)',
  ],
};

const ESTRUCTURA_LONG = {
  descripcion: 'Versión larga para LinkedIn e Instagram. Mismo texto en ambas.',
  bloques: [
    {
      nombre: 'Hook',
      lineas: 1,
      regla:  'Empieza con 1-2 emojis. Describe la tendencia del mes orientada al negocio (infraestructura, CPOs). Verbos adaptados al YoY: sube fuerte → "acelerando/impulsando"; cae → "ajustándose/moderándose"; mixto → "con luces y sombras". Variar cada mes.',
      override: 'Si hay RÉCORD HISTÓRICO, el hook DEBE empezar mencionándolo (ej. "🏆 Récord histórico en España" / "🚀 Mes récord: nunca tantas matriculaciones enchufables").',
    },
    {
      nombre: 'Bullets de datos',
      lineas: 3,
      regla:  'Usar EXACTAMENTE estos 3 bullets con emojis fijos y valores del mes:\n  📈 {periodoFull}: {evMat} vehículos enchufables matriculados ({mat.evYoy} YoY)\n  🔋 España ya supera las {evActivo} unidades enchufables en circulación\n  📊 El parque eléctrico crece un sólido {acu.evYoy} interanual',
    },
    {
      nombre: 'Cierre',
      lineas: 1,
      regla:  'Reflexión breve sobre impacto para infraestructura de carga, demanda energética o ubicaciones estratégicas. Variar según los datos.',
    },
    {
      nombre: 'Nota de exclusión',
      lineas: 1,
      regla:  'Literal, siempre: "*Excluye la categoría Otros (tractores, maquinaria especial y vehículos fuera de las categorías principales)."',
    },
    {
      nombre: 'Hashtags',
      lineas: 1,
      regla:  'Línea con los 6 hashtags fijos, separados por espacio.',
    },
  ],
  reglasEstrictas: [
    'Los 3 bullets (📈 🔋 📊) van con esos números exactos y en ese orden',
    'Hashtags: los 6 fijos, en orden, sin cambios',
    'Si YoY negativo, usar verbos coherentes — no decir "acelerando" si cayó',
    'Texto plano: sin negrita, cursiva ni Markdown',
    'Saltos de línea entre bloques mantienen legibilidad',
  ],
};

const ESTRUCTURA_SHORT = {
  descripcion: 'Versión corta para X (Twitter). Máximo 280 caracteres INCLUYENDO hashtags y emojis.',
  bloques: [
    {
      nombre: 'Mensaje compacto',
      regla:  '1 emoji + frase con 1-2 cifras clave (no usar los 3 bullets completos — elegir los datos más impactantes).',
      ejemplo: '🔋 Marzo 2026: +31.295 enchufables (+58,2% YoY). España supera 621.000 en circulación.',
    },
    {
      nombre: 'Hashtags',
      regla: 'Línea con los 6 hashtags fijos.',
    },
  ],
  reglasEstrictas: [
    'MÁXIMO 280 caracteres contando emojis (cada emoji cuenta como ~2)',
    'Si se pasa, acortar la frase inicial — NUNCA quitar hashtags',
    'Si hay RÉCORD HISTÓRICO, mencionarlo sí o sí (ej. "🏆 Récord: ...")',
    'Los mismos 6 hashtags fijos al final',
  ],
};

const DETECCION_RECORDS = {
  descripcion: 'Se detectan en app/lib/social/monthly.ts comparando contra TODOS los meses anteriores en dgtParqueMensual (no solo YoY).',
  tipos: [
    {
      flag:      'records.enchufablesMatri',
      condicion: 'BEV+PHEV del mes > máximo histórico de BEV+PHEV mensual',
      prioridad: 'MÁXIMA — debe ser el foco absoluto del post',
    },
    {
      flag:      'records.bevMatri',
      condicion: 'BEV del mes > máximo histórico BEV mensual',
      prioridad: 'ALTA — mencionar en el hook',
    },
    {
      flag:      'records.phevMatri',
      condicion: 'PHEV del mes > máximo histórico PHEV mensual',
      prioridad: 'ALTA — mencionar en el hook',
    },
  ],
  orden: 'Si hay múltiples récords simultáneos, se prioriza: enchufablesMatri > bevMatri > phevMatri',
};

const EJEMPLO_REAL = {
  contexto: 'Marzo 2026, récord histórico de matriculaciones enchufables',
  long: `🚗⚡ Las matriculaciones siguen acelerando… y el parque activo también sigue creciendo, un dato clave para los CPOs.

📈 Marzo 2026: 31.295 vehículos enchufables matriculados (+58,2% YoY)
🔋 España ya supera las 621.000 unidades enchufables en circulación
📊 El parque eléctrico crece un sólido +40,8% interanual

Más coches en la calle significa más demanda de infraestructura, energía y ubicaciones estratégicas.

*Excluye la categoría Otros (tractores, maquinaria especial y vehículos fuera de las categorías principales).

#MovilidadElectrica #CocheElectrico #VehiculoElectrico #DGT #EV #ESPAÑA`,
  short: `🔋 Marzo 2026: +31.295 enchufables matriculados (+58,2% YoY). España ya supera 621.000 en circulación.

#MovilidadElectrica #CocheElectrico #VehiculoElectrico #DGT #EV #ESPAÑA`,
};

const DATA_SOURCES = {
  descripcion: 'De dónde vienen los números que se inyectan en el prompt',
  campos: {
    'mat.bev / mat.phev':        'DGT MATRABA, app/lib/insights/dgt-parque-data.ts → matriculaciones_mes',
    'mat.evYoy':                 'Calculado YoY vs mismo mes año anterior',
    'acu.bevActivos / acu.phevActivos / acu.parqueTotal': 'Parque oficial DGT ZIP (real desde 2025-03) + calculado hacia atrás, app/lib/insights/dgt-parque-data.ts → parque_acumulado / parque_total',
    'acu.evYoy':                 'YoY del parque acumulado enchufable (MATRABA)',
    'records.*':                 'Calculado en app/lib/social/monthly.ts:getTemplateDataFor() comparando contra toda la serie histórica',
  },
};

const TOOLS_SPEC = {
  endpoint_api:   'POST /api/social/generate-copy (app/api/social/generate-copy/route.ts)',
  modelo:         'claude-sonnet-4-5',
  respuesta:      '{ long, short, linkedin, instagram, twitter } — linkedin e instagram = long; twitter = short (truncado hard a 280 chars)',
  triggerClient:  'MonthDetail.tsx auto-dispara la generación al abrir un bundle en estado "pendiente" sin caption previo',
};

// ─────────────────────────────────────────────────────────────────
// SERVIDOR
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'social-copy-specialist', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_spec_completa',
      description: 'Retorna la especificación completa de cómo se generan los textos de posts sociales mensuales de CAPIRA (estructura, reglas, hashtags, ejemplos, detección de récords, data sources). Llamar cuando se vaya a editar el prompt de generación o crear nuevas variantes de post.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_estructura',
      description: 'Retorna solo la estructura obligatoria del post (long o short).',
      inputSchema: {
        type: 'object',
        properties: {
          version: { type: 'string', enum: ['long', 'short'], description: 'Cuál versión. "long" es LinkedIn+Instagram, "short" es X.' },
        },
        required: ['version'],
      },
    },
    {
      name: 'get_hashtags',
      description: 'Retorna los hashtags fijos obligatorios y sus reglas de uso.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_ejemplo',
      description: 'Retorna un ejemplo real de post (long + short) para usar como referencia de estilo. NO copiar literal — es guía.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_records_spec',
      description: 'Retorna la especificación de cómo se detectan y tratan los récords históricos (cuándo un mes supera el máximo de la serie).',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_plataformas',
      description: 'Retorna los límites de caracteres por plataforma y qué versión (long/short) se publica en cada una.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  try {
    if (name === 'get_spec_completa') {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            meta:              SPEC,
            estructuraLong:    ESTRUCTURA_LONG,
            estructuraShort:   ESTRUCTURA_SHORT,
            deteccionRecords:  DETECCION_RECORDS,
            ejemplo:           EJEMPLO_REAL,
            dataSources:       DATA_SOURCES,
            tooling:           TOOLS_SPEC,
          }, null, 2),
        }],
      };
    }

    if (name === 'get_estructura') {
      const { version } = request.params.arguments ?? {};
      const data = version === 'short' ? ESTRUCTURA_SHORT : ESTRUCTURA_LONG;
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_hashtags') {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            fijos:  SPEC.hashtagsFijos,
            reglas: SPEC.hashtagsReglas,
            linea:  SPEC.hashtagsFijos.join(' '),
          }, null, 2),
        }],
      };
    }

    if (name === 'get_ejemplo') {
      return {
        content: [{ type: 'text', text: JSON.stringify(EJEMPLO_REAL, null, 2) }],
      };
    }

    if (name === 'get_records_spec') {
      return {
        content: [{ type: 'text', text: JSON.stringify(DETECCION_RECORDS, null, 2) }],
      };
    }

    if (name === 'get_plataformas') {
      return {
        content: [{ type: 'text', text: JSON.stringify(SPEC.plataformas, null, 2) }],
      };
    }

    return {
      content: [{ type: 'text', text: `Tool desconocida: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
