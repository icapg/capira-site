import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  findLicitacionBySlug,
  deeplinkFromIdEvl,
  displayName,
  categoriaLabel,
  ESTADO_LABEL,
  type LicitacionItem,
  type Licitador,
  type UbicacionConcesion,
  type Concesion,
  type ProcesoLicitacion,
} from "../../../../lib/insights/licitaciones-data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lic = findLicitacionBySlug(id);
  if (!lic) return { title: "Licitación no encontrada" };
  return {
    title: `${lic.titulo} — Licitación PLACSP (v2)`,
    description: `${categoriaLabel(lic.categoria)}${lic.organo ? ` · ${lic.organo}` : ""}`,
  };
}

// ─── Paleta: monocroma con 4 acentos moderados ──────────────────────────
const P = {
  bg:        "#0a0e14",
  text:      "#e8edf4",
  text2:     "#b4bcc8",
  text3:     "#7a8494",
  text4:     "#505a6b",
  line:      "rgba(255,255,255,0.10)",
  lineSoft:  "rgba(255,255,255,0.05)",
  card:      "rgba(255,255,255,0.025)",
  green:     "#4ade80",   // ganador / adjudicada
  greenDim:  "rgba(74,222,128,0.10)",
  amber:     "#fbbf24",   // canon / económico
  amberDim:  "rgba(251,191,36,0.10)",
  blue:      "#60a5fa",   // técnico / variable
  blueDim:   "rgba(96,165,250,0.10)",
  red:       "#ef4444",
  redDim:    "rgba(239,68,68,0.08)",
};

function fmtEur(n?: number | null, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("es-ES")} €${unit}`;
}
function fmtEurExact(n?: number | null, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("es-ES", { maximumFractionDigits: 2 })} €${unit}`;
}
function pct(n: number | null): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  const abs = Math.abs(n);
  return abs < 10 ? `${sign}${n.toFixed(1)}%` : `${sign}${Math.round(n)}%`;
}

const TIPO_INICIO: Record<string, string> = {
  adjudicacion:     "Desde adjudicación",
  formalizacion:    "Desde formalización",
  puesta_en_marcha: "Desde puesta en marcha",
};
const TIPO_RETRIB: Record<string, string> = {
  canon_fijo:          "Canon fijo",
  canon_variable_pct:  "Canon variable (% facturación)",
  mixto:               "Mixto (fijo + variable)",
  contraprestacion:    "Contraprestación",
  compra:              "Compra",
};

