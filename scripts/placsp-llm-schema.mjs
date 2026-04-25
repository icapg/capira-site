/**
 * placsp-llm-schema.mjs
 *
 * Schema canónico del extraccion.json producido por LLM para licitaciones PLACSP.
 *
 * Lo consumen:
 *   - placsp-llm-analyze.mjs   (arma el prompt para la API de Anthropic)
 *   - placsp-llm-validate.mjs  (verifica contra reglas declarativas)
 *   - sesiones Claude (free-tier) que leen los PDFs y escriben el JSON manualmente
 *
 * Spec completa: ~/.claude/.../memory/reference_placsp_extraction_spec_v2.md
 *
 * Si modificás campos acá, actualizá también:
 *   - placsp-llm-apply.mjs (UPSERT a DB)
 *   - placsp-build-json.mjs (lectura DB → bundle)
 *   - app/lib/insights/licitaciones-data.ts (types TS)
 *   - app/info/licitaciones/[id]/page.tsx (consumo UI)
 *   - el spec memory file
 */

export const SCHEMA_VERSION = 'v2';

// ─── Dominios cerrados (enums) ──────────────────────────────────────────
export const ENUMS = {
  tipo_adjudicacion:    ['subasta', 'concurso', 'concurso_multicriterio', 'acuerdo_marco'],
  idioma_pliego:        ['es', 'ca', 'gl', 'eu', 'mixto'],
  tipo_inicio_concesion:['adjudicacion', 'formalizacion', 'puesta_en_marcha'],
  tipo_retribucion:     ['canon_fijo', 'canon_variable_pct', 'mixto', 'contraprestacion', 'compra', 'venta_energia_usuario'],
  tecnologia_requerida: ['AC', 'DC', 'HPC', 'mixto'],
  rol_licitador:        ['adjudicataria', 'participante', 'excluida'],
  tipo_hw:              ['AC', 'DC', 'HPC', 'mixto'],
  tipo_mejora:          ['descuento', 'app', 'ampliacion_hw', 'sostenibilidad', 'mantenimiento', 'otro'],
};

// ─── Reglas que aplica el validador ─────────────────────────────────────
export const VALIDATION_RULES = {
  // Tolerancia para sumas de pesos / puntuaciones
  toleranciaPct:    1.0,
  toleranciaPuntos: 0.5,

  // Cat=1: al menos uno de estos campos no-null
  cat1RequiredAtLeastOne: [
    'plazo_concesion_anos',
    'tipo_retribucion',
    'num_cargadores_minimo',
    'num_ubicaciones', // viene del XML, pero si está null el LLM debería inferirlo de ubicaciones[]
  ],

  // Comunes a todas las cats: deben estar presentes (warning si null)
  comunesEsperados: ['tipo_adjudicacion', 'idioma_pliego'],

  // Si tipo_retribucion === 'mixto', debe haber componente fijo y variable
  mixtoFijoCampos:    ['canon_mix_fijo_anual', 'canon_minimo_anual', 'canon_mix_fijo_por_cargador'],
  mixtoVariableCampos:['canon_variable_eur_kwh', 'canon_variable_pct', 'canon_mix_var_pct', 'canon_mix_var_eur_kwh'],
};

