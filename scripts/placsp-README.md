# PLACSP — Base de datos de licitaciones públicas (España)

Pipeline completo para ingerir, clasificar y analizar licitaciones públicas
españolas con foco en **e-movilidad**. Replica el patrón de `dgt-specialist`:
SQLite local grande, JSONs agregados chicos commiteados al repo, MCP server
para análisis asistido.

---

## 1. Qué resuelve este proyecto

Capira necesita ofrecer a sus clientes (CPOs, fabricantes, instaladoras,
consultoras) un **sistema de inteligencia sobre licitaciones públicas de
e-movilidad en España**:

1. **Monitor** — radar de licitaciones nuevas (alertas, próxima fase).
2. **Análisis individual** — dada una licitación: pliego, criterios de
   valoración, importe, plazos, ¿le conviene al cliente?
3. **Inteligencia competitiva** — quién gana, quiénes se presentan, qué
   ofertan, precios, patrones de adjudicación por segmento y provincia.

La ambición es cubrir **100 % de licitaciones públicas de e-movilidad en
España** y clasificarlas por taxonomía propia.

---

## 2. Fuente de datos

**Plataforma de Contratación del Sector Público (PLACSP)** — portal oficial
estatal. API de datos abiertos vía Atom/XML (UBL/CODICE):

```
Base:  https://contrataciondelestado.es/sindicacion/sindicacion_643/

Mensuales: licitacionesPerfilesContratanteCompleto3_YYYYMM.zip     (~80-180 MB/mes)
Cabeza:    licitacionesPerfilesContratanteCompleto3.atom            (delta, se actualiza cada día)
```

Cada ZIP contiene ~50-100 archivos `.atom`, cada uno con ~500-800 `<entry>`
representando una licitación. Namespace UBL/CODICE (`cbc:`, `cac:`,
`cac-place-ext:`).

**Cobertura de PLACSP**: los órganos contratantes del Estado + la mayoría
de CCAA y ayuntamientos publican aquí. Hay ~1-2 % de licitaciones que
aparecen SOLO en portales autonómicos (contractaciopublica.cat,
contratacion.euskadi.eus, pdc_sirec Junta Andalucía,
contratos-publicos.comunidad.madrid) o en TED (Tenders Electronic Daily de
la UE para contratos grandes). **No cubrimos TED ni portales autonómicos
todavía** — roadmap fase 2.

---

## 3. Arquitectura de datos

Copia exacta del patrón `dgt-specialist`:

```
capira-site/
├── data/
│   ├── placsp-raw/                ← ZIPs mensuales (gitignore, ~8.5 GB)
│   ├── licitaciones.db            ← SQLite local (gitignore, ~3.1 GB)
│   ├── placsp-work/               ← extracción temporal (gitignore)
│   ├── licitaciones-emov.json     ← AGREGADO commiteado (<3 MB, pendiente)
│   └── licitaciones-cat-summary.json ← AGREGADO commiteado (pendiente)
│
├── scripts/
│   ├── placsp-schema.sql          ← schema SQLite
│   ├── placsp-download.mjs        ← descarga ZIPs
│   ├── placsp-import.mjs          ← parsea XML y upsert en SQLite
│   ├── placsp-classify.mjs        ← aplica taxonomía v3
│   ├── placsp-enrich-municipios.mjs ← cruza con INE (opcional)
│   ├── placsp-build-benchmarks.mjs  ← regenera tabla benchmarks_cpo
│   ├── placsp-mcp.mjs             ← MCP server `placsp-specialist`
│   ├── placsp-README.md           ← este archivo
│   ├── _validate_aedive.mjs       ← script de validación contra AEDIVE CSV
│   ├── _validate_noemov.mjs       ← análisis de falsos negativos
│   └── _inspect_cat6.mjs          ← inspección de cat 6
│
└── app/lib/insights/
    └── licitaciones-data.ts       ← adaptador de JSON (pendiente)
```

