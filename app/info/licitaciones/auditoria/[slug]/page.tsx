import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.04)",
  cardSolid: "#0a0f1a",
  border: "rgba(255,255,255,0.10)",
  green:  "#34d399",
  blue:   "#38bdf8",
  purple: "#a78bfa",
  amber:  "#fbbf24",
  red:    "#f87171",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.78)",
  soft:   "rgba(241,245,249,0.62)",
  dim:    "rgba(241,245,249,0.40)",
  grid:   "rgba(255,255,255,0.06)",
};

type Explicacion = { descripcion?: string; detalles?: string[] };

type AuditoriaRow = {
  slug: string;
  titulo: string;
  ciudad?: string | null;
  organo?: string | null;
  estado?: string | null;
  categoria?: string | null;
  confianza_global: number;
  semaforo: "verde" | "amarillo" | "rojo";
  cobertura_pliego_pct: number;
  cobertura_adjudicacion_pct: number | null;
  cobertura_lectura_pct?: number;
  cobertura_lectura_label?: string;
  pliego_complejo: boolean;
  motivos_complejidad: string[];
  flags_abiertos: string[];
  ultima_extraccion: { fecha: string | null; modelo: string | null };
  explicaciones?: Record<string, Explicacion>;
  criterios_detalle?: Array<{ tipo: string; peso: number | null; descripcion: string; clave_canonica?: string }>;
  criterios_count?: { economicos: number; tecnicos: number; mejoras: number; juicio: number; total: number };
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Auditoría · ${slug} | Capira`,
    description: `Detalle completo de auditoría de extracción para la licitación ${slug}: cobertura, criterios, lectura, flags y lecciones aprendidas.`,
  };
}

export default async function AuditoriaSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const file = path.join(process.cwd(), "data", "licitaciones-auditoria.json");
  if (!fs.existsSync(file)) notFound();
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const r = data.licitaciones.find((x: AuditoriaRow) => x.slug === slug);
  if (!r) notFound();

  const ex = r.explicaciones ?? {};
  const semaforoColor = r.semaforo === "verde" ? C.green : r.semaforo === "amarillo" ? C.amber : C.red;
  const semaforoEmoji = r.semaforo === "verde" ? "🟢" : r.semaforo === "amarillo" ? "🟡" : "🔴";

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", padding: "32px 28px", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: 8, fontSize: 12, color: C.soft, marginBottom: 6 }}>
        <Link href="/info/licitaciones" style={{ color: C.soft, textDecoration: "none" }}>← Licitaciones</Link>
        <span>·</span>
        <Link href="/info/licitaciones/auditoria" style={{ color: C.soft, textDecoration: "none" }}>Auditoría</Link>
        <span>·</span>
        <span>{slug}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
          {r.titulo}
        </h1>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: C.soft, fontSize: 13 }}>
          <span><strong style={{ color: C.text }}>Slug:</strong> {r.slug}</span>
          <span><strong style={{ color: C.text }}>Ciudad:</strong> {r.ciudad ?? "—"}</span>
          <span><strong style={{ color: C.text }}>Órgano:</strong> {r.organo ?? "—"}</span>
          <span><strong style={{ color: C.text }}>Estado:</strong> {r.estado ?? "—"}</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <Link href={`/info/licitaciones/${r.slug}`}
                style={{ fontSize: 12, fontWeight: 700, color: C.blue, padding: "6px 12px", border: `1px solid ${C.blue}66`, borderRadius: 6, background: `${C.blue}22`, textDecoration: "none" }}>
            Ver detalle PLACSP →
          </Link>
        </div>
      </div>

      {/* Confianza global destacada */}
      <div style={{ display: "flex", gap: 16, alignItems: "stretch", flexWrap: "wrap", marginBottom: 22 }}>
        <div style={{ minWidth: 200, padding: "18px 22px", background: C.card, border: `2px solid ${semaforoColor}66`, borderRadius: 14 }}>
          <div style={{ fontSize: 11, color: C.soft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Confianza global</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 32 }}>{semaforoEmoji}</span>
            <span style={{ fontSize: 36, fontWeight: 800, color: semaforoColor }}>{r.confianza_global}%</span>
          </div>
        </div>
        <BlockKpi label="Cobertura pliego"        valor={`${r.cobertura_pliego_pct}%`}        color={pctColor(r.cobertura_pliego_pct)} />
        <BlockKpi label="Cobertura adjudicación"  valor={r.cobertura_adjudicacion_pct == null ? "—" : `${r.cobertura_adjudicacion_pct}%`} color={r.cobertura_adjudicacion_pct == null ? C.dim : pctColor(r.cobertura_adjudicacion_pct)} />
        <BlockKpi label="Cobertura lectura"       valor={r.cobertura_lectura_label ?? "—"}    color={r.cobertura_lectura_pct != null ? pctColor(r.cobertura_lectura_pct) : C.dim} />
        <BlockKpi label="Flags abiertos"          valor={r.flags_abiertos.length === 0 ? "OK" : `${r.flags_abiertos.length}`} color={r.flags_abiertos.length === 0 ? C.green : C.amber} />
      </div>

      {/* Pliego complejo banner */}
      {r.pliego_complejo && (
        <div style={{ marginBottom: 18, padding: 14, background: `${C.purple}11`, border: `1px solid ${C.purple}66`, borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 6 }}>⚙ Este pliego es complejo</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
            {r.motivos_complejidad.map((m: string, i: number) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {/* Bloques de auditoría narrativos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Section titulo="🎯 Confianza global — desglose del cálculo"      e={ex.confianza_global} />
        <Section titulo="📋 Cobertura del pliego (pre-adjudicación)"        e={ex.cobertura_pliego} />
        <Section titulo="🏆 Cobertura de la adjudicación"                  e={ex.cobertura_adjudicacion} />
        <Section titulo="📖 Cobertura de lectura — qué docs leyó el LLM"   e={ex.cobertura_lectura} />
        <Section titulo="📄 Documentos descargados"                        e={ex.docs_completos} />
        <Section titulo="🔗 Enlaces internos resueltos"                    e={ex.links_embebidos_resueltos} />
        <Section titulo="👁 Lectura por Vision API"                         e={ex.docs_legibles} />
        <Section titulo="⚖ Σ pesos = 100 — criterios económicos + técnicos" e={ex.criterios_suman_100} />
        <Section titulo={`🧮 Criterios encontrados (${r.criterios_count?.total ?? 0})`} e={ex.criterios_detalle} maxDetalles={200} />
        <Section titulo="📍 Σ ubicaciones vs mínimo del pliego"            e={ex.coherencia_ubis} />
        <Section titulo="🌍 Cobertura geográfica — coordenadas por ubicación" e={ex.cobertura_geo} />
        <Section titulo="🔌 Puntos de carga claros por ubicación"           e={ex.cobertura_puntos} />
        <Section titulo="📐 Anexos del pliego (deep-links #page=N)"        e={ex.anexos_validos} />
        <Section titulo="🏢 Licitadores extraídos"                          e={ex.licitadores_vs_acta} />
        <Section titulo="⚙ Pliego complejo — diagnóstico"                  e={ex.pliego_complejo} />
        <Section titulo="🕒 Última extracción"                              e={ex.ultima_extraccion} />
        <Section titulo="⚠️ Flags / alertas pendientes"                     e={ex.flags_abiertos} />
      </div>

      {/* Footer info */}
      <div style={{ marginTop: 32, padding: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
        <strong style={{ color: C.text }}>Sobre esta página:</strong> es la auditoría completa narrativa del slug{" "}
        <code style={{ color: C.purple }}>{r.slug}</code>. Cada bloque corresponde a una métrica de la tabla principal,
        expandida con su descripción y todos los detalles que se mostraban en el tooltip de hover. Si necesitás abrir el
        expediente original, usá el link &quot;Ver detalle PLACSP&quot; arriba.
      </div>
    </div>
  );
}

function pctColor(pct: number) {
  return pct >= 85 ? C.green : pct >= 60 ? C.amber : C.red;
}

function BlockKpi({ label, valor, color }: { label: string; valor: string; color: string }) {
  return (
    <div style={{ minWidth: 180, padding: "14px 18px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 11, color: C.soft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{valor}</div>
    </div>
  );
}

function Section({ titulo, e, maxDetalles = 100 }: { titulo: string; e?: Explicacion; maxDetalles?: number }) {
  if (!e || (!e.descripcion && (!e.detalles || e.detalles.length === 0))) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{titulo}</div>
        <div style={{ fontSize: 12, color: C.dim, fontStyle: "italic" }}>Sin datos para esta métrica.</div>
      </div>
    );
  }
  const detallesViz = (e.detalles ?? []).slice(0, maxDetalles);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{titulo}</div>
      {e.descripcion && (
        <p style={{ margin: "0 0 10px", fontSize: 13, color: C.text, lineHeight: 1.6 }}>{e.descripcion}</p>
      )}
      {detallesViz.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
          {detallesViz.map((d, i) => (
            <li key={i} style={{
              fontFamily: d.startsWith("   ") ? "ui-monospace, SFMono-Regular, monospace" : "inherit",
              fontSize: 12,
              color: d.startsWith("✅") ? C.green : d.startsWith("❌") ? C.red : d.startsWith("⚠") ? C.amber : C.muted,
              padding: "2px 0",
              whiteSpace: "pre-wrap",
            }}>
              {d}
            </li>
          ))}
        </ul>
      )}
      {(e.detalles?.length ?? 0) > maxDetalles && (
        <div style={{ marginTop: 6, fontSize: 11, color: C.dim, fontStyle: "italic" }}>
          (mostrando {maxDetalles} de {e.detalles!.length})
        </div>
      )}
    </div>
  );
}