// ─── Texto del schema (lo embebe el prompt enviado al LLM) ──────────────
export function buildSchemaText(isConcesion) {
  return `
Devuelve SOLO un objeto JSON con esta estructura. Si un campo no aparece
en los pliegos/actas, usa null. NO inventes. Si hay contradicción entre PDFs,
usa el más autoritativo (resolución > acta de propuesta > pliego > anuncio) y
añade una línea en "notas_pliego" o "notas_adjudicacion" según corresponda.

Todos los importes en EUR sin IVA cuando sea posible. Porcentajes 0..100.
Fechas en YYYY-MM-DD. Booleanos true/false.

{
  "_modelo": "<string libre con id de modelo o sesión>",

  "criterios_valoracion": {
    "economicos": [{ "peso": <0..100>, "formula": "<string|null>" }],
    "tecnicos":   [{ "peso": <0..100>, "descripcion": "<string>" }]
  },

  // Pesos top-level (suman 100)
  "peso_criterios_economicos": <0..100|null>,
  "peso_criterios_tecnicos":   <0..100|null>,

  // Sub-pesos económicos (suman peso_criterios_economicos)
  "peso_canon_fijo":           <0..100|null>,
  "peso_canon_variable":       <0..100|null>,

  // Sub-pesos técnicos (suman peso_criterios_tecnicos)
  "peso_construccion_tiempo":  <0..100|null>,
  "peso_proyecto_tecnico":     <0..100|null>,
  "peso_mas_hw_potencia":      <0..100|null>,
  "peso_mas_ubicaciones":      <0..100|null>,
  "peso_otros":                <0..100|null>,

  "mejoras_puntuables": [
    {
      "descripcion": "<string>",
      "puntos_max":  <number|null>,
      "tipo":        "${ENUMS.tipo_mejora.join('"|"')}"|null
    }
  ],

  "tipo_adjudicacion": "${ENUMS.tipo_adjudicacion.join('"|"')}"|null,
  "idioma_pliego":     "${ENUMS.idioma_pliego.join('"|"')}"|null,

  "garantias": {
    "provisional_eur":     <number|null>,
    "provisional_pct":     <0..100|null>,
    "provisional_exigida": <bool|null>,
    "definitiva_eur":      <number|null>,
    "definitiva_pct":      <0..100|null>,
    "definitiva_base":     "canon_total_15_anos"|"valor_estimado_15_anos"|"importe_base"|"otra"|<string|null>
  },

  "requisitos": {
    "solvencia_economica": [{ "tipo": "<string>", "descripcion": "<string>", "umbral": "<string|null>", "critico": <bool> }],
    "solvencia_tecnica":   [{ "tipo": "<string>", "descripcion": "<string>", "umbral": "<string|null>", "critico": <bool> }],
    "adicionales":         [{ "tipo": "<string>", "descripcion": "<string>", "umbral": "<string|null>", "critico": <bool> }]
  },
${isConcesion ? `
  // ── Bloque cat=1 (concesión demanial) ─────────────────────────────────
  "fecha_inicio_concesion":          "YYYY-MM-DD"|null,
  "tipo_inicio_concesion":           "${ENUMS.tipo_inicio_concesion.join('"|"')}"|null,
  "plazo_construccion_meses":        <number|null>,
  "potencia_disponible_kw":          <number|null>,
  "potencia_disponible_garantizada": <bool|null>,
  "tecnologia_requerida":            "${ENUMS.tecnologia_requerida.join('"|"')}"|null,
  "num_cargadores_minimo":           <number|null>,
  "num_cargadores_opcional_extra":   <bool|null>,
  "potencia_minima_por_cargador_kw": <number|null>,
  "potencia_opcional_subible":       <bool|null>,

  "plazo_concesion_anos":  <number|null>,
  "renovacion_anos":       <number|null>,
  "tipo_retribucion":      "${ENUMS.tipo_retribucion.join('"|"')}"|null,

  // CANON DEL PLIEGO (mínimos exigidos por la Administración):
  "canon_minimo_anual":          <number|null>,
  "canon_por_ubicacion_anual":   <number|null>,
  "canon_variable_pct":          <number|null>,
  "canon_variable_eur_kwh":      <number|null>,
  "canon_mix_fijo_anual":        <number|null>,
  "canon_mix_var_pct":           <number|null>,
  "canon_mix_var_eur_kwh":       <number|null>,
  "canon_mix_fijo_por_cargador": <number|null>,

  // CANON OFERTADO POR EL GANADOR (resumen — el detalle por licitador va abajo):
  "canon_ganador":      <number|null>,    // EUR/año del adjudicatario
  "canon_por_cargador": <number|null>,    // EUR/HW/año del adjudicatario, si aplica

  "ubicaciones": [
    {
      "nombre":                  "<string>",
      "direccion":               "<string|null>",
      "municipio":               "<string|null>",
      "latitud":                 <number|null>,
      "longitud":                <number|null>,
      "google_maps_url":         "<string|null>",
      "plazas":                  <number|null>,
      "num_cargadores_ac":       <number|null>,
      "num_cargadores_dc":       <number|null>,
      "num_cargadores_dc_plus":  <number|null>,
      "num_cargadores_hpc":      <number|null>,
      "num_cargadores_total":    <number|null>,
      "potencia_total_kw":       <number|null>,
      "potencia_por_cargador_kw":<number|null>,
      "tipo_hw":                 "${ENUMS.tipo_hw.join('"|"')}"|null,
      "plazo_pem_meses":         <number|null>,
      "notas":                   "<string|null>",
      "es_opcional":             <bool|null>
    }
  ],
` : ''}
  "licitadores": [
    {
      "nombre":   "<razón social tal cual aparece en el PDF/XML>",
      "nif":      "<string|null>",
      "rol":      "${ENUMS.rol_licitador.join('"|"')}",
      "es_ute":   <bool>,
      "miembros_ute": [{ "nombre": "<string>", "nif": "<string|null>" }] | null,

      "oferta_economica":                <number|null>,
      "oferta_canon_anual":              <number|null>,
      "oferta_canon_por_cargador":       <number|null>,
      "oferta_canon_variable_eur_kwh":   <number|null>,
      "oferta_canon_variable_pct":       <number|null>,
      "oferta_descuento_residentes_pct": <number|null>,
      "inversion_comprometida":          <number|null>,

      "puntuacion_economica": <number|null>,
      "puntuacion_tecnica":   <number|null>,
      "puntuacion_total":     <number|null>,
      "puntuaciones_detalle": [
        {
          "nombre":   "<string — usar el MISMO label entre licitadores no-excluidos>",
          "oferta":   "<string|null — texto literal que va a la celda de la columna>",
          "puntos":   <number|null>,
          "peso_max": <number|null>
        }
      ],

      "rank_position":     <number|null>,
      "motivo_exclusion":  "<string|null>",
      "mejoras_ofertadas": ["<string>", ...] | null
    }
  ],

  "notas_pliego":       ["<string>", ...],
  "notas_adjudicacion": ["<string>", ...]
}
`.trim();
}

