"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../../../lib/useIsMobile";
import type { MarcaIndexEntry } from "../types";

const DOMINIO_ICON: Record<string, string> = {
  turismo: "🚗",
  moto: "🏍️",
  trimoto: "🛺",
  furgoneta_van: "🚐",
  camion: "🚚",
  autobus: "🚌",
  agricola: "🚜",
  quad_atv: "🏁",
  remolque: "🚛",
  especial: "🛠️",
  microcar: "🛵",
  otros: "▫️",
  mixto: "🔀",
};

function fmtMiles(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function normaliza(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

type Props = {
  marcas: MarcaIndexEntry[];
  slugActivo: string | null;
  onSelect: (slug: string) => void;
};

export function MarcaSelector({ marcas, slugActivo, onSelect }: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activa = useMemo(() => marcas.find((m) => m.slug === slugActivo) ?? null, [marcas, slugActivo]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const { destacadas, resto } = useMemo(() => {
    const q = normaliza(query.trim());
    const filtradas = q
      ? marcas.filter((m) => normaliza(m.marca).includes(q))
      : marcas;
    return {
      destacadas: filtradas.filter((m) => m.destacada).sort((a, b) => b.parque_activo - a.parque_activo),
      resto:      filtradas.filter((m) => !m.destacada).sort((a, b) => a.marca.localeCompare(b.marca)),
    };
  }, [marcas, query]);

  const pick = (slug: string) => {
    onSelect(slug);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", maxWidth: isMobile ? "100%" : 420 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.14)",
          color: "#f1f5f9",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16 }}>{activa ? DOMINIO_ICON[activa.dominio] ?? "🔀" : "🔍"}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activa ? activa.marca : "Elegí una marca…"}
          </span>
          {activa && (
            <span style={{ fontSize: 11, color: "rgba(241,245,249,0.5)", fontWeight: 600 }}>
              · {fmtMiles(activa.parque_activo)} en parque
            </span>
          )}
        </span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#0b1020",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 10,
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            zIndex: 50,
            padding: 6,
            display: "flex",
            flexDirection: "column",
            maxHeight: 420,
          }}
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar marca…"
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "#f1f5f9",
              fontSize: 13,
              outline: "none",
              marginBottom: 6,
            }}
          />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {destacadas.length > 0 && (
              <GrupoLabel>Destacadas</GrupoLabel>
            )}
            {destacadas.map((m) => (
              <Item key={m.slug} m={m} active={m.slug === slugActivo} onClick={() => pick(m.slug)} />
            ))}
            {resto.length > 0 && (
              <GrupoLabel>Todas{destacadas.length > 0 ? " las demás" : ""}</GrupoLabel>
            )}
            {resto.map((m) => (
              <Item key={m.slug} m={m} active={m.slug === slugActivo} onClick={() => pick(m.slug)} />
            ))}
            {destacadas.length === 0 && resto.length === 0 && (
              <div style={{ padding: "18px 12px", color: "rgba(241,245,249,0.5)", fontSize: 12, textAlign: "center" }}>
                Sin coincidencias para “{query}”.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GrupoLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "8px 10px 4px",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.1em",
        color: "rgba(241,245,249,0.45)",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function Item({ m, active, onClick }: { m: MarcaIndexEntry; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "7px 10px",
        borderRadius: 6,
        border: "1px solid transparent",
        background: active ? "rgba(56,189,248,0.12)" : "transparent",
        color: active ? "#f1f5f9" : "rgba(241,245,249,0.78)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 8,
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 14 }}>{DOMINIO_ICON[m.dominio] ?? "🔀"}</span>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {m.marca}
      </span>
      {m.pocos_datos && <span title="Pocos datos" style={{ fontSize: 10, opacity: 0.5 }}>⚠</span>}
      <span style={{ fontSize: 10, color: "rgba(241,245,249,0.5)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
        {fmtMiles(m.parque_activo)}
      </span>
    </button>
  );
}