**Costo operacional: 0 €.** Sólo disco local + backup Google Drive. Vercel
sirve solo los JSONs agregados (<3 MB total).

---

## 4. Esquema SQLite

Ver `placsp-schema.sql`. 8 tablas principales:

### `licitaciones` (1.020.226 filas) — tabla central
Una fila por expediente PLACSP. Clave: `id` (URI estable del feed Atom,
distinta del `deeplink` público).

**Campos clave**:
- `expediente`, `uuid_ted`, `deeplink` — identificación
- `organo_nombre`, `organo_nif` — órgano contratante
- `tipo_contrato` — Suministro/Obras/Servicios/Mixto/Concesión (derivado
  de `TypeCode`). Usar `tipo_contrato_codigo` (raw) si se necesita el
  código crudo.
- `importe_estimado`, `importe_base`, `importe_adjudicado`
- `provincia_codigo`, `provincia_nombre`, `ciudad`, `ciudad_ine`, `poblacion_ine`
- `fecha_publicacion`, `fecha_limite_ofertas`, `fecha_adjudicacion`,
  `fecha_formalizacion`, `fecha_ultima_actualizacion`
- `dias_aviso` — derivado: `fecha_limite - fecha_publicacion`
- `estado_actual` — enum PUB/EV/ADJ/RES/ANUL/PRE
- `financiacion_ue` (bool), `programa_ue` (texto: MRR/NextGen/DUS5000/…)

**Campos e-movilidad** (poblados por `placsp-classify.mjs`):
- `tiene_infra_recarga` (bool) — presencia de cargador físico
- `categoria_emov` — enum "1" … "11" | "no_emov"
- `subcategoria` — texto libre por cat
- `confianza_clasificacion` (0..1)
- `tags` — JSON array (next_generation, dus5000, pstd, moves_iii, aena_pipra)

**Campos de concesión** (cat=1, mayoritariamente nullable hasta fase 2 LLM):
- `plazo_concesion_anos`, `renovacion_anos`, `tipo_retribucion`
- `canon_minimo_anual`, `canon_anual_ofertado_ganador`, `canon_por_cargador_ofertado`
- `canon_fuente` — enum: pdf_resolucion / aedive_manual / inferido_base_pliego / null
- `num_ubicaciones`, `num_cargadores_ac`, `num_cargadores_dc`,
  `num_cargadores_dc_plus`, `num_cargadores_hpc`, `num_cargadores_total`
- `quality_score_ubicacion` — poor/fair/good/very_good/excellent (derivado
  de población INE)

### `licitacion_cpvs` (1.642.968) — many-to-many
CPV codes (Common Procurement Vocabulary EU) por licitación.

### `licitadores` (3.208.318)
Bidders + ganadores. **Importante**: hoy solo están los ganadores extraídos
del `TenderResult` del XML (rol = `adjudicataria`). Los **participantes no
ganadores** y **ofertas económicas específicas** están en los PDFs de actas
de apertura → fase 2 LLM.

### `empresas` — maestro bottom-up
Tabla de agregación por NIF. Se popula cuando haya más data de licitadores.

### `documentos`
Pliegos administrativos, pliegos técnicos, anuncios, actas de apertura,
resoluciones de adjudicación. Hoy vacía (URLs en el XML pero no
descargadas). Fase 2: descarga + parseo LLM para extraer canon ganador,
criterios, etc.

### `snapshots_estado` (2.173.037)
Historial PUB → EV → ADJ → RES de cada expediente. Útil para reconstruir
timeline.

### `ingest_log`
Control de ficheros Atom ingestados. Permite import idempotente.

### `benchmarks_cpo` (vacía hasta que se poblen canones)
Vista materializada del mercado de concesiones demaniales. Buckets:
`segmento_hw × tamano_municipio × provincia × anio × tipo_retribucion`.
Métricas: p25/p50/p75/p90 del canon anual por cargador ofertado por el
ganador. Fuente: `licitadores` + `licitaciones` con cat=1 y estado
adjudicado. **No se usan benchmarks externos (POWY u otro CPO individual)** —
el benchmark ES el mercado observado.

