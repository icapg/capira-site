import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  findLicitacionBySlug,
  deeplinkFromIdEvl,
  displayName,
  categoriaLabel,
  categoriaShort,
  categoriaColor,
  ESTADO_LABEL,
  ESTADO_COLOR,
  type LicitacionItem,
  type Licitador,
  type UbicacionConcesion,
  type Concesion,
  type ProcesoLicitacion,
  type RequisitoParticipacion,
  type MejoraPuntuable,
} from "../../../lib/insights/licitaciones-data";
import { DonutCriterios, BarPuntuaciones, BarMixHW, BarCanonOferta } from "./Charts";
import { UbicacionesMapa } from "./UbicacionesMapa";
import ExplicacionButton from "./ExplicacionButton";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lic = findLicitacionBySlug(id);
  if (!lic) return { title: "Licitación no encontrada" };
  return {
    title: `${lic.titulo} — Licitación PLACSP`,
    description: `${categoriaLabel(lic.categoria)}${lic.organo ? ` · ${lic.organo}` : ""}${lic.provincia ? ` · ${lic.provincia}` : ""}`,
  };
}

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.14)",
  green:  "#34d399",
  blue:   "#38bdf8",
  purple: "#a78bfa",
  orange: "#fb923c",
  amber:  "#fbbf24",
  yellow: "#facc15",
  red:    "#f87171",
  teal:   "#06b6d4",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.62)",
  dim:    "rgba(241,245,249,0.36)",
  row:    "rgba(255,255,255,0.05)",
};

const EMOJI_CAT: Record<string, string> = {
  "1":  "🅿️", "2":  "🔧", "3":  "📐", "4":  "⚡", "5":  "💻", "6":  "🚗",
  "7":  "🚌", "8":  "🛠️", "9":  "🛴", "10": "☀️", "11": "🔩",
};

const ESTADO_EMOJI: Record<string, string> = {
  PUB: "🟢", EV: "⏳", ADJ: "🎯", RES: "✅", ANUL: "❌", DES: "🚫", PRE: "📝", CERR: "🔒", BORR: "📋",
};

function fmtEur(n?: number | null, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("es-ES")} €${unit}`;
}
function fmtEurExact(n?: number | null, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("es-ES", { maximumFractionDigits: 2 })} €${unit}`;
}
function fmtEurCompact(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)} M€`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)} k€`;
  return fmtEur(n);
}
function fmtNum(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-ES");
}
function fmtTipoHw(t?: string | null): string {
  if (!t) return "—";
  if (t === "mixto") return "AC+DC";
  return t;
}

const TIPO_INICIO_LABEL: Record<string, string> = {
  adjudicacion:     "Desde adjudicación",
  formalizacion:    "Desde formalización",
  puesta_en_marcha: "Desde puesta en marcha",
};

const TIPO_RETRIB_LABEL: Record<string, string> = {
  canon_fijo:            "canon fijo",
  canon_variable_pct:    "canon variable (% sobre facturación)",
  mixto:                 "canon mixto (fijo + variable)",
  contraprestacion:      "contraprestación",
  compra:                "compra",
  venta_energia_usuario: "venta de energía al usuario (sin canon al órgano)",
};

type SeccionNarrativa = { titulo: string; bullets: string[] };

// Clasifica una nota libre de notas_pliego[] al tema más apropiado por keywords.
function clasificarNotaPliego(n: string): keyof PliegoSecciones {
  const s = n.toLowerCase();
  if (/canon|retribuci|tarif|alza|€\/kwh|euro\/kwh|ipc|incremento\s+anual|ofertad/.test(s)) return "canon";
  if (/garant[ií]a|provisional|definitiva|aval|seguro\s+de\s+caución/.test(s)) return "garantias";
  if (/solvencia|seguro\s+de\s+resp|experiencia|volumen\s+de\s+negoci|habilitaci|certif|visit[ao]\s+obligatori|informe\s+de\s+viabilidad|plan\s+econ|proyecto\s+t[eé]cnico|bastanteo|garant[ií]a\s+de\s+origen|al\s+corriente/.test(s)) return "solvencia";
  if (/criterio|valoraci|punt[oa]s?\s+m[áa]x|baremaci|exclusi[oó]n|formul/.test(s)) return "criterios";
  if (/cargad|punto\s+de\s+carga|plaza|potencia|kw|ubicaci[oó]n|tecnolog|conector|mennekes|ccs|chademo|fotovolt|marquesina|acometida|centro\s+de\s+transformaci|cabina|dispensador|interoperabilid|exist[eé]nte|desmantel/.test(s)) return "infra";
  if (/plazo|prórroga|prorrogabl|años|formalizaci|construcci[oó]n|puesta\s+en\s+(marcha|servicio)|duraci|rescate|vencimi/.test(s)) return "plazo";
  if (/sobre\s+[abc]|apertura|sistema\s+de\s+\d+\s+sobres|reserva|modific|penali[sz]aci/.test(s)) return "proceso";
  return "otras";
}

type PliegoSecciones = {
  plazo:     string[];
  canon:     string[];
  infra:     string[];
  garantias: string[];
  solvencia: string[];
  criterios: string[];
  proceso:   string[];
  otras:     string[];
};

function buildPliegoNarrative(lic: LicitacionItem, notasPre: string[]): SeccionNarrativa[] {
  const con  = lic.concesion;
  const proc = lic.proceso;
  const sec: PliegoSecciones = { plazo: [], canon: [], infra: [], garantias: [], solvencia: [], criterios: [], proceso: [], otras: [] };

  // ── PLAZO ─────────────────────────────────────────────────────────────
  if (con?.plazo_anos != null) {
    let s = `Concesión demanial por ${con.plazo_anos} años`;
    if (con.renovacion_anos && con.renovacion_anos > 0) s += `, prorrogables ${con.renovacion_anos} años adicionales`;
    else s += ` sin prórroga prevista`;
    s += ".";
    sec.plazo.push(s);
  }
  if (con?.tipo_inicio) {
    const labelMap: Record<string, string> = {
      adjudicacion: "la adjudicación",
      formalizacion: "la formalización del contrato",
      puesta_en_marcha: "la puesta en marcha",
    };
    sec.plazo.push(`El plazo se computa desde ${labelMap[con.tipo_inicio] ?? con.tipo_inicio}.`);
  }
  if (con?.fecha_inicio) {
    sec.plazo.push(`Fecha de inicio efectiva de la concesión: ${con.fecha_inicio}.`);
  }
  if (con?.plazo_construccion_meses != null) {
    sec.plazo.push(`El adjudicatario dispone de ${con.plazo_construccion_meses} meses para construir y poner en marcha la infraestructura.`);
  }

  // ── CANON Y RÉGIMEN ECONÓMICO ─────────────────────────────────────────
  if (con?.tipo_retribucion) {
    sec.canon.push(`Modelo de retribución: ${TIPO_RETRIB_LABEL[con.tipo_retribucion] ?? con.tipo_retribucion}.`);
  }
  if (con?.canon_minimo_anual != null) {
    sec.canon.push(`Canon fijo mínimo del pliego: ${fmtEurExact(con.canon_minimo_anual)}/año (las ofertas deben igualarlo o superarlo).`);
  }
  if (con?.canon_variable_eur_kwh != null) {
    sec.canon.push(`Canon variable mínimo: ${con.canon_variable_eur_kwh.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh cargado.`);
  }
  if (con?.canon_variable_pct != null) {
    sec.canon.push(`Canon variable mínimo: ${con.canon_variable_pct}% sobre facturación.`);
  }
  if (con?.canon_por_ubicacion_anual != null) {
    sec.canon.push(`Canon de referencia por ubicación: ${fmtEurExact(con.canon_por_ubicacion_anual)}/ubicación/año.`);
  }
  if (con?.canon_por_cargador != null) {
    sec.canon.push(`Canon de referencia por punto de carga: ${fmtEurExact(con.canon_por_cargador)}/punto/año.`);
  }
  if (lic.importe_base != null) {
    sec.canon.push(`Importe base de la convocatoria: ${fmtEur(lic.importe_base)}.`);
  }
  if (lic.importe_estimado != null && lic.importe_estimado !== lic.importe_base) {
    sec.canon.push(`Valor estimado total del contrato: ${fmtEur(lic.importe_estimado)}.`);
  }

  // ── INFRAESTRUCTURA EXIGIDA ───────────────────────────────────────────
  if (con?.num_ubicaciones != null) {
    sec.infra.push(`Ubicaciones: ${con.num_ubicaciones}.`);
  }
  if (con?.num_cargadores_minimo != null) {
    let s = `Se exigen al menos ${con.num_cargadores_minimo} puntos de carga (plazas con cable disponible)`;
    if (con.num_cargadores_opcional) s += " — el licitador puede ofertar más como mejora";
    s += ".";
    sec.infra.push(s);
  }
  if (con?.potencia_minima_por_cargador_kw != null) {
    let s = `Potencia mínima por punto de carga: ${con.potencia_minima_por_cargador_kw} kW`;
    if (con.potencia_opcional_subible) s += " (subible como mejora)";
    s += ".";
    sec.infra.push(s);
  }
  if (con?.potencia_disponible_kw != null) {
    sec.infra.push(`Potencia disponible en acometida: ${con.potencia_disponible_kw.toLocaleString("es-ES")} kW — ${con.potencia_garantizada ? "garantizada por la Administración" : "NO garantizada (riesgo a cargo del adjudicatario)"}.`);
  }
  const hwMix = [
    con?.num_cargadores_ac      && `${con.num_cargadores_ac} AC`,
    con?.num_cargadores_dc      && `${con.num_cargadores_dc} DC`,
    con?.num_cargadores_dc_plus && `${con.num_cargadores_dc_plus} DC+`,
    con?.num_cargadores_hpc     && `${con.num_cargadores_hpc} HPC`,
  ].filter(Boolean).join(" + ");
  if (hwMix) sec.infra.push(`Mix tecnológico exigido: ${hwMix}.`);
  if (con?.tecnologia_requerida) {
    sec.infra.push(`Tecnología requerida: ${fmtTipoHw(con.tecnologia_requerida)}.`);
  }

  // ── GARANTÍAS ─────────────────────────────────────────────────────────
  const g = proc?.garantias;
  if (g) {
    if (g.provisional_exigida === true) {
      const prov = g.provisional_eur != null
        ? fmtEur(g.provisional_eur)
        : g.provisional_pct != null ? `${g.provisional_pct}%` : "importe a determinar";
      sec.garantias.push(`Garantía provisional exigida para presentar oferta: ${prov} (reembolsable a los no adjudicatarios).`);
    } else if (g.provisional_exigida === false) {
      sec.garantias.push(`No se exige garantía provisional: cualquier empresa puede presentarse sin depósito inicial.`);
    }
    if (g.definitiva_eur != null || g.definitiva_pct != null) {
      let s = `Garantía definitiva (a constituir por el adjudicatario): `;
      if (g.definitiva_pct != null) s += `${g.definitiva_pct}%`;
      if (g.definitiva_base) s += ` sobre ${g.definitiva_base.replace(/_/g, " ")}`;
      if (g.definitiva_eur != null) s += ` (≈ ${fmtEur(g.definitiva_eur)})`;
      s += ".";
      sec.garantias.push(s);
    }
  }

  // ── SOLVENCIA Y REQUISITOS ────────────────────────────────────────────
  const req = proc?.requisitos;
  if (req) {
    for (const r of (req.solvencia_economica ?? [])) {
      let s = `Solvencia económica — ${r.descripcion}`;
      if (r.umbral) s += ` (umbral: ${r.umbral})`;
      if (r.critico) s += " [crítico]";
      s += ".";
      sec.solvencia.push(s);
    }
    for (const r of (req.solvencia_tecnica ?? [])) {
      let s = `Solvencia técnica — ${r.descripcion}`;
      if (r.umbral) s += ` (umbral: ${r.umbral})`;
      if (r.critico) s += " [crítico]";
      s += ".";
      sec.solvencia.push(s);
    }
    for (const r of (req.adicionales ?? [])) {
      let s = `Otro requisito — ${r.descripcion}`;
      if (r.umbral) s += ` (${r.umbral})`;
      if (r.critico) s += " [crítico]";
      s += ".";
      sec.solvencia.push(s);
    }
  }

  // ── CRITERIOS DE VALORACIÓN ───────────────────────────────────────────
  if (proc?.peso_economico != null || proc?.peso_tecnico != null || proc?.peso_canon_fijo != null) {
    const pieces: string[] = [];
    if (proc.peso_canon_fijo != null)     pieces.push(`${proc.peso_canon_fijo}% canon fijo`);
    if (proc.peso_canon_variable != null) pieces.push(`${proc.peso_canon_variable}% canon variable`);
    if (proc.peso_canon_fijo == null && proc.peso_canon_variable == null && proc.peso_economico != null) {
      pieces.push(`${proc.peso_economico}% económico`);
    }
    if (proc.peso_tecnico != null) pieces.push(`${proc.peso_tecnico}% técnico`);
    if (pieces.length > 0) sec.criterios.push(`Pesos de los criterios: ${pieces.join(" + ")}.`);
  }
  if (proc?.tipo_adjudicacion) {
    const tipoAdj: Record<string, string> = {
      subasta: "subasta",
      concurso: "concurso",
      concurso_multicriterio: "concurso multicriterio",
      acuerdo_marco: "acuerdo marco",
    };
    sec.criterios.push(`Tipo de procedimiento: ${tipoAdj[proc.tipo_adjudicacion] ?? proc.tipo_adjudicacion}.`);
  }
  for (const m of (proc?.mejoras_puntuables ?? [])) {
    let s = `Mejora puntuable — ${m.descripcion}`;
    if (m.puntos_max != null) s += ` (hasta ${m.puntos_max} pts)`;
    s += ".";
    sec.criterios.push(s);
  }

  // ── OTRAS CONDICIONES ─────────────────────────────────────────────────
  if (proc?.idioma_pliego) {
    sec.otras.push(`Idioma del pliego: ${proc.idioma_pliego.toUpperCase()}.`);
  }
  if (lic.financiacion_ue) {
    sec.otras.push(`Cofinanciación europea${lic.programa_ue ? ` (${lic.programa_ue})` : ""}: puede implicar requisitos adicionales de trazabilidad y justificación de gasto.`);
  }

  // ── Notas del extractor: clasificarlas en su sección correspondiente ──
  for (const n of notasPre) {
    const tema = clasificarNotaPliego(n);
    sec[tema].push(n);
  }

  return [
    { titulo: "📅 Plazo y duración",          bullets: sec.plazo },
    { titulo: "💰 Canon y régimen económico", bullets: sec.canon },
    { titulo: "🔌 Infraestructura exigida",   bullets: sec.infra },
    { titulo: "🛡️ Garantías",                 bullets: sec.garantias },
    { titulo: "✅ Solvencia y requisitos",    bullets: sec.solvencia },
    { titulo: "⚖️ Criterios de adjudicación", bullets: sec.criterios },
    { titulo: "📋 Proceso y otras condiciones", bullets: [...sec.proceso, ...sec.otras] },
  ].filter((s) => s.bullets.length > 0);
}