// ─── Reglas de clasificación notas_pliego vs notas_adjudicacion ─────────
export const CLASIFICACION_NOTAS_TEXT = `
REGLA DE CLASIFICACIÓN DE NOTAS (obligatoria):
La salida tiene DOS listas separadas: "notas_pliego" y "notas_adjudicacion".
NO uses "warnings" plano — clasifica cada observación.

• notas_pliego  → todo lo que la Administración FIJA ANTES de que alguien
                  se presente. Cosas que un potencial licitador leería para
                  decidir si le interesa participar:
                    · Plazo de concesión y prórroga (existencia/ausencia)
                    · Cuándo se computa el inicio (adjudicación/formalización/PeM)
                      y plazo de construcción
                    · Modelo de retribución y mínimos del pliego (canon/año,
                      canon/kWh, canon/ubicación, canon/cargador)
                    · Infraestructura exigida: ubicaciones, mínimo de puntos,
                      mix AC/DC/DC+/HPC, potencia mínima por cargador,
                      potencia disponible (garantizada o no)
                    · Garantías exigidas (provisional sí/no, definitiva % y base)
                    · Solvencia económica/técnica/adicional con umbrales
                    · Criterios de valoración y pesos
                    · Régimen tarifario (libre o regulado), amortización,
                      rescate/reversión
                    · Importe base de convocatoria, financiación UE, idioma

• notas_adjudicacion → todo lo que ocurre DURANTE o DESPUÉS de abrir
                        ofertas. Hechos que no existían hasta que los
                        licitadores se presentaron:
                    · Quiénes se presentaron (nombres, número), competencia
                      efectiva o única licitadora
                    · Canon fijo/variable OFERTADO por cada licitador (NO
                      confundir con canon mínimo del pliego)
                    · Puntuaciones obtenidas y correcciones del órgano
                    · Penalizaciones por criterio a un licitador concreto y
                      por qué (ej: "X penalizada en criterio Y porque...")
                    · Licitadores excluidos y motivo
                    · Fechas de apertura Sobre A, Sobre B, adjudicación,
                      formalización
                    · Tiempos del proceso NO derivables del XML (entre
                      sobres, entre Sobre B y propuesta, etc.). Los tiempos
                      derivables (publicación→adjudicación) los calcula la
                      UI; no los duplique el LLM.

REGLA DECISIVA: si el hecho existe ANTES de que se abran sobres → notas_pliego.
Si existe DESPUÉS de que se abran sobres → notas_adjudicacion.

Cada nota: frase autocontenida en español, sin bullet chars al inicio.
`.trim();