---

## 5. Taxonomía v3 (11 categorías de e-movilidad)

Precedencia top-down en `placsp-classify.mjs`: la primera categoría que
matchea gana.

| # | Nombre | Ejemplos | N actual |
|---|---|---|---|
| **1** | **Concesión demanial / arrendamiento para recarga** | "Concesión demanial para instalación, mantenimiento y explotación de red de recarga VE en Madrid" | 172 |
| **2** | **Obra e instalación de infraestructura de recarga** | "Obra para instalación de 8 puntos de recarga en aparcamiento" | 747 |
| **3** | **Ingeniería y proyectos de recarga** | "Redacción proyecto instalación puntos de recarga" | 12 |
| **4** | **Suministro de cargadores / hardware** | "Suministro de 4 cargadores eléctricos para dependencias municipales" | 384 |
| **5** | **Software y plataformas de gestión** | "Plataforma verificación y autorización de acceso a infraestructura de recarga" (BSM Barcelona) | 12 |
| **6** | **Compra / renting de VE** (6a turismos/furgonetas, 6b camiones, 6c maquinaria) | "Suministro de 10 furgonetas eléctricas" | 2.373 |
| **7** | **Bus eléctrico / autobús híbrido** | "Adquisición de 8 autobuses eléctricos Clase II" | 167 |
| **8** | **Gestión y mantenimiento red de recarga** | "Servicio mantenimiento puntos de recarga BSM" | 31 |
| **9** | **Micromovilidad eléctrica** | "Suministro de 20 bicicletas eléctricas con estación de recarga" | 134 |
| **10** | **Mixto FV + recarga** | "Pérgola fotovoltaica con puntos de recarga en aparcamiento" | 117 |
| **11** | **Mantenimiento flota eléctrica** | "Servicio reparación flota VE Mercabilbao" | 80 |
| **no_emov** | Fuera del universo | (todo lo demás: compras de vehículos genéricos diesel, cargadores de baterías sin VE, mantenimiento ITV, etc.) | 1.015.997 |

**Total e-mov: 4.229 licitaciones en 100 meses** (2018-01 → 2026-04), ~0.41 %
del total PLACSP.

### Reglas de clasificación (resumidas)

1. **Exclusiones hard primero**:
   - Recarga de dispositivos móviles/teléfonos → `no_emov`
   - Recarga de tóner/cartuchos → `no_emov`
   - Recarga de extintores → `no_emov`
   - Cargador de baterías genérico sin VE → `no_emov`
   - Cargadores de carretillas / apiladores → `no_emov`
   - Camión basura (CPV 34144511/34144512) **solo si menciona "eléctrico"
     o "biogas/gnc"** → si no, `no_emov`

2. **Regla anti-falso-positivo CPV 34144900**: el CPV "vehículos eléctricos"
   es mal usado por muchos órganos para cualquier vehículo municipal.
   Requiere confirmación por keyword (eléctric / híbrid / phev / bev /
   enchufable / 100% / cero emisiones / plug-in).

3. **Precedencia**: cat 1 → 2 → 3 → 10 → 4 → 5 → 7 → 11 → 8 → 9 → 6. La
   cat 6 es fallback porque es la más genérica.

### Validación contra AEDIVE (ground truth humano)

Cruce contra CSV curado manualmente por AEDIVE con 946 licitaciones
españolas con link PLACSP:

- **Recall**: 98.3 % (930 / 946 matcheadas en nuestra DB)
- **Falsos negativos críticos**:
  - Cargadores=SI (AEDIVE) mal clasificados como no_emov: **0**
  - Concesiones demaniales (AEDIVE) mal clasificadas: **0**
- **44 falsos negativos menores**: vehículos con fraseos no estándar
  ("motorización eléctrica", "carros eléctricos de golf", etc.) —
  diminishing returns refinando más.

