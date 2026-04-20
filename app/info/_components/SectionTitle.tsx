"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = { children: ReactNode; sub?: string; tooltip?: string };

export function SectionTitle({ children, sub, tooltip }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [open]);

  return (
    <div style={{ marginBottom: 18, position: "relative" }} ref={ref}>
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
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            title={tooltip}
            aria-label="Información"
            aria-expanded={open}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 12,
              lineHeight: 1,
              color: open ? "rgba(241,245,249,0.85)" : "rgba(241,245,249,0.35)",
              transition: "color 0.15s",
            }}
          >
            ⓘ
          </button>
        )}
      </div>
      {sub && (
        <p style={{ fontSize: 11, color: "rgba(241,245,249,0.42)", marginTop: 4, marginLeft: 13 }}>
          {sub}
        </p>
      )}
      {tooltip && open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 13,
            right: 0,
            maxWidth: 360,
            background: "rgba(15,23,42,0.98)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.45,
            color: "rgba(241,245,249,0.85)",
            zIndex: 50,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