// ─────────────────────────────────────────────────────────────────────────────
export default async function LicitacionDetailV2({ params }: Props) {
  const { id } = await params;
  const lic = findLicitacionBySlug(id);
  if (!lic) notFound();

  const deeplink = deeplinkFromIdEvl(lic.idEvl);
  const esConcesion = lic.categoria === "1";

  // Dedup licitadores
  const ROL: Record<string, number> = { adjudicataria: 3, participante: 2, excluida: 1 };
  const dmap = new Map<string, Licitador>();
  for (const l of lic.licitadores ?? []) {
    const k = (l.nif || l.nombre).trim().toLowerCase();
    const prev = dmap.get(k);
    if (!prev || (ROL[l.rol] ?? 0) > (ROL[prev.rol] ?? 0)) dmap.set(k, l);
  }
  const licitadores = [...dmap.values()];
  const adj = licitadores.filter((l) => l.rol === "adjudicataria");
  const par = licitadores.filter((l) => l.rol === "participante");
  const exc = licitadores.filter((l) => l.rol === "excluida");
  const winner = adj[0];
  const estaAdjudicada = lic.estado === "ADJ" || lic.estado === "RES";

  const ranking = [...adj, ...par]
    .filter((l) => l.puntuacion_total != null || l.oferta_canon_anual != null || l.oferta_canon_variable_eur_kwh != null)
    .sort((a, b) => {
      const ap = a.puntuacion_total ?? -Infinity;
      const bp = b.puntuacion_total ?? -Infinity;
      if (ap !== bp) return bp - ap;
      return (b.oferta_canon_anual ?? 0) - (a.oferta_canon_anual ?? 0);
    });
  const showVar  = ranking.some((l) => l.oferta_canon_variable_eur_kwh != null);
  const showDesc = ranking.some((l) => l.oferta_descuento_residentes_pct != null);

  const snaps = [...(lic.snapshots ?? [])].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div style={{
      background: P.bg, minHeight: "100vh", color: P.text,
      fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      fontWeight: 400,
    }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 28px 72px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: P.text3, marginBottom: 24 }}>
          <Link href="/info/licitaciones" style={{ color: P.text2, textDecoration: "none" }}>Licitaciones</Link>
          <span style={{ margin: "0 10px", color: P.text4 }}>/</span>
          <span style={{ color: P.text3 }}>{lic.expediente ?? lic.slug}</span>
          <span style={{ margin: "0 10px", color: P.text4 }}>·</span>
          <Link href={`/info/licitaciones/${lic.slug}`} style={{ color: P.text4, textDecoration: "none", fontSize: 11 }}>
            ver diseño anterior
          </Link>
        </div>

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
            <TagSoft label={categoriaLabel(lic.categoria)} />
            {lic.estado && <TagSoft label={ESTADO_LABEL[lic.estado] ?? lic.estado} color={estaAdjudicada ? P.green : P.text3} />}
            {lic.tipo_contrato && <TagSoft label={lic.tipo_contrato} />}
            {lic.financiacion_ue && <TagSoft label="Financiación UE" color={P.amber} />}
          </div>
          <h1 style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 500, letterSpacing: "-0.015em", margin: 0, color: P.text }}>
            {lic.titulo}
          </h1>
          <div style={{ fontSize: 12, color: P.text3, marginTop: 10, display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
            {lic.organo      && <span>{lic.organo}</span>}
            {lic.expediente  && <span>Exp. {lic.expediente}</span>}
            {lic.provincia   && <span>{lic.provincia}{lic.ccaa ? ` · ${lic.ccaa}` : ""}</span>}
          </div>
        </div>

        {/* ─── Banner Ganador ──────────────────────────────────────────── */}
        {estaAdjudicada && winner && (
          <div style={{
            padding: "14px 18px",
            background: P.greenDim,
            border: `1px solid ${P.green}33`,
            borderRadius: 8,
            marginBottom: 22,
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, color: P.green, letterSpacing: "0.14em", fontWeight: 700, textTransform: "uppercase" }}>
                  Ganador
                </span>
                <span style={{ fontSize: 17, color: P.text, fontWeight: 500 }}>
                  {displayName(winner)}
                  {winner.es_ute && <span style={{ marginLeft: 8, fontSize: 10, color: P.text3, fontWeight: 600 }}>UTE</span>}
                </span>
              </div>
              <div style={{ fontSize: 12, color: P.text2, display: "flex", gap: 12, flexWrap: "wrap", fontVariantNumeric: "tabular-nums" }}>
                {winner.puntuacion_total != null && (
                  <span>Pts <b style={{ color: P.text }}>{Math.round(winner.puntuacion_total)}/100</b></span>
                )}
                {winner.oferta_canon_anual != null && (
                  <span>Canon fijo <b style={{ color: P.amber }}>{fmtEurExact(winner.oferta_canon_anual, "/año")}</b></span>
                )}
                {winner.oferta_canon_variable_eur_kwh != null && (
                  <span>Variable <b style={{ color: P.amber }}>{winner.oferta_canon_variable_eur_kwh.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh</b></span>
                )}
                {winner.oferta_descuento_residentes_pct != null && (
                  <span>Descuento residentes <b style={{ color: P.blue }}>{winner.oferta_descuento_residentes_pct}%</b></span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── KPI BAR ─────────────────────────────────────────────────── */}
        <KpiBar lic={lic} esConcesion={esConcesion} />

        {/* ─── Ofertas (tabla protagonista con podio encabezando) ──────── */}
        {ranking.length + exc.length > 0 && (
          <Section title="🏆 Ranking">
            {ranking.length >= 2 && <PodioMini ranking={ranking} />}
            <div style={{ marginTop: ranking.length >= 2 ? 18 : 0 }}>
              <TablaOfertas
                ranking={ranking}
                excluidos={exc}
                showVar={showVar}
                showDesc={showDesc}
                concesion={lic.concesion}
              />
            </div>
          </Section>
        )}

        {/* ─── Especificaciones del pliego ─────────────────────────────── */}
        {esConcesion && lic.concesion && (
          <Section title="📐 Especificaciones del pliego">
            <SpecSheet concesion={lic.concesion} proceso={lic.proceso} lic={lic} />
          </Section>
        )}

        {/* ─── Criterios de adjudicación ───────────────────────────────── */}
        {lic.proceso && (lic.proceso.peso_economico != null || lic.proceso.peso_tecnico != null) && (
          <Section title="⚖️ Criterios de adjudicación">
            <Criterios proceso={lic.proceso} />
          </Section>
        )}

        {/* ─── Requisitos + Garantías ──────────────────────────────────── */}
        {(lic.proceso?.requisitos || lic.proceso?.garantias) && (
          <Section title="🛡️ Requisitos y garantías">
            <RequisitosYGarantias proceso={lic.proceso} />
          </Section>
        )}

        {/* ─── Ubicaciones ─────────────────────────────────────────────── */}
        {esConcesion && (lic.concesion?.ubicaciones?.length ?? 0) > 0 && (
          <Section title={`📍 Ubicaciones · ${lic.concesion!.ubicaciones!.length}`}>
            <ListaUbicaciones ubicaciones={lic.concesion!.ubicaciones!} />
          </Section>
        )}

        {/* ─── Mejoras ofertadas del ganador ───────────────────────────── */}
        {(winner?.mejoras_ofertadas?.length ?? 0) > 0 && (
          <Section title="✨ Mejoras ofertadas por el ganador">
            <ul style={{ margin: 0, paddingLeft: 18, color: P.text2, fontSize: 13, lineHeight: 1.7 }}>
              {winner!.mejoras_ofertadas!.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </Section>
        )}

        {/* ─── Fechas + estados ────────────────────────────────────────── */}
        <Section title="📅 Fechas">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 28px" }}>
            {lic.fecha_publicacion   && <SpecRow label="Publicación"    value={lic.fecha_publicacion} />}
            {lic.fecha_limite        && <SpecRow label="Límite ofertas" value={lic.fecha_limite} />}
            {lic.dias_aviso    != null && <SpecRow label="Días de aviso"  value={`${lic.dias_aviso} días`} />}
            {lic.fecha_adjudicacion  && <SpecRow label="Adjudicación"   value={lic.fecha_adjudicacion} />}
            {lic.fecha_formalizacion && <SpecRow label="Formalización"  value={lic.fecha_formalizacion} />}
          </div>
          {snaps.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${P.lineSoft}`, fontSize: 12, color: P.text3, display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
              {snaps.map((s, i) => (
                <span key={i}>
                  <span style={{ color: P.text2 }}>{ESTADO_LABEL[s.estado] ?? s.estado}</span>
                  <span style={{ color: P.text4, marginLeft: 6 }}>{s.fecha}</span>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* ─── Documentos ──────────────────────────────────────────────── */}
        {(lic.documentos?.length ?? 0) > 0 && (
          <Section title={`📄 Documentos · ${lic.documentos!.length}`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "2px 20px" }}>
              {lic.documentos!.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                   style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "6px 0",
                            fontSize: 12, color: P.text2, textDecoration: "none",
                            borderBottom: `1px solid ${P.lineSoft}` }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.tipo.replace(/_/g, " ")}
                  </span>
                  {d.fecha && <span style={{ color: P.text4, fontSize: 10, fontVariantNumeric: "tabular-nums" }}>{d.fecha.slice(0, 10)}</span>}
                  <span style={{ color: P.text4, fontSize: 11 }}>↗</span>
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* ─── Link PLACSP ─────────────────────────────────────────────── */}
        {deeplink && (
          <div style={{ marginTop: 24, fontSize: 12 }}>
            <a href={deeplink} target="_blank" rel="noopener noreferrer" style={{ color: P.green, textDecoration: "none" }}>
              → Abrir expediente completo en PLACSP
            </a>
          </div>
        )}

        <p style={{ fontSize: 11, color: P.text4, marginTop: 40 }}>
          Fuente: PLACSP · Taxonomía v3 Capira · Datos extraídos directamente de los PDFs públicos del expediente.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper con card sutil
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: P.card,
      border: `1px solid ${P.line}`,
      borderRadius: 10,
      padding: "18px 22px",
      marginBottom: 18,
    }}>
      <h2 style={{
        fontSize: 12, fontWeight: 600, color: P.text,
        margin: "0 0 14px", letterSpacing: "-0.005em",
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TagSoft({ label, color }: { label: string; color?: string }) {
  const c = color ?? P.text3;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color: c,
      background: `${c}14`, border: `1px solid ${c}33`,
      borderRadius: 4, padding: "3px 8px", letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Bar — 4 boxes duales (inspirado en V1 pero sin glows)
// ─────────────────────────────────────────────────────────────────────────────
function KpiBar({ lic, esConcesion }: { lic: LicitacionItem; esConcesion: boolean }) {
  const con = lic.concesion;
  const winner = (lic.licitadores ?? []).find((l) => l.rol === "adjudicataria");
  const boxes: Array<{ label1: string; value1: string; sub1?: string; label2?: string; value2?: string; sub2?: string; accent: string }> = [];

  // Canon anual (fijo)
  if (con?.canon_minimo_anual != null || con?.canon_ganador != null) {
    const delta = con?.canon_minimo_anual && con?.canon_minimo_anual > 0 && con?.canon_ganador != null
      ? ((con.canon_ganador - con.canon_minimo_anual) / con.canon_minimo_anual) * 100 : null;
    boxes.push({
      label1: "Canon fijo inicial",
      value1: con?.canon_minimo_anual != null ? `${fmtEur(con.canon_minimo_anual)}/año` : "—",
      sub1:   "mínimo del pliego",
      label2: "Canon fijo ganador",
      value2: con?.canon_ganador != null ? `${fmtEur(con.canon_ganador)}/año` : "—",
      sub2:   delta != null ? `${delta >= 0 ? "+" : ""}${Math.round(delta)}% vs inicial` : undefined,
      accent: P.amber,
    });
  }

  // Canon variable
  const varMin = con?.canon_variable_eur_kwh;
  const varGan = winner?.oferta_canon_variable_eur_kwh;
  if (varMin != null || varGan != null) {
    const delta = varMin != null && varMin > 0 && varGan != null
      ? ((varGan - varMin) / varMin) * 100 : null;
    boxes.push({
      label1: "Canon var. inicial",
      value1: varMin != null ? `${varMin.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh` : "—",
      sub1:   "mínimo del pliego",
      label2: "Canon var. ganador",
      value2: varGan != null ? `${varGan.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh` : "—",
      sub2:   delta != null ? `${delta >= 0 ? "+" : ""}${Math.round(delta)}% vs inicial` : undefined,
      accent: P.amber,
    });
  }

  // Plazo
  if (esConcesion && con?.plazo_anos != null) {
    boxes.push({
      label1: "Plazo",
      value1: `${con.plazo_anos} años`,
      sub1:   "concesión",
      label2: "Prórroga",
      value2: con.renovacion_anos ? `${con.renovacion_anos} años` : "No prevista",
      sub2:   con.renovacion_anos ? "adicionales" : undefined,
      accent: P.text2,
    });
  } else if (lic.plazo_meses != null) {
    boxes.push({ label1: "Plazo", value1: `${lic.plazo_meses} meses`, accent: P.text2 });
  }

  // Puntos + Ubicaciones
  const tieneHw = esConcesion && (con?.num_cargadores_minimo != null || con?.num_cargadores != null);
  const nUbic  = esConcesion
    ? (con?.num_ubicaciones ?? (con?.ubicaciones?.length != null && con.ubicaciones.length > 0 ? con.ubicaciones.length : null))
    : null;
  if (tieneHw || nUbic != null) {
    const total = tieneHw ? (con!.num_cargadores ?? con!.num_cargadores_minimo!) : null;
    const mix = [
      con?.num_cargadores_ac      && `${con.num_cargadores_ac} AC`,
      con?.num_cargadores_dc      && `${con.num_cargadores_dc} DC`,
      con?.num_cargadores_dc_plus && `${con.num_cargadores_dc_plus} DC+`,
      con?.num_cargadores_hpc     && `${con.num_cargadores_hpc} HPC`,
    ].filter(Boolean).join(" · ");
    boxes.push({
      label1: "Puntos de carga",
      value1: total != null ? String(total) : "—",
      sub1:   mix || (con?.tecnologia_requerida ? `tecnología ${con.tecnologia_requerida}` : undefined),
      label2: "Ubicaciones",
      value2: nUbic != null ? String(nUbic) : "—",
      sub2:   nUbic != null ? (nUbic === 1 ? "ubicación" : "ubicaciones") : undefined,
      accent: P.blue,
    });
  }

  if (boxes.length === 0) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 18 }}>
      {boxes.map((b, i) => (
        <div key={i} style={{
          background: P.card, border: `1px solid ${P.line}`, borderRadius: 10,
          padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 9, color: P.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>{b.label1}</div>
            <div style={{ fontSize: 20, color: P.text, fontWeight: 500, marginTop: 4, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em" }}>{b.value1}</div>
            {b.sub1 && <div style={{ fontSize: 10, color: P.text3, marginTop: 2 }}>{b.sub1}</div>}
          </div>
          {b.label2 && (
            <>
              <div style={{ height: 1, background: P.line }} />
              <div>
                <div style={{ fontSize: 9, color: b.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {b.accent === P.amber && "🏆 "}{b.label2}
                </div>
                <div style={{ fontSize: 20, color: P.text, fontWeight: 500, marginTop: 4, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em" }}>{b.value2}</div>
                {b.sub2 && <div style={{ fontSize: 10, color: P.text3, marginTop: 2 }}>{b.sub2}</div>}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Podio mini (3 columnas pequeñas con medallas)
// ─────────────────────────────────────────────────────────────────────────────
function PodioMini({ ranking }: { ranking: Licitador[] }) {
  const top = ranking.slice(0, 3);
  const medals = [
    { i: 1, l: top[0], emoji: "🥇", h: 96, c: P.green },
    { i: 2, l: top[1], emoji: "🥈", h: 72, c: P.text2 },
    { i: 3, l: top[2], emoji: "🥉", h: 56, c: "#cd7f32" },
  ];
  // Orden visual 2 - 1 - 3
  const visual = [medals[1], medals[0], medals[2]];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, paddingBottom: 16, borderBottom: `1px solid ${P.lineSoft}` }}>
      {/* Fila 1: medalla + nombre (altura fija) */}
      {visual.map(({ i, l, emoji }) => (
        <div key={`n${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: 52, justifyContent: "flex-end", minWidth: 0, padding: "0 4px" }}>
          {l ? (
            <>
              <span style={{ fontSize: 20, lineHeight: 1, marginBottom: 4 }}>{emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: i === 1 ? P.green : P.text, textAlign: "center", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.nombre}>
                {displayName(l)}
              </span>
            </>
          ) : null}
        </div>
      ))}
      {/* Fila 2: plataforma alineada al fondo */}
      <div style={{ display: "contents" }}>
        {visual.map(({ i, l, h, c }) => (
          <div key={`p${i}`} style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            {l ? (
              <div style={{
                width: "100%",
                background: `${c}10`, border: `1px solid ${c}33`, borderBottom: "none", borderRadius: "6px 6px 0 0",
                height: h, padding: "8px 6px", textAlign: "center",
                display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
              }}>
                {l.puntuacion_total != null && (
                  <div style={{ fontSize: i === 1 ? 18 : 15, fontWeight: 600, color: c, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                    {Math.round(l.puntuacion_total)}
                  </div>
                )}
                <div style={{ fontSize: 8, color: P.text3, fontWeight: 600, letterSpacing: "0.08em" }}>PUNTOS</div>
                {l.oferta_canon_anual != null && (
                  <div style={{ fontSize: 9, color: P.text3 }}>
                    {fmtEur(l.oferta_canon_anual)}/año
                  </div>
                )}
              </div>
            ) : <div style={{ height: h }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabla de ofertas protagonista
// ─────────────────────────────────────────────────────────────────────────────
function TablaOfertas({
  ranking, excluidos, showVar, showDesc, concesion,
}: {
  ranking: Licitador[]; excluidos: Licitador[]; showVar: boolean; showDesc: boolean; concesion?: Concesion;
}) {
  const primero    = ranking[0];
  const primeroFijo= primero?.oferta_canon_anual ?? null;
  const primeroVar = primero?.oferta_canon_variable_eur_kwh ?? null;

  // Criterios técnicos únicos
  const criteriosTec: string[] = [];
  for (const l of ranking) {
    for (const d of (l.puntuaciones_detalle ?? [])) {
      if (!criteriosTec.includes(d.nombre)) criteriosTec.push(d.nombre);
    }
  }

  const gridCols = [
    "28px",
    "minmax(160px, 1.8fr)",
    "minmax(120px, 1.2fr)",
    ...(showVar  ? ["minmax(110px, 1fr)"] : []),
    ...(showDesc ? ["minmax(90px, 0.7fr)"] : []),
    ...criteriosTec.map(() => "minmax(140px, 1.5fr)"),
    "68px",
  ].join(" ");

  const headers = [
    "#", "Empresa", "Canon fijo",
    ...(showVar  ? ["Canon variable"] : []),
    ...(showDesc ? ["Desc. resid."] : []),
    ...criteriosTec,
    "Puntos",
  ];

  return (
    <div style={{ fontSize: 12 }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: gridCols, gap: 0,
        paddingBottom: 8, borderBottom: `1px solid ${P.line}`,
        fontSize: 10, color: P.text3, fontWeight: 600, letterSpacing: "0.04em",
      }}>
        {headers.map((h, i) => (
          <div key={i} style={{ padding: "0 8px", textAlign: i === headers.length - 1 ? "right" : "left", textTransform: "uppercase" }}>
            {h}
          </div>
        ))}
      </div>

      {/* Filas ranking */}
      {ranking.map((l, idx) => {
        const esGan = idx === 0 || l.rol === "adjudicataria";
        const ofertaFija = l.oferta_canon_anual ?? null;
        const ofertaVar  = l.oferta_canon_variable_eur_kwh ?? null;
        const dFijo = ofertaFija != null && primeroFijo != null && primeroFijo !== 0
          ? ((ofertaFija - primeroFijo) / primeroFijo) * 100 : null;
        const dVar  = ofertaVar != null && primeroVar != null && primeroVar !== 0
          ? ((ofertaVar - primeroVar) / primeroVar) * 100 : null;
        return (
          <div key={idx} style={{
            display: "grid", gridTemplateColumns: gridCols, gap: 0,
            padding: "13px 0", borderBottom: `1px solid ${P.lineSoft}`,
            alignItems: "flex-start",
            background: esGan ? P.greenDim : "transparent",
          }}>
            <div style={{ padding: "0 8px", color: esGan ? P.green : P.text3, fontWeight: 600, fontSize: 13 }}>
              {l.rank_position ?? idx + 1}
            </div>
            <div style={{ padding: "0 8px", minWidth: 0 }}>
              <div style={{ color: P.text, fontWeight: esGan ? 500 : 400, fontSize: 13, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.nombre}>
                  {displayName(l)}
                </span>
                {esGan && <span style={{ fontSize: 10 }}>🏆</span>}
                {l.es_ute && <span style={{ fontSize: 9, color: P.text3, fontWeight: 600 }}>UTE</span>}
              </div>
              {l.nombre_comercial && l.nombre_comercial !== l.nombre && (
                <div style={{ fontSize: 10, color: P.text4, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.nombre}
                </div>
              )}
            </div>
            {/* Canon fijo */}
            <div style={{ padding: "0 8px", fontVariantNumeric: "tabular-nums", color: P.text }}>
              {ofertaFija != null ? (
                <>
                  <div style={{ color: P.amber }}>{fmtEurExact(ofertaFija, "/año")}</div>
                  {dFijo != null && !esGan && (
                    <div style={{ fontSize: 10, color: P.text3, marginTop: 2 }}>{pct(dFijo)} vs 1º</div>
                  )}
                </>
              ) : <span style={{ color: P.text4 }}>—</span>}
            </div>
            {/* Canon variable */}
            {showVar && (
              <div style={{ padding: "0 8px", fontVariantNumeric: "tabular-nums" }}>
                {ofertaVar != null ? (
                  <>
                    <div style={{ color: P.amber }}>{ofertaVar.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh</div>
                    {dVar != null && !esGan && (
                      <div style={{ fontSize: 10, color: P.text3, marginTop: 2 }}>{pct(dVar)} vs 1º</div>
                    )}
                  </>
                ) : <span style={{ color: P.text4 }}>—</span>}
              </div>
            )}
            {/* Descuento */}
            {showDesc && (
              <div style={{ padding: "0 8px", fontVariantNumeric: "tabular-nums", color: l.oferta_descuento_residentes_pct != null ? P.blue : P.text4 }}>
                {l.oferta_descuento_residentes_pct != null ? `${l.oferta_descuento_residentes_pct}%` : "—"}
              </div>
            )}
            {/* Criterios técnicos */}
            {criteriosTec.map((c, ci) => {
              const d = (l.puntuaciones_detalle ?? []).find((x) => x.nombre === c);
              return (
                <div key={ci} style={{ padding: "0 8px", fontSize: 11, color: P.text2, lineHeight: 1.45 }}>
                  {d?.oferta ?? <span style={{ color: P.text4 }}>—</span>}
                  {d?.puntos != null && d?.peso_max != null && (
                    <div style={{ fontSize: 10, color: P.text3, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                      {d.puntos}/{d.peso_max} pts
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ padding: "0 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: esGan ? P.green : P.text, fontWeight: 500, fontSize: 14 }}>
              {l.puntuacion_total != null ? Math.round(l.puntuacion_total) : "—"}
            </div>
          </div>
        );
      })}

      {/* Excluidos */}
      {excluidos.map((l, idx) => (
        <div key={`exc${idx}`} style={{
          display: "grid", gridTemplateColumns: gridCols, gap: 0,
          padding: "12px 0", borderBottom: `1px solid ${P.lineSoft}`, alignItems: "flex-start",
          background: P.redDim,
        }}>
          <div style={{ padding: "2px 8px 0", color: P.red, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>EXC</div>
          <div style={{ padding: "0 8px", gridColumn: `span ${headers.length - 1}`, minWidth: 0 }}>
            <div style={{ color: P.text2, fontSize: 13 }}>
              {displayName(l)}
              {l.es_ute && <span style={{ marginLeft: 6, fontSize: 9, color: P.text3 }}>UTE</span>}
            </div>
            {l.motivo_exclusion && (
              <div style={{ fontSize: 11, color: P.red, marginTop: 3, lineHeight: 1.4 }}>{l.motivo_exclusion}</div>
            )}
          </div>
        </div>
      ))}

      {/* Canon mínimo del pliego referencia */}
      {concesion?.canon_minimo_anual != null && (
        <div style={{ marginTop: 10, fontSize: 11, color: P.text3 }}>
          Canon fijo mínimo del pliego: <span style={{ color: P.text2 }}>{fmtEurExact(concesion.canon_minimo_anual, "/año")}</span>
          {concesion.canon_variable_eur_kwh != null && (
            <> · variable mínimo: <span style={{ color: P.text2 }}>{concesion.canon_variable_eur_kwh.toLocaleString("es-ES", { maximumFractionDigits: 4 })} €/kWh</span></>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spec sheet — grid 2 cols
// ─────────────────────────────────────────────────────────────────────────────
function SpecSheet({ concesion, proceso, lic }: { concesion: Concesion; proceso?: ProcesoLicitacion; lic: LicitacionItem }) {
  const rows: Array<[string, React.ReactNode]> = [];
  if (concesion.plazo_anos != null) rows.push(["Plazo concesión", `${concesion.plazo_anos} años`]);
  rows.push(["Renovación",
    concesion.renovacion_anos
      ? <span style={{ color: P.green }}>{concesion.renovacion_anos} años adicionales</span>
      : <span style={{ color: P.text4 }}>No prevista</span>
  ]);
  if (concesion.tipo_inicio) rows.push(["Inicio", TIPO_INICIO[concesion.tipo_inicio] ?? concesion.tipo_inicio]);
  if (concesion.plazo_construccion_meses != null) rows.push(["Plazo construcción", `${concesion.plazo_construccion_meses} meses`]);
  if (concesion.tipo_retribucion) rows.push(["Tipo retribución", TIPO_RETRIB[concesion.tipo_retribucion] ?? concesion.tipo_retribucion]);
  if (concesion.num_ubicaciones != null) rows.push(["N.º ubicaciones", String(concesion.num_ubicaciones)]);
  if (concesion.num_cargadores_minimo != null) rows.push(["Puntos de carga (mínimo)", `${concesion.num_cargadores_minimo}${concesion.num_cargadores_opcional ? " (opcional ofertar más)" : ""}`]);
  const hwMix = [
    concesion.num_cargadores_ac      && `${concesion.num_cargadores_ac} AC`,
    concesion.num_cargadores_dc      && `${concesion.num_cargadores_dc} DC`,
    concesion.num_cargadores_dc_plus && `${concesion.num_cargadores_dc_plus} DC+`,
    concesion.num_cargadores_hpc     && `${concesion.num_cargadores_hpc} HPC`,
  ].filter(Boolean).join(" · ");
  if (hwMix) rows.push(["Mix tecnológico", hwMix]);
  if (concesion.tecnologia_requerida) rows.push(["Tecnología requerida", concesion.tecnologia_requerida]);
  if (concesion.potencia_minima_por_cargador_kw != null) rows.push(["Potencia mín. / cargador", `${concesion.potencia_minima_por_cargador_kw} kW${concesion.potencia_opcional_subible ? " (subible)" : ""}`]);
  if (concesion.potencia_disponible_kw != null) rows.push(["Potencia disponible punto", `${concesion.potencia_disponible_kw.toLocaleString("es-ES")} kW${concesion.potencia_garantizada ? " · garantizada" : " · no garantizada"}`]);
  if (concesion.canon_por_cargador    != null) rows.push(["Canon / cargador", fmtEurExact(concesion.canon_por_cargador, "/HW/año")]);
  if (concesion.canon_por_ubicacion_anual != null) rows.push(["Canon / ubicación", fmtEurExact(concesion.canon_por_ubicacion_anual, "/ubic./año")]);
  if (proceso?.tipo_adjudicacion) rows.push(["Tipo adjudicación", proceso.tipo_adjudicacion.replace(/_/g, " ")]);
  if (proceso?.idioma_pliego)     rows.push(["Idioma pliego", proceso.idioma_pliego.toUpperCase()]);
  if (lic.programa_ue)            rows.push(["Programa UE", lic.programa_ue]);
  if (lic.importe_base != null)   rows.push(["Importe base", fmtEur(lic.importe_base)]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0 40px" }}>
      {rows.map(([k, v], i) => <SpecRow key={i} label={k} value={v} />)}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16,
      padding: "7px 0", borderBottom: `1px solid ${P.lineSoft}`,
    }}>
      <span style={{ color: P.text3, fontSize: 12 }}>{label}</span>
      <span style={{ color: P.text, fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Criterios
// ─────────────────────────────────────────────────────────────────────────────
function Criterios({ proceso }: { proceso: ProcesoLicitacion }) {
  const items: Array<{ nombre: string; peso: number; color: string }> = [];
  const hasSubEco = proceso.peso_canon_fijo != null || proceso.peso_canon_variable != null;
  if (hasSubEco) {
    if (proceso.peso_canon_fijo     != null) items.push({ nombre: "Canon fijo",     peso: proceso.peso_canon_fijo,     color: P.amber });
    if (proceso.peso_canon_variable != null) items.push({ nombre: "Canon variable", peso: proceso.peso_canon_variable, color: `${P.amber}99` });
  } else if (proceso.peso_economico != null) {
    items.push({ nombre: "Económico / Canon", peso: proceso.peso_economico, color: P.amber });
  }
  const hasSubTec = proceso.peso_proyecto_tecnico != null || proceso.peso_construccion_tiempo != null
                 || proceso.peso_mas_hw_potencia  != null || proceso.peso_mas_ubicaciones    != null
                 || proceso.peso_otros != null;
  if (hasSubTec) {
    if (proceso.peso_proyecto_tecnico    != null) items.push({ nombre: "Proyecto técnico",   peso: proceso.peso_proyecto_tecnico,    color: P.blue });
    if (proceso.peso_construccion_tiempo != null) items.push({ nombre: "Plazo construcción", peso: proceso.peso_construccion_tiempo, color: `${P.blue}cc` });
    if (proceso.peso_mas_hw_potencia     != null) items.push({ nombre: "Más HW / potencia",  peso: proceso.peso_mas_hw_potencia,     color: `${P.blue}99` });
    if (proceso.peso_mas_ubicaciones     != null) items.push({ nombre: "Más ubicaciones",    peso: proceso.peso_mas_ubicaciones,     color: `${P.blue}77` });
    if (proceso.peso_otros               != null) items.push({ nombre: "Otros técnicos",     peso: proceso.peso_otros,               color: `${P.blue}55` });
  } else if (proceso.peso_tecnico != null) {
    items.push({ nombre: "Técnico", peso: proceso.peso_tecnico, color: P.blue });
  }
  const total = items.reduce((s, i) => s + i.peso, 0) || 100;

  return (
    <>
      <div style={{ display: "flex", height: 8, background: P.lineSoft, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
        {items.map((it, i) => (
          <div key={i} title={`${it.nombre}: ${it.peso}%`} style={{
            width: `${(it.peso / total) * 100}%`,
            background: it.color,
          }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 28px" }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 0", borderBottom: `1px solid ${P.lineSoft}`, fontSize: 13,
          }}>
            <div style={{ width: 8, height: 8, background: it.color, borderRadius: "50%", flexShrink: 0 }} />
            <span style={{ flex: 1, color: P.text2 }}>{it.nombre}</span>
            <span style={{ color: P.text, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{it.peso}%</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Requisitos + Garantías
// ─────────────────────────────────────────────────────────────────────────────
function RequisitosYGarantias({ proceso }: { proceso: ProcesoLicitacion }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0 40px" }}>
      {proceso.garantias && (
        <div>
          <div style={{ fontSize: 10, color: P.text3, marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Garantías</div>
          {proceso.garantias.provisional_exigida === false
            ? <SpecRow label="Provisional" value={<span style={{ color: P.text4 }}>No exigida</span>} />
            : (proceso.garantias.provisional_eur != null || proceso.garantias.provisional_pct != null) && (
              <SpecRow label="Provisional"
                value={proceso.garantias.provisional_eur != null
                  ? fmtEur(proceso.garantias.provisional_eur)
                  : `${proceso.garantias.provisional_pct}%`} />
            )}
          {(proceso.garantias.definitiva_eur != null || proceso.garantias.definitiva_pct != null) && (
            <SpecRow label="Definitiva"
              value={<>
                {proceso.garantias.definitiva_eur != null && fmtEur(proceso.garantias.definitiva_eur)}
                {proceso.garantias.definitiva_pct != null && (
                  <span style={{ color: P.text3 }}>{proceso.garantias.definitiva_eur != null ? " · " : ""}{proceso.garantias.definitiva_pct}%</span>
                )}
              </>} />
          )}
          {proceso.garantias.definitiva_base && (
            <SpecRow label="Base cálculo" value={<span style={{ color: P.text3, fontSize: 11 }}>{proceso.garantias.definitiva_base.replace(/_/g, " ")}</span>} />
          )}
        </div>
      )}
      {proceso.requisitos && (
        <div>
          <div style={{ fontSize: 10, color: P.text3, marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Requisitos must-have</div>
          {[
            ...(proceso.requisitos.solvencia_economica ?? []),
            ...(proceso.requisitos.solvencia_tecnica ?? []),
            ...(proceso.requisitos.adicionales ?? []),
          ].slice(0, 10).map((r, i) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${P.lineSoft}`, fontSize: 12 }}>
              <div style={{ color: P.text, fontWeight: r.critico ? 500 : 400, lineHeight: 1.4 }}>
                {r.descripcion}
                {r.critico && <span style={{ marginLeft: 6, fontSize: 9, color: P.red, fontWeight: 700 }}>CRÍTICO</span>}
              </div>
              {r.umbral && <div style={{ color: P.text3, fontSize: 11, marginTop: 2 }}>{r.umbral}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ubicaciones en lista plana con acento sutil
// ─────────────────────────────────────────────────────────────────────────────
function ListaUbicaciones({ ubicaciones }: { ubicaciones: UbicacionConcesion[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {ubicaciones.map((u, i) => {
        const mapsUrl = u.google_maps_url
          ?? (u.latitud != null && u.longitud != null
              ? `https://www.google.com/maps?q=${u.latitud},${u.longitud}`
              : (u.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${u.direccion}${u.municipio ? `, ${u.municipio}` : ""}`)}` : null));
        const hw = [
          u.cargadores_ac     && `${u.cargadores_ac} AC`,
          u.cargadores_dc     && `${u.cargadores_dc} DC`,
          u.cargadores_dc_plus && `${u.cargadores_dc_plus} DC+`,
          u.cargadores_hpc    && `${u.cargadores_hpc} HPC`,
        ].filter(Boolean).join(" · ");
        return (
          <div key={i} style={{
            padding: "12px 0", borderBottom: `1px solid ${P.lineSoft}`,
            display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr) auto", gap: 16, alignItems: "baseline",
          }}>
            <div>
              <div style={{ color: P.text, fontSize: 13, fontWeight: 500 }}>
                {u.nombre ?? `Ubicación ${i + 1}`}
                {u.es_opcional && <span style={{ marginLeft: 8, fontSize: 9, color: P.amber, fontWeight: 600 }}>OPCIONAL</span>}
              </div>
              {(u.direccion || u.municipio) && (
                <div style={{ color: P.text3, fontSize: 11, marginTop: 2 }}>
                  {[u.direccion, u.municipio].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: P.text2, display: "flex", gap: 12, flexWrap: "wrap", fontVariantNumeric: "tabular-nums" }}>
              {u.plazas != null        && <span>{u.plazas} plazas</span>}
              {u.cargadores_total != null && <span style={{ color: P.blue }}>{u.cargadores_total} puntos</span>}
              {hw                      && <span style={{ color: P.text3 }}>{hw}</span>}
              {u.potencia_total_kw != null && <span>{u.potencia_total_kw} kW</span>}
            </div>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                 style={{ fontSize: 11, color: P.green, textDecoration: "none", whiteSpace: "nowrap" }}>
                Maps ↗
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
