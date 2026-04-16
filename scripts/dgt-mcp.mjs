/**
 * DGT MCP Server — Especialista en la base de datos de matriculaciones
 *
 * Servidor MCP local que expone la base de datos SQLite de la DGT
 * (data/dgt-matriculaciones.db) a Claude Code. Permite ejecutar
 * queries SQL reales contra los microdatos de matriculaciones y bajas.
 *
 * Uso (configurado automáticamente vía .claude/settings.json):
 *   node scripts/dgt-mcp.mjs
 *
 * Tablas disponibles:
 *   matriculaciones  — 18.6M registros, dic 2014 → presente
 *   bajas            — 21.9M registros, dic 2014 → presente
 *   meses_procesados / meses_procesados_bajas — control de importación
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
import { existsSync }   from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');

// ─────────────────────────────────────────────────────────────────
// SCHEMA — documentación completa para que Claude sepa qué hay
// ─────────────────────────────────────────────────────────────────

const SCHEMA_DOC = `
# Base de datos DGT — Microdatos de matriculaciones y bajas (España)

## Fuente
Microdatos oficiales de la DGT. Formato original: MATRABA (ancho fijo, 714 chars/línea).
Cobertura: diciembre 2014 → presente. Actualización: mensual (día ~16 de cada mes).

## Tablas

### matriculaciones (~18.6M registros)
Cada fila = un vehículo matriculado en España.

| Columna              | Tipo    | Descripción |
|----------------------|---------|-------------|
| periodo              | TEXT    | "YYYY-MM" — mes de matriculación |
| año                  | INTEGER | Año (2014–2026) |
| mes                  | INTEGER | Mes (1–12) |
| fecha                | TEXT    | Fecha exacta "YYYY-MM-DD" |
| marca                | TEXT    | Marca del vehículo (ej: "TESLA", "RENAULT") |
| modelo               | TEXT    | Modelo (ej: "MODEL 3", "ZOE") |
| fabricante           | TEXT    | Fabricante según ITV |
| cod_tipo             | TEXT    | Código original DGT 2 dígitos (ej: "10", "24") |
| tipo_vehiculo        | TEXT    | Nombre derivado (turismo, furgoneta, motocicleta…) |
| tipo_grupo           | TEXT    | Agrupación dashboard: turismo, furgoneta_van, camion, autobus, moto, quad_atv, remolque, agricola, especial, otros |
| cod_propulsion       | TEXT    | Código original: 0=gasolina, 1=diesel, 2=electrico_bev, 6=glp, 7=gnc, 8=gnl, 9=hidrogeno |
| combustible          | TEXT    | Nombre: gasolina, diesel, electrico_bev, glp, gnc, gnl, hidrogeno, biometano, etanol, biodiesel, butano, solar, otros |
| cilindrada           | INTEGER | cm³ |
| potencia_cv          | REAL    | CV (potencia fiscal) |
| kw                   | REAL    | kW (potencia ITV) |
| co2                  | INTEGER | g/km de CO2 |
| nivel_euro           | TEXT    | Norma de emisiones: "Euro 6d", "Euro 5", etc. |
| tipo_alimentacion    | TEXT    | Campo adicional de alimentación |
| cat_vehiculo_ev      | TEXT    | Categoría EV homologación: BEV, PHEV, HEV, REEV, FCEV (NULL si no es EV) |
| autonomia_ev         | INTEGER | km de autonomía eléctrica (solo EVs) |
| consumo_wh_km        | REAL    | Consumo en Wh/km (solo EVs) |
| tara                 | INTEGER | kg |
| peso_max             | INTEGER | kg |
| masa_orden_marcha    | INTEGER | kg |
| masa_max_tecnica     | INTEGER | kg |
| num_plazas           | INTEGER | Plazas ITV |
| num_plazas_max       | INTEGER | Plazas máximas |
| carroceria           | TEXT    | Tipo de carrocería |
| cat_homologacion_eu  | TEXT    | Categoría EU: M1 (turismo), N1 (furgoneta comercial <3.5t), L3e (moto), etc. |
| ind_nuevo_usado      | TEXT    | "N"=nuevo, "U"=usado |
| clase_matricula      | TEXT    | Clase de matrícula |
| persona_fisica_jur   | TEXT    | "F"=persona física, "J"=persona jurídica/empresa |
| servicio             | TEXT    | Uso: particular, público, alquiler, etc. |
| fecha_prim_matriculac| TEXT    | Primera matriculación (para vehículos de importación) |
| cod_provincia_mat    | TEXT    | Código INE 2 dígitos de la provincia de matriculación |
| provincia_mat        | TEXT    | Nombre de la provincia de matriculación |
| cod_provincia_veh    | TEXT    | Código INE del titular del vehículo |
| provincia_veh        | TEXT    | Provincia del titular |
| municipio            | TEXT    | Municipio |
| codigo_postal        | TEXT    | Código postal |
| renting              | TEXT    | "S"=renting, "N"=no renting |

### bajas (~21.9M registros)
Cada fila = un vehículo dado de baja en España.
Mismos campos que matriculaciones, más:

| Columna              | Tipo    | Descripción |
|----------------------|---------|-------------|
| motivo_baja          | TEXT    | Código motivo de baja |
| motivo_baja_desc     | TEXT    | Descripción del motivo de baja |

(Las bajas NO tienen cod_provincia_mat ni provincia_mat — solo cod_provincia_veh/provincia_veh)

### meses_procesados / meses_procesados_bajas
Control de qué meses han sido importados.

| Columna        | Tipo    |
|----------------|---------|
| periodo        | TEXT PK | "YYYY-MM" |
| año            | INTEGER |
| mes            | INTEGER |
| total_registros| INTEGER |
| procesado_en   | TEXT    |

## Índices disponibles (queries rápidas)
- matriculaciones: periodo, combustible, tipo_grupo, cod_provincia_mat, marca, ind_nuevo_usado, año
- bajas: periodo, motivo_baja, combustible, tipo_grupo, cod_provincia_veh, marca, año

## Provincias (cod → nombre)
01=Álava, 02=Albacete, 03=Alicante, 04=Almería, 05=Ávila, 06=Badajoz,
07=Baleares, 08=Barcelona, 09=Burgos, 10=Cáceres, 11=Cádiz, 12=Castellón,
13=Ciudad Real, 14=Córdoba, 15=A Coruña, 16=Cuenca, 17=Girona, 18=Granada,
19=Guadalajara, 20=Guipúzcoa, 21=Huelva, 22=Huesca, 23=Jaén, 24=León,
25=Lleida, 26=La Rioja, 27=Lugo, 28=Madrid, 29=Málaga, 30=Murcia,
31=Navarra, 32=Ourense, 33=Asturias, 34=Palencia, 35=Las Palmas, 36=Pontevedra,
37=Salamanca, 38=S.C. Tenerife, 39=Cantabria, 40=Segovia, 41=Sevilla, 42=Soria,
43=Tarragona, 44=Teruel, 45=Toledo, 46=Valencia, 47=Valladolid, 48=Bizkaia,
49=Zamora, 50=Zaragoza, 51=Ceuta, 52=Melilla

## Patrones de query habituales

### BEVs matriculados en 2025 por provincia
SELECT provincia_mat, COUNT(*) as total
FROM matriculaciones
WHERE año = 2025 AND cat_vehiculo_ev = 'BEV'
GROUP BY provincia_mat ORDER BY total DESC;

### Evolución mensual BEV+PHEV (turismos nuevos)
SELECT periodo, cat_vehiculo_ev, COUNT(*) as n
FROM matriculaciones
WHERE cat_vehiculo_ev IN ('BEV','PHEV')
  AND tipo_grupo = 'turismo'
  AND ind_nuevo_usado = 'N'
GROUP BY periodo, cat_vehiculo_ev
ORDER BY periodo;

### Top marcas BEV en 2025
SELECT marca, COUNT(*) as total
FROM matriculaciones
WHERE año = 2025 AND cat_vehiculo_ev = 'BEV' AND ind_nuevo_usado = 'N'
GROUP BY marca ORDER BY total DESC LIMIT 20;

### Bajas de EVs por motivo en 2025
SELECT motivo_baja_desc, COUNT(*) as n
FROM bajas
WHERE año = 2025 AND cat_vehiculo_ev IN ('BEV','PHEV')
GROUP BY motivo_baja_desc ORDER BY n DESC;

### Parque activo estimado (mats - bajas acumuladas)
SELECT
  SUM(CASE WHEN t='mat' THEN n ELSE -n END) as parque_estimado,
  cat_vehiculo_ev
FROM (
  SELECT 'mat' as t, cat_vehiculo_ev, COUNT(*) as n FROM matriculaciones WHERE cat_vehiculo_ev IS NOT NULL GROUP BY cat_vehiculo_ev
  UNION ALL
  SELECT 'baja' as t, cat_vehiculo_ev, COUNT(*) as n FROM bajas WHERE cat_vehiculo_ev IS NOT NULL GROUP BY cat_vehiculo_ev
)
GROUP BY cat_vehiculo_ev;
`.trim();

// ─────────────────────────────────────────────────────────────────
// SERVIDOR
// ─────────────────────────────────────────────────────────────────

let db = null;

function getDb() {
  if (!db) {
    if (!existsSync(DB_FILE)) {
      throw new Error(`Base de datos no encontrada: ${DB_FILE}\nEjecutá: node scripts/dgt-matriculaciones.mjs --init`);
    }
    db = new Database(DB_FILE, { readonly: true });
    db.pragma('journal_mode = WAL');
    db.pragma('temp_store = MEMORY');
    db.pragma('mmap_size = 268435456');
  }
  return db;
}

const server = new Server(
  { name: 'dgt-specialist', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ─────────────────────────────────────────────────────────────────
// HERRAMIENTAS
// ─────────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'query_dgt',
      description: `Ejecuta una query SQL de solo lectura contra la base de datos DGT.
Tablas disponibles: matriculaciones (18.6M registros), bajas (21.9M registros),
meses_procesados, meses_procesados_bajas.
Siempre usar LIMIT para queries exploratorias. Máximo recomendado: 10000 filas.
Para el schema completo usar la tool get_schema.`,
      inputSchema: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'Query SQL de solo lectura (SELECT). No se permiten INSERT/UPDATE/DELETE/DROP.',
          },
          limit: {
            type: 'number',
            description: 'Límite máximo de filas a retornar (default: 500, max: 10000)',
          },
        },
        required: ['sql'],
      },
    },
    {
      name: 'get_schema',
      description: 'Retorna el schema completo de la base de datos DGT con descripción de todas las tablas, columnas, tipos, valores posibles y ejemplos de queries.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_periodos',
      description: 'Lista todos los períodos (meses) disponibles en la base de datos, tanto para matriculaciones como para bajas.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_stats',
      description: 'Estadísticas generales de la base de datos: total de registros, rango de fechas, último mes procesado, totales por categoría EV.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'diagnose_import',
      description: `Diagnostica si un período se importó correctamente. Compara el mes con el anterior para detectar anomalías.
Si no se especifica período, diagnostica el último mes importado.
Checks que realiza:
- Si el período existe en matriculaciones y bajas
- Total de registros vs mes anterior (alerta si diff > 30%)
- Distribución BEV/PHEV/HEV vs mes anterior
- Top 5 marcas BEV del mes
- Si se generaron los archivos TS (via meses_procesados)`,
      inputSchema: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            description: 'Período a diagnosticar en formato YYYY-MM (ej: "2026-03"). Si se omite, usa el último mes importado.',
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'get_schema') {
      return {
        content: [{ type: 'text', text: SCHEMA_DOC }],
      };
    }

    if (name === 'get_periodos') {
      const database = getDb();
      const mat  = database.prepare('SELECT periodo, total_registros FROM meses_procesados ORDER BY periodo').all();
      const bajas = database.prepare('SELECT periodo, total_registros FROM meses_procesados_bajas ORDER BY periodo').all();
      const result = {
        matriculaciones: {
          total_meses: mat.length,
          primer_periodo: mat[0]?.periodo,
          ultimo_periodo: mat[mat.length - 1]?.periodo,
          periodos: mat,
        },
        bajas: {
          total_meses: bajas.length,
          primer_periodo: bajas[0]?.periodo,
          ultimo_periodo: bajas[bajas.length - 1]?.periodo,
          periodos: bajas,
        },
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'get_stats') {
      const database = getDb();

      const totalMat   = database.prepare('SELECT COUNT(*) as n FROM matriculaciones').get();
      const totalBajas = database.prepare('SELECT COUNT(*) as n FROM bajas').get();
      const ultimoMat  = database.prepare('SELECT MAX(periodo) as p FROM meses_procesados').get();
      const ultimoBaja = database.prepare('SELECT MAX(periodo) as p FROM meses_procesados_bajas').get();

      const evMat = database.prepare(`
        SELECT cat_vehiculo_ev, COUNT(*) as total
        FROM matriculaciones
        WHERE cat_vehiculo_ev IS NOT NULL
        GROUP BY cat_vehiculo_ev
        ORDER BY total DESC
      `).all();

      const evBajas = database.prepare(`
        SELECT cat_vehiculo_ev, COUNT(*) as total
        FROM bajas
        WHERE cat_vehiculo_ev IS NOT NULL
        GROUP BY cat_vehiculo_ev
        ORDER BY total DESC
      `).all();

      const porAño = database.prepare(`
        SELECT año,
          COUNT(*) as total,
          SUM(CASE WHEN cat_vehiculo_ev='BEV' THEN 1 ELSE 0 END) as bev,
          SUM(CASE WHEN cat_vehiculo_ev='PHEV' THEN 1 ELSE 0 END) as phev,
          SUM(CASE WHEN cat_vehiculo_ev='HEV' THEN 1 ELSE 0 END) as hev
        FROM matriculaciones
        GROUP BY año ORDER BY año
      `).all();

      const result = {
        matriculaciones: {
          total_registros: totalMat.n,
          ultimo_periodo: ultimoMat.p,
          por_cat_ev: evMat,
          por_año: porAño,
        },
        bajas: {
          total_registros: totalBajas.n,
          ultimo_periodo: ultimoBaja.p,
          por_cat_ev: evBajas,
        },
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'diagnose_import') {
      const database = getDb();

      // Determinar período a diagnosticar
      const ultimoRow = database.prepare('SELECT MAX(periodo) as p FROM meses_procesados').get();
      const periodo = args?.periodo || ultimoRow?.p;

      if (!periodo) {
        return { content: [{ type: 'text', text: 'No hay períodos importados en la base de datos.' }], isError: true };
      }

      // Período anterior
      const [year, month] = periodo.split('-').map(Number);
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear  = month === 1 ? year - 1 : year;
      const periodoPrev = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

      // 1. ¿Existe en meses_procesados?
      const enMat  = database.prepare('SELECT * FROM meses_procesados WHERE periodo = ?').get(periodo);
      const enBaja = database.prepare('SELECT * FROM meses_procesados_bajas WHERE periodo = ?').get(periodo);

      // 2. Totales del mes y del anterior
      const totalesMes  = database.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN ind_nuevo_usado='N' THEN 1 ELSE 0 END) as nuevos FROM matriculaciones WHERE periodo = ?").get(periodo);
      const totalesPrev = database.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN ind_nuevo_usado='N' THEN 1 ELSE 0 END) as nuevos FROM matriculaciones WHERE periodo = ?").get(periodoPrev);

      // 3. EV del mes y del anterior
      const evMes  = database.prepare(`SELECT cat_vehiculo_ev, COUNT(*) as n FROM matriculaciones WHERE periodo = ? AND cat_vehiculo_ev IN ('BEV','PHEV','HEV') GROUP BY cat_vehiculo_ev`).all(periodo);
      const evPrev = database.prepare(`SELECT cat_vehiculo_ev, COUNT(*) as n FROM matriculaciones WHERE periodo = ? AND cat_vehiculo_ev IN ('BEV','PHEV','HEV') GROUP BY cat_vehiculo_ev`).all(periodoPrev);

      // 4. Top 5 marcas BEV
      const topBev = database.prepare(`SELECT marca, COUNT(*) as n FROM matriculaciones WHERE periodo = ? AND cat_vehiculo_ev = 'BEV' AND ind_nuevo_usado = 'N' GROUP BY marca ORDER BY n DESC LIMIT 5`).all(periodo);

      // 5. Bajas del mes
      const bajasMes  = database.prepare('SELECT COUNT(*) as total FROM bajas WHERE periodo = ?').get(periodo);
      const bajasPrev = database.prepare('SELECT COUNT(*) as total FROM bajas WHERE periodo = ?').get(periodoPrev);

      // Calcular diffs y alertas
      const alertas = [];
      if (totalesPrev?.total > 0) {
        const diffPct = ((totalesMes.total - totalesPrev.total) / totalesPrev.total * 100).toFixed(1);
        if (Math.abs(diffPct) > 30) alertas.push(`⚠️  Total matriculaciones difiere ${diffPct}% vs mes anterior (${totalesPrev.total} → ${totalesMes.total})`);
      }
      if (!enMat) alertas.push(`❌ Período ${periodo} NO encontrado en meses_procesados (matriculaciones no importadas)`);
      if (!enBaja) alertas.push(`❌ Período ${periodo} NO encontrado en meses_procesados_bajas (bajas no importadas)`);

      const evMesMap  = Object.fromEntries(evMes.map(r  => [r.cat_vehiculo_ev, r.n]));
      const evPrevMap = Object.fromEntries(evPrev.map(r => [r.cat_vehiculo_ev, r.n]));
      for (const cat of ['BEV', 'PHEV', 'HEV']) {
        const curr = evMesMap[cat] || 0;
        const prev = evPrevMap[cat] || 0;
        if (prev > 0) {
          const d = ((curr - prev) / prev * 100).toFixed(1);
          if (Math.abs(d) > 50) alertas.push(`⚠️  ${cat} difiere ${d}% vs mes anterior (${prev} → ${curr})`);
        }
      }

      const result = {
        periodo_diagnosticado: periodo,
        periodo_anterior: periodoPrev,
        estado: {
          matriculaciones_importadas: !!enMat,
          bajas_importadas: !!enBaja,
          registros_mat: enMat?.total_registros ?? 0,
          registros_bajas: enBaja?.total_registros ?? 0,
          procesado_en: enMat?.procesado_en ?? null,
        },
        matriculaciones: {
          total: totalesMes?.total ?? 0,
          nuevos: totalesMes?.nuevos ?? 0,
          prev_total: totalesPrev?.total ?? 0,
          diff_pct: totalesPrev?.total > 0 ? `${((totalesMes.total - totalesPrev.total) / totalesPrev.total * 100).toFixed(1)}%` : 'n/a',
        },
        bajas: {
          total: bajasMes?.total ?? 0,
          prev_total: bajasPrev?.total ?? 0,
        },
        ev: {
          mes: evMesMap,
          prev: evPrevMap,
        },
        top5_marcas_bev: topBev,
        alertas: alertas.length > 0 ? alertas : ['✅ Todo parece correcto'],
      };

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    if (name === 'query_dgt') {
      const { sql, limit = 500 } = args;

      // Seguridad: solo lectura
      const sqlUpper = sql.trim().toUpperCase();
      const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'ATTACH', 'DETACH', 'PRAGMA'];
      for (const kw of forbidden) {
        if (sqlUpper.startsWith(kw) || sqlUpper.includes(` ${kw} `) || sqlUpper.includes(`\n${kw} `)) {
          return {
            content: [{ type: 'text', text: `Error: Solo se permiten queries SELECT. La keyword "${kw}" no está permitida.` }],
            isError: true,
          };
        }
      }

      const maxLimit = Math.min(limit, 10000);
      const database = getDb();

      // Si la query ya tiene LIMIT, respetarla. Si no, añadirla.
      const finalSql = /\bLIMIT\b/i.test(sql) ? sql : `${sql.trimEnd().replace(/;$/, '')} LIMIT ${maxLimit}`;

      const start = Date.now();
      const rows  = database.prepare(finalSql).all();
      const ms    = Date.now() - start;

      const result = {
        rows,
        count: rows.length,
        ms,
        note: rows.length === maxLimit ? `Resultado truncado a ${maxLimit} filas. Refiná la query o aumentá el limit.` : null,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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

// ─────────────────────────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
