"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/insights/matriculaciones", label: "Matriculaciones" },
  { href: "/insights/parque", label: "Parque activo" },
  { href: "/insights/infraestructura", label: "Infraestructura" },
  { href: "/insights/social", label: "Social" },
];

export function InsightsNav() {
  const pathname = usePathname();

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(6,9,15,0.92)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32, height: 52 }}>
          <Link href="/insights" style={{ textDecoration: "none" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em", color: "#f4f4f5" }}>
                eMobility Insights
              </span>
            </span>
          </Link>

          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: active ? "#f4f4f5" : "rgba(244,244,245,0.55)",
                    textDecoration: "none",
                    padding: "5px 12px",
                    borderRadius: 6,
                    background: active ? "rgba(255,255,255,0.08)" : "transparent",
                    transition: "color 0.15s, background 0.15s",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "rgba(244,244,245,0.3)", fontFamily: "monospace" }}>
              Fuente: AEDIVE · ANFAC
            </span>
            <Link
              href="/"
              style={{
                fontSize: 12,
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              capirapower.com →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
