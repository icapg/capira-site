import type { ReactNode } from "react";

type Props = { children: ReactNode; sub?: string; tooltip?: string };

export function SectionTitle({ children, sub, tooltip }: Props) {
  return (
    <div style={{ marginBottom: 18, cursor: tooltip ? "help" : undefined }} title={tooltip}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            background: "linear-gradient(180deg,#38bdf8,#8b5cf6)",
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#f1f5f9",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {children}
        </h2>
        {tooltip && (
          <span style={{ fontSize: 11, color: "rgba(241,245,249,0.20)", lineHeight: 1 }}>ⓘ</span>
        )}
      </div>
      {sub && (
        <p style={{ fontSize: 11, color: "rgba(241,245,249,0.42)", marginTop: 4, marginLeft: 13 }}>
          {sub}
        </p>
      )}
    </div>
  );
}
