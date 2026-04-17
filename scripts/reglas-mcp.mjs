/**
 * Reglas Básicas MCP — Base de conocimiento persistente de Capira
 *
 * Almacena reglas, definiciones y criterios de negocio en data/reglas.json.
 * Permite leer y agregar reglas desde Claude Code.
 *
 * Uso (configurado vía .claude.json):
 *   node scripts/reglas-mcp.mjs
 */

import { Server }              from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname }       from 'path';
import { fileURLToPath }       from 'url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const REGLAS_FILE = join(__dirname, '..', 'data', 'reglas.json');

function loadReglas() {
  if (!existsSync(REGLAS_FILE)) return { version: 1, reglas: [] };
  return JSON.parse(readFileSync(REGLAS_FILE, 'utf8'));
}

function saveReglas(data) {
  writeFileSync(REGLAS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─────────────────────────────────────────────────────────────────
// SERVIDOR
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'reglas-basicas', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_all',
      description: 'Retorna todas las reglas y definiciones de negocio almacenadas. Llamar siempre al inicio de una conversación sobre datos EV o Capira para cargar el contexto correcto.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_by_categoria',
      description: 'Retorna las reglas de una categoría específica (ej: "EV / Movilidad Eléctrica").',
      inputSchema: {
        type: 'object',
        properties: {
          categoria: { type: 'string', description: 'Nombre de la categoría a filtrar' },
        },
        required: ['categoria'],
      },
    },
    {
      name: 'add_regla',
      description: 'Agrega una nueva regla o definición a la base de conocimiento.',
      inputSchema: {
        type: 'object',
        properties: {
          id:        { type: 'string',  description: 'ID único slug (ej: "ev-clasificacion-enchufables")' },
          categoria: { type: 'string',  description: 'Categoría temática (ej: "EV / Movilidad Eléctrica")' },
          titulo:    { type: 'string',  description: 'Título corto de la regla' },
          contenido: { type: 'string',  description: 'Descripción completa de la regla' },
          contexto:  { type: 'string',  description: 'Contexto de aplicación (ej: "Capira / DGT")' },
        },
        required: ['id', 'categoria', 'titulo', 'contenido'],
      },
    },
    {
      name: 'update_regla',
      description: 'Actualiza el contenido de una regla existente por su ID.',
      inputSchema: {
        type: 'object',
        properties: {
          id:        { type: 'string', description: 'ID de la regla a actualizar' },
          titulo:    { type: 'string', description: 'Nuevo título (opcional)' },
          contenido: { type: 'string', description: 'Nuevo contenido (opcional)' },
          contexto:  { type: 'string', description: 'Nuevo contexto (opcional)' },
        },
        required: ['id'],
      },
    },
    {
      name: 'list_categorias',
      description: 'Lista todas las categorías disponibles con el número de reglas en cada una.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'get_all') {
      const data = loadReglas();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_by_categoria') {
      const data = loadReglas();
      const filtered = data.reglas.filter(r =>
        r.categoria.toLowerCase().includes(args.categoria.toLowerCase())
      );
      return {
        content: [{ type: 'text', text: JSON.stringify({ reglas: filtered, total: filtered.length }, null, 2) }],
      };
    }

    if (name === 'list_categorias') {
      const data = loadReglas();
      const cats = {};
      for (const r of data.reglas) {
        cats[r.categoria] = (cats[r.categoria] || 0) + 1;
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(cats, null, 2) }],
      };
    }

    if (name === 'add_regla') {
      const data = loadReglas();
      if (data.reglas.find(r => r.id === args.id)) {
        return {
          content: [{ type: 'text', text: `Error: ya existe una regla con id "${args.id}". Usá update_regla para modificarla.` }],
          isError: true,
        };
      }
      const nueva = {
        id:        args.id,
        categoria: args.categoria,
        titulo:    args.titulo,
        contenido: args.contenido,
        contexto:  args.contexto ?? '',
        creada:    new Date().toISOString().split('T')[0],
      };
      data.reglas.push(nueva);
      saveReglas(data);
      return {
        content: [{ type: 'text', text: `Regla "${args.id}" agregada correctamente. Total reglas: ${data.reglas.length}` }],
      };
    }

    if (name === 'update_regla') {
      const data = loadReglas();
      const idx = data.reglas.findIndex(r => r.id === args.id);
      if (idx === -1) {
        return {
          content: [{ type: 'text', text: `Error: no existe ninguna regla con id "${args.id}".` }],
          isError: true,
        };
      }
      if (args.titulo)    data.reglas[idx].titulo    = args.titulo;
      if (args.contenido) data.reglas[idx].contenido = args.contenido;
      if (args.contexto)  data.reglas[idx].contexto  = args.contexto;
      data.reglas[idx].actualizada = new Date().toISOString().split('T')[0];
      saveReglas(data);
      return {
        content: [{ type: 'text', text: `Regla "${args.id}" actualizada correctamente.` }],
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
