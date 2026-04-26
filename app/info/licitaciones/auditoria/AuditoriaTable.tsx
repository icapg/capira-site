"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.03)",
  cardSolid: "#0a0f1a",
  border: "rgba(255,255,255,0.07)",
  green:  "#34d399",
  blue:   "#38bdf8",
  purple: "#a78bfa",
  amber:  "#fbbf24",
  red:    "#f87171",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.42)",
  dim:    "rgba(241,245,249,0.20)",
  grid:   "rgba(255,255,255,0.045)",
  rowAlt: "rgba(255,255,255,0.02)",
};

type Explicacion = { descripcion?: string; detalles?: string[] };
type Explicaciones = Record<string, Explicacion>;

type AuditoriaRow = {
  slug: string;
  titulo: string;
  ciudad?: string | null;
  organo?: string | null;
  estado?: string | null;
  categoria?: string | null;

  confianza_global: number;
  semaforo: "verde" | "amarillo" | "rojo";

  docs_completos: string;
  links_embebidos_resueltos: string;
  docs_legibles: string;
  uso_vision: boolean;

  criterios_suman_100: string;
  suma_pesos: number;
  peso_economico: number;
  peso_tecnico: number;

  pliego_complejo: boolean;
  motivos_complejidad: string[];

  cobertura_pliego_pct: number;
  cobertura_adjudicacion_pct: number | null;

  licitadores_vs_acta: string;
  coherencia_ubis: string;
  anexos_validos: string;

  coste_vision_usd: number;
  ultima_extraccion: { fecha: string | null; modelo: string | null };

  flags_abiertos: string[];
  etapa: string;
  explicaciones?: Explicaciones;
};

type Props = {
  data: {
    generado_en: string;
    total: number;
    resumen: {
      verdes: number;
      amarillos: number;
      rojos: number;
      complejos: number;
      con_vision: number;
      coste_vision_total_usd: number;
    };
    licitaciones: AuditoriaRow[];
  };
};

