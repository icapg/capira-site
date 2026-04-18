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

## CONCEPTOS CLAVE DEL DOMINIO (leer siempre antes de responder)

### Clasificación de vehículos en el dashboard

El dashboard de Capira divide los vehículos en DOS grupos, NO en categorías individuales:

**ENCHUFABLES** (Plug-in) — ÚNICA definición: vehículos que se conectan a la red eléctrica para cargar:
- BEV (Battery Electric Vehicle) — 100% eléctrico, solo batería
- PHEV (Plug-in Hybrid Electric Vehicle) — híbrido enchufable, tiene motor de combustión + batería recargable

**NO ENCHUFABLES** — TODO lo demás, sin excepción:
- HEV (Hybrid Electric Vehicle) — híbrido NO enchufable (ej: Toyota Prius clásico), se carga solo frenando
- REEV (Range Extender EV) — eléctrico con motor auxiliar de combustión, NO se conecta a la red
- FCEV (Fuel Cell EV) — pila de combustible (hidrógeno)
- Gasolina, Diesel, GLP, GNC, GNL, Hidrógeno, Biometano, Etanol, Biodiesel, etc.

**REGLA CRÍTICA**: La única distinción que importa es si el vehículo SE CONECTA A LA RED ELÉCTRICA para cargar.
- "Enchufables" o "EVs" o "plug-in" → SOLO BEV + PHEV. Nunca incluir HEV, REEV ni FCEV aquí.
- "No enchufables" → HEV, REEV, FCEV, gasolina, diesel, y cualquier otro. Todo lo que no se enchufa.
- "Electrificados" → puede ser BEV+PHEV+HEV según contexto; confirmar con el usuario si no es claro.
- "Todo el mercado" o "todos los vehículos" → NO filtrar por cat_vehiculo_ev (incluye los ~16M de gasolina/diesel).

**El parque activo del dashboard** muestra enchufables (BEV+PHEV) como métricas principales.
Los vehículos sin cat_vehiculo_ev (NULL) son gasolina/diesel/GLP = ~16M de vehículos, NO se muestran en el dashboard EV.

### Flujo vs Stock (distinción crítica)

