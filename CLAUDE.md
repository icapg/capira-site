# Capira — Dashboards de movilidad eléctrica (España)

## Arquitectura DGT (CRÍTICO — NO BORRAR NUNCA SIN PERMISO EXPLÍCITO)

El dashboard de parque activo, matriculaciones y bajas usa tres fuentes OFICIALES DGT
guardadas en un SQLite local de ~12-15 GB. Nunca usamos cifras calculadas donde hay dato real.

### Archivos críticos (NO BORRAR)

- `data/dgt-matriculaciones.db` — SQLite con todas las tablas DGT (~15 GB)
- `data/parque_vehiculos_YYYYMM.zip` — ZIP originales de la DGT (~1.6 GB c/u, desde mar-2025)
- `scripts/dgt-mcp.mjs` — servidor MCP `dgt-specialist` (query_dgt, parque_stats, etc.)
- `scripts/dgt-parque-import.mjs` — importa ZIPs al SQLite
- `scripts/dgt-parque-build.mjs` — genera `data/dgt-parque.json` + TS wrapper
- `scripts/dgt-parque-download.mjs` — descarga ZIPs mensuales de la DGT
- `scripts/dgt-matriculaciones.mjs` — importa microdatos MATRABA (matric + bajas)

### Tablas en SQLite (`data/dgt-matriculaciones.db`)

| Tabla                          | Tipo   | Filas       | Cobertura                 | Fuente                 |
|--------------------------------|--------|-------------|---------------------------|------------------------|
| matriculaciones                | Flujo  | ~18.8M      | dic-2014 → presente       | DGT MATRABA microdatos |
| bajas                          | Flujo  | ~22.1M      | dic-2014 → presente       | DGT MATRABA microdatos |
| parque                         | Stock  | ~38.9M      | último snapshot real      | DGT Parque ZIP         |
| parque_agregados_mes           | Stock  | ~cientos    | desde mar-2025 mensual    | DGT Parque ZIP         |
| meses_procesados               | Meta   |             | control matric            |                        |
| meses_procesados_bajas         | Meta   |             | control bajas             |                        |
| parque_meses_procesados        | Meta   |             | control parque            |                        |

### Regla de oro del dashboard de parque

- **Desde mar-2025 en adelante**: SIEMPRE usar datos reales del ZIP (`parque_agregados_mes`).
- **Antes de mar-2025**: calcular hacia atrás desde el ancla real (matriculaciones − bajas).
  En el gráfico, esos puntos se muestran con línea **punteada** y etiqueta "calculado".
- El campo `fuente: "real" | "calculado"` en `dgtParqueMensual` controla esto.

### Flujo mensual (cron Windows Task Scheduler, día 17)

1. `node scripts/dgt-matriculaciones.mjs --latest`  → importa MATRABA del mes
2. `node scripts/dgt-parque-download.mjs YYYYMM`    → descarga ZIP nuevo
3. `node scripts/dgt-parque-import.mjs YYYYMM`      → importa al SQLite
4. `node scripts/dgt-parque-build.mjs`              → regenera JSON + TS del dashboard
5. `git commit && git push`                         → trigger deploy Vercel

### MCP `dgt-specialist`

Tools disponibles:
- `query_dgt` — SQL read-only contra las tablas
- `get_schema`, `get_periodos`, `get_stats` — documentación y rango
- `diagnose_import` — chequea sanity de un período
- `parque_stats` — breakdown real del último snapshot
- `parque_serie_mensual` — serie temporal real (desde mar-2025)

Registrado en `~/.claude.json` como MCP server. No borrar esa entrada.

## Conceptos de dominio

### Enchufables vs No enchufables

- **Enchufables** = BEV + PHEV (se conectan a la red eléctrica para cargar)
- **No enchufables** = HEV, REEV, FCEV, gasolina, diésel, GLP, GNC, etc.

HEV (híbrido no enchufable tipo Toyota Prius) NO es enchufable, aunque tenga batería.
REEV (range extender) no se conecta a la red directamente.

### Fuentes externas relevantes

- DGT ZIPs: `https://www.dgt.es/microdatos/Parque/parque_vehiculos_YYYYMM.zip`
- DGT MATRABA: `https://www.dgt.es/menusecundario/dgt-en-cifras/matraba-listados/`
- ANFAC: fabricantes (solo turismos nuevos), cifras ligeramente distintas a DGT
- AEDIVE: puntos de recarga + agregados

## Reglas operativas

- **Nunca borrar** archivos de `data/` sin confirmación explícita del usuario.
- **Nunca recalcular** cifras que la DGT ya publica directamente — usar siempre la fuente oficial.
- **Cuando un dato es calculado** (ej: parque pre-mar-2025), marcarlo visualmente en el dashboard
  con línea punteada + etiqueta "calculado".
- El dashboard tiene toggle DGT/ANFAC — por defecto usa DGT.
