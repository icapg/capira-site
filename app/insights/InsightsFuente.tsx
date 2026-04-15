"use client";

import { useInsights, FUENTE_OPTIONS } from "./InsightsContext";

export function InsightsFuente() {
  const { fuente, setFuente, isAdmin } = useInsights();

  if (!isAdmin) return null;

  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.07)",
      padding: "10px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      background: "rgba(6,9,15,0.88)",
      backdropFilter: "blur(12px)",
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "rgba(244,244,245,0.35)",
      }}>
        Fuente
      </span>
      <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, gap: 2 }}>
        {FUENTE_OPTIONS.map((o) => {
          const active = fuente === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setFuente(o.value)}
              style={{
                padding: "4px 14px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 700,
                border: active ? `1px solid ${o.color}44` : "1px solid transparent",
                background: active ? `${o.color}18` : "transparent",
                color: active ? o.color : "rgba(244,244,245,0.4)",
                transition: "all 0.15s",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