Dos tipos de dato, NO mezclar:
- **Flujo** (tablas \`matriculaciones\`, \`bajas\`): eventos dentro de un mes. Cada fila es una alta o una baja.
- **Stock** (tablas \`parque\`, \`parque_agregados_mes\`): foto del conjunto activo en un momento dado. Snapshot, no evento.

**Regla**: para "cuántos se vendieron/matricularon" usar flujo (matriculaciones). Para "cuántos hay rodando/activos" usar stock (parque). Son datasets distintos con fuentes distintas y NO deben mezclarse ni sumarse.

### Altas nuevas vs re-matriculaciones (ind_nuevo_usado)

- \`ind_nuevo_usado='N'\` → vehículo **nuevo** (alta real, primera matriculación). SÍ suma al parque.
- \`ind_nuevo_usado='U'\` → vehículo **usado** re-matriculado (importación, cambio de servicio). NO suma al parque — ya estaba en circulación.

Para calcular crecimiento del parque desde flujos MATRABA, usar SIEMPRE \`ind_nuevo_usado='N'\`.

### Bajas: el motivo importa

- \`motivo_baja='3'\` → desguace / renovación del parque (baja **definitiva**). SÍ resta del parque.
- Otros motivos (transferencias, bajas temporales, voluntarias, motivo=6 null, motivo=7) NO restan del parque porque el vehículo sigue existiendo administrativamente.

Para calcular decremento del parque desde flujos MATRABA, usar SIEMPRE \`motivo_baja='3'\`.

### Fuentes de datos
- **DGT MATRABA**: microdatos oficiales de matriculaciones y bajas, todos los vehículos matriculados en España desde dic 2014. Muy granular. Es lo que contiene esta base de datos.
- **DGT Parque de Vehículos** (ZIP oficial): snapshot completo del parque activo en un momento dado. Contiene TODOS los vehículos activos registrados, incluyendo los matriculados antes de 2014. Es la fuente oficial para parque total y parque por tecnología. Tabla SQLite: parque + parque_agregados_mes (snapshots mensuales desde marzo 2025).
- **ANFAC**: datos de fabricantes, solo turismos nuevos, cifras ligeramente distintas a DGT.
- El dashboard tiene un toggle DGT/ANFAC para comparar — por defecto usa DGT.

### Horarios de publicación DGT (relevado 2026-04-17 via Last-Modified)

| Mes dato | Parque (ZIP) UTC       | MATRABA (mat+bajas) UTC |
|----------|------------------------|-------------------------|
| 2025-07  | 04-Aug 20:30           | 15-Aug 06:31            |
| 2025-08  | 01-Sep 20:19           | 15-Sep 06:30            |
| 2025-09  | 01-Oct 20:21           | 15-Oct 06:31            |
| 2025-10  | 01-Nov 21:17           | 15-Nov 07:31            |
| 2025-11  | 01-Dec 21:19           | 15-Dec 07:31            |
| 2025-12  | 01-Jan 21:19           | 15-Jan 07:31            |
| 2026-01  | 01-Feb 21:14           | 15-Feb 07:31            |
| 2026-02  | 01-Mar 20:50           | 15-Mar 07:30            |
| 2026-03  | 10-Apr 10:06 (atípico) | 15-Apr 06:31            |

**Patrón**:
- **Parque** (ZIP Parque de Vehículos): día **1** del mes siguiente, ~21-22h España. Outlier registrado: 2026-03 se republicó el 10-abril (probable corrección).
- **MATRABA** (matriculaciones + bajas): día **15** del mes siguiente, ~08:30 España. Muy estable (variación de segundos mes a mes; salto de ~1h por DST entre verano/invierno).

**URL MATRABA — atención**: el path usa mes SIN zero-padding: \`https://www.dgt.es/microdatos/salida/{year}/{M}/vehiculos/matriculaciones/export_mensual_mat_{YYYYMM}.zip\` (ej \`/2026/3/\`, NO \`/2026/03/\`). El script \`scripts/dgt-matriculaciones.mjs\` ya lo maneja.

**Implicancia para el cron local**: el cron actual (día 16, 00:01 España) garantiza tener MATRABA del mes anterior (publicado ~15 08:30) y el snapshot de parque (~1 22:00, 15 días de margen). Podría adelantarse al día 15 ~10:00 España si se quieren datos más frescos.

### Parque activo oficial (ZIP DGT, marzo 2025) — fuente más fiable que MATRABA para parque
| Categoría   | Vehículos  | Tipo        |
|-------------|-----------|-------------|
| NO_EV       | 35.775.738 | No enchufable (gasolina, diesel, GLP, HEV, etc.) |
| HEV         |  1.724.593 | No enchufable |
| BEV         |    343.873 | **Enchufable** |
| PHEV        |    277.307 | **Enchufable** |
| REEV        |      2.250 | No enchufable |
| FCEV        |        120 | No enchufable |
| **TOTAL**   | **38.123.881** | |

Enchufables totales (BEV+PHEV): **621.180** — penetración: **1,63%** del parque total.

Nota: esos números son del **primer snapshot histórico** (marzo 2025). Para cifras actuales usar la tool \`parque_stats\` (devuelve el último snapshot disponible, actualmente marzo 2026).

METODOLOGÍA OFICIAL (desde abril 2026):
El parque activo de enchufables se obtiene del ZIP oficial DGT Parque de Vehículos, NO del cálculo MATRABA.
El cálculo MATRABA (matriculaciones - bajas) sobreestima (~792K) porque solo cubre desde 2014. El ZIP es el dato real.
Cuando el usuario pregunte por "enchufables activos" o "parque EV", usar las cifras del ZIP: BEV=343.873, PHEV=277.307.

### Parque real vs calculado (dashboard /insights/parque)

El archivo \`app/lib/insights/dgt-parque-data.ts\` (generado por \`scripts/dgt-parque-build.mjs\`) contiene 136 meses de datos consumidos por el dashboard:

| Rango                          | Fuente          | Tipo       | Cómo se obtiene                                    |
|--------------------------------|-----------------|------------|----------------------------------------------------|
| 2025-03 → 2026-03 (13 meses)   | ZIP mensual DGT | **Real**   | Conteo directo del snapshot por tipo × CATELECT    |
| 2014-12 → 2025-02 (123 meses)  | MATRABA flows   | **Calc.**  | Retroceso desde ancla 2025-03                      |

**Fórmula del retroceso** (por tipo × CATELECT):
\`\`\`
parque[m-1, tipo, cat] = parque[m, tipo, cat]
                       - matriculaciones[m, tipo, cat, ind_nuevo_usado='N']
                       + bajas[m, tipo, cat, motivo_baja='3']
\`\`\`
Suma de tipos = total global en cada período (invariante verificado). El dashboard marca el límite con línea vertical en 2025-03 (\`DGT real 2025-03 →\`); los períodos calculados se muestran con línea punteada y etiqueta "calculado".

### Caveats conocidos (no son bugs, son datos reales DGT)

- **2024-02**: 749k bajas con motivo=3 en un solo mes (~10× lo normal). Procesamiento batch administrativo real de la DGT. Produce caída visible en no-enchufables.
- **2023-12** y **2025-12**: ~288k bajas en un mes cada uno (también batch administrativo).
- No existen informes oficiales mensuales de parque pre-2025-03 — solo reportes anuales. Por eso el ancla de cálculo arranca en 2025-03.

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

### parque (~38.9M registros — último snapshot)
Stock. Último snapshot oficial del parque activo publicado por DGT. Fuente: ZIP Parque de Vehículos. Cada fila = un vehículo activo en el último snapshot. **Se sobreescribe con cada actualización mensual** (NO acumula histórico — para serie temporal usar \`parque_agregados_mes\`).

| Columna         | Tipo    | Descripción |
|-----------------|---------|-------------|
| periodo         | TEXT    | Snapshot al que pertenece la fila, formato "YYYYMM" |
| subtipo         | TEXT    | Subtipo DGT detallado |
| tipo_grupo      | TEXT    | Agrupación dashboard (turismo, moto, furgoneta_van, camion, etc.) |
| catelect        | TEXT    | Categoría EV (BEV/PHEV/HEV/REEV/FCEV/NO_EV) — OJO nombre distinto a matriculaciones.cat_vehiculo_ev |
| propulsion      | TEXT    | Combustible/propulsión |
| distintivo      | TEXT    | Etiqueta ambiental DGT (0, B, C, ECO, CERO) |
| provincia       | TEXT    | Código provincia (01-52) |
| municipio       | TEXT    | Código municipio INE |
| marca           | TEXT    | Marca |
| modelo          | TEXT    | Modelo |
| fecha_matr      | TEXT    | Fecha de matriculación |
| fec_prim_matr   | TEXT    | Fecha primera matriculación (útil para usados importados) |
| clase_matr      | TEXT    | Clase de matrícula |
| procedencia     | TEXT    | Procedencia del vehículo |
| nuevo_usado     | TEXT    | "N"/"U" (análogo a ind_nuevo_usado de matriculaciones) |
| carroceria      | TEXT    | Tipo de carrocería |

### parque_agregados_mes (agregados por clave, 13 snapshots 202503→202603)
Stock agregado. Pre-calculado para queries rápidas de serie temporal. **PK compuesta (periodo, clave)**.

| Columna | Tipo    | Descripción |
|---------|---------|-------------|
| periodo | TEXT    | Mes del snapshot, formato "YYYYMM" (sin guión — ¡atención!) |
| clave   | TEXT    | Identificador del agregado (ver formato abajo) |
| n       | INTEGER | Cantidad de vehículos del agregado |

**Formato de \`clave\`** (prefijo:valor):
- \`TOTAL\` — total del parque en ese período (1 fila por periodo)
- \`CATELECT:<cat>\` — por categoría EV (BEV, PHEV, HEV, REEV, FCEV, NO_EV)
- \`TIPO:<tipo_grupo>\` — por tipo de vehículo (turismo, moto, furgoneta_van, etc.)
- \`CATELECT_TIPO:<cat>:<tipo>\` — combinación cat × tipo
- \`PROVINCIA:<cod>\` — por provincia INE (01-52)
- \`PROVINCIA_CATELECT:<cod>:<cat>\` — combinación provincia × cat
- \`DISTINTIVO:<etiqueta>\` — por etiqueta ambiental (0, B, C, ECO, CERO)

**Ejemplo** (obtener BEVs activos en último snapshot):
\`\`\`sql
SELECT n FROM parque_agregados_mes
WHERE periodo = (SELECT MAX(periodo) FROM parque_agregados_mes)
  AND clave = 'CATELECT:BEV';
\`\`\`

### parque_meses_procesados
Control de qué snapshots de parque se importaron.

| Columna      | Tipo    | Descripción |
|--------------|---------|-------------|
| periodo      | TEXT PK | "YYYYMM" |
| rows         | INTEGER | Total de vehículos del snapshot |
| procesado_en | TEXT    | Timestamp ISO del import |

### meses_procesados / meses_procesados_bajas
Control de qué meses MATRABA han sido importados.

| Columna        | Tipo    |
|----------------|---------|
| periodo        | TEXT PK | "YYYY-MM" (OJO — formato distinto a parque_meses_procesados) |
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

### Parque activo por CATELECT (último snapshot, dato REAL)
SELECT substr(clave, 10) as cat, n
FROM parque_agregados_mes
WHERE periodo = (SELECT MAX(periodo) FROM parque_agregados_mes)
  AND clave LIKE 'CATELECT:%'
ORDER BY n DESC;

### Serie mensual del parque enchufable (BEV+PHEV, 13 meses reales)
SELECT periodo,
  SUM(CASE WHEN clave = 'CATELECT:BEV'  THEN n ELSE 0 END) as bev,
  SUM(CASE WHEN clave = 'CATELECT:PHEV' THEN n ELSE 0 END) as phev
FROM parque_agregados_mes
WHERE clave IN ('CATELECT:BEV','CATELECT:PHEV')
GROUP BY periodo ORDER BY periodo;

### ⚠️  NO USAR: parque estimado como (matriculaciones − bajas)
Tentador pero INCORRECTO: MATRABA solo cubre desde dic 2014, así que sobreestima ~800k enchufables
(y millones de no-enchufables) porque ignora vehículos matriculados antes de 2014 que todavía están activos.
Para parque activo usar SIEMPRE la tabla \`parque_agregados_mes\` (o la tool \`parque_stats\`).
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
Tablas disponibles:
  matriculaciones (18.6M registros, flujos desde dic 2014)
  bajas (21.9M registros, flujos desde dic 2014)
  parque (último snapshot del parque activo, ~38.9M vehículos — fuente: ZIP DGT)
  parque_agregados_mes (serie mensual agregada del parque desde mar-2025)
  parque_meses_procesados, meses_procesados, meses_procesados_bajas.
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
    {
      name: 'parque_stats',
      description: `Estadísticas del parque activo REAL (fuente: ZIP DGT, NO calculado).
Devuelve: periodos disponibles (snapshots mensuales), último snapshot, total de vehículos,
breakdown por CATELECT (BEV/PHEV/HEV/REEV/FCEV/NO_EV) y por tipo (turismo/moto/etc).
Usar SIEMPRE esta tool antes que query_dgt cuando la pregunta sea sobre parque activo.`,
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'parque_serie_mensual',
      description: `Serie temporal mensual del parque activo (datos REALES DGT).
Devuelve evolución mes a mes del total, enchufables (BEV+PHEV), BEV, PHEV y otros CATELECT
a partir de parque_agregados_mes. Solo disponible desde mar-2025 (inicio de publicación DGT).
Para períodos anteriores, usar matriculaciones - bajas (datos CALCULADOS, marcar visualmente).`,
      inputSchema: {
        type: 'object',
        properties: {
          dimension: {
            type: 'string',
            description: 'Dimensión a desglosar: "catelect" (default), "tipo", "ccaa".',
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

    if (name === 'parque_stats') {
      const database = getDb();
      const meses = database.prepare(`SELECT periodo, rows, procesado_en FROM parque_meses_procesados ORDER BY periodo`).all();
      if (!meses.length) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: 'No hay snapshots de parque importados todavía. Ejecutá: node scripts/dgt-parque-import.mjs --all' }, null, 2) }] };
      }
      const ultimo = meses[meses.length - 1].periodo;

      const total      = database.prepare(`SELECT n FROM parque_agregados_mes WHERE periodo = ? AND clave = 'TOTAL'`).get(ultimo)?.n ?? 0;
      const porCat     = database.prepare(`SELECT substr(clave, 10) as cat, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'CATELECT:%' ORDER BY n DESC`).all(ultimo);
      const porTipo    = database.prepare(`SELECT substr(clave, 6) as tipo, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'TIPO:%' ORDER BY n DESC`).all(ultimo);

      const catMap     = Object.fromEntries(porCat.map(r => [r.cat, r.n]));
      const enchufables = (catMap.BEV ?? 0) + (catMap.PHEV ?? 0);

      const result = {
        fuente: 'ZIP oficial DGT Parque de Vehículos — NO calculado',
        snapshots_disponibles: meses.map(m => m.periodo),
        ultimo_snapshot: ultimo,
        total,
        enchufables,
        no_enchufables: total - enchufables,
        por_catelect: catMap,
        por_tipo: Object.fromEntries(porTipo.map(r => [r.tipo, r.n])),
      };
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    if (name === 'parque_serie_mensual') {
      const database = getDb();
      const dim = (args?.dimension || 'catelect').toLowerCase();

      const meses = database.prepare(`SELECT periodo FROM parque_meses_procesados ORDER BY periodo`).all().map(r => r.periodo);
      if (!meses.length) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: 'No hay snapshots de parque importados todavía.' }, null, 2) }] };
      }

      const series = {};
      for (const p of meses) {
        const total = database.prepare(`SELECT n FROM parque_agregados_mes WHERE periodo = ? AND clave = 'TOTAL'`).get(p)?.n ?? 0;
        let breakdown = {};
        if (dim === 'catelect') {
          const rows = database.prepare(`SELECT substr(clave, 10) as k, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'CATELECT:%'`).all(p);
          breakdown = Object.fromEntries(rows.map(r => [r.k, r.n]));
          breakdown.enchufables = (breakdown.BEV ?? 0) + (breakdown.PHEV ?? 0);
        } else if (dim === 'tipo') {
          const rows = database.prepare(`SELECT substr(clave, 6) as k, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'TIPO:%'`).all(p);
          breakdown = Object.fromEntries(rows.map(r => [r.k, r.n]));
        } else if (dim === 'ccaa') {
          const rows = database.prepare(`SELECT substr(clave, 6) as k, n FROM parque_agregados_mes WHERE periodo = ? AND clave LIKE 'CCAA:%'`).all(p);
          breakdown = Object.fromEntries(rows.map(r => [r.k, r.n]));
        }
        series[p] = { total, ...breakdown };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({
          fuente: 'ZIP oficial DGT Parque de Vehículos — datos reales, no calculados',
          dimension: dim,
          serie: series,
        }, null, 2) }],
      };
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
