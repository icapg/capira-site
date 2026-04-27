"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
  muted:  "rgba(241,245,249,0.72)",
  soft:   "rgba(241,245,249,0.55)",
  dim:    "rgba(241,245,249,0.40)",
  grid:   "rgba(255,255,255,0.06)",
  rowAlt: "rgba(255,255,255,0.025)",
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
  cobertura_lectura_pct: number;
  cobertura_lectura_label: string;
  cobertura_lectura_total: number;
  cobertura_lectura_leidos: number;
  cobertura_lectura_scanned_sin_vision: number;
  cobertura_lectura_no_soportados: number;
  cobertura_lectura_no_citados: number;

  cobertura_geo_pct: number;
  cobertura_geo_label: string;
  cobertura_geo_total: number;
  cobertura_geo_con_coord: number;
  cobertura_geo_aprox: number;
  cobertura_geo_sin: number;

  cobertura_puntos_pct: number;
  cobertura_puntos_label: string;
  cobertura_puntos_total: number;
  cobertura_puntos_con: number;
  cobertura_puntos_sin: number;

  licitadores_vs_acta: string;
  coherencia_ubis: string;
  anexos_validos: string;

  coste_vision_usd: number;
  ultima_extraccion: { fecha: string | null; modelo: string | null };

  flags_abiertos: string[];
  etapa: string;
  explicaciones?: Explicaciones;
  criterios_detalle?: Array<{ tipo: string; peso: number | null; descripcion: string; formula?: string | null; clave_canonica?: string; subtipo?: string | null }>;
  criterios_count?: { economicos: number; tecnicos: number; mejoras: number; juicio: number; total: number };
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
  const [coords, setCoords] = useState<{ top: number; left: number; transform: string } | null>(null);
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

  // Calcula posición fija sobre el viewport para que el tooltip salga del
  // contenedor con overflow (no se corta por el scroll horizontal de la tabla).
  function recalcPos() {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const TT_W = 460;
    const TT_H = 280;
    const margin = 12;
    // Vertical: si hay menos de TT_H abajo, mostrar arriba
    const espacioAbajo = window.innerHeight - rect.bottom;
    const arriba = espacioAbajo < TT_H && rect.top > TT_H;
    const top = arriba ? rect.top - 8 : rect.bottom + 8;
    // Horizontal: alinear left con la celda, pero clamp para que no se salga
    let left = rect.left;
    if (left + TT_W > window.innerWidth - margin) left = window.innerWidth - TT_W - margin;
    if (left < margin) left = margin;
    const transform = arriba ? "translateY(-100%)" : "none";
    setCoords({ top, left, transform });
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
      {showing && coords && (
        <div
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            transform: coords.transform,
            zIndex: 1000,
            minWidth: 320,
            maxWidth: 460,
            maxHeight: "70vh",
            overflowY: "auto",
            background: C.cardSolid,
            border: `1px solid ${C.purple}aa`,
            borderRadius: 10,
            padding: "12px 14px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.85)",
            color: C.text,
            fontSize: 12,
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
                <li key={i} style={{ fontFamily: d.startsWith("   ") ? "ui-monospace, SFMono-Regular, monospace" : "inherit", fontSize: 11.5, color: C.muted, padding: "3px 0", whiteSpace: "pre-wrap" }}>
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

      {/* Pestañas */}
      <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
        <Link href="/info/licitaciones/auditoria"
              style={{ padding: "8px 16px", background: `${C.purple}22`, border: `1px solid ${C.purple}66`, borderRadius: 8, color: C.purple, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          🔍 Auditoría por licitación
        </Link>
        <Link href="/info/licitaciones/auditoria/criterios"
              style={{ padding: "8px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          🎯 Criterios maestros
        </Link>
        <Link href="/info/licitaciones/auditoria/complejos"
              style={{ padding: "8px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          ⚙ Pliegos complejos
        </Link>
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

      <div style={{ marginTop: 16, maxHeight: "75vh", overflowX: "auto", overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 10, position: "relative" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "21%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>
          <thead style={{ position: "sticky", top: 0, zIndex: 5, background: C.cardSolid, boxShadow: `0 1px 0 ${C.border}` }}>
            <tr style={{ color: C.muted, textAlign: "left" }}>
              <Th>Licitación</Th>
              <Th>Confianza</Th>
              <Th>Coberturas</Th>
              <Th>Documentos</Th>
              <Th>Criterios</Th>
              <Th>Ubicaciones</Th>
              <Th>Licitadores</Th>
              <Th>Flags</Th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r, i) => {
              const ex = r.explicaciones ?? {};
              return (
                <tr key={r.slug} style={{ background: i % 2 === 0 ? "transparent" : C.rowAlt, borderTop: `1px solid ${C.grid}` }}>
                  <Td>
                    <Link href={`/info/licitaciones/auditoria/${r.slug}`} style={{ color: C.text, textDecoration: "none", display: "block", padding: "6px 0" }} title="Ver auditoría detallada">
                      <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.35 }}>{r.titulo}</div>
                      <div style={{ color: C.soft, fontSize: 10.5, marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span>{r.slug}</span>
                        <span style={{ color: C.dim }}>·</span>
                        <span>{r.ciudad ?? "—"}</span>
                        {r.pliego_complejo && (
                          <ExplainCell titulo="Pliego complejo" explicacion={ex.pliego_complejo}>
                            <Badge color={C.purple} title="Pliego complejo">⚙ Complejo</Badge>
                          </ExplainCell>
                        )}
                      </div>
                      <div style={{ color: C.dim, fontSize: 9.5, marginTop: 4 }}>
                        <ExplainCell titulo="Última extracción" explicacion={ex.ultima_extraccion}>
                          <span>
                            {r.ultima_extraccion.fecha ? new Date(r.ultima_extraccion.fecha).toLocaleDateString("es-ES") : "sin fecha"}
                            {r.ultima_extraccion.modelo ? ` · ${r.ultima_extraccion.modelo}` : ""}
                          </span>
                        </ExplainCell>
                      </div>
                    </Link>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Confianza global" explicacion={ex.confianza_global}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{semaforoEmoji(r.semaforo)}</span>
                        <span style={{ color: semaforoColor(r.semaforo), fontWeight: 700, fontSize: 14 }}>{r.confianza_global}%</span>
                      </div>
                    </ExplainCell>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <StackedRow label="Pliego">
                        <ExplainCell titulo="Cobertura pliego" explicacion={ex.cobertura_pliego}>
                          <PctBar pct={r.cobertura_pliego_pct} />
                        </ExplainCell>
                      </StackedRow>
                      <StackedRow label="Adj.">
                        <ExplainCell titulo="Cobertura adjudicación" explicacion={ex.cobertura_adjudicacion}>
                          {r.cobertura_adjudicacion_pct == null ? <span style={{ color: C.dim }}>—</span> : <PctBar pct={r.cobertura_adjudicacion_pct} />}
                        </ExplainCell>
                      </StackedRow>
                      <StackedRow label="Lectura">
                        <ExplainCell titulo="Cobertura lectura" explicacion={ex.cobertura_lectura}>
                          <CoberturaLectura row={r} />
                        </ExplainCell>
                      </StackedRow>
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <StackedRow label="Docs">
                        <ExplainCell titulo="Documentos descargados" explicacion={ex.docs_completos}>
                          <span>{r.docs_completos}</span>
                        </ExplainCell>
                      </StackedRow>
                      <StackedRow label="Links">
                        <ExplainCell titulo="Enlaces internos resueltos" explicacion={ex.links_embebidos_resueltos}>
                          <span>{r.links_embebidos_resueltos}</span>
                        </ExplainCell>
                      </StackedRow>
                      <StackedRow label="Vision">
                        <ExplainCell titulo="Lectura por Vision API" explicacion={ex.docs_legibles}>
                          {r.uso_vision ? <Badge color={C.blue}>${r.coste_vision_usd}</Badge> : <span style={{ color: C.dim }}>—</span>}
                        </ExplainCell>
                      </StackedRow>
                      <StackedRow label="Anexos">
                        <ExplainCell titulo="Anexos del pliego" explicacion={ex.anexos_validos}>
                          <span>{r.anexos_validos}</span>
                        </ExplainCell>
                      </StackedRow>
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <StackedRow label="Σ=100">
                        <ExplainCell titulo="Σ pesos = 100" explicacion={ex.criterios_suman_100}>
                          <span>{r.criterios_suman_100}</span>
                        </ExplainCell>
                      </StackedRow>
                      <StackedRow label="Total">
                        <ExplainCell titulo="Criterios encontrados" explicacion={ex.criterios_detalle}>
                          <CriteriosBadge counts={r.criterios_count} />
                        </ExplainCell>
                      </StackedRow>
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <StackedRow label="Σ ubis">
                        <ExplainCell titulo="Σ ubicaciones vs mínimo pliego" explicacion={ex.coherencia_ubis}>
                          <span>{r.coherencia_ubis}</span>
                        </ExplainCell>
                      </StackedRow>
                      <StackedRow label="Geo">
                        <ExplainCell titulo="Cobertura geográfica" explicacion={ex.cobertura_geo}>
                          <CoberturaGeo row={r} />
                        </ExplainCell>
                      </StackedRow>
                      <StackedRow label="Puntos">
                        <ExplainCell titulo="Puntos de carga por ubicación" explicacion={ex.cobertura_puntos}>
                          <CoberturaPuntos row={r} />
                        </ExplainCell>
                      </StackedRow>
                    </div>
                  </Td>
                  <Td>
                    <ExplainCell titulo="Licitadores extraídos" explicacion={ex.licitadores_vs_acta}>
                      <span>{r.licitadores_vs_acta}</span>
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
              <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
  return <th title={title} style={{ padding: "12px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", color: "rgba(241,245,249,0.85)" }}>{children}</th>;
}

function Td({ children, title, ...rest }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td title={title} style={{ padding: "10px 12px", verticalAlign: "middle" }} {...rest}>{children}</td>;
}

function StackedRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", width: 52, flexShrink: 0, fontWeight: 700 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function CriteriosBadge({ counts }: { counts?: { economicos: number; tecnicos: number; mejoras: number; juicio: number; total: number } }) {
  if (!counts || counts.total === 0) return <span style={{ color: C.dim }}>—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 86 }}>
      <span style={{ fontWeight: 700, color: C.text, fontSize: 11 }}>{counts.total} crit.</span>
      <div style={{ display: "flex", gap: 4, fontSize: 9, color: C.muted }}>
        {counts.economicos > 0 && <span title="Económicos" style={{ color: C.amber }}>E:{counts.economicos}</span>}
        {counts.tecnicos > 0   && <span title="Técnicos top-level" style={{ color: C.blue }}>T:{counts.tecnicos}</span>}
        {counts.mejoras > 0    && <span title="Mejoras puntuables" style={{ color: C.green }}>M:{counts.mejoras}</span>}
        {counts.juicio > 0     && <span title="Juicio de valor" style={{ color: C.purple }}>JV:{counts.juicio}</span>}
      </div>
    </div>
  );
}

function CoberturaGeo({ row }: { row: AuditoriaRow }) {
  if ((row.cobertura_geo_total ?? 0) === 0) return <span style={{ color: C.dim }}>—</span>;
  const sin   = row.cobertura_geo_sin ?? 0;
  const aprox = row.cobertura_geo_aprox ?? 0;
  const color = sin > 0 ? C.red : aprox > 0 ? C.amber : C.green;
  const icono = sin > 0 ? "❌" : aprox > 0 ? "⚠️" : "✅";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 96 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12 }}>{icono}</span>
        <span style={{ color, fontWeight: 700, fontSize: 11 }}>{row.cobertura_geo_pct}%</span>
        <span style={{ color: C.muted, fontSize: 10 }}>· {row.cobertura_geo_con_coord}/{row.cobertura_geo_total}</span>
      </div>
      {(sin > 0 || aprox > 0) && (
        <div style={{ display: "flex", gap: 4, fontSize: 9 }}>
          {sin > 0   && <span style={{ color: C.red }}>{sin} sin</span>}
          {aprox > 0 && <span style={{ color: C.amber }}>{aprox} aprox</span>}
        </div>
      )}
    </div>
  );
}

function CoberturaPuntos({ row }: { row: AuditoriaRow }) {
  if ((row.cobertura_puntos_total ?? 0) === 0) return <span style={{ color: C.dim }}>—</span>;
  const sin   = row.cobertura_puntos_sin ?? 0;
  const color = sin > 0 ? C.red : C.green;
  const icono = sin > 0 ? "❌" : "✅";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 96 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12 }}>{icono}</span>
        <span style={{ color, fontWeight: 700, fontSize: 11 }}>{row.cobertura_puntos_pct}%</span>
        <span style={{ color: C.muted, fontSize: 10 }}>· {row.cobertura_puntos_con}/{row.cobertura_puntos_total}</span>
      </div>
      {sin > 0 && (
        <div style={{ display: "flex", gap: 4, fontSize: 9 }}>
          <span style={{ color: C.red }}>{sin} sin nº puntos</span>
        </div>
      )}
    </div>
  );
}

function CoberturaLectura({ row }: { row: AuditoriaRow }) {
  const tieneCritico = row.cobertura_lectura_scanned_sin_vision > 0 || row.cobertura_lectura_no_soportados > 0;
  const tieneAdvertencia = row.cobertura_lectura_no_citados > 0;
  const color = tieneCritico ? C.red : tieneAdvertencia ? C.amber : C.green;
  const icono = tieneCritico ? "❌" : tieneAdvertencia ? "⚠️" : "✅";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12 }}>{icono}</span>
        <span style={{ color, fontWeight: 700, fontSize: 11 }}>{row.cobertura_lectura_pct}%</span>
        <span style={{ color: C.muted, fontSize: 10 }}>· {row.cobertura_lectura_leidos}/{row.cobertura_lectura_total}</span>
      </div>
      {(tieneCritico || tieneAdvertencia) && (
        <div style={{ display: "flex", gap: 4, fontSize: 9 }}>
          {row.cobertura_lectura_scanned_sin_vision > 0 && <span style={{ color: C.red }}>{row.cobertura_lectura_scanned_sin_vision} scan</span>}
          {row.cobertura_lectura_no_soportados > 0 && <span style={{ color: C.red }}>{row.cobertura_lectura_no_soportados} ZIP/doc</span>}
          {row.cobertura_lectura_no_citados > 0 && <span style={{ color: C.amber }}>{row.cobertura_lectura_no_citados} sin citar</span>}
        </div>
      )}
    </div>
  );
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
