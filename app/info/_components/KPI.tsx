import type { ReactNode } from "react";

type Props = {
  label: string;
  sublabel?: string;
  sublabelColor?: string;
  value: string;
  sub?: string;
  delta?: number;
  color?: string;
  icon?: string;
  tag?: string;
  tooltip?: string;
  /** Contenido extra opcional renderizado en la esquina sup-derecha (ej. Sparkline). */
  extra?: ReactNode;
};

export function KPI({
  label,
  sublabel,
  sublabelColor,
  value,
  sub,
  delta,
  color,
  icon,
  tag,
  tooltip,
  extra,
}: Props) {
  const glow = color ?? "#38bdf8";
  return (
    <div
      title={tooltip}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.11)",
        borderRadius: 18,
        padding: "20px 22px",
        flex: 1,
        minWidth: 160,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: tooltip ? "help" : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `${glow}18`,
          filter: "blur(24px)",
          pointerEvents: "none",
        }}
      />
      {extra && (
        <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.9, pointerEvents: "none" }}>
          {extra}
        </div>
      )}
      <div
        style={{
          minHeight: 72,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {icon && <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 6 }}>{icon}</div>}
        {tag && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: glow,
              textTransform: "uppercase",
              background: `${glow}18`,
              borderRadius: 4,
              padding: "2px 6px",
              marginBottom: 6,
              display: "inline-block",
              alignSelf: "flex-start",
            }}
          >
            {tag}
          </span>
        )}
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "rgba(241,245,249,0.42)",
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {label}
          {sublabel && (
            <>
              <br />
              <span
                style={{
                  fontWeight: 700,
                  letterSpacing: sublabelColor ? "0.01em" : "0.06em",
                  fontSize: sublabelColor ? 13 : 10,
                  color: sublabelColor ?? "inherit",
                  opacity: sublabelColor ? 1 : 0.7,
                  textTransform: sublabelColor ? "none" : "uppercase",
                }}
              >
                {sublabel}
              </span>
            </>
          )}
        </p>
      </div>
      <p
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: color ?? "#f1f5f9",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          margin: "10px 0 8px",
        }}
      >
        {value}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {delta !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: delta >= 0 ? "#34d399" : "#f87171",
              background: delta >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
              borderRadius: 5,
              padding: "2px 7px",
            }}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: "rgba(241,245,249,0.42)" }}>{sub}</span>}
      </div>
    </div>
  );
}
