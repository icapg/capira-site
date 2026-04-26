import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.10)",
  purple: "#a78bfa",
  amber:  "#fbbf24",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.72)",
  soft:   "rgba(241,245,249,0.55)",
  dim:    "rgba(241,245,249,0.40)",
};

export const metadata: Metadata = {
  title: "Pliegos complejos · Auditoría · Licitaciones | Capira",
  description: "Licitaciones con contradicciones internas, Q&A oficiales, variantes raras o ambigüedades resueltas manualmente.",
  alternates: { canonical: "/info/licitaciones/auditoria/complejos" },
};

export default function PliegosComplejosPage() {
  const file = path.join(process.cwd(), "data", "licitaciones-auditoria.json");
  if (!fs.existsSync(file)) {
    return (
      <div style={{ padding: 32, color: C.text, background: C.bg, minHeight: "100vh", fontFamily: "system-ui" }}>
        <p style={{ color: C.soft }}>No hay datos. Ejecutá <code>node scripts/placsp-auditoria.mjs</code> primero.</p>
      </div>
    );
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const complejos = data.licitaciones.filter((r: { pliego_complejo: boolean }) => r.pliego_complejo);

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", padding: "32px 28px", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>

      <div style={{ marginBottom: 4 }}>
        <div style={{ display: "flex", gap: 8, fontSize: 12, color: C.soft, marginBottom: 4 }}>
          <Link href="/info/licitaciones" style={{ color: C.soft, textDecoration: "none" }}>← Licitaciones</Link>
          <span>·</span>
          <Link href="/info/licitaciones/auditoria" style={{ color: C.soft, textDecoration: "none" }}>Auditoría</Link>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0", letterSpacing: "-0.01em" }}>
          ⚙ Pliegos complejos
        </h1>
        <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0", maxWidth: 800, lineHeight: 1.5 }}>
          Licitaciones cuyo articulado tiene contradicciones internas, variantes raras de retribución o ambigüedades
          que requirieron decisiones especiales en la extracción (típicamente Q&A oficiales del expediente como override del
          pliego original). Cada caso vale leerlo antes de tomar decisiones de negocio sobre esa licitación.
        </p>
      </div>

      {/* Pestañas */}
      <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
        <Tab href="/info/licitaciones/auditoria"           label="🔍 Auditoría por licitación" active={false} />
        <Tab href="/info/licitaciones/auditoria/criterios" label="🎯 Criterios maestros"        active={false} />
        <Tab href="/info/licitaciones/auditoria/complejos" label="⚙ Pliegos complejos"          active />
      </div>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        {complejos.map((r: { slug: string; titulo: string; ciudad: string | null; confianza_global: number; motivos_complejidad: string[] }) => (
          <div key={r.slug} style={{ background: C.card, border: `1px solid ${C.purple}44`, borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <Link href={`/info/licitaciones/auditoria/${r.slug}`} style={{ color: C.text, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                {r.titulo}
              </Link>
              <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 11, color: C.soft }}>
                <span>{r.slug}</span>
                <span>·</span>
                <span>{r.ciudad ?? "—"}</span>
                <span>·</span>
                <span style={{ color: C.amber }}>confianza {r.confianza_global}%</span>
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.text, lineHeight: 1.7 }}>
              {r.motivos_complejidad.map((m: string, i: number) => (
                <li key={i} style={{ marginBottom: 4 }}>{m}</li>
              ))}
            </ul>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <Link href={`/info/licitaciones/auditoria/${r.slug}`}
                    style={{ fontSize: 11, fontWeight: 700, color: C.purple, textDecoration: "none", padding: "5px 12px", border: `1px solid ${C.purple}66`, borderRadius: 6, background: `${C.purple}22` }}>
                Ver auditoría detallada →
              </Link>
              <Link href={`/info/licitaciones/${r.slug}`}
                    style={{ fontSize: 11, fontWeight: 700, color: C.soft, textDecoration: "none", padding: "5px 12px", border: `1px solid ${C.border}`, borderRadius: 6 }}>
                Detalle PLACSP →
              </Link>
            </div>
          </div>
        ))}
        {complejos.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: C.soft, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
            No hay pliegos complejos detectados. Todos los expedientes auditados siguen las reglas convencionales.
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href}
          style={{ padding: "8px 16px",
                   background: active ? `${C.purple}22` : C.card,
                   border: `1px solid ${active ? `${C.purple}66` : C.border}`,
                   borderRadius: 8,
                   color: active ? C.purple : C.muted,
                   fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
      {label}
    </Link>
  );
}