export default async function LicitacionDetail({ params }: Props) {
  const { id } = await params;
  const lic = findLicitacionBySlug(id);
  if (!lic) notFound();

  const deeplink = deeplinkFromIdEvl(lic.idEvl);
  const catColor = categoriaColor(lic.categoria);
  const catEmoji = EMOJI_CAT[lic.categoria] ?? "📋";
  const estColor = lic.estado ? (ESTADO_COLOR[lic.estado] ?? C.dim) : C.dim;
  const estLabel = lic.estado ? (ESTADO_LABEL[lic.estado] ?? lic.estado) : "—";
  const estEmoji = lic.estado ? (ESTADO_EMOJI[lic.estado] ?? "📌") : "📌";

  const licitadoresRaw: Licitador[] = lic.licitadores ?? [];

  // Dedup por NIF, rol prioritario adjudicataria > participante > excluida
  const ROL_PRIO: Record<string, number> = { adjudicataria: 3, participante: 2, excluida: 1 };
  const map = new Map<string, Licitador>();
  for (const l of licitadoresRaw) {
    const key = (l.nif || l.nombre).trim().toLowerCase();
    const prev = map.get(key);
    if (!prev || (ROL_PRIO[l.rol] ?? 0) > (ROL_PRIO[prev.rol] ?? 0)) map.set(key, l);
  }
  const licitadores = [...map.values()];
  const adj = licitadores.filter((l) => l.rol === "adjudicataria");
  const par = licitadores.filter((l) => l.rol === "participante");
  const exc = licitadores.filter((l) => l.rol === "excluida");
  const winner = adj[0];

  const esConcesion    = lic.categoria === "1";

  // Fuente preferida: notas_pliego / notas_adjudicacion (nuevo formato MCP).
  // Fallback: warnings plano → clasificador heurístico.
  const ext = lic.proceso?.extraccion_llm;
  const hasNuevoFormato = Array.isArray(ext?.notas_pliego) || Array.isArray(ext?.notas_adjudicacion);
  let notasPre: string[];
  let notasPost: string[];
  if (hasNuevoFormato) {
    notasPre  = ext!.notas_pliego       ?? [];
    notasPost = ext!.notas_adjudicacion ?? [];
  } else {
    const allWarnings = ext?.warnings ?? [];
    const isNotaAdjudicacion = (w: string) => {
      const s = w.toLowerCase();
      return /única\s+licitador/.test(s)
          || /licitador[ae]s?\s+(presentad|ofertant|se\s+present)/.test(s)
          || /sin\s+competencia/.test(s)
          || /m[aá]xima\s+puntuaci/.test(s)
          || /\b(ganador|adjudicatari)/.test(s)
          || /\bsobre\s+[ab]\b/.test(s)
          || /apertura\s+(de\s+)?sobre/.test(s)
          || /\bformalizaci[oó]n\b/.test(s)
          || /\bcanon\s+(fijo\s+|variable\s+)?ofertad/.test(s)
          || /fechas:.*(apertura|adjudic|sobre|formaliz)/.test(s)
          || /\bpenaliz/.test(s)
          || /\bexcluid/.test(s)
          || /\bexclus(i[oó]n|iones)\b/.test(s)
          || /\bincumplim/.test(s)
          || /oferta[s]?\s+(evaluad|admitid|descartad|rechazad)/.test(s)
          || /solicitudes\s+(admitid|presentad)/.test(s)
          || /\bpuntuaci[oó]n\s+(de|del|correg|final|obten|reduc|ampli)/.test(s)
          || /\b(correg|modific|reduc|ampli)(i[oó]|ó)\s+(la\s+)?puntuaci/.test(s)
          || /\bcriterio\s+\d/.test(s)
          || /\b[oó]rgano\s+(de\s+contrataci[oó]n\s+)?(correg|ampli|reduc|excluy|descalif)/.test(s)
          || /\bacta\s+de\s+(apertura|evaluaci)/.test(s);
    };
    notasPost = allWarnings.filter(isNotaAdjudicacion);
    notasPre  = allWarnings.filter((w) => !isNotaAdjudicacion(w));
  }

  // ── Timings derivados automáticos (se prepend a notasPost) ──────────────
  const daysBetween = (a?: string | null, b?: string | null) => {
    if (!a || !b) return null;
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    if (!Number.isFinite(da) || !Number.isFinite(db)) return null;
    return Math.round((db - da) / 86_400_000);
  };
  const fmtDur = (days: number) => {
    const abs = Math.abs(days);
    if (abs >= 60) {
      const meses = Math.round(abs / 30.44);
      return `${days < 0 ? "-" : ""}${meses} ${meses === 1 ? "mes" : "meses"} (${abs} días)`;
    }
    return `${days} ${abs === 1 ? "día" : "días"}`;
  };
  const timings: string[] = [];
  const dPubLim = daysBetween(lic.fecha_publicacion, lic.fecha_limite);
  if (dPubLim != null && dPubLim >= 0) {
    timings.push(`Plazo de presentación de ofertas: ${fmtDur(dPubLim)} desde la publicación (${lic.fecha_publicacion} → ${lic.fecha_limite}).`);
  }
  const dLimAdj = daysBetween(lic.fecha_limite, lic.fecha_adjudicacion);
  if (dLimAdj != null && dLimAdj >= 0) {
    timings.push(`La mesa tardó ${fmtDur(dLimAdj)} en resolver la adjudicación desde el cierre del plazo de ofertas (${lic.fecha_limite} → ${lic.fecha_adjudicacion}).`);
  }
  const dPubAdj = daysBetween(lic.fecha_publicacion, lic.fecha_adjudicacion);
  if (dPubAdj != null && dPubAdj >= 0) {
    timings.push(`Desde el anuncio del pliego hasta la adjudicación transcurrieron ${fmtDur(dPubAdj)} en total (${lic.fecha_publicacion} → ${lic.fecha_adjudicacion}).`);
  }
  const dAdjForm = daysBetween(lic.fecha_adjudicacion, lic.fecha_formalizacion);
  if (dAdjForm != null && dAdjForm >= 0) {
    timings.push(`La formalización del contrato se firmó ${fmtDur(dAdjForm)} después de la adjudicación (${lic.fecha_adjudicacion} → ${lic.fecha_formalizacion}).`);
  }
  notasPost = [...timings, ...notasPost];

  const estaAdjudicada = lic.estado === "ADJ" || lic.estado === "RES";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 72px" }}>

        {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20, fontSize: 12, color: C.muted }}>
          <Link href="/info/licitaciones" style={{ color: C.muted, textDecoration: "none" }}>← Licitaciones</Link>
          <span style={{ margin: "0 8px", color: C.dim }}>/</span>
          <span style={{ color: C.dim }}>{lic.expediente ?? lic.slug}</span>
        </div>

        {/* ── HERO: título + ganador ───────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {(lic.ciudad || lic.provincia) && (
              <Chip label={`📍 ${lic.ciudad ?? lic.provincia}`} color={C.muted} />
            )}
            <Chip label={`${lic.categoria}. ${categoriaShort(lic.categoria)}`} color={C.muted} />
            {lic.estado && <Chip label={estLabel} color={estColor} />}
{/* tipo_contrato no se muestra en el Hero — el dato sigue disponible en la TablaPlanaFinal abajo */}
            {lic.financiacion_ue && <Chip label="🇪🇺 Financiación UE" color={C.amber} />}
            {(lic.tags ?? []).map((t) => <Chip key={t} label={t} color={C.blue} />)}
            {lic.fecha_actualizacion && (
              <span
                title="Fecha en la que actualizamos los datos de esta licitación. Si han pasado muchos días, conviene refrescar el expediente — el estado real en PLACSP puede haber cambiado."
                style={{ fontSize: 10, color: C.dim, alignSelf: "center", letterSpacing: "0.02em", cursor: "help", marginLeft: "auto" }}
              >
                Última actualización: {lic.fecha_actualizacion.slice(0, 10).split("-").reverse().join("/")}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 18, lineHeight: 1.35, fontWeight: 500, letterSpacing: "-0.01em", margin: 0, marginBottom: 12, color: C.text }}>
              {lic.titulo}
            </h1>
            {winner && <WinnerBadge winner={winner} />}
          </div>
        </div>

        {/* ── 🏆 Ranking (cuando ya hay adjudicataria identificada — aún si no está 100% resuelta) ── */}
        {winner != null && (
          <RankingBlock adj={adj} par={par} exc={exc} concesion={lic.concesion} winner={winner} notas={notasPost} />
        )}

        {/* ── 🗂️ Resumen pliego — abierto por defecto si NO hay adjudicación ── */}
        <details style={{ marginTop: 20 }} open={winner == null}>
          <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            🗂️ Resumen pliego
          </summary>

          {/* Fila superior: Fechas | KpiBar (misma altura) */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,3fr)", gap: 20, alignItems: "stretch" }}>
            <TimelineFechas lic={lic} />
            <KpiBar lic={lic} esConcesion={esConcesion} nParticipantes={licitadores.length} nExcluidos={exc.length} winner={winner} />
          </div>

          {/* Grid principal 2 cols */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,3fr)", gap: 20, marginTop: 20 }}>

            {/* Columna izquierda (sidebar compacta) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* 🛡️ Garantías — siempre visible */}
              <GarantiasBlock garantias={lic.proceso?.garantias ?? {}} />

              {/* 📄 Documentos */}
              {(lic.documentos?.length ?? 0) > 0 && (
                <Section title={`📄 Documentos (${lic.documentos!.length})`} compact>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 380, overflowY: "auto" }}>
                    {lic.documentos!.map((d, i) => {
                      const labelOriginal = d.nombre ?? d.tipo.replace(/_/g, " ");
                      const tipoLabel = d.tipo.replace(/_/g, " ");
                      const tooltip = d.nombre
                        ? `Clasificación canónica: ${tipoLabel}\nNombre original (PLACSP): ${d.nombre}`
                        : `Clasificación canónica: ${tipoLabel}`;
                      return (
                        <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                           title={tooltip}
                           style={{ display: "flex", gap: 8, padding: "6px 8px", background: C.row, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, color: C.text, textDecoration: "none", alignItems: "center", cursor: "help" }}>
                          <span style={{ fontSize: 13 }}>{docEmoji(d.tipo)}</span>
                          <span style={{ flex: 1, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {labelOriginal}
                          </span>
                          {d.fecha && <span style={{ color: C.dim, fontSize: 10 }}>{d.fecha.slice(0, 10)}</span>}
                        </a>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* 🔗 Abrir en PLACSP */}
              {deeplink && (
                <a href={deeplink} target="_blank" rel="noopener noreferrer"
                   style={{ display: "block", textAlign: "center", padding: "12px 16px",
                     background: "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(56,189,248,0.14))",
                     border: `1px solid ${C.purple}55`, borderRadius: 12, color: C.text,
                     fontSize: 12, fontWeight: 700, textDecoration: "none", letterSpacing: "0.02em" }}>
                  🔗 Abrir en PLACSP ↗
                </a>
              )}

            </div>

            {/* Columna derecha (contenido principal) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* 🏢 Concesión demanial */}
              {esConcesion && lic.concesion && (
                <ConcesionBlock lic={lic} concesion={lic.concesion} proceso={lic.proceso} />
              )}

              {/* 👥 Participantes al final si todavía NO está adjudicada (Alfa) */}
              {!estaAdjudicada && (
                <ParticipantesBlock adj={adj} par={par} exc={exc} />
              )}
            </div>
          </div>

        </details>

        {/* ── 📍 Ubicaciones y cargadores — abierto por defecto si NO hay adjudicación ── */}
        {esConcesion && (
          <details style={{ marginTop: 20 }} open={winner == null}>
            <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              📍 Ubicaciones y puntos de carga
            </summary>
            <UbicacionesBlock ubicaciones={lic.concesion?.ubicaciones ?? []} concesion={lic.concesion} />
          </details>
        )}

        {/* ── 🗺 Mapa de ubicaciones — sección hermana, plegada por defecto ── */}
        {esConcesion && (lic.concesion?.ubicaciones?.length ?? 0) > 0 && (
          <details style={{ marginTop: 20 }}>
            <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              🗺 Mapa de ubicaciones
            </summary>
            <UbicacionesMapa ubicaciones={lic.concesion?.ubicaciones ?? []} />
          </details>
        )}

        {/* ── 📘 Explicación simple del pliego (standalone, sobre el resumen) ── */}
        {esConcesion && lic.concesion && (() => {
          const explicacion = buildPliegoNarrative(lic, notasPre);
          if (explicacion.length === 0) return null;
          return (
            <details style={{ marginTop: 20 }}>
              <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                📘 Explicación del pliego en texto
              </summary>
              <div style={{ padding: "16px 18px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", flexDirection: "column", gap: 18 }}>
                {explicacion.map((s) => (
                  <div key={s.titulo}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.purple, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                      {s.titulo}
                    </div>
                    <BulletList items={s.bullets} color={C.blue} textColor={C.text} />
                  </div>
                ))}
              </div>
            </details>
          );
        })()}

        {/* ── TABLA PLANA FINAL (resumen estructurado, plegable) ────────── */}
        <details style={{ marginTop: 20 }}>
          <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            📊 Resumen en tabla estándar
          </summary>
          <TablaPlanaFinal lic={lic} licitadores={licitadores} />
        </details>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI BAR
// ─────────────────────────────────────────────────────────────────────────────

// Detecta si el PLIEGO permite ofertar más puntos/ubicaciones como mejora,
// y si tiene un máximo declarado. La fuente es `mejoras_puntuables[]` y los
// flags del pliego (`num_cargadores_opcional_extra`, `peso_mas_ubicaciones`).
// Independiente del ganador — refleja la posibilidad ANTES de adjudicar.
function posibilidadAdicionales(
  con: Concesion | undefined,
  mejoras: MejoraPuntuable[] | undefined,
  kind: "puntos" | "ubicaciones",
): { permitido: boolean; maximo: number | null } {
  const ms = mejoras ?? [];
  if (kind === "puntos") {
    // Solo matchea si la mejora habla EXPLÍCITAMENTE de "número/cantidad de
    // puntos" o "puntos adicionales". No matchea "mejora de potencia/HW",
    // que es mejora de capacidad por punto, no más puntos.
    const matchMejora = ms.find((m) => {
      const d = (m.descripcion ?? "").toLowerCase();
      return (
        /incremento\s+(del\s+)?n[uú]mero\s+de\s+puntos/.test(d)
        || /mayor\s+n[uú]mero\s+de\s+puntos/.test(d)
        || /m[áa]s\s+puntos\s+de\s+(re)?carga/.test(d)
        || /puntos?\s+adicionales/.test(d)
        || /(instalar|ofertar|incrementar)\s+(m[áa]s\s+)?puntos\s+de\s+(re)?carga/.test(d)
      );
    });
    const permitido = con?.num_cargadores_opcional === true || !!matchMejora;
    // Buscar un número de "unidades máximas" en la descripción (ej. "hasta 10 puntos adicionales")
    let maximo: number | null = null;
    if (matchMejora?.descripcion) {
      const m = matchMejora.descripcion.match(/hasta\s+(\d+)\s+(?:puntos?|plazas?|equipos?)/i)
             ?? matchMejora.descripcion.match(/(?:m[áa]ximo|max\.?)\s+(\d+)\s+(?:puntos?|plazas?|equipos?)/i);
      if (m) maximo = parseInt(m[1], 10);
    }
    return { permitido, maximo };
  } else {
    const matchMejora = ms.find((m) => /m[áa]s\s+ubicaci|nuevas?\s+ubicaci|m[áa]s\s+estaciones?|adicional.*ubicaci|incremento.*ubicaci/i.test(m.descripcion ?? ""));
    const permitido = (con?.canon_por_ubicacion_anual != null && (con as any)?.peso_mas_ubicaciones != null) || !!matchMejora;
    let maximo: number | null = null;
    if (matchMejora?.descripcion) {
      const m = matchMejora.descripcion.match(/hasta\s+(\d+)\s+(?:ubicaci|estaciones?)/i)
             ?? matchMejora.descripcion.match(/(?:m[áa]ximo|max\.?)\s+(\d+)\s+(?:ubicaci|estaciones?)/i);
      if (m) maximo = parseInt(m[1], 10);
    }
    return { permitido, maximo };
  }
}

function KpiBar({ lic, esConcesion, nParticipantes, nExcluidos, winner }: { lic: LicitacionItem; esConcesion: boolean; nParticipantes: number; nExcluidos: number; winner?: Licitador }) {
  const con = lic.concesion;
  const mejoras = lic.proceso?.mejoras_puntuables;

  // Boxes "dobles" (mínimo/pliego + ganador) para canon fijo y canon variable
  type Dual = { emoji: string; labelTop: string; valueTop: string; subTop?: string; labelBot: string; valueBot: string; subBot?: string; color: string; botHighlight?: boolean };
  type Simple = { emoji: string; label: string; value: string; sub?: string; subSize?: number; color: string };

  const boxes: Array<Dual | Simple> = [];

  // ── Descomposición de ubicaciones y puntos de carga (spec §4.ter M) ────
  // Las dos dimensiones (UBICACIONES físicas y PUNTOS DE CARGA / tomas)
  // tienen rango propio y se descomponen en 3 tramos mutuamente excluyentes:
  //   1. Existentes asumidas        (es_existente: true)
  //   2. Nuevas obligatorias        (es_existente: false, es_opcional: false)
  //   3. Nuevas opcionales (cupo)   (es_existente: false, es_opcional: true)
  // Cuando el pliego define cupo cerrado (Alcorcón: máx 25), las opcionales
  // se modelan como ubicaciones placeholder. Cuando es apertura sin techo
  // (Mancomunitat: incremento sin máximo), no se modelan y el flag
  // num_cargadores_opcional + posibilidadAdicionales() las refleja con "+ X".
  if (esConcesion) {
    const ubics = con?.ubicaciones ?? [];
    const ubicExistentes  = ubics.filter((u) => u.es_existente);
    const ubicOpcionales  = ubics.filter((u) => !u.es_existente && u.es_opcional);
    const ubicObligatorias = ubics.filter((u) => !u.es_existente && !u.es_opcional);
    const nUbicExist = ubicExistentes.length;
    const nUbicOpc   = ubicOpcionales.length;
    const nUbicObl   = ubicObligatorias.length;

    // Ubicaciones (primero) — siempre presente para cat=1 (con N/A si falta)
    {
      // Si el extractor descompuso por flags, usamos el desglose. Si no, caemos
      // al num_ubicaciones bruto (caso simple: pliego con N único sin tramos).
      const huboDesglose = nUbicExist + nUbicOpc + nUbicObl > 0;
      const nObligatorias = huboDesglose
        ? nUbicObl
        : (con?.num_ubicaciones ?? (ubics.length > 0 ? ubics.length : null));
      const ciudadesUnicas = Array.from(new Set(
        ubics.map((u) => u.municipio).filter((m): m is string => !!m && m.trim().length > 0)
      ));
      const subCiudades = ciudadesUnicas.length > 0
        ? ciudadesUnicas.join(" · ")
        : (lic.ciudad ?? lic.provincia ?? undefined);
      // Posibilidad del pliego — solo si NO hay opcionales ya modeladas (caso
      // apertura sin techo: Mancomunitat). Si hay placeholders modelados se
      // prefiere ese número concreto sobre el flag boolean.
      const posUbic = posibilidadAdicionales(con, mejoras, "ubicaciones");
      const usarFlagAdicional = nUbicOpc === 0 && posUbic.permitido;
      const adicionalLabel = usarFlagAdicional
        ? (posUbic.maximo != null ? String(posUbic.maximo) : "X")
        : null;

      // Construir value: <obligatorias>[ + <existentes>][ + <opcionales modeladas o flag>]
      // §4.ter S: omitir tramos con valor 0 — solo mostrar los que aportan algo.
      let valueUbic: string;
      if (nObligatorias == null) {
        valueUbic = "N/A";
      } else {
        const partes: string[] = [];
        if (nObligatorias > 0) partes.push(String(nObligatorias));
        if (nUbicExist > 0)    partes.push(String(nUbicExist));
        if (nUbicOpc > 0)              partes.push(String(nUbicOpc));
        else if (adicionalLabel)       partes.push(adicionalLabel);
        valueUbic = partes.length > 0 ? partes.join(" + ") : "0";
      }
      const cuant: string[] = [];
      if (nObligatorias != null && nObligatorias > 0) cuant.push(`${nObligatorias} mínimo del pliego`);
      if (nUbicExist > 0) cuant.push(`${nUbicExist} existente${nUbicExist > 1 ? "s" : ""} asumida${nUbicExist > 1 ? "s" : ""}`);
      if (nUbicOpc > 0) {
        cuant.push(`hasta ${nUbicOpc} ubicaciones adicionales del cupo del pliego`);
      } else if (adicionalLabel) {
        cuant.push(posUbic.maximo != null
          ? `hasta ${posUbic.maximo} ubicaciones adicionales a ofertar`
          : `${adicionalLabel} ubicaciones adicionales a ofertar (sin tope explícito)`);
      }
      const sumaTexto = cuant.join(" + ");
      const subUbic = subCiudades
        ? (sumaTexto ? `${sumaTexto} · ${subCiudades}` : subCiudades)
        : sumaTexto || undefined;
      boxes.push({
        emoji: "📍",
        label: "Ubicaciones",
        value: valueUbic,
        sub:   subUbic,
        color: C.green,
      });
    }

    // Puntos de carga (después) — siempre presente para cat=1
    {
      const nuevos = con?.num_cargadores ?? con?.num_cargadores_minimo ?? null;
      // Puntos existentes que el adjudicatario asume sin reemplazo
      const existentes = ubicExistentes.reduce((s, u) => s + (u.cargadores_total ?? 1), 0);
      // Puntos opcionales MODELADOS (suma de cargadores en placeholders) —
      // preferido sobre el flag boolean cuando hay cupo cerrado.
      const opcionalesModelados = ubicOpcionales.reduce((s, u) => s + (u.cargadores_total ?? 0), 0);
      const posPuntos = posibilidadAdicionales(con, mejoras, "puntos");
      const usarFlagAdicional = opcionalesModelados === 0 && posPuntos.permitido;
      const adicionalLabel = usarFlagAdicional
        ? (posPuntos.maximo != null ? String(posPuntos.maximo) : "X")
        : null;

      // §4.ter S: omitir tramos con valor 0 — solo mostrar los que aportan algo.
      let value: string;
      if (nuevos == null) {
        value = "N/A";
      } else {
        const partes: string[] = [];
        if (nuevos > 0)             partes.push(String(nuevos));
        if (existentes > 0)         partes.push(String(existentes));
        if (opcionalesModelados > 0) partes.push(String(opcionalesModelados));
        else if (adicionalLabel)     partes.push(adicionalLabel);
        value = partes.length > 0 ? partes.join(" + ") : "0";
      }
      const desglose = [con?.num_cargadores_ac, con?.num_cargadores_dc, con?.num_cargadores_dc_plus, con?.num_cargadores_hpc].some((v) => v != null)
        ? [con?.num_cargadores_ac && `${con.num_cargadores_ac} AC`, con?.num_cargadores_dc && `${con.num_cargadores_dc} DC`, con?.num_cargadores_dc_plus && `${con.num_cargadores_dc_plus} DC+`, con?.num_cargadores_hpc && `${con.num_cargadores_hpc} HPC`].filter(Boolean).join(" · ")
        : null;
      const subBase = desglose ?? (con?.tecnologia_requerida ? `tecnología ${fmtTipoHw(con.tecnologia_requerida)}` : undefined);
      const subParts: string[] = [];
      if (nuevos != null && nuevos > 0) subParts.push(`${nuevos} mínimo del pliego`);
      if (existentes > 0) subParts.push(`${existentes} existente${existentes > 1 ? "s" : ""} asumidos`);
      if (opcionalesModelados > 0) {
        subParts.push(`hasta ${opcionalesModelados} puntos adicionales del cupo del pliego`);
      } else if (adicionalLabel) {
        subParts.push(posPuntos.maximo != null
          ? `hasta ${posPuntos.maximo} puntos adicionales a ofertar`
          : `${adicionalLabel} puntos adicionales a ofertar (sin tope explícito)`);
      }
      const sumaTexto = subParts.join(" + ");
      const sub = subBase
        ? (sumaTexto ? `${sumaTexto} · ${subBase}` : subBase)
        : sumaTexto || undefined;
      boxes.push({
        emoji: "🔌",
        label: "Puntos de carga",
        value,
        sub,
        color: C.green,
      });
    }
  }

  // Plazo (último) — siempre presente
  if (esConcesion) {
    boxes.push({
      emoji: "📅",
      label: "Plazo",
      value: con?.plazo_anos != null ? `${con.plazo_anos} años` : "N/A",
      sub: con?.plazo_anos != null
        ? (con.renovacion_anos ? `+ ${con.renovacion_anos} años prórroga` : "sin prórroga")
        : undefined,
      subSize: con?.renovacion_anos ? 15 : undefined,
      color: C.purple,
    });
  } else {
    boxes.push({
      emoji: "📅",
      label: "Plazo",
      value: lic.plazo_meses != null ? `${lic.plazo_meses} meses` : "N/A",
      color: C.purple,
    });
  }


  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {boxes.map((k, i) => {
        const glow = k.color;
        const isDual = "labelTop" in k;
        return (
          <div key={i} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 18,
            padding: isDual ? "14px 14px" : "16px 16px", flex: 1, minWidth: isDual ? 170 : 140, position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: "50%", background: `${glow}18`, filter: "blur(24px)", pointerEvents: "none" }} />
            <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 10 }}>{k.emoji}</div>
            {isDual ? (
              <>
                {/* Parte superior — inicial */}
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", margin: 0 }}>{k.labelTop}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.1, fontVariantNumeric: "tabular-nums", margin: "4px 0 2px" }}>{k.valueTop}</p>
                  {k.subTop && <span style={{ fontSize: 10, color: C.muted }}>{k.subTop}</span>}
                </div>
                {/* Separador */}
                <div style={{ height: 1, background: C.border, margin: "12px 0" }} />
                {/* Parte inferior — label con acento si botHighlight, valor siempre en blanco */}
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: k.botHighlight ? glow : C.muted, textTransform: "uppercase", margin: 0 }}>{k.labelBot}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.1, fontVariantNumeric: "tabular-nums", margin: "4px 0 2px" }}>{k.valueBot}</p>
                  {k.subBot && <span style={{ fontSize: 10, color: C.muted }}>{k.subBot}</span>}
                </div>
              </>
            ) : (
              <>
                <div style={{ minHeight: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", margin: 0 }}>{k.label}</p>
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", margin: "10px 0 8px" }}>{k.value}</p>
                {k.sub && <span style={{ fontSize: k.subSize ?? 11, color: C.muted, fontWeight: k.subSize && k.subSize > 12 ? 600 : 400 }}>{k.sub}</span>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCESIÓN
// ─────────────────────────────────────────────────────────────────────────────

function ConcesionBlock({ lic, concesion, proceso }: { lic: LicitacionItem; concesion: Concesion; proceso?: ProcesoLicitacion }) {
  const hasPhase2 =
    concesion.fecha_inicio != null ||
    concesion.plazo_construccion_meses != null ||
    concesion.potencia_disponible_kw != null ||
    concesion.tecnologia_requerida != null ||
    concesion.num_cargadores_minimo != null ||
    concesion.canon_variable_eur_kwh != null ||
    concesion.canon_mix_fijo_anual != null;

  const mixHW = {
    ac:      concesion.num_cargadores_ac ?? undefined,
    dc:      concesion.num_cargadores_dc ?? undefined,
    dc_plus: concesion.num_cargadores_dc_plus ?? undefined,
    hpc:     concesion.num_cargadores_hpc ?? undefined,
  };
  const tieneMixHW = Object.values(mixHW).some((v) => v != null && v > 0);

  // Armar criterios para donut
  const criterios: Array<{ nombre: string; peso: number; color: string }> = [];
  const hasSubEco = proceso?.peso_canon_fijo != null
                 || proceso?.peso_canon_variable != null
                 || (proceso as any)?.peso_otros_economicos != null;
  if (hasSubEco) {
    if (proceso?.peso_canon_fijo     != null) criterios.push({ nombre: "Canon fijo",     peso: proceso.peso_canon_fijo,     color: C.amber });
    if (proceso?.peso_canon_variable != null) criterios.push({ nombre: "Canon variable", peso: proceso.peso_canon_variable, color: C.orange });
    if ((proceso as any)?.peso_otros_economicos != null) criterios.push({ nombre: "Otros económicos", peso: (proceso as any).peso_otros_economicos, color: C.yellow });
  } else if (proceso?.peso_economico != null) {
    criterios.push({ nombre: "Económico", peso: proceso.peso_economico, color: C.amber });
  }
  const hasSubTec = proceso?.peso_proyecto_tecnico != null || proceso?.peso_construccion_tiempo != null
                 || proceso?.peso_mas_hw_potencia  != null || proceso?.peso_mas_ubicaciones    != null
                 || proceso?.peso_otros != null;
  if (hasSubTec) {
    if (proceso?.peso_proyecto_tecnico    != null) criterios.push({ nombre: "Proyecto técnico",   peso: proceso.peso_proyecto_tecnico,    color: C.blue  });
    if (proceso?.peso_construccion_tiempo != null) criterios.push({ nombre: "Plazo construcción", peso: proceso.peso_construccion_tiempo, color: C.teal  });
    if (proceso?.peso_mas_hw_potencia     != null) criterios.push({ nombre: "Más HW/potencia",    peso: proceso.peso_mas_hw_potencia,     color: C.green });
    if (proceso?.peso_mas_ubicaciones     != null) criterios.push({ nombre: "Más ubicaciones",    peso: proceso.peso_mas_ubicaciones,     color: C.purple });
    if (proceso?.peso_otros               != null) criterios.push({ nombre: "Otros técnicos",     peso: proceso.peso_otros,               color: C.red });
  } else if (proceso?.peso_tecnico != null) {
    criterios.push({ nombre: "Técnico", peso: proceso.peso_tecnico, color: C.blue });
  }
  criterios.sort((a, b) => b.peso - a.peso);
  const sumCri = criterios.reduce((s, c) => s + c.peso, 0);
  const mostrarDonut = criterios.length >= 2;

  return (
    <Section title="🏢 Concesión demanial">
      <div style={{ display: "grid", gridTemplateColumns: tieneMixHW ? "minmax(0,1.4fr) minmax(0,1fr)" : "1fr", gap: 16 }}>
        <div>
          <SubTitle>📜 Términos del pliego</SubTitle>
          <Kv label="Plazo concesión" value={concesion.plazo_anos != null ? `${concesion.plazo_anos} años` : <span style={{ color: C.dim }}>N/A</span>} />
          <Kv label="Renovación" value={
            concesion.renovacion_anos != null && concesion.renovacion_anos > 0
              ? <span style={{ color: C.green }}>✅ {concesion.renovacion_anos} años adicionales</span>
              : <span style={{ color: C.dim }}>No prevista</span>
          } />
          <Kv label="Inicio" value={concesion.tipo_inicio ? (TIPO_INICIO_LABEL[concesion.tipo_inicio] ?? concesion.tipo_inicio) : <span style={{ color: C.dim }}>N/A</span>} />
          <Kv label="Fecha inicio" value={concesion.fecha_inicio ?? <span style={{ color: C.dim }}>N/A</span>} />
          <Kv label="Plazo construcción" value={concesion.plazo_construccion_meses != null ? `${concesion.plazo_construccion_meses} meses` : <span style={{ color: C.dim }}>N/A</span>} />
          <Kv label="Tipo retribución" value={concesion.tipo_retribucion ? (TIPO_RETRIB_LABEL[concesion.tipo_retribucion] ?? concesion.tipo_retribucion) : <span style={{ color: C.dim }}>N/A</span>} />
          <Kv label="Importe base" value={lic.importe_base != null ? fmtEur(lic.importe_base) : <span style={{ color: C.dim }}>N/A</span>} />
          {lic.importe_estimado != null && lic.importe_estimado !== lic.importe_base && (
            <Kv label="Importe estimado" value={fmtEur(lic.importe_estimado)} />
          )}
          <Kv label="Importe adjudicado" value={lic.importe_adjudicado != null ? fmtEur(lic.importe_adjudicado) : <span style={{ color: C.dim }}>N/A</span>} />

          <SubTitle>🔌 Hardware exigido</SubTitle>
          <Kv label="N.º ubicaciones" value={concesion.num_ubicaciones != null ? String(concesion.num_ubicaciones) : <span style={{ color: C.dim }}>N/A</span>} />
          <Kv label="Tecnología" value={concesion.tecnologia_requerida ? fmtTipoHw(concesion.tecnologia_requerida) : <span style={{ color: C.dim }}>N/A</span>} />
          <Kv label="Mín. puntos de carga"
              value={concesion.num_cargadores_minimo != null
                ? `${concesion.num_cargadores_minimo}${concesion.num_cargadores_opcional ? " · opcional ofertar más" : ""}`
                : <span style={{ color: C.dim }}>N/A</span>} />
          <Kv label="Pot. mín. por punto"
              value={concesion.potencia_minima_por_cargador_kw != null
                ? `${concesion.potencia_minima_por_cargador_kw} kW${concesion.potencia_opcional_subible ? " · subible" : ""}`
                : <span style={{ color: C.dim }}>N/A</span>} />
          <Kv label="Potencia disponible"
              value={concesion.potencia_disponible_kw != null
                ? `${concesion.potencia_disponible_kw.toLocaleString("es-ES")} kW${concesion.potencia_garantizada ? " · ✅ garantizada" : " · ⚠ no garantizada"}`
                : <span style={{ color: C.dim }}>N/A</span>} />

          {(concesion.hardware_especificaciones?.length ?? 0) > 0 && (
            <div style={{ marginTop: 10 }}>
              <ExplicacionButton
                label="📖 HW explicado"
                modalTitulo="Hardware exigido — especificaciones del pliego"
                contenido={concesion.hardware_especificaciones!}
              />
            </div>
          )}

          {concesion.tipo_retribucion === "venta_energia_usuario" ? (
            <>
              <SubTitle>⚡ Precio de venta de energía al usuario</SubTitle>
              <Kv label="Precio máximo (€/kWh)" value={concesion.precio_max_kwh_usuario != null ? `${concesion.precio_max_kwh_usuario.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh` : <span style={{ color: C.dim }}>N/A</span>} />
              <Kv label="Precio ofertado ganador" value={concesion.precio_kwh_ofertado_ganador != null ? `${concesion.precio_kwh_ofertado_ganador.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh` : <span style={{ color: C.dim }}>N/A</span>} />
              <Kv label="Compromiso mantener precio" value={concesion.mantenimiento_precio_anos != null ? `${concesion.mantenimiento_precio_anos} años` : <span style={{ color: C.dim }}>N/A</span>} />
              <p style={{ fontSize: 10, color: C.dim, marginTop: 6, lineHeight: 1.45 }}>
                ℹ️ En esta variante el adjudicatario NO paga canon al órgano contratante. El órgano puntúa al licitador que ofrece el precio más bajo de la energía vendida al usuario final.
              </p>
            </>
          ) : (
            <>
              {/* Canon basado en €/m² del valor del suelo (spec §4.ter N) */}
              {(concesion.canon_eur_m2_ano != null
                || concesion.valor_suelo_eur_m2_ano != null
                || concesion.canon_pct_valor_suelo != null
                || concesion.superficie_minima_m2 != null
                || concesion.superficie_maxima_m2 != null) && (
                <>
                  <SubTitle>📐 Canon mínimo unitario (€/m²)</SubTitle>
                  <Kv
                    label="Canon mínimo €/m²/año"
                    value={
                      concesion.canon_eur_m2_ano != null
                        ? <strong>{concesion.canon_eur_m2_ano.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/m²/año</strong>
                        : <span style={{ color: C.dim }}>N/A</span>
                    }
                  />
                  {(concesion.canon_pct_valor_suelo != null || concesion.valor_suelo_eur_m2_ano != null) && (
                    <Kv
                      label="Cálculo"
                      value={
                        <span style={{ color: C.dim, fontSize: 13 }}>
                          {concesion.canon_pct_valor_suelo != null ? `${concesion.canon_pct_valor_suelo} %` : "—"}
                          {" × "}
                          {concesion.valor_suelo_eur_m2_ano != null ? `${concesion.valor_suelo_eur_m2_ano.toLocaleString("es-ES", { maximumFractionDigits: 2 })} €/m²/año` : "—"}
                          {" (valor del suelo)"}
                        </span>
                      }
                    />
                  )}
                  {(concesion.superficie_minima_m2 != null || concesion.superficie_maxima_m2 != null) && (
                    <Kv
                      label="Superficie por ubicación"
                      value={
                        concesion.superficie_minima_m2 != null && concesion.superficie_maxima_m2 != null
                          ? `${concesion.superficie_minima_m2.toLocaleString("es-ES")}–${concesion.superficie_maxima_m2.toLocaleString("es-ES")} m²`
                          : (concesion.superficie_minima_m2 != null ? `mín ${concesion.superficie_minima_m2} m²` : `máx ${concesion.superficie_maxima_m2} m²`)
                      }
                    />
                  )}
                </>
              )}

              <SubTitle>💰 Canon exigido</SubTitle>
              <Kv label="Canon fijo mínimo" value={concesion.canon_minimo_anual != null ? `${fmtEurExact(concesion.canon_minimo_anual)}/año` : <span style={{ color: C.dim }}>N/A</span>} />
              <Kv label="Por ubicación" value={concesion.canon_por_ubicacion_anual != null ? `${fmtEurExact(concesion.canon_por_ubicacion_anual)}/ubic./año` : <span style={{ color: C.dim }}>N/A</span>} />
              <Kv label="Por punto de carga" value={concesion.canon_por_cargador != null ? `${fmtEurExact(concesion.canon_por_cargador)}/punto/año` : <span style={{ color: C.dim }}>N/A</span>} />
              <Kv label="Variable mínimo (€/kWh)" value={concesion.canon_variable_eur_kwh != null ? `${concesion.canon_variable_eur_kwh.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh` : <span style={{ color: C.dim }}>N/A</span>} />
              <Kv label="Variable mínimo (%)" value={concesion.canon_variable_pct != null ? `${concesion.canon_variable_pct}% s/ facturación` : <span style={{ color: C.dim }}>N/A</span>} />
              {concesion.canon_explicacion && (
                <div style={{ marginTop: 10 }}>
                  <ExplicacionButton
                    label="📖 Canon explicado"
                    modalTitulo="Canon exigido — desglose del cálculo"
                    contenido={concesion.canon_explicacion}
                  />
                </div>
              )}
            </>
          )}

          {(proceso?.mejoras_puntuables?.length ?? 0) > 0 && (
            <CriteriosTabla
              titulo="✨ Criterios automáticos por fórmulas"
              subtitulo="Lo que el licitador oferta sobre el mínimo del pliego, evaluable mecánicamente."
              items={proceso!.mejoras_puntuables!}
            />
          )}
          {(proceso?.criterios_juicio_valor?.length ?? 0) > 0 && (
            <CriteriosTabla
              titulo="🧠 Criterios de juicio de valor"
              subtitulo="Aspectos cualitativos evaluados por la mesa de contratación."
              items={proceso!.criterios_juicio_valor!}
            />
          )}
        </div>

        {tieneMixHW && (
          <div>
            <SubTitle>📊 Mix de tecnología declarada</SubTitle>
            <div style={{ background: C.row, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 10px" }}>
              <BarMixHW mix={mixHW} height={170} />
            </div>
            <p style={{ fontSize: 10, color: C.dim, marginTop: 6 }}>
              Cargadores por tipo de conector declarados por el adjudicatario.
            </p>
          </div>
        )}
      </div>

      {/* Pesos de criterios — dentro de Concesión demanial */}
      {mostrarDonut && (
        <div style={{ marginTop: 16 }}>
          <SubTitle>⚖️ Pesos de criterios de adjudicación</SubTitle>
          <div style={{ background: C.row, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
            {/* Barra única apilada horizontal */}
            <div style={{ display: "flex", width: "100%", height: 28, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
              {criterios.map((c) => {
                const pctW = (c.peso / (sumCri || 100)) * 100;
                return (
                  <div key={c.nombre} title={`${c.nombre}: ${c.peso}%`}
                    style={{
                      width: `${pctW}%`, background: c.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#0a0f1a", fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    }}>
                    {pctW >= 6 ? `${c.peso}%` : ""}
                  </div>
                );
              })}
            </div>
            {/* Leyenda inline */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
              {criterios.map((c) => (
                <div key={c.nombre} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                  <span style={{ color: C.text, whiteSpace: "nowrap" }}>{c.nombre}</span>
                </div>
              ))}
            </div>
            {/* Nota cuando la suma del pliego ≠ 100 (errata interna del documento original) */}
            {Math.abs(sumCri - 100) > 1 && sumCri > 0 && (
              <div style={{
                marginTop: 14,
                padding: "10px 12px",
                background: "rgba(251,191,36,0.08)",
                border: `1px solid rgba(251,191,36,0.32)`,
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.55,
                color: C.text,
              }}>
                <span style={{ color: C.amber, fontWeight: 700 }}>ℹ️ Suma {sumCri} pts (no 100)</span>
                {" — "}
                Esta cifra <strong>refleja literalmente lo que dice el pliego</strong> original; no es un error de
                nuestra extracción. El documento {sumCri > 100 ? "asigna más" : "deja menos"} de 100 pts en total
                porque el redactor publicó ponderaciones inconsistentes entre el articulado y el modelo de oferta
                económica del Anexo I (errata interna del pliego). Preservamos los valores exactos del Anexo I que
                firma el licitador para fidelidad documental. Sin Q&A oficial del órgano que aclare la
                ponderación intencionada, la suma queda como está en el pliego.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Otros requisitos exigidos — colapsable, debajo de pesos */}
      {proceso?.requisitos && (
        ((proceso.requisitos.solvencia_economica?.length ?? 0) +
         (proceso.requisitos.solvencia_tecnica?.length ?? 0) +
         (proceso.requisitos.adicionales?.length ?? 0)) > 0
      ) && (
        <details style={{ marginTop: 14, padding: "12px 16px", background: C.row, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            ⚠️ Otros requisitos exigidos
          </summary>
          <div style={{ marginTop: 12 }}>
            {(proceso.requisitos.solvencia_economica?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, marginBottom: 4, letterSpacing: "0.05em" }}>💰 Solvencia económica</div>
                {proceso.requisitos.solvencia_economica!.map((r, i) => <RequisitoRow key={i} r={r} accent={C.amber} />)}
              </div>
            )}
            {(proceso.requisitos.solvencia_tecnica?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, marginBottom: 4, letterSpacing: "0.05em" }}>🔧 Solvencia técnica</div>
                {proceso.requisitos.solvencia_tecnica!.map((r, i) => <RequisitoRow key={i} r={r} accent={C.blue} />)}
              </div>
            )}
            {(proceso.requisitos.adicionales?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, marginBottom: 4, letterSpacing: "0.05em" }}>📌 Adicionales</div>
                {proceso.requisitos.adicionales!.map((r, i) => <RequisitoRow key={i} r={r} accent={C.purple} />)}
              </div>
            )}
          </div>
        </details>
      )}

    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANTES (listado simple para vista Alfa / no adjudicada)
// ─────────────────────────────────────────────────────────────────────────────

function ParticipantesBlock({
  adj, par, exc,
}: {
  adj: Licitador[]; par: Licitador[]; exc: Licitador[];
}) {
  const total = adj.length + par.length + exc.length;
  if (total === 0) {
    return (
      <Section title="👥 Participantes">
        <FasePendiente text="Sin licitadores cargados todavía. Los no ganadores se extraen del acta de apertura (fase 2 LLM)." />
      </Section>
    );
  }

  const soloUno = total === 1 && adj.length === 1;

  return (
    <Section title="👥 Participantes">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {soloUno && (
          <div style={{ padding: "8px 12px", background: `${C.amber}0a`, border: `1px dashed ${C.amber}44`, borderRadius: 8, fontSize: 11, color: C.muted }}>
            <span style={{ color: C.amber, fontWeight: 700 }}>ℹ️ Único licitador · </span>
            Solo una empresa se presentó al concurso.
          </div>
        )}
        {[...adj, ...par, ...exc].map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "8px 10px", background: C.row, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}>
            <span style={{ color: C.text }}>
              {displayName(l)}
              {l.es_ute && <span style={{ marginLeft: 6, color: C.amber, fontSize: 9, fontWeight: 800 }}>UTE</span>}
            </span>
            <span style={{ color: l.rol === "adjudicataria" ? C.green : l.rol === "excluida" ? C.red : C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {l.rol === "adjudicataria" ? "Adjudicataria" : l.rol === "excluida" ? "Excluida" : "Participante"}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RANKING (Vista Beta: licitación adjudicada) — PodioMini + tabla consolidada
// ─────────────────────────────────────────────────────────────────────────────

function RankingBlock({ adj, par, exc, concesion, winner, notas }: {
  adj: Licitador[]; par: Licitador[]; exc: Licitador[]; concesion?: Concesion; winner?: Licitador; notas?: string[];
}) {
  const ranking = [...adj, ...par]
    .filter((l) => l.puntuacion_total != null || l.oferta_canon_anual != null || l.oferta_canon_variable_eur_kwh != null || l.oferta_precio_kwh_usuario != null)
    .sort((a, b) => {
      const ap = a.puntuacion_total ?? -Infinity;
      const bp = b.puntuacion_total ?? -Infinity;
      if (ap !== bp) return bp - ap;
      return (b.oferta_canon_anual ?? 0) - (a.oferta_canon_anual ?? 0);
    });
  if (ranking.length + exc.length === 0) return null;

  const showVar  = ranking.some((l) => l.oferta_canon_variable_eur_kwh != null);
  const showDesc = ranking.some((l) => l.oferta_descuento_residentes_pct != null);

  const puntuaciones = ranking
    .filter((l) => l.puntuacion_total != null || l.puntuacion_economica != null || l.puntuacion_tecnica != null)
    .map((l) => ({
      nombre: displayName(l),
      puntuacion_economica: l.puntuacion_economica,
      puntuacion_tecnica:   l.puntuacion_tecnica,
      puntuacion_total:     l.puntuacion_total,
      rank:                 l.rank_position,
      esGanador:            l === winner || l.rol === "adjudicataria",
    }));

  return (
    <div style={{ marginBottom: 20 }}>
      <details open>
        <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          🏆 Ranking y Ofertas
        </summary>
        <div style={{
          padding: "16px 18px",
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
        }}>
          {puntuaciones.length >= 2 && (
            <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
              <PuntuacionesLeaderboard puntuaciones={puntuaciones} />
            </div>
          )}
          <TablaOfertas ranking={ranking} excluidos={exc} showVar={showVar} showDesc={showDesc} />
          {ranking.length >= 2 && (ranking.some((l) => l.oferta_canon_anual != null) || ranking.some((l) => l.oferta_canon_variable_eur_kwh != null)) && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                Comparación de canon ofertado
              </div>
              <ComparacionCanon ranking={ranking} winner={winner} />
            </div>
          )}
        </div>
      </details>

      {(notas?.length ?? 0) > 0 && (
        <details style={{ marginTop: 20 }} open>
          <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            📝 Notas sobre la adjudicación
          </summary>
          <div style={{ marginTop: 12, padding: "16px 18px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
            <BulletList items={notas!} color={C.green} textColor={C.text} />
          </div>
        </details>
      )}
    </div>
  );
}

type PuntItem = {
  nombre: string;
  puntuacion_economica?: number;
  puntuacion_tecnica?: number;
  puntuacion_total?: number;
  rank?: number;
  esGanador?: boolean;
};

function PuntuacionesLeaderboard({ puntuaciones }: { puntuaciones: PuntItem[] }) {
  const ECON = "#e8b4a0";
  const TEC  = "#8b9fc4";
  const maxTotal = Math.max(100, ...puntuaciones.map((p) => p.puntuacion_total ?? 0));

  return (
    <div style={{
      padding: "18px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      {/* Leyenda — Técnica primero (lo no-canon), Canon (económica) al final */}
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.muted, justifyContent: "flex-end" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: TEC }} /> Técnica (no-canon)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: ECON }} /> Canon (económica)
        </span>
      </div>

      {puntuaciones.map((p, i) => {
        const econ = p.puntuacion_economica ?? 0;
        const tec  = p.puntuacion_tecnica   ?? 0;
        const tot  = p.puntuacion_total     ?? (econ + tec);
        const econW = (econ / maxTotal) * 100;
        const tecW  = (tec  / maxTotal) * 100;
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 200px) 1fr 58px", gap: 16, alignItems: "center" }}>
            {/* Empresa */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: p.esGanador ? C.green : C.dim, width: 14, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {p.rank ?? i + 1}
              </span>
              <span style={{ fontSize: 13, fontWeight: p.esGanador ? 600 : 500, color: p.esGanador ? C.green : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.nombre}>
                {p.nombre}
              </span>
            </div>

            {/* Barra stacked: técnica primero (lo que muchas veces todos cumplen al máximo),
                canon después (la diferenciación real). Así se ve claramente cuándo el canon decide. */}
            <div style={{ position: "relative", height: 26, background: "rgba(255,255,255,0.04)", borderRadius: 6, overflow: "hidden", display: "flex" }}>
              {tec > 0 && (
                <div style={{
                  width: `${tecW}%`,
                  background: TEC,
                  display: "flex", alignItems: "center", justifyContent: "flex-end",
                  padding: "0 8px",
                  fontSize: 11, fontWeight: 700, color: "#1a1a1a",
                  fontVariantNumeric: "tabular-nums",
                  minWidth: tec > 0 ? 4 : 0,
                }}>
                  {tecW > 10 ? tec.toFixed(1) : ""}
                </div>
              )}
              {econ > 0 && (
                <div style={{
                  width: `${econW}%`,
                  background: ECON,
                  display: "flex", alignItems: "center", justifyContent: "flex-end",
                  padding: "0 8px",
                  fontSize: 11, fontWeight: 700, color: "#1a1a1a",
                  fontVariantNumeric: "tabular-nums",
                  minWidth: econ > 0 ? 4 : 0,
                }}>
                  {econW > 10 ? econ.toFixed(1) : ""}
                </div>
              )}
            </div>

            {/* Total */}
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: p.esGanador ? C.green : C.text, letterSpacing: "-0.02em" }}>
                {tot.toFixed(0)}
              </span>
              <span style={{ fontSize: 10, color: C.dim, marginLeft: 2 }}>/100</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComparacionCanon({ ranking, winner }: { ranking: Licitador[]; winner?: Licitador }) {
  const esGanador = (l: Licitador, idx: number) =>
    l === winner || l.rol === "adjudicataria" || (winner == null && idx === 0);

  const fijos = ranking
    .map((l, idx) => ({ l, idx }))
    .filter(({ l }) => l.oferta_canon_anual != null)
    .map(({ l, idx }) => ({ nombre: displayName(l), valor: l.oferta_canon_anual!, esGanador: esGanador(l, idx) }));
  const vars_ = ranking
    .map((l, idx) => ({ l, idx }))
    .filter(({ l }) => l.oferta_canon_variable_eur_kwh != null)
    .map(({ l, idx }) => ({ nombre: displayName(l), valor: l.oferta_canon_variable_eur_kwh!, esGanador: esGanador(l, idx) }));

  if (fijos.length === 0 && vars_.length === 0) return null;

  const twoCols = fijos.length > 0 && vars_.length > 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: twoCols ? "1fr 1fr" : "1fr", gap: 16 }}>
      {fijos.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
            Canon fijo
          </div>
          <BarCanonOferta licitadores={fijos} tipo="fijo" />
        </div>
      )}
      {vars_.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
            Canon variable
          </div>
          <BarCanonOferta licitadores={vars_} tipo="variable" />
        </div>
      )}
    </div>
  );
}

function TablaOfertas({
  ranking, excluidos, showVar, showDesc,
}: {
  ranking: Licitador[]; excluidos: Licitador[]; showVar: boolean; showDesc: boolean;
}) {
  const criteriosTec: string[] = [];
  for (const l of ranking) {
    for (const d of (l.puntuaciones_detalle ?? [])) {
      if (!criteriosTec.includes(d.nombre)) criteriosTec.push(d.nombre);
    }
  }

  const gridCols = [
    "28px",
    "minmax(80px, 0.9fr)",
    "minmax(90px, 0.7fr)",
    ...(showVar  ? ["minmax(90px, 0.7fr)"] : []),
    ...(showDesc ? ["minmax(90px, 0.7fr)"] : []),
    ...criteriosTec.map(() => "minmax(180px, 2.2fr)"),
    "68px",
  ].join(" ");

  const headers = [
    "#", "Empresa", "Canon fijo",
    ...(showVar  ? ["Canon variable"] : []),
    ...(showDesc ? ["Desc. resid."] : []),
    ...criteriosTec,
    "Puntos",
  ];

  // Ancho mínimo para que el grid no se aplaste y active el scroll horizontal
  // del wrapper externo cuando hay muchas columnas técnicas (Mancomunitat = 8).
  const minWidthPx = 28 + 80 + 90
    + (showVar  ? 90 : 0)
    + (showDesc ? 90 : 0)
    + criteriosTec.length * 180
    + 68
    + (headers.length - 1) * 16; // padding lateral por celda

  return (
    <div style={{ fontSize: 12, overflowX: "auto", overflowY: "visible", maxWidth: "100%" }}>
    <div style={{ minWidth: minWidthPx }}>
      <div style={{
        display: "grid", gridTemplateColumns: gridCols, gap: 0,
        paddingBottom: 8, borderBottom: `1px solid ${C.border}`,
        fontSize: 10, color: C.dim, fontWeight: 700, letterSpacing: "0.04em",
      }}>
        {headers.map((h, i) => (
          <div key={i} style={{ padding: "0 8px", textAlign: i === headers.length - 1 ? "right" : "left", textTransform: "uppercase" }}>
            {h}
          </div>
        ))}
      </div>

      {ranking.map((l, idx) => {
        const esGan = idx === 0 || l.rol === "adjudicataria";
        const ofertaFija = l.oferta_canon_anual ?? null;
        const ofertaVar  = l.oferta_canon_variable_eur_kwh ?? null;
        return (
          <div key={idx} style={{
            display: "grid", gridTemplateColumns: gridCols, gap: 0,
            padding: "12px 0", borderBottom: `1px solid ${C.border}`,
            alignItems: "flex-start",
            background: esGan ? "rgba(52,211,153,0.06)" : "transparent",
          }}>
            <div style={{ padding: "0 8px", color: esGan ? C.green : C.dim, fontWeight: 700, fontSize: 13 }}>
              {l.rank_position ?? idx + 1}
            </div>
            <div style={{ padding: "0 8px", minWidth: 0 }}>
              <div style={{ color: C.text, fontWeight: esGan ? 600 : 500, fontSize: 13, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.nombre}>
                  {displayName(l)}
                </span>
                {esGan && <span style={{ fontSize: 10 }}>🏆</span>}
                {l.es_ute && <span style={{ fontSize: 9, color: C.amber, fontWeight: 800 }}>UTE</span>}
              </div>
              {l.nombre_comercial && l.nombre_comercial !== l.nombre && (
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.nombre}
                </div>
              )}
            </div>
            <div style={{ padding: "0 8px", fontVariantNumeric: "tabular-nums", color: C.text }}>
              {ofertaFija != null
                ? <div style={{ color: C.text }}>{fmtEurExact(ofertaFija, "/año")}</div>
                : <span style={{ color: C.dim }}>—</span>}
            </div>
            {showVar && (
              <div style={{ padding: "0 8px", fontVariantNumeric: "tabular-nums" }}>
                {ofertaVar != null
                  ? <div style={{ color: C.text }}>{ofertaVar.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh</div>
                  : <span style={{ color: C.dim }}>—</span>}
              </div>
            )}
            {showDesc && (
              <div style={{ padding: "0 8px", fontVariantNumeric: "tabular-nums", color: l.oferta_descuento_residentes_pct != null ? C.blue : C.dim }}>
                {l.oferta_descuento_residentes_pct != null ? `${l.oferta_descuento_residentes_pct}%` : "—"}
              </div>
            )}
            {criteriosTec.map((c, ci) => {
              const d = (l.puntuaciones_detalle ?? []).find((x) => x.nombre === c);
              // Color del badge según ratio puntos/peso_max:
              //   ≥0.95 → verde (máximo o casi)
              //   ≥0.50 → amarillo (parcial)
              //   >0    → rojo (bajo)
              //    0    → gris (cero/no puntuado)
              let badgeColor = C.dim;
              if (d?.puntos != null && d?.peso_max != null && d.peso_max > 0) {
                const ratio = d.puntos / d.peso_max;
                if (ratio >= 0.95)      badgeColor = C.green;
                else if (ratio >= 0.50) badgeColor = C.amber;
                else if (ratio > 0)     badgeColor = C.red;
                else                    badgeColor = C.dim;
              }
              return (
                <div key={ci} style={{ padding: "0 8px", fontSize: 11, color: C.muted, lineHeight: 1.45, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div>{d?.oferta ?? <span style={{ color: C.dim }}>—</span>}</div>
                  {d?.puntos != null && d?.peso_max != null && (
                    <div
                      title={`${d.puntos} de ${d.peso_max} puntos posibles (${Math.round((d.puntos / d.peso_max) * 100)}%)`}
                      style={{
                        alignSelf: "flex-start",
                        fontSize: 11,
                        fontWeight: 800,
                        color: badgeColor,
                        background: `${badgeColor}1c`,
                        border: `1px solid ${badgeColor}55`,
                        borderRadius: 6,
                        padding: "3px 8px",
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.puntos}<span style={{ opacity: 0.6 }}> / {d.peso_max}</span> pts
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ padding: "0 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: esGan ? C.green : C.text, fontWeight: 600, fontSize: 14 }}>
              {l.puntuacion_total != null ? Math.round(l.puntuacion_total) : "—"}
            </div>
          </div>
        );
      })}

      {excluidos.map((l, idx) => (
        <div key={`exc${idx}`} style={{
          display: "grid", gridTemplateColumns: gridCols, gap: 0,
          padding: "11px 0", borderBottom: `1px solid ${C.border}`, alignItems: "flex-start",
          background: `${C.red}0c`,
        }}>
          <div style={{ padding: "2px 8px 0", color: C.red, fontSize: 9, fontWeight: 800, letterSpacing: "0.06em" }}>EXC</div>
          <div style={{ padding: "0 8px", gridColumn: `span ${headers.length - 1}`, minWidth: 0 }}>
            <div style={{ color: C.muted, fontSize: 13 }}>
              {displayName(l)}
              {l.es_ute && <span style={{ marginLeft: 6, fontSize: 9, color: C.dim }}>UTE</span>}
            </div>
            {l.motivo_exclusion && (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>{l.motivo_exclusion}</div>
            )}
          </div>
        </div>
      ))}

    </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UBICACIONES
// ─────────────────────────────────────────────────────────────────────────────

function UbicacionesBlock({ ubicaciones, concesion }: { ubicaciones: UbicacionConcesion[]; concesion?: Concesion }) {
  if (ubicaciones.length === 0) {
    return (
      <div style={{ padding: "20px 24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 13, color: C.dim, textAlign: "center" }}>
        N/A — sin ubicaciones cargadas en el expediente.
      </div>
    );
  }
  const sumaCargadores = ubicaciones.reduce((s, u) => s + (u.cargadores_total ?? 0), 0);
  // Si el sumatorio es menor al total declarado en concesion, usar el top-level
  const totalCargadoresTop = concesion?.num_cargadores ?? concesion?.num_cargadores_minimo ?? null;
  const totalCargadores = (totalCargadoresTop != null && totalCargadoresTop >= sumaCargadores) ? totalCargadoresTop : sumaCargadores;
  const totalUbicaciones = concesion?.num_ubicaciones ?? ubicaciones.length;

  return (
    <div style={{ padding: "16px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 20 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        {totalUbicaciones > 0 && <MiniStat label="📍 Total ubicaciones" value={fmtNum(totalUbicaciones)} color={C.blue} />}
        {totalCargadores  > 0 && <MiniStat label="🔌 Total puntos de carga" value={fmtNum(totalCargadores)} color={C.green} />}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        {ubicaciones.map((u, i) => {
          const mapsUrl =
            u.google_maps_url
              ?? (u.latitud != null && u.longitud != null
                    ? `https://www.google.com/maps?q=${u.latitud},${u.longitud}`
                    : (u.direccion
                          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${u.direccion}${u.municipio ? `, ${u.municipio}` : ""}`)}`
                          : null));
          return (
            <div key={i} style={{ padding: "12px 14px", background: u.es_existente ? `${C.amber}0a` : C.row, border: `1px solid ${u.es_existente ? `${C.amber}55` : C.border}`, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 22,
                    height: 22,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: `${C.purple}22`,
                    border: `1px solid ${C.purple}55`,
                    color: C.purple,
                    fontSize: 11,
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {i + 1}
                  </span>
                  📍 {u.nombre ?? `Ubicación ${i + 1}`}
                  {u.es_existente && <Chip label="EXISTENTE" color={C.amber} />}
                  {u.es_opcional && <Chip label="OPCIONAL" color={C.amber} />}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                  {u.tipo_hw && <Chip label={fmtTipoHw(u.tipo_hw)} color={C.blue} />}
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                       style={{ fontSize: 10, fontWeight: 700, color: C.teal, background: `${C.teal}18`, border: `1px solid ${C.teal}33`, borderRadius: 6, padding: "3px 9px", textDecoration: "none", whiteSpace: "nowrap" }}>
                      Maps ↗
                    </a>
                  )}
                  {u.plano_url && (
                    <a href={u.plano_url} target="_blank" rel="noopener noreferrer"
                       title={u.plano_label ?? "Plano del pliego"}
                       style={{ fontSize: 10, fontWeight: 700, color: C.purple, background: `${C.purple}18`, border: `1px solid ${C.purple}33`, borderRadius: 6, padding: "3px 9px", textDecoration: "none", whiteSpace: "nowrap" }}>
                      📐 {u.plano_label ?? "Plano"} ↗
                    </a>
                  )}
                </div>
              </div>
              {(u.direccion || u.municipio) && (
                <div style={{ fontSize: 11, color: C.muted }}>{[u.direccion, u.municipio].filter(Boolean).join(" · ")}</div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", fontSize: 11, color: C.muted }}>
                {/* Mostramos puntos de carga (= plazas con cable). El campo `plazas` está deprecado y no se renderiza. */}
                {u.cargadores_total  != null && <span title="Puntos de carga (= plazas con cable disponible)">🔌 <b style={{ color: C.text }}>{u.cargadores_total}</b></span>}
                {u.cargadores_ac     != null && <span style={{ color: C.purple }}>AC <b>{u.cargadores_ac}</b></span>}
                {u.cargadores_dc     != null && <span style={{ color: C.blue }}>DC <b>{u.cargadores_dc}</b></span>}
                {u.cargadores_dc_plus != null && <span style={{ color: C.green }}>DC+ <b>{u.cargadores_dc_plus}</b></span>}
                {u.cargadores_hpc    != null && <span style={{ color: C.amber }}>HPC <b>{u.cargadores_hpc}</b></span>}
                {u.potencia_total_kw != null && <span>⚡ <b style={{ color: C.text }}>{u.potencia_total_kw} kW</b></span>}
                {/* Split por toma para tipo_hw mixto (o cualquier ubicación con AC/DC/HPC explícitos). Si no hay split, fallback al campo legacy. */}
                {(() => {
                  const ac = u.potencia_ac_kw;
                  const dc = u.potencia_dc_kw;
                  const hpc = u.potencia_hpc_kw;
                  const haySplit = ac != null || dc != null || hpc != null;
                  if (haySplit) {
                    return (
                      <>
                        {ac  != null && <span title="Potencia toma AC (modo 3, Mennekes Tipo 2)" style={{ color: C.purple }}>⚡AC <b>{ac} kW</b></span>}
                        {dc  != null && <span title="Potencia toma DC (modo 4, CCS Combo2)" style={{ color: C.blue }}>⚡DC <b>{dc} kW</b></span>}
                        {hpc != null && <span title="Potencia toma HPC (high-power charging)" style={{ color: C.amber }}>⚡HPC <b>{hpc} kW</b></span>}
                      </>
                    );
                  }
                  if (u.potencia_por_cargador_kw != null) {
                    return <span title="Potencia por punto de carga">⚡/punto <b style={{ color: C.text }}>{u.potencia_por_cargador_kw} kW</b></span>;
                  }
                  return null;
                })()}
                {u.plazo_pem_meses   != null && <span>⏱️ PeM <b>{u.plazo_pem_meses}m</b></span>}
              </div>
              {u.notas && <div style={{ fontSize: 11, color: C.dim, marginTop: 6, fontStyle: "italic" }}>💬 {u.notas}</div>}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE DE FECHAS
// ─────────────────────────────────────────────────────────────────────────────

function TimelineFechas({ lic }: { lic: LicitacionItem }) {
  // Siempre los 4 hitos canónicos, con "N/A" si falta
  const hitos: Array<{ fecha?: string; label: string }> = [
    { label: "Publicación",   fecha: lic.fecha_publicacion },
    { label: "Límite ofertas", fecha: lic.fecha_limite },
    { label: "Adjudicación",   fecha: lic.fecha_adjudicacion },
    { label: "Formalización",  fecha: lic.fecha_formalizacion },
  ];

  return (
    <Section title="📅 Fechas clave" compact fill>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {hitos.map((h, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", fontSize: 11, gap: 8 }}>
            <span style={{ color: C.text, fontWeight: 700, flex: 1 }}>{h.label}</span>
            <span style={{ color: h.fecha ? C.muted : C.dim, fontVariantNumeric: "tabular-nums" }}>
              {h.fecha ?? "N/A"}
            </span>
          </li>
        ))}
        <li style={{ display: "flex", alignItems: "center", fontSize: 11, gap: 8 }}>
          <span style={{ color: C.text, fontWeight: 700, flex: 1 }}>Días de aviso</span>
          <span style={{ color: lic.dias_aviso != null ? C.muted : C.dim }}>
            {lic.dias_aviso != null ? `${lic.dias_aviso} días` : "N/A"}
          </span>
        </li>
      </ol>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GARANTÍAS
// ─────────────────────────────────────────────────────────────────────────────

function GarantiasBlock({ garantias }: { garantias: Partial<NonNullable<ProcesoLicitacion["garantias"]>> }) {
  const tieneProv = garantias.provisional_exigida === true || garantias.provisional_eur != null || garantias.provisional_pct != null;
  const tieneDef  = garantias.definitiva_eur != null || garantias.definitiva_pct != null;
  const provisionalNoExigida = garantias.provisional_exigida === false;
  return (
    <Section title="🛡️ Garantías exigidas" compact>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ padding: "8px 10px", background: `${C.amber}0a`, border: `1px solid ${C.amber}33`, borderRadius: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.amber, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            🔒 Provisional · para ofertar
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginTop: 2 }}>
            {tieneProv
              ? (garantias.provisional_eur != null
                  ? fmtEur(garantias.provisional_eur)
                  : garantias.provisional_pct != null
                      ? `${garantias.provisional_pct}%`
                      : "Exigida")
              : provisionalNoExigida
                ? <span style={{ color: C.muted }}>No exigida</span>
                : <span style={{ color: C.dim }}>N/A</span>}
          </div>
          {tieneProv && garantias.provisional_exigida !== false && (
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>💸 Reembolsable a no adjudicatarios</div>
          )}
        </div>
        <div style={{ padding: "8px 10px", background: `${C.green}0a`, border: `1px solid ${C.green}33`, borderRadius: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.green, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            🔐 Definitiva · al adjudicatario
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginTop: 2 }}>
            {tieneDef
              ? <>
                  {garantias.definitiva_eur != null ? fmtEur(garantias.definitiva_eur) : ""}
                  {garantias.definitiva_pct != null && <span style={{ color: C.muted, fontSize: 11 }}>{garantias.definitiva_eur != null ? " · " : ""}{garantias.definitiva_pct}%</span>}
                </>
              : <span style={{ color: C.dim }}>N/A</span>}
          </div>
          {tieneDef && garantias.definitiva_base && (
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              sobre {garantias.definitiva_base.replace(/_/g, " ")}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WINNER BADGE (igual que antes, con canon variable + descuento)
// ─────────────────────────────────────────────────────────────────────────────

function WinnerBadge({ winner }: { winner: Licitador }) {
  return (
    <div style={{
      width: "100%",
      padding: "16px 22px", borderRadius: 12,
      background: "linear-gradient(135deg, rgba(52,211,153,0.14), rgba(52,211,153,0.04))",
      border: `1px solid ${C.green}44`,
      display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
    }}>
      {/* IZQ: trofeo + identidad */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "1 1 260px", minWidth: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", background: C.green,
          color: "#05160d", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 900, flexShrink: 0,
        }}>🏆</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", color: C.green, textTransform: "uppercase" }}>
            Ganador
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginTop: 2, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={winner.nombre}>
            {displayName(winner)}
            {winner.es_ute && <span style={{ fontSize: 11, marginLeft: 8, color: C.amber, fontWeight: 800 }}>UTE</span>}
          </div>
          {winner.nombre_comercial && winner.nombre_comercial !== winner.nombre && (
            <div style={{ fontSize: 10, color: C.dim, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {winner.nombre}
            </div>
          )}
        </div>
      </div>

      {/* DER: stats grandes */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
        {winner.puntuacion_total != null && (
          <WinnerStat label="Puntos" value={`${Math.round(winner.puntuacion_total)}/100`} color={C.text} />
        )}
        {winner.oferta_canon_anual != null && (
          <WinnerStat label="Canon fijo" value={fmtEurExact(winner.oferta_canon_anual, "/año")} color={C.text} />
        )}
        {winner.oferta_canon_variable_eur_kwh != null && (
          <WinnerStat label="Canon variable" value={`${winner.oferta_canon_variable_eur_kwh.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh`} color={C.text} />
        )}
        {winner.oferta_canon_variable_pct != null && (
          <WinnerStat label="Canon variable" value={`${winner.oferta_canon_variable_pct}%`} color={C.text} />
        )}
        {winner.oferta_descuento_residentes_pct != null && (
          <WinnerStat label="Descuento residentes" value={`${winner.oferta_descuento_residentes_pct}%`} color={C.purple} />
        )}
        {winner.oferta_precio_kwh_usuario != null && (
          <WinnerStat label="Precio al usuario" value={`${winner.oferta_precio_kwh_usuario.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh`} color={C.text} />
        )}
        {winner.oferta_mantenimiento_precio_anos != null && (
          <WinnerStat label="Mantiene precio" value={`${winner.oferta_mantenimiento_precio_anos} años`} color={C.purple} />
        )}
      </div>
    </div>
  );
}

function WinnerStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: "4px 28px",
      borderLeft: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1.1, whiteSpace: "nowrap" }}>
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVOS
// ─────────────────────────────────────────────────────────────────────────────

function RequisitoRow({ r, accent }: { r: RequisitoParticipacion; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", background: C.row, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 4 }}>
      <div style={{ width: 3, alignSelf: "stretch", background: accent, borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: C.text, fontWeight: r.critico ? 700 : 500 }}>
          {r.descripcion}
          {r.critico && <span style={{ fontSize: 9, marginLeft: 6, color: C.red, fontWeight: 800, letterSpacing: "0.06em" }}>⚠ CRÍTICO</span>}
        </div>
        {r.umbral && (
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
            <b style={{ color: C.text }}>Umbral:</b> {r.umbral}
          </div>
        )}
      </div>
    </div>
  );
}

function CriteriosTabla({ titulo, subtitulo, items }: { titulo: string; subtitulo?: string; items: Array<{ descripcion: string; puntos_max?: number }> }) {
  const total = items.reduce((s, m) => s + (m.puntos_max ?? 0), 0);
  return (
    <div style={{ marginTop: 16 }}>
      <SubTitle>{titulo}</SubTitle>
      {subtitulo && <p style={{ fontSize: 11, color: C.dim, margin: "0 0 8px 2px", lineHeight: 1.45 }}>{subtitulo}</p>}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 90px",
          padding: "8px 12px", background: "rgba(255,255,255,0.04)",
          fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          <div>Criterio</div>
          <div style={{ textAlign: "right" }}>Pts máx.</div>
        </div>
        {items.map((m, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr 90px",
            padding: "8px 12px", borderTop: `1px solid ${C.border}`,
            fontSize: 12, color: C.text, alignItems: "center",
          }}>
            <div style={{ lineHeight: 1.45 }}>{m.descripcion}</div>
            <div style={{ textAlign: "right", color: m.puntos_max != null ? C.text : C.dim, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {m.puntos_max != null ? `+${m.puntos_max}` : "—"}
            </div>
          </div>
        ))}
        {total > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 90px",
            padding: "8px 12px", borderTop: `1px solid ${C.border}`,
            fontSize: 11, color: C.muted, fontWeight: 700, alignItems: "center", background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ textAlign: "right", letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 10 }}>Subtotal</div>
            <div style={{ textAlign: "right", color: C.text, fontVariantNumeric: "tabular-nums" }}>{total} pts</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, small }: { label: string; value: string; color: string; small?: boolean }) {
  return (
    <div style={{ padding: small ? "6px 10px" : "8px 12px", background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 8, flex: small ? undefined : "0 1 auto" }}>
      <div style={{ fontSize: 9, color, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: small ? 13 : 16, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function BulletList({ items, color, textColor }: { items: string[]; color: string; textColor?: string }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map((t, i) => (
        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, color: textColor ?? C.muted, lineHeight: 1.55 }}>
          <span style={{
            flexShrink: 0, marginTop: 6,
            width: 6, height: 6, borderRadius: "50%",
            background: color, opacity: 0.75,
          }} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Chip({ label, color, title }: { label: string; color: string; title?: string }) {
  return (
    <span title={title} style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, borderRadius: 6, padding: "3px 9px", letterSpacing: "0.02em", whiteSpace: "nowrap", cursor: title ? "help" : undefined }}>
      {label}
    </span>
  );
}

function Section({ title, children, compact, fill }: { title: string; children: React.ReactNode; compact?: boolean; fill?: boolean }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: compact ? "18px 20px" : "22px 24px", height: fill ? "100%" : undefined, boxSizing: "border-box", display: fill ? "flex" : undefined, flexDirection: fill ? "column" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: compact ? 12 : 16 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: "linear-gradient(180deg,#34d399,#38bdf8)", flexShrink: 0 }} />
        <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 6 : 8, flex: fill ? 1 : undefined, justifyContent: fill ? "center" : undefined }}>{children}</div>
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 10, fontWeight: 800, color: C.purple, letterSpacing: "0.1em", textTransform: "uppercase", margin: "14px 0 6px" }}>
      {children}
    </h3>
  );
}

function Kv({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(140px,1fr) 2fr", gap: 12, alignItems: "baseline" }}>
      <span style={{ fontSize: 11, color: C.dim, letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ fontSize: 13, color: C.text, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function FasePendiente({ text }: { text?: string } = {}) {
  return (
    <div style={{ padding: "10px 12px", background: "rgba(251,191,36,0.05)", border: `1px dashed ${C.amber}55`, borderRadius: 10, marginTop: 10, fontSize: 11, color: C.muted }}>
      <span style={{ color: C.amber, fontWeight: 700 }}>⏳ Pendiente · </span>
      {text ?? "Datos profundos aún no extraídos. Fase 2: parseo LLM del pliego PDF."}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLA PLANA FINAL — resumen estructurado idéntico en todas las licitaciones
// Sin emojis. Dos columnas: campo / valor. Agrupado por sección.
// ─────────────────────────────────────────────────────────────────────────────

function TablaPlanaFinal({ lic, licitadores }: { lic: LicitacionItem; licitadores: Licitador[] }) {
  const con = lic.concesion;
  const proc = lic.proceso;
  const rows: Array<{ section?: string; campo: string; valor: React.ReactNode }> = [];

  const push = (section: string, campo: string, v: any) => {
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return;
    rows.push({ section, campo, valor: v });
  };

  // Identificación
  push("Identificación", "Expediente",          lic.expediente);
  push("Identificación", "Slug interno",        lic.slug);
  push("Identificación", "idEvl",               lic.idEvl);
  push("Identificación", "Título",              lic.titulo);
  push("Identificación", "Categoría",           categoriaLabel(lic.categoria));
  push("Identificación", "Subcategoría",        lic.subcategoria);
  push("Identificación", "Estado",              lic.estado ? (ESTADO_LABEL[lic.estado] ?? lic.estado) : null);

  // Órgano
  push("Órgano contratante", "Nombre",          lic.organo);
  push("Órgano contratante", "NIF",             lic.organo_nif);
  push("Órgano contratante", "Provincia",       lic.provincia);
  push("Órgano contratante", "CCAA",            lic.ccaa);
  push("Órgano contratante", "Ciudad",          lic.ciudad);

  // Contrato
  push("Contrato",    "Tipo de contrato",       lic.tipo_contrato);
  push("Contrato",    "Procedimiento",          (proc as any)?.tipo_adjudicacion);
  push("Contrato",    "Idioma pliego",          proc?.idioma_pliego);
  push("Contrato",    "CPVs",                   lic.cpvs?.join(", "));
  push("Contrato",    "Plazo ejecución",        lic.plazo_meses != null ? `${lic.plazo_meses} meses` : null);
  push("Contrato",    "Programa UE",            lic.programa_ue);
  push("Contrato",    "Financiación UE",        lic.financiacion_ue ? "Sí" : null);

  // Económico
  push("Económico",   "Importe base",           fmtEurNullable(lic.importe_base));
  push("Económico",   "Importe estimado",       fmtEurNullable(lic.importe_estimado));
  push("Económico",   "Importe adjudicado",     fmtEurNullable(lic.importe_adjudicado));

  // Fechas
  push("Fechas",      "Publicación",            lic.fecha_publicacion);
  push("Fechas",      "Límite de ofertas",      lic.fecha_limite);
  push("Fechas",      "Días de aviso",          lic.dias_aviso != null ? `${lic.dias_aviso} días` : null);
  push("Fechas",      "Adjudicación",           lic.fecha_adjudicacion);
  push("Fechas",      "Formalización",          lic.fecha_formalizacion);

  // Concesión
  if (con) {
    push("Concesión", "Plazo",                  con.plazo_anos != null ? `${con.plazo_anos} años` : null);
    push("Concesión", "Renovación",             con.renovacion_anos != null ? `${con.renovacion_anos} años` : "No prevista");
    push("Concesión", "Tipo inicio",            con.tipo_inicio ? (TIPO_INICIO_LABEL[con.tipo_inicio] ?? con.tipo_inicio) : null);
    push("Concesión", "Fecha inicio",           con.fecha_inicio);
    push("Concesión", "Plazo construcción",     con.plazo_construccion_meses != null ? `${con.plazo_construccion_meses} meses` : null);
    push("Concesión", "Tipo retribución",       con.tipo_retribucion ? (TIPO_RETRIB_LABEL[con.tipo_retribucion] ?? con.tipo_retribucion) : null);
    push("Concesión", "Canon mínimo anual",     fmtEurNullable(con.canon_minimo_anual));
    push("Concesión", "Canon ganador anual",    fmtEurNullable(con.canon_ganador));
    push("Concesión", "Canon por punto de carga", fmtEurNullable(con.canon_por_cargador));
    push("Concesión", "Canon por ubicación",    fmtEurNullable(con.canon_por_ubicacion_anual));
    push("Concesión", "Canon variable €/kWh",   con.canon_variable_eur_kwh != null ? `${con.canon_variable_eur_kwh} €/kWh` : null);
    push("Concesión", "Canon variable %",       con.canon_variable_pct != null ? `${con.canon_variable_pct}%` : null);
    push("Concesión", "N.º ubicaciones",        con.num_ubicaciones);
    push("Concesión", "Mínimo puntos de carga", con.num_cargadores_minimo);
    push("Concesión", "Puntos AC declarados",   con.num_cargadores_ac);
    push("Concesión", "Puntos DC declarados",   con.num_cargadores_dc);
    push("Concesión", "Puntos DC+ declarados",  con.num_cargadores_dc_plus);
    push("Concesión", "Puntos HPC declarados",  con.num_cargadores_hpc);
    push("Concesión", "Total puntos",           con.num_cargadores);
    push("Concesión", "Tecnología requerida",   con.tecnologia_requerida ? fmtTipoHw(con.tecnologia_requerida) : null);
    push("Concesión", "Pot. mínima/cargador",   con.potencia_minima_por_cargador_kw != null ? `${con.potencia_minima_por_cargador_kw} kW` : null);
    push("Concesión", "Pot. disponible punto",  con.potencia_disponible_kw != null ? `${con.potencia_disponible_kw} kW${con.potencia_garantizada ? " (garantizada)" : ""}` : null);
  }

  // Criterios (pesos) — jerarquía top-level que suma 100% + sub-desgloses
  if (proc) {
    // Económico top-level
    if (proc.peso_economico != null) {
      const subEco: string[] = [];
      if (proc.peso_canon_fijo     != null) subEco.push(`canon fijo ${proc.peso_canon_fijo}%`);
      if (proc.peso_canon_variable != null) subEco.push(`canon variable ${proc.peso_canon_variable}%`);
      push("Criterios (suman 100%)", "Peso económico",
        subEco.length > 0 ? `${proc.peso_economico}% · ${subEco.join(" + ")}` : `${proc.peso_economico}%`);
    }
    // Técnico top-level
    if (proc.peso_tecnico != null) {
      const subTec: string[] = [];
      if (proc.peso_proyecto_tecnico    != null) subTec.push(`proyecto ${proc.peso_proyecto_tecnico}%`);
      if (proc.peso_construccion_tiempo != null) subTec.push(`plazo construcción ${proc.peso_construccion_tiempo}%`);
      if (proc.peso_mas_hw_potencia     != null) subTec.push(`más HW/potencia ${proc.peso_mas_hw_potencia}%`);
      if (proc.peso_mas_ubicaciones     != null) subTec.push(`más ubicaciones ${proc.peso_mas_ubicaciones}%`);
      if (proc.peso_otros               != null) subTec.push(`otros ${proc.peso_otros}%`);
      push("Criterios (suman 100%)", "Peso técnico",
        subTec.length > 0 ? `${proc.peso_tecnico}% · ${subTec.join(" + ")}` : `${proc.peso_tecnico}%`);
    }
  }

  // Garantías
  if (proc?.garantias) {
    const g = proc.garantias;
    push("Garantías", "Provisional exigida",    g.provisional_exigida == null ? null : (g.provisional_exigida ? "Sí" : "No"));
    push("Garantías", "Provisional importe",    fmtEurNullable(g.provisional_eur));
    push("Garantías", "Provisional %",          g.provisional_pct != null ? `${g.provisional_pct}%` : null);
    push("Garantías", "Definitiva importe",     fmtEurNullable(g.definitiva_eur));
    push("Garantías", "Definitiva %",           g.definitiva_pct != null ? `${g.definitiva_pct}%` : null);
    push("Garantías", "Definitiva base",        g.definitiva_base);
  }

  // Licitadores
  for (const l of licitadores) {
    const rolLabel = l.rol === "adjudicataria" ? "Adjudicataria" : l.rol === "excluida" ? "Excluida" : "Participante";
    const campo = l.nombre_comercial && l.nombre_comercial !== l.nombre
      ? `${l.nombre_comercial} (${l.nombre})`
      : l.nombre;
    push("Licitadores", campo, [
      rolLabel,
      l.nif && `NIF ${l.nif}`,
      l.party_id && `OCPI ${l.party_id}`,
      l.oferta_canon_anual != null && `Canon fijo ${fmtEurExact(l.oferta_canon_anual, "/año")}`,
      l.oferta_canon_variable_eur_kwh != null && `${l.oferta_canon_variable_eur_kwh} €/kWh`,
      l.oferta_canon_variable_pct != null && `Var ${l.oferta_canon_variable_pct}%`,
      l.oferta_descuento_residentes_pct != null && `Descuento ${l.oferta_descuento_residentes_pct}%`,
      l.puntuacion_total != null && `${l.puntuacion_total.toFixed(2)} pts`,
      l.rank_position != null && `rank ${l.rank_position}`,
      l.motivo_exclusion && `Motivo exclusión: ${l.motivo_exclusion}`,
    ].filter(Boolean).join(" · "));
  }

  // Render agrupado
  const sections = [...new Set(rows.map((r) => r.section))];
  return (
    <Card style={{ marginTop: 28 }}>
      <SectionTitleBar>Resumen estructurado completo</SectionTitleBar>
      <p style={{ fontSize: 11, color: C.muted, marginTop: 4, marginBottom: 14 }}>
        Toda la información de la licitación en formato tabular — consistente en todas las fichas PLACSP.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {sections.map((section) => (
          <div key={section}>
            <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.04)", fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", borderTop: `1px solid ${C.border}` }}>
              {section}
            </div>
            {rows.filter((r) => r.section === section).map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, padding: "7px 14px", fontSize: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ color: C.muted }}>{r.campo}</div>
                <div style={{ color: C.text, fontVariantNumeric: "tabular-nums", wordBreak: "break-word" }}>{r.valor as React.ReactNode}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

function fmtEurNullable(n?: number | null): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  return fmtEurExact(n);
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, ...style }}>
      {children}
    </div>
  );
}

function SectionTitleBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: "linear-gradient(180deg,#34d399,#38bdf8)", flexShrink: 0 }} />
      <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.01em" }}>{children}</h2>
    </div>
  );
}

// Emoji por tipo de documento
function docEmoji(tipo: string): string {
  const t = tipo.toLowerCase();
  if (t.includes("anuncio"))       return "📢";
  if (t.includes("pliego_tecnico")) return "🔧";
  if (t.includes("pliego"))        return "📜";
  if (t.includes("acta_apertura")) return "📂";
  if (t.includes("acta_propuesta"))return "🗳️";
  if (t.includes("acta"))          return "📋";
  if (t.includes("resolucion"))    return "🎯";
  if (t.includes("formalizacion")) return "✍️";
  if (t.includes("baremacion"))    return "📊";
  if (t.includes("memoria"))       return "📖";
  if (t.includes("planos"))        return "🗺️";
  if (t.includes("proyecto"))      return "📐";
  if (t.includes("presupuesto"))   return "💰";
  if (t.includes("aclaracion"))    return "❓";
  if (t.includes("rectificacion")) return "🔄";
  if (t.includes("modificacion"))  return "🔄";
  if (t.includes("replanteo"))     return "📏";
  if (t.includes("acuerdo"))       return "🤝";
  return "📄";
}

function mejoraEmoji(tipo: string, descripcion?: string): string {
  const t = tipo.toLowerCase();
  const d = (descripcion ?? "").toLowerCase();
  // "incremento del canon" NO es descuento, es un alza económica
  if (d.includes("incremento") && d.includes("canon")) return "📈";
  if (d.includes("canon") && d.includes("alza"))       return "📈";
  if (t === "descuento" && d.includes("canon"))        return "📈";
  if (t === "descuento")      return "💸";
  if (t === "app")            return "📱";
  if (t === "ampliacion_hw")  return "⚡";
  if (t === "sostenibilidad") return "🌱";
  if (t === "mantenimiento")  return "🔧";
  return "✨";
}

// Re-etiqueta tipo: "descuento" de un canon no es descuento
function mejoraTipoLabel(tipo: string, descripcion?: string): string {
  const d = (descripcion ?? "").toLowerCase();
  if (tipo === "descuento" && (d.includes("incremento") && d.includes("canon"))) return "incremento canon";
  if (tipo === "descuento" && (d.includes("alza") && d.includes("canon")))       return "incremento canon";
  return tipo;
}
