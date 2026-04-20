type Props = { height?: number; label?: string };

export function NoData({ height = 200, label = "Sin datos para esta fuente" }: Props) {
  return (
    <div
      style={{
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed rgba(255,255,255,0.1)",
        borderRadius: 12,
        gap: 8,
      }}
    >
      <span style={{ fontSize: 22, opacity: 0.3 }}>—</span>
      <span
        style={{ fontSize: 11, color: "rgba(241,245,249,0.3)", letterSpacing: "0.04em" }}
      >
        {label}
      </span>
    </div>
  );
}
