"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

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

type CriterioMaster = {
  clave: string;
  label: string;
  tipo: string;
  frecuencia: number;
  ocurrencias_total: number;
  peso_min: number | null;
  peso_max: number | null;
  peso_promedio: number | null;
  descripciones_observadas: string[];
  licitaciones: string[];
  ocurrencias: Array<{ slug: string; peso: number | null; fuente: string; tipo: string }>;
};

type Props = {
  data: {
    generado_en: string;
    total_criterios_unicos: number;
    total_licitaciones_analizadas: number;
    criterios: CriterioMaster[];
  };
};

const TIPO_COLOR: Record<string, string> = {
  economico:       C.amber,
  tecnico:         C.blue,
  tecnico_cuant:   C.blue,
  tecnico_juicio:  C.purple,
  mejora_puntuable: C.green,
  juicio_valor:    C.purple,
  otro:            C.muted,
  desconocido:     C.dim,
};

const TIPO_LABEL: Record<string, string> = {
  economico:        "Económico",
  tecnico:          "Técnico",
  tecnico_cuant:    "Técnico cuantitativo",
  tecnico_juicio:   "Técnico (juicio de valor)",
  mejora_puntuable: "Mejora puntuable",
  juicio_valor:     "Juicio de valor",
  otro:             "Otro",
  desconocido:      "Desconocido",
};

