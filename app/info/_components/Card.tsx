import type { CSSProperties, ReactNode } from "react";

type Props = { children: ReactNode; style?: CSSProperties };

export function Card({ children, style }: Props) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.11)",
        borderRadius: 20,
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
