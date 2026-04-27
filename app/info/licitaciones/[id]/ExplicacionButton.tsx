"use client";

import { useEffect, useState } from "react";
import type { ExplicacionExtendida } from "@/app/lib/insights/licitaciones-data";

const C = {
  cardSolid: "#0a0f1a",
  border:    "rgba(255,255,255,0.10)",
  green:     "#34d399",
  amber:     "#fbbf24",
  red:       "#f87171",
  blue:      "#38bdf8",
  text:      "rgba(255,255,255,0.92)",
  dim:       "rgba(255,255,255,0.62)",
};

const BADGE: Record<string, { label: string; color: string }> = {
  obligatorio:  { label: "OBLIGATORIO",                     color: C.red    },
  alternativa: { label: "ALTERNATIVA — A ELECCIÓN",         color: C.amber  },
  opcional:    { label: "OPCIONAL — MEJORA PUNTUABLE",      color: C.green  },
  informativo: { label: "MARCO GENERAL",                    color: C.blue   },
};

type Props = {
  /** Texto del botón ("📖 Hardware explicado", "📖 Canon explicado", etc.). */
  label:        string;
  /** Título del modal. */
  modalTitulo:  string;
  /** Una sección (canon_explicacion) o varias (hardware_especificaciones). */
  contenido:    ExplicacionExtendida | ExplicacionExtendida[];
};

export default function ExplicacionButton({ label, modalTitulo, contenido }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const secciones: ExplicacionExtendida[] = Array.isArray(contenido) ? contenido : [contenido];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "rgba(52,211,153,0.10)",
          color: C.green,
          border: `1px solid ${C.green}`,
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {label} →
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.cardSolid,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              maxWidth: 760,
              width: "100%",
              maxHeight: "84vh",
              overflowY: "auto",
              padding: 28,
              color: C.text,
              boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.green }}>{modalTitulo}</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                style={{
                  background: "transparent",
                  border: "none",
                  color: C.dim,
                  fontSize: 26,
                  lineHeight: 1,
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >×</button>
            </div>

            {secciones.map((sec, i) => {
              const badge = sec.caracter ? BADGE[sec.caracter] : null;
              return (
                <div
                  key={i}
                  style={{
                    marginBottom: 22,
                    paddingBottom: 18,
                    borderBottom: i < secciones.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  {badge && (
                    <div
                      style={{
                        display: "inline-block",
                        background: `${badge.color}1f`,
                        color: badge.color,
                        border: `1px solid ${badge.color}`,
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        marginBottom: 6,
                      }}
                    >
                      {badge.label}
                    </div>
                  )}
                  <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700 }}>{sec.titulo}</h3>
                  {sec.descripcion_breve && (
                    <p style={{ margin: "0 0 10px 0", fontSize: 14, color: C.dim, lineHeight: 1.5 }}>
                      {sec.descripcion_breve}
                    </p>
                  )}
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {sec.items.map((it, j) => (
                      <p key={j} style={{ margin: "0 0 8px 0" }}>{it}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