export function CriteriosMasterTable({ data }: Props) {
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [criterioExpandido, setCriterioExpandido] = useState<string | null>(null);

  const tiposUnicos = useMemo(
    () => Array.from(new Set(data.criterios.map((c) => c.tipo))).sort(),
    [data.criterios]
  );

  const filtrados = useMemo(() => {
    let xs = data.criterios;
    if (filtroTipo !== "todos") xs = xs.filter((c) => c.tipo === filtroTipo);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      xs = xs.filter((c) =>
        c.label.toLowerCase().includes(q) ||
        c.clave.toLowerCase().includes(q) ||
        c.descripciones_observadas.some((d) => d.toLowerCase().includes(q))
      );
    }
    return xs;
  }, [data.criterios, filtroTipo, busqueda]);

  const totales = {
    economico:        data.criterios.filter((c) => c.tipo === "economico").length,
    tecnico:          data.criterios.filter((c) => c.tipo.startsWith("tecnico")).length,
    mejora_puntuable: data.criterios.filter((c) => c.tipo === "mejora_puntuable").length,
    juicio_valor:     data.criterios.filter((c) => c.tipo === "juicio_valor").length,
  };

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", padding: "32px 28px", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", gap: 8, fontSize: 11, color: C.muted, marginBottom: 4 }}>
            <Link href="/info/licitaciones" style={{ color: C.muted, textDecoration: "none" }}>← Licitaciones</Link>
            <span>·</span>
            <Link href="/info/licitaciones/auditoria" style={{ color: C.muted, textDecoration: "none" }}>Auditoría</Link>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0", letterSpacing: "-0.01em" }}>
            🎯 Criterios maestros
          </h1>
          <p style={{ color: C.muted, fontSize: 12, margin: "4px 0 0", maxWidth: 760 }}>
            Tabla maestra de los criterios de adjudicación encontrados en todas las licitaciones procesadas, agrupados por
            clave canónica. La tabla crece automáticamente cuando se procesan nuevas licitaciones — si dos pliegos describen
            el mismo concepto con distintas palabras (ej. &quot;mejora del canon&quot; vs &quot;incremento del canon variable&quot;),
            se normalizan bajo la misma clave para que vos puedas verlos juntos.
            Generado el {new Date(data.generado_en).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}.
          </p>
        </div>
      </div>

      {/* Pestañas (auditoría / criterios) */}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <Link href="/info/licitaciones/auditoria"
              style={{ padding: "8px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          🔍 Auditoría por licitación
        </Link>
        <Link href="/info/licitaciones/auditoria/criterios"
              style={{ padding: "8px 16px", background: `${C.purple}22`, border: `1px solid ${C.purple}66`, borderRadius: 8, color: C.purple, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          🎯 Criterios maestros
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Pill label="Criterios únicos" value={data.total_criterios_unicos} color={C.text} />
        <Pill label="Licitaciones analizadas" value={data.total_licitaciones_analizadas} color={C.text} />
        <Pill label="🟡 Económicos" value={totales.economico} color={C.amber} />
        <Pill label="🔵 Técnicos" value={totales.tecnico} color={C.blue} />
        <Pill label="🟢 Mejoras puntuables" value={totales.mejora_puntuable} color={C.green} />
        <Pill label="🟣 Juicio de valor" value={totales.juicio_valor} color={C.purple} />
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setFiltroTipo("todos")}
          style={pill(filtroTipo === "todos")}>
          Todos
        </button>
        {tiposUnicos.map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            style={pill(filtroTipo === t, TIPO_COLOR[t])}>
            {TIPO_LABEL[t] ?? t}
          </button>
        ))}
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por descripción, clave canónica…"
          style={{
            marginLeft: "auto",
            padding: "6px 12px",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.text,
            fontSize: 12,
            minWidth: 280,
          }}
        />
      </div>

      {/* Tabla maestra */}
      <div style={{ marginTop: 16, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.rowAlt, color: C.muted, textAlign: "left" }}>
              <Th>Clave canónica / Concepto</Th>
              <Th>Tipo</Th>
              <Th title="En cuántas licitaciones distintas aparece">Frecuencia</Th>
              <Th title="Cantidad total de apariciones (puede haber varios criterios distintos en una misma licitación que mapeen al mismo concepto)">Ocurrencias</Th>
              <Th>Peso típico</Th>
              <Th>Variantes redactadas</Th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c, i) => {
              const expandido = criterioExpandido === c.clave;
              const color = TIPO_COLOR[c.tipo] ?? C.muted;
              return (
                <Fragment key={c.clave}>
                  <tr
                    onClick={() => setCriterioExpandido(expandido ? null : c.clave)}
                    style={{ background: i % 2 === 0 ? "transparent" : C.rowAlt, borderTop: `1px solid ${C.grid}`, cursor: "pointer" }}>
                    <Td>
                      <div style={{ fontWeight: 600, color: C.text, fontSize: 12 }}>{c.label}</div>
                      <div style={{ color: C.dim, fontSize: 10, fontFamily: "ui-monospace, monospace", marginTop: 2 }}>{c.clave}</div>
                    </Td>
                    <Td>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: `${color}22`, border: `1px solid ${color}66`, color, fontSize: 10, fontWeight: 700 }}>
                        {TIPO_LABEL[c.tipo] ?? c.tipo}
                      </span>
                    </Td>
                    <Td><span style={{ color: c.frecuencia >= 3 ? C.green : c.frecuencia >= 2 ? C.amber : C.muted, fontWeight: 700 }}>{c.frecuencia}</span> <span style={{ color: C.muted, fontSize: 10 }}>de {data.total_licitaciones_analizadas}</span></Td>
                    <Td>{c.ocurrencias_total}</Td>
                    <Td>
                      {c.peso_min != null && c.peso_max != null ? (
                        c.peso_min === c.peso_max
                          ? <span>{c.peso_min} pts</span>
                          : <span>{c.peso_min}…{c.peso_max} pts <span style={{ color: C.dim }}>(prom {c.peso_promedio})</span></span>
                      ) : <span style={{ color: C.dim }}>—</span>}
                    </Td>
                    <Td><span style={{ color: C.muted, fontSize: 11 }}>{c.descripciones_observadas.length} variantes {expandido ? "▾" : "▸"}</span></Td>
                  </tr>
                  {expandido && (
                    <tr style={{ background: C.rowAlt }}>
                      <td colSpan={6} style={{ padding: "12px 16px", borderTop: `1px solid ${C.grid}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                          <div>
                            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>📝 Variantes de redacción observadas</div>
                            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: C.text }}>
                              {c.descripciones_observadas.map((d, j) => (
                                <li key={j} style={{ marginBottom: 4 }}>{d}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>🏛 Licitaciones donde aparece</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {c.ocurrencias.map((o, j) => (
                                <Link key={j} href={`/info/licitaciones/${o.slug}`}
                                      style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, color: C.text, textDecoration: "none" }}>
                                  <span style={{ fontFamily: "ui-monospace, monospace" }}>{o.slug}</span>
                                  <span style={{ color: C.muted }}>
                                    {o.peso != null ? `${o.peso} pts` : "—"} · <span style={{ color: C.dim, fontSize: 9 }}>{o.fuente.split(".").pop()}</span>
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, padding: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 11, color: C.muted }}>
        <strong style={{ color: C.text }}>¿Cómo funciona la normalización?</strong> Cada criterio extraído de un pliego pasa por una función{" "}
        <code>clavearCriterio()</code> que detecta conceptos canónicos por keywords (canon, kWh usuario, puntos de carga,
        potencia, sostenibilidad, app, mantenimiento, etc.). Si dos criterios mapean a la misma clave, se agrupan en una
        sola fila aunque estén redactados distinto. Las que no caen en ningún concepto conocido usan las primeras 2-3 palabras
        como clave fallback (aparecen como minúsculas separadas por guiones bajos). Cuando aparece un nuevo concepto recurrente
        en sesión 3, se puede agregar al mapeo y se reagrupa automáticamente al re-correr el script.
      </div>
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, minWidth: 100 }}>
      <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function Th({ children, title }: { children: React.ReactNode; title?: string }) {
  return <th title={title} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{children}</th>;
}

function Td({ children, ...rest }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td style={{ padding: "10px 12px", verticalAlign: "middle" }} {...rest}>{children}</td>;
}

function pill(active: boolean, accent?: string) {
  const c = accent ?? C.purple;
  return {
    padding: "6px 14px",
    background: active ? `${c}22` : C.card,
    border: `1px solid ${active ? `${c}66` : C.border}`,
    borderRadius: 8,
    color: active ? c : C.muted,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    textTransform: "capitalize" as const,
  };
}