---

## 6. Flujo de trabajo

```bash
cd capira-site

# 1. Descarga ZIPs mensuales (idempotente, resume)
node scripts/placsp-download.mjs
node scripts/placsp-download.mjs --from=2024-01 --to=2024-12
node scripts/placsp-download.mjs --only-head   # solo el atom-cabeza (delta diaria)

# 2. Importa a SQLite (idempotente por id PLACSP)
node scripts/placsp-import.mjs
node scripts/placsp-import.mjs --month=202604

# 3. Clasifica e-movilidad (taxonomía v3)
node scripts/placsp-classify.mjs
node scripts/placsp-classify.mjs --only-new     # solo filas sin categoria_emov
node scripts/placsp-classify.mjs --id=<uri>     # debug una específica

# 4. (Opcional) Enriquece con INE
node scripts/placsp-enrich-municipios.mjs      # requiere data/ine-municipios.json

# 5. (Opcional) Regenera benchmarks (vacío hasta que haya canon data)
node scripts/placsp-build-benchmarks.mjs

# 6. Ver estado
node -e "const db = require('better-sqlite3')('data/licitaciones.db', {readonly:true}); console.log(db.prepare('SELECT categoria_emov, COUNT(*) AS n FROM licitaciones GROUP BY categoria_emov').all())"
```

### Delta diaria (cuando se automatice)

```bash
node scripts/placsp-download.mjs --only-head
node scripts/placsp-import.mjs --only-head
node scripts/placsp-classify.mjs --only-new
```

---

## 7. MCP Server `placsp-specialist`

Registrado en `~/.claude.json` como:
```json
{ "command": "node", "args": ["C:/Users/ignacio.capurro/capira-site/scripts/placsp-mcp.mjs"] }
```

Ver archivo `placsp-mcp.mjs` para lista completa de herramientas. Resumen:

| Tool | Para qué |
|---|---|
| `get_schema` | Devuelve el schema + doc completo del dominio |
| `query_sql` | Ejecuta SELECT/WITH arbitrario (read-only, max 1000 filas) |
| `search_licitaciones` | Búsqueda por keyword + filtros (categoria, estado, provincia, fechas) |
| `benchmark_canon` | Percentiles del canon ofertado ganador por bucket |
| `ranking_adjudicatarios` | Top N empresas por N° ganadas / importe total |
| `get_licitacion` | Detalle completo de una licitación (con licitadores, documentos, snapshots) |
| `get_stats` | Stats globales: total por categoría, estado, año |

---

## 8. Estadísticas clave del dataset (2018-01 → 2026-04)

```
licitaciones:        1.020.226
licitacion_cpvs:     1.642.968
licitadores:         3.208.318
snapshots_estado:    2.173.037
ingested_atom_files: ~6.000
DB size:             ~3.1 GB
```

### Por estado
```
RES    ~60 %  resuelta/formalizada
EV     ~15 %  en evaluación
PUB    ~12 %  publicada (ofertas abiertas)
ADJ    ~8 %   adjudicada, pendiente formalización
ANUL   ~3 %   anulada
PRE    ~2 %   preliminar
```

### Por tipo de contrato
```
Servicios    ~35 %
Suministro   ~30 %
Obras        ~25 %
Concesión    ~2 %
Mixto        ~5 %
otros        ~3 %
```

---

## 9. Roadmap y estado actual

### ✅ Hecho
- Pipeline completo ETL: download + import + classify
- Schema SQLite con todas las tablas para escalar a fases siguientes
- Taxonomía v3 calibrada con validación AEDIVE (recall 98.3 %)
- MCP server `placsp-specialist` registrado
- Backfill 2018-01 → 2026-04 completo (1 M licitaciones, 4.229 e-mov)

### ⏳ En curso / próximo
- **UI del dashboard** `/info/licitaciones` en capira-site
- **`licitaciones-emov.json`** agregado para consumo web (~3 MB)

