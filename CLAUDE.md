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

## Pipeline cat=1 — extracción LLM de licitaciones PLACSP

Para concesiones demaniales de recarga (taxonomía v3 cat=1) hay un pipeline
operativo que toma un slug PLACSP y produce un `extraccion.json` canónico que
se aplica a SQLite y alimenta la ficha `/info/licitaciones/[id]`.

**Spec canónica**: `~/.claude/.../memory/reference_placsp_extraction_spec_v2.md`
(§4.ter A–P es la sección viva de casos edge aprendidos).

**Convención clave**: la extracción la hace una sesión Claude Max leyendo los
PDFs en local. **NO usar `placsp-llm-analyze.mjs`** (cobra API). La única
llamada paga del pipeline es `placsp-llm-vision-ubicaciones.mjs` cuando los
planos del Anexo I son escaneos sin OCR.

### Flujo por slug

```bash
# 1. Descarga UNIVERSAL y RECURSIVA. Baja todos los archivos del expediente
#    (PDF/DOC/DOCX/XLS/XLSX/CSV/TXT/JPG/PNG/TIFF/DWG/…), no solo PDF/ZIP.
#    Cola FIFO escanea cada archivo en busca de URLs embebidas y las sigue.
#    Solo se descartan respuestas HTML/XML.
node scripts/placsp-extract-pdfs.mjs --slug=<N>

# 2. (sesión Claude lee data/placsp-pdfs/<slug>/ y escribe extraccion.json)

# 3. Solo si Anexo I son planos no-OCR (~$0.10–0.40/slug):
node scripts/placsp-llm-vision-ubicaciones.mjs --slug=<N>

# 4. Validar contra reglas declarativas
node scripts/placsp-llm-validate.mjs --slug=<N>

# 5. UPSERT a SQLite (primera pasada — sin coords aún)
node scripts/placsp-llm-apply.mjs --slug=<N>

# 6. Geocodificar ubicaciones nuevas (escribe lat/lng al extraccion.json)
node scripts/placsp-geocode.mjs --slug=<N>

# 7. RE-APPLY tras geocode — CRÍTICO: el geocode escribe al JSON pero NO a
#    SQLite. Sin este paso las coords no llegan al bundle web → mapa vacío.
node scripts/placsp-llm-apply.mjs --slug=<N>

# 8. Refrescar fechas que faltaron en el feed Atom
node scripts/placsp-refresh-slug.mjs --slug=<N>
```

### Cierre del lote

```bash
# 8. Bundle web (data/licitaciones-emov.json)
node scripts/placsp-build-json.mjs

# 9. Auditoría cross-licitación + few-shots regenerados
node scripts/placsp-auditoria.mjs
```

Outputs: `data/licitaciones-auditoria.json`,
`data/licitaciones-criterios-master.json`,
`data/placsp-correcciones-aprendidas.json`,
`data/placsp-criterios-sugerencias.json`.

### Pilotos cerrados (gold standard)