const semaforoColor = (s: string) => (s === "verde" ? C.green : s === "amarillo" ? C.amber : C.red);
const semaforoEmoji = (s: string) => (s === "verde" ? "🟢" : s === "amarillo" ? "🟡" : "🔴");

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, minWidth: 110 }}>
      <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function Badge({ color, children, title }: { color: string; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: `${color}22`, border: `1px solid ${color}66`, color, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

/** Tooltip enriquecido: aparece al hover, click hace "pin" para que no se cierre. */
function ExplainCell({
  titulo,
  explicacion,
  children,
}: {
  titulo: string;
  explicacion?: Explicacion;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<"below" | "above">("below");
  const ref = useRef<HTMLDivElement | null>(null);

  // Cerrar pinned al click fuera
  useEffect(() => {
    if (!pinned) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPinned(false);
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pinned]);

  const showing = open || pinned;

  // Calcula posición arriba/abajo según espacio disponible
  function recalcPos() {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    setPos(espacioAbajo < 280 ? "above" : "below");
  }

  if (!explicacion) return <>{children}</>;

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-flex", cursor: "help", borderBottom: `1px dotted ${C.dim}` }}
      onMouseEnter={() => { recalcPos(); setOpen(true); }}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); recalcPos(); setPinned((p) => !p); }}
    >
      {children}
      {showing && (
        <div
          style={{
            position: "absolute",
            [pos === "below" ? "top" : "bottom"]: "calc(100% + 8px)",
            left: 0,
            zIndex: 100,
            minWidth: 320,
            maxWidth: 460,
            background: C.cardSolid,
            border: `1px solid ${C.purple}66`,
            borderRadius: 10,
            padding: "12px 14px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.7)",
            color: C.text,
            fontSize: 11,
            fontWeight: 400,
            lineHeight: 1.55,
            textTransform: "none",
            letterSpacing: "normal",
            whiteSpace: "normal",
            cursor: "default",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontWeight: 700, fontSize: 11.5, color: C.purple, textTransform: "uppercase", letterSpacing: "0.05em" }}>{titulo}</span>
            {pinned && (
              <button
                onClick={(e) => { e.stopPropagation(); setPinned(false); setOpen(false); }}
                style={{ background: "transparent", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", padding: 0, lineHeight: 1 }}
                title="Cerrar"
              >×</button>
            )}
          </div>
          {explicacion.descripcion && (
            <div style={{ marginBottom: explicacion.detalles && explicacion.detalles.length > 0 ? 8 : 0, color: C.text }}>
              {explicacion.descripcion}
            </div>
          )}
          {explicacion.detalles && explicacion.detalles.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
              {explicacion.detalles.map((d, i) => (
                <li key={i} style={{ fontFamily: d.startsWith("   ") ? "ui-monospace, SFMono-Regular, monospace" : "inherit", fontSize: 10.5, color: C.muted, padding: "2px 0", whiteSpace: "pre-wrap" }}>
                  {d}
                </li>
              ))}
            </ul>
          )}
          {!pinned && (
            <div style={{ marginTop: 8, fontSize: 9, color: C.dim, fontStyle: "italic" }}>
              clic para fijar
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AuditoriaTable({ data }: Props) {
  const [filtro, setFiltro] = useState<"todos" | "verde" | "amarillo" | "rojo" | "complejos">("todos");
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    let xs = data.licitaciones;
    if (filtro === "verde" || filtro === "amarillo" || filtro === "rojo") {
      xs = xs.filter((r) => r.semaforo === filtro);
    } else if (filtro === "complejos") {
      xs = xs.filter((r) => r.pliego_complejo);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      xs = xs.filter((r) => `${r.slug} ${r.titulo} ${r.organo ?? ""} ${r.ciudad ?? ""}`.toLowerCase().includes(q));
    }
    return xs.sort((a, b) => a.confianza_global - b.confianza_global);
  }, [data.licitaciones, filtro, busqueda]);

  const complejos = data.licitaciones.filter((r) => r.pliego_complejo);

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", padding: "32px 28px", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Link href="/info/licitaciones" style={{ fontSize: 11, color: C.muted, textDecoration: "none" }}>← Licitaciones</Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0", letterSpacing: "-0.01em" }}>
            🔍 Auditoría de extracción
          </h1>
          <p style={{ color: C.muted, fontSize: 12, margin: "4px 0 0" }}>
            Calidad y confiabilidad de la extracción automática de cada licitación procesada. Pasá el cursor sobre cualquier celda para ver el detalle de por qué tiene ese valor (clic para fijar).
            Generado el {new Date(data.generado_en).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <StatPill label="Total" value={data.total} color={C.text} />
        <StatPill label="🟢 Verde ≥85%" value={data.resumen.verdes} color={C.green} />
        <StatPill label="🟡 Amarillo 60-84%" value={data.resumen.amarillos} color={C.amber} />
        <StatPill label="🔴 Rojo <60%" value={data.resumen.rojos} color={C.red} />
        <StatPill label="⚙ Pliegos complejos" value={data.resumen.complejos} color={C.purple} />
        <StatPill label="👁 Con Vision API" value={`${data.resumen.con_vision} ($${data.resumen.coste_vision_total_usd.toFixed(2)})`} color={C.blue} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap", alignItems: "center" }}>
        {(["todos", "verde", "amarillo", "rojo", "complejos"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "6px 14px",
              background: filtro === f ? `${C.purple}22` : C.card,
              border: `1px solid ${filtro === f ? `${C.purple}66` : C.border}`,
              borderRadius: 8,
              color: filtro === f ? C.purple : C.muted,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar slug, título, órgano…"
          style={{
            marginLeft: "auto",
            padding: "6px 12px",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.text,
            fontSize: 12,
            minWidth: 240,
          }}
        />
      </div>

      <div style={{ marginTop: 16, overflowX: "auto", overflowY: "visible", border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <table style={{ width: "100%", minWidth: 1500, borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.rowAlt, color: C.muted, textAlign: "left" }}>
              <Th>Licitación</Th>
              <Th>Confianza</Th>
              <Th>Cob. pliego</Th>
              <Th>Cob. adj.</Th>
              <Th>Docs</Th>
              <Th>Links emb.</Th>
              <Th>Vision</Th>
              <Th>Σ=100</Th>
              <Th>Σ ubis</Th>
              <Th>Anexos</Th>
              <Th>Licitadores</Th>
              <Th>Pliego complejo</Th>
              <Th>Última extr.</Th>
              <Th>Flags</Th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r, i) => {
              const ex = r.explicaciones ?? {};
              return (
                <tr key={r.slug} style={{ background: i % 2 === 0 ? "transparent" : C.rowAlt, borderTop: `1px solid ${C.grid}` }}>
                  <Td>
                    <Link href={`/info/licitaciones/${r.slug}`} style={{ color: C.text, textDecoration: "none", display: "block", padding: "8px 0" }}>
                      <div style={{ fontWeight: 600, fontSize: 11.5 }}>{r.titulo.length > 60 ? r.titulo.slice(0, 60) + "…" : r.titulo}</div>
                      <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{r.slug} · {r.ciudad ?? "—"}</div>
                    </Link>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Confianza global" explicacion={ex.confianza_global}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{semaforoEmoji(r.semaforo)}</span>
                        <span style={{ color: semaforoColor(r.semaforo), fontWeight: 700 }}>{r.confianza_global}%</span>
                      </div>
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Cobertura pliego" explicacion={ex.cobertura_pliego}>
                      <PctBar pct={r.cobertura_pliego_pct} />
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Cobertura adjudicación" explicacion={ex.cobertura_adjudicacion}>
                      {r.cobertura_adjudicacion_pct == null ? <span style={{ color: C.dim }}>—</span> : <PctBar pct={r.cobertura_adjudicacion_pct} />}
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Documentos descargados" explicacion={ex.docs_completos}>
                      <span>{r.docs_completos}</span>
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Enlaces internos resueltos" explicacion={ex.links_embebidos_resueltos}>
                      <span>{r.links_embebidos_resueltos}</span>
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Lectura por Vision API" explicacion={ex.docs_legibles}>
                      {r.uso_vision ? <Badge color={C.blue}>Vision ${r.coste_vision_usd}</Badge> : <span style={{ color: C.dim }}>—</span>}
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Σ pesos = 100" explicacion={ex.criterios_suman_100}>
                      <span>{r.criterios_suman_100}</span>
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Σ ubicaciones vs mínimo pliego" explicacion={ex.coherencia_ubis}>
                      <span>{r.coherencia_ubis}</span>
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Anexos del pliego" explicacion={ex.anexos_validos}>
                      <span>{r.anexos_validos}</span>
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Licitadores extraídos" explicacion={ex.licitadores_vs_acta}>
                      <span>{r.licitadores_vs_acta}</span>
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Pliego complejo" explicacion={ex.pliego_complejo}>
                      {r.pliego_complejo
                        ? <Badge color={C.purple}>⚙ Complejo</Badge>
                        : <span style={{ color: C.dim }}>—</span>}
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Última extracción" explicacion={ex.ultima_extraccion}>
                      <div>
                        <div style={{ fontSize: 10 }}>{r.ultima_extraccion.fecha ? new Date(r.ultima_extraccion.fecha).toLocaleDateString("es-ES") : "—"}</div>
                        <div style={{ color: C.muted, fontSize: 9 }}>{r.ultima_extraccion.modelo ?? ""}</div>
                      </div>
                    </ExplainCell>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Alertas pendientes" explicacion={ex.flags_abiertos}>
                      {r.flags_abiertos.length === 0
                        ? <Badge color={C.green}>OK</Badge>
                        : <Badge color={C.amber}>{r.flags_abiertos.length} flag{r.flags_abiertos.length === 1 ? "" : "s"}</Badge>}
                    </ExplainCell>
                  </Td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr><Td>—</Td><td colSpan={13} style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {complejos.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>⚙ Pliegos complejos</h2>
          <p style={{ color: C.muted, fontSize: 11, margin: "0 0 14px" }}>
            Licitaciones con contradicciones internas en el pliego, variantes raras o ambigüedades resueltas por Q&A oficial.
            Acción: revisar la nota del extractor antes de tomar decisiones de negocio.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {complejos.map((r) => (
              <div key={r.slug} style={{ background: C.card, border: `1px solid ${C.purple}33`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                  <Link href={`/info/licitaciones/${r.slug}`} style={{ color: C.text, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                    {r.titulo}
                  </Link>
                  <span style={{ color: C.muted, fontSize: 10 }}>{r.slug} · {r.ciudad ?? ""} · confianza {r.confianza_global}%</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: C.text }}>
                  {r.motivos_complejidad.map((m, i) => (
                    <li key={i} style={{ marginBottom: 2 }}>{m}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 36, padding: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 11, color: C.muted }}>
        <strong style={{ color: C.text }}>¿Cómo se calcula la confianza?</strong> Combina cobertura de campos del pliego (12 campos críticos) +
        cobertura de adjudicación (4 campos, si aplica) y aplica penalizaciones por: pesos de criterios que no suman 100,
        incoherencia entre Σ ubicaciones nuevas y mínimo del pliego, links embebidos no resueltos, y pliegos complejos con
        contradicción no incorporada vía Q&A. Semáforo: 🟢 ≥85, 🟡 60-84, 🔴 &lt;60. Cada celda con borde punteado tiene un
        tooltip detallado al hacer hover.
      </div>
    </div>
  );
}

function Th({ children, title }: { children: React.ReactNode; title?: string }) {
  return <th title={title} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{children}</th>;
}

function Td({ children, title, ...rest }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td title={title} style={{ padding: "10px 12px", verticalAlign: "middle" }} {...rest}>{children}</td>;
}

function PctBar({ pct }: { pct: number }) {
  const color = pct >= 85 ? C.green : pct >= 60 ? C.amber : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 6, background: C.grid, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ color, fontSize: 10, fontWeight: 700, minWidth: 30, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}
