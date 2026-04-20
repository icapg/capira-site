import type { ReactNode } from "react";

function colorize(text: string): ReactNode {
  return text.split(/(BEV|PHEV)/g).map((part, i) =>
    part === "BEV" ? (
      <span key={i} style={{ color: "#38bdf8" }}>{part}</span>
    ) : part === "PHEV" ? (
      <span key={i} style={{ color: "#fb923c" }}>{part}</span>
    ) : (
      part
    )
  );
}

type Props = { icon: string; headline: string; body: string; color: string };

export function InsightCard({ icon, headline, body, color }: Props) {
  return (
    <div
      style={{
        background: `${color}0e`,
        border: `1px solid ${color}30`,
        borderRadius: 14,
        padding: "14px 16px",
        flex: 1,
        minWidth: 200,
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#f1f5f9",
          marginBottom: 4,
          letterSpacing: "-0.01em",
        }}
      >
        {colorize(headline)}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "rgba(241,245,249,0.42)",
          lineHeight: 1.5,
          whiteSpace: "pre-line",
        }}
      >
        {colorize(body)}
      </p>
    </div>
  );
}