19140288 (Burjassot), 13576641 (Pirotecnia 47 Madrid), 15534510 (Juan Mieg
Madrid UTE), 19217419 (Carabanchel Madrid), 17776623 (Haro), 17794455
(Mancomunitat l'Alacantí). Sus `extraccion.json` viven en
`data/placsp-pdfs/<slug>/` y son referencia obligatoria al cubrir casos
nuevos.

### Reglas no-negociables

- **Descarga universal**: el paso 1 baja TODO archivo del expediente, no solo
  PDF/ZIP. Spec memoria: `reference_placsp_pliego_enlaces_embebidos.md`.
- **Sesión Max para extracción, NO API paga** salvo Vision para planos.
- **NO pushear a Vercel hasta que el usuario lo apruebe explícitamente** —
  todo el trabajo en local hasta confirmación.
- Cualquier caso edge nuevo descubierto al auditar se agrega a §4.ter de la
  spec v2 ANTES de pasar al siguiente lote.
- **Pre-extracción programática + cross-validation** (§4.ter T): los NÚMEROS
  del pliego (cantidades, ponderaciones, conectores, canon, superficies,
  plazos) NO se extraen leyendo PDFs por bloques — los extrae un script
  determinista. Workflow obligatorio: paso 1.5b NUEVO `node scripts/placsp-extraer-datos-base.mjs --slug=<N>`
  que recorre TODO el texto y produce `_datos_base.json` con datos
  estructurados + detección automática de discrepancias internas. El
  applier valida CRUZADO contra ese archivo: si los números del
  extraccion.json divergen sin justificación explícita en
  `_override_datos_base`, ABORTA con exit 3. El LLM solo verifica + redacta
  narrativa; los números los aporta el script. Caso piloto: Breña Baja
  18309278 donde el script detectó automáticamente "5 vs 10 cargadores"
  que la primera extracción del LLM había omitido.
- **KpiBar — omitir tramos con valor 0** (§4.ter S): en las cajas de
  Ubicaciones y Puntos de carga del KpiBar, cuando un tramo de la
  descomposición "obligatorios + existentes + opcionales" tiene valor 0,
  NO mostrarlo. El display "0 + 5" se renderiza como "5". Caso piloto:
  Breña Baja 18309278 con 0 cargadores nuevos exigidos + 5 existentes
  asumidos → mostraba "0 + 5", ahora muestra "5". Mismo principio para
  el sub-texto descriptivo: "0 mínimo del pliego" no aparece cuando
  nuevos=0.
- **Texto cliente-friendly: NO filtrar nombres del schema en strings**
  (§4.ter R). Las notas, descripciones, items y cualquier valor string del
  extraccion.json se renderiza tal cual en la UI para el cliente final
  (CPO/EPC/instaladora). Términos PROHIBIDOS dentro de strings: nombres de
  campos del schema (`num_cargadores_minimo`, `es_existente`, `tipo_hw`,
  `peso_canon_fijo`, `flag_criterios_incompletos`, etc.), referencias a la
  spec (`§4.ter X`, "Caso piloto", "spec v2"), referencias a archivos
  internos (`extraccion.json`, `placsp-*.mjs`), términos de proceso
  ("applier", "validador", "extracción inicial"). En lugar de "NO suma al
  num_cargadores_minimo del pliego (88 nuevos)" usar "NO se cuenta dentro
  de los 88 puntos nuevos exigidos por el pliego". Verificación automática
  con walk recursivo del JSON antes de cerrar.
- **Lectura COMPLETA del pliego — script obligatorio + suma literal** (§4.ter Q):
  ANTES de empezar a escribir el extraccion.json, ejecutar
  `node scripts/placsp-cobertura-pliego.mjs --slug=<N>` que genera
  `_cobertura.txt` con un índice exhaustivo de qué hay en cada documento +
  banderas críticas automáticas + checklist obligatorio. La sesión Claude
  DEBE leer ese reporte primero y responder explícitamente a su checklist
  antes de cerrar la extracción. Patrones léxicos detectados automáticamente:
  Anexos I/II/III/IV, AUTOEVALUACIÓN/PUNTUACIÓN OFERTA (Anexo I con criterios
  extra), Q&A oficiales, declaración desierta, ponderaciones, fórmulas, etc.
  **Pliegos con errata (suma ≠ 100): NO normalizar los pesos top-level. Preservar
  la suma LITERAL del pliego** y marcar `flag_criterios_incompletos: true`. El
  validador acepta la suma ≠ 100 cuando ese flag está marcado. La UI muestra la
  suma real + nota visible "Pliego con errata interna". Caso piloto: Breña Baja
  18309278 con suma 120 (Anexo I: canon 70 + Ampliación 30 + GdO 20 — el script
  habría detectado el Anexo I antes de que perdiéramos los 30 pts en la primera
  extracción).
- **`num_cargadores_opcional_extra` = TRUE siempre que el pliego permita
  ampliar puntos de carga, puntuable o no** (§4.ter A, refinada sesión
  2026-04-27). El KpiBar de Puntos de carga muestra "+ X" para reflejar
  el techo físico potencial (existentes + obligatorios + ampliables), NO
  qué da puntos en la valoración. Patrones disparadores: criterios
  puntuables de "incremento de puntos" + autorizaciones del tipo "el
  adjudicatario podrá realizar mejoras e inversiones con recursos
  propios". Caso piloto: Breña Baja 18309278 — el Anexo I del PCAP
  incluye criterio "Ampliación de la red" (30 pts) que la cláusula 8
  articulada NO lista (errata interna, suma Anexo I = 120).
- **Ubicaciones y puntos de carga — descomposición en 3 tramos × 2 dimensiones** (§4.ter M):
  son métricas INDEPENDIENTES (1 ubicación contiene N puntos de carga). Cada
  ubicación se clasifica por sus flags `es_existente`/`es_opcional` en uno de
  3 tramos: existentes asumidas, nuevas obligatorias, nuevas opcionales del
  cupo. Casos:
  - A) número fijo único (Burjassot): N ubic × X tomas. Render "5" / "10".
  - B) con existentes asumidas (Mancomunitat): M nuevas + N existentes.
    Render "34 + 12" / "68 + 24". `num_cargadores_minimo` = solo M nuevas.
  - C) techo cerrado (Alcorcón "no superior a 25" + "mín 3/distrito"): M
    obligatorias + (N−M) opcionales modeladas. Render "12 + 13" / "24 + 26".
    `num_cargadores_minimo` = solo M obligatorias (NO suma opcionales).
  - D) apertura sin techo (criterio "incremento" sin máximo): solo M
    obligatorias modeladas + flag `num_cargadores_opcional_extra: true`. La
    UI infiere "+ X" del flag.
  Nunca dejar `ubicaciones[]` vacío. Nunca mezclar ubicaciones con puntos
  en un mismo número. Si existe documento sugerido del Ayuntamiento, cargar
  las direcciones reales en las ubicaciones obligatorias / opcionales según
  alcancen, marcar con `es_sugerida: true`.
