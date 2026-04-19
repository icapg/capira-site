"use client";

export function InsightsFuente() {
  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.07)",
      padding: "10px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      background: "rgba(6,9,15,0.88)",
      backdropFilter: "blur(12px)",
      fontSize: 11,
      color: "rgba(244,244,245,0.45)",
    }}>
      <span style={{ fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Fuente:
      </span>
      <span style={{ color: "#34d399", fontWeight: 700 }}>DGT</span>
    </div>
  );
}
