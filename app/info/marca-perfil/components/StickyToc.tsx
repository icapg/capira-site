"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; label: string };

type Props = { items: TocItem[] };

/**
 * Navegación lateral sticky. Resalta la sección visible usando IntersectionObserver
 * sobre elementos con id. Click hace scroll suave a la sección.
 * En mobile se renderiza como pill horizontal arriba.
 */
export function StickyToc({ items }: Props) {
  const [activo, setActivo] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0));
        if (visible[0]) setActivo(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    const nodes: Element[] = [];
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) { obs.observe(el); nodes.push(el); }
    }
    return () => obs.disconnect();
  }, [items]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Secciones"
      style={{
        position: "sticky",
        top: 112,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 0",
      }}
    >
      {items.map((it) => {
        const active = it.id === activo;
        return (
          <button
            key={it.id}
            onClick={() => go(it.id)}
            style={{
              padding: "6px 12px",
              textAlign: "left",
              background: "transparent",
              border: "none",
              borderLeft: `2px solid ${active ? "#38bdf8" : "rgba(255,255,255,0.08)"}`,
              color: active ? "#f1f5f9" : "rgba(241,245,249,0.45)",
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