- **Explicaciones extendidas para modales** (§4.ter P): dos campos top-level
  alimentan botones "📖 ... explicado →" en la ficha:
  - `hardware_especificaciones[]` (array): empieza SIEMPRE con una sección
    `caracter: "informativo"` que es el MARCO GENERAL (qué es obligatorio
    para todos vs. qué decide el licitador), seguida de N tipologías con
    `caracter: "alternativa"` (a elegir, badge ámbar), `"obligatorio"` (rojo)
    o `"opcional"` (verde, mejora puntuable). NUNCA marcar varias tipologías
    como `obligatorio` cuando son alternativas — engaña al lector. Caso
    piloto: Alcorcón 19129858 (rápida/semirrápida/lenta = 3 alternativas).
  - `canon_explicacion` (objeto): cuando el cálculo del canon NO es trivial
    (€/m², mixto, fórmulas con referencia legal, IPC, etc.). Si el canon es
    un único €/año fijo, omitir.
  Ambos comparten estructura `{ titulo, descripcion_breve?, caracter?, items[] }`.
  **Tono narrativo obligatorio**: items son párrafos completos de prosa
  (2-4 frases), no bullets de specs secas. Empezar por el "para qué" antes
  que la spec técnica. Marcar explícitamente lo que el pliego NO impone.
  Cerrar con consecuencias prácticas (riesgos, trade-offs).
  El botón solo aparece si el campo tiene contenido (no rompe slugs viejos).
- **Criterios de adjudicación: 2 arrays separados + suma debe llegar a 100** (§4.ter O):
  cuando el pliego separa Sobre 2 (juicio de valor) y Sobre 3 (cifras /
  fórmulas), emitir SIEMPRE los dos arrays: `mejoras_puntuables[]` (Sobre 3)
  y `criterios_juicio_valor[]` (Sobre 2). La UI tiene dos tablas dedicadas;
  si solo se llena uno, la mitad de los puntos queda invisible. Después de
  emitir ambos: **verificar que Σ(puntos_max) llegue al máximo del pliego**
  (típicamente 100). Si NO llega, buscar exhaustivamente en PCAP +
  anuncio HTML + notas/aclaraciones por criterios omitidos. Si tras la
  búsqueda la suma sigue sin cuadrar, marcar `flag_criterios_incompletos:
  true` + nota explícita en `notas_pliego` (validador y auditoría flagean
  automáticamente). NUNCA inventar puntos para forzar la suma.
  Excepción legítima: pliegos antiguos / municipios pequeños (Outeiro de Rei
  6604680) con escala bruta no-100 — el extractor normaliza pesos top-level
  a 100 % y el validador lo acepta.
  **Aplica en DOS niveles**: (A) `Σ mejoras_puntuables + Σ criterios_juicio_valor
  ≈ 100` (alimenta tablas de la ficha), Y (B) `Σ sub-pesos económicos =
  peso_criterios_economicos` + `Σ sub-pesos técnicos = peso_criterios_tecnicos`
  (alimentan el DONUT). Sub-pesos económicos: `peso_canon_fijo`,
  `peso_canon_variable`, `peso_otros_economicos` (criterios cifras no-canon
  como gratuidades, descuentos, abonos a residentes). Sub-pesos técnicos:
  `peso_construccion_tiempo`, `peso_proyecto_tecnico`, `peso_mas_hw_potencia`,
  `peso_mas_ubicaciones`, `peso_otros`. Si un nivel cubre 100 pero el otro
  no, el donut muestra menos del 100% — es señal de que falta clasificar
  criterios en sub-pesos. Validador y auditor flagean automáticamente.
- **Canon basado en €/m² del valor del suelo** (§4.ter N): patrón frecuente
  en concesiones patrimoniales municipales. El canon NO es un €/año fijo —
  se calcula como `pct × valor_suelo_eur_m2_ano × superficie_m2` por
  ubicación. Detectar patrones en el pliego ("5 % a aplicar al valor",
  "263,06 €/m²/año", "informe de valoración urbanística"). Emitir 5
  campos top-level: `canon_eur_m2_ano`, `valor_suelo_eur_m2_ano`,
  `canon_pct_valor_suelo`, `superficie_minima_m2`, `superficie_maxima_m2`.
  Y poblar `canon_por_ubicacion_anual` (= canon_eur_m2_ano × superficie_min)
  y `canon_minimo_anual` (= canon_por_ubicacion × N obligatorias) para
  retrocompatibilidad y benchmarks. Caso piloto: Alcorcón 19129858
  (5 % × 263,06 €/m²/año × [7,4..22,20 m²]).

## Reglas operativas

- **Nunca borrar** archivos de `data/` sin confirmación explícita del usuario.
- **Nunca recalcular** cifras que la DGT ya publica directamente — usar siempre la fuente oficial.
- **Cuando un dato es calculado** (ej: parque pre-mar-2025), marcarlo visualmente en el dashboard
  con línea punteada + etiqueta "calculado".
- El dashboard tiene toggle DGT/ANFAC — por defecto usa DGT.
