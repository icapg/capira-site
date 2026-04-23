"use client";

import { useState } from "react";

type Props = { marca: string; totalHist: number };

export function PocosDatosBanner({ marca, totalHist }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      style={{
        margin: "0 auto 16px",
        maxWidth: 1400,
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.25)",
        color: "#fbbf24",
        fontSize: 12,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 14 }}>⚠</span>
      <span style={{ flex: 1, color: "rgba(251,191,36,0.92)" }}>
        <b>{marca}</b> tiene pocos datos ({totalHist.toLocaleString("es-ES")} matriculaciones históricas). Algunos gráficos pueden no ser representativos.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Cerrar aviso"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(251,191,36,0.7)",
          fontSize: 14,
          cursor: "pointer",
          padding: 2,
        }}
      >
        ✕
      </button>
    </div>
  );
}