// ─── Reglas críticas que aprende el modelo del prompt ───────────────────
export const REGLAS_CRITICAS_TEXT = `
REGLAS CRÍTICAS:

1. CANON MÍNIMO DEL PLIEGO ≠ CANON OFERTADO POR EL GANADOR.
   - El mínimo va en "canon_minimo_anual"/"canon_variable_eur_kwh"/etc.
   - El ofertado por el ganador va en "canon_ganador" (resumen) Y dentro de
     "licitadores[adjudicataria].oferta_canon_anual"/etc.
   - Si el ganador igualó exactamente el mínimo, ambos pueden coincidir, pero
     los campos son semánticamente distintos.

2. tipo_retribucion="mixto" exige al menos un componente fijo Y un variable.
   No dejes los canon_mix_* todos en null si el pliego declara canon mixto;
   usa canon_minimo_anual + canon_variable_eur_kwh si la estructura es
   "alza sobre canon fijo + alza sobre canon variable".

3. El "nombre" del licitador es la razón social literal del PDF/XML
   (ej "IBERDROLA CLIENTES S.A.", "Qwello España SL"). NO emitas
   "nombre_comercial" ni "party_id" — la pipeline los enriquece después
   cruzando NIF contra infraestructura.db + empresas-aliases.json.

4. Si una licitadora va por UTE: "es_ute": true y "miembros_ute":
   [{nombre, nif}, ...]. En "nombre" pon la denominación de la UTE como
   aparece en la resolución.

5. "puntuaciones_detalle[].nombre" debe ser CONSISTENTE entre licitadores
   no excluidos del mismo concurso (la UI usa esos nombres para generar
   columnas de la tabla). No uses "HW" en uno y "Hardware" en otro —
   elige un label canónico y úsalo para todos.

6. Si el órgano corrigió la puntuación de un licitador (típicamente porque
   la propuesta no era ejecutable), pon en "puntos" la puntuación FINAL
   corregida y describí la corrección en "puntuaciones_detalle[].oferta"
   y/o en "notas_adjudicacion".

7. Para licitadores excluidos: "rol":"excluida" y "motivo_exclusion"
   conciso. No requiere puntuaciones.
`.trim();

// ─── Ejemplos canónicos (paths a los gold standards) ────────────────────
export const EJEMPLOS_CANONICOS = [
  { slug: '19140288', etiqueta: 'Burjassot — caso simple, 1 licitadora, canon fijo' },
  { slug: '13576641', etiqueta: 'Pirotecnia 47 — múltiples licitadores, canon mixto, exclusiones, puntuaciones corregidas' },
];

// ─── Builders del prompt ────────────────────────────────────────────────
export function buildSystemPrompt(row, isConcesion) {
  return `Eres un analista experto en licitaciones públicas españolas del sector
e-movilidad. Trabajás con pliegos (PPT, PCAP), actas de apertura, informes
de baremación, resoluciones de adjudicación, anuncios oficiales y formalizaciones
del PLACSP.

Extraé la información solicitada con estricta fidelidad. No inventes ni infieras
más allá de lo escrito. Si algo no aparece, devolvé null. Si hay ambigüedad,
apuntalo en "notas_pliego" o "notas_adjudicacion" según corresponda.

Contexto de esta licitación:
- Expediente: ${row.expediente ?? '(sin expediente)'}
- Título: ${row.titulo}
- Órgano: ${row.organo_nombre ?? '(sin órgano)'}
- Categoría e-mov: ${row.categoria_emov} (${isConcesion ? 'concesión demanial' : 'otra'})
- Estado: ${row.estado_actual}
- Deeplink PLACSP: ${row.deeplink}

El canon puede ser FIJO (EUR/año), VARIABLE (% sobre facturación o EUR/kWh
dispensado) o MIXTO (parte fija + parte variable). Registralo en los campos
correspondientes según el tipo declarado en el pliego.

En los criterios de valoración, separá económicos (canon, descuento residentes)
de técnicos. Dentro de técnicos identificá los buckets típicos: plazo de
construcción, calidad del proyecto técnico, oferta de más HW/potencia, oferta
de más ubicaciones, otros (sostenibilidad, fotovoltaica, etc.).

${REGLAS_CRITICAS_TEXT}

${CLASIFICACION_NOTAS_TEXT}`;
}

export function buildUserPrompt(isConcesion) {
  return `Analizá los PDFs adjuntos y devolvé el JSON con la estructura indicada.

${buildSchemaText(isConcesion)}`;
}