### Fase 2 (LLM)
- Parsear PDFs de pliegos/actas/resoluciones para poblar:
  - `canon_anual_ofertado_ganador`, `canon_por_cargador_ofertado`
  - `num_cargadores_ac/dc/dc_plus/hpc`, `num_ubicaciones`
  - `plazo_concesion_anos`, `tipo_retribucion`
  - Licitadores no ganadores + ofertas económicas
- Benchmark por bucket real (p25/p50/p75/p90) sobre `benchmarks_cpo`

### Fase 3 (cobertura)
- Sumar **TED** (licitaciones UE >umbral europeo)
- Sumar portales autonómicos (Catalunya, Euskadi, Andalucía, Madrid)
- Cerrar la brecha del ~2-5 % que no pasa por PLACSP

### Fase 4 (monitor)
- Cron diario con Atom "cabeza" → detecta licitaciones nuevas
- Alertas por email/Slack cuando hay nueva e-mov que matchee criterios
  del cliente

### Fase 5 (análisis LLM por licitación)
- Dado un deeplink PLACSP, sistema que lee el pliego y responde:
  - "¿Le conviene a mi cliente X?"
  - Criterios de valoración resumidos
  - Riesgos detectados (plazos, solvencia, penalizaciones)
  - Competidores probables (basado en histórico del adjudicatario dominante
    en bucket similar)

---

## 10. Decisiones de diseño importantes (no cambiar sin razón)

1. **SQLite local, no Supabase.** Igual que dgt-specialist. Plan gratis,
   sin bandwidth cost.
2. **JSONs agregados al repo, no la DB.** Vercel sirve solo lo chico.
3. **Benchmark CPO ES el mercado, no un CPO individual.** Nada de
   "benchmark POWY" ni valores hardcodeados. Se calcula desde
   `licitadores` con canon conocido.
4. **CPV 34144900 no es señal suficiente por sí solo** para cat 6 — mal
   usado por muchos órganos. Requiere confirmación por keyword.
5. **Exclusión explícita de camión basura no-eléctrico** — los CPV
   34144511/34144512 requieren mención de "eléctrico" o "biogas/gnc"
   para entrar a cat 6b.
6. **El deeplink PLACSP contiene `idEvl`**, que es el identificador
   estable visible al usuario. El `id` de nuestra DB es la URI del feed
   Atom, distinta. Al cruzar con fuentes externas (AEDIVE CSV), **cruzar
   por idEvl extraído del deeplink**.
7. **El import es idempotente** por `id`. Se puede re-ejecutar sin miedo.
8. **ZIPs mensuales se guardan tras parsear** (~8.5 GB). Vale la pena por
   si hay que re-parsear tras cambios de schema.

---

## 11. Fuentes de ground truth y referencias externas

- **AEDIVE** (Asociación Empresarial de Vehículo Eléctrico) publica un
  anuario y mantiene un tracker manual curado de licitaciones de e-mov en
  España. Sus CSVs están en `Downloads/` locales del usuario, pero no se
  commitean. Se usan para validación puntual, no como fuente de datos
  primaria.
- **POWY** (CPO español) comparte material interno con Capira para
  benchmarking. **NO usar sus valores como referencia** — el benchmark es
  el mercado observado.
- **CPV (Common Procurement Vocabulary)**: taxonomía oficial UE. Ver
  https://simap.ted.europa.eu/cpv

---

## 12. Cuándo regenerar data

- **Cada mes**: descargar el ZIP del mes nuevo + import + classify.
- **Cuando cambie la taxonomía**: `node scripts/placsp-classify.mjs` sobre
  toda la DB (~1 min).
- **Cuando haya nueva data en PDFs de pliegos**: regenerar
  `benchmarks_cpo` con `placsp-build-benchmarks.mjs`.
- **Cuando se agregue una fuente secundaria** (TED, autonómicos):
  reestructurar `ingest_log` con columna `fuente` y re-ingerir.
