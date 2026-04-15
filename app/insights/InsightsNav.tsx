"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useInsights, FUENTE_OPTIONS } from "./InsightsContext";

const navItems = [
  { href: "/insights/matriculaciones", label: "Matriculaciones" },
  { href: "/insights/parque", label: "Parque activo" },
  { href: "/insights/infraestructura", label: "Infraestructura" },
  { href: "/insights/social", label: "Social" },
];

export function InsightsNav() {
  const pathname = usePathname();
  const { fuente, setFuente } = useInsights();

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
        <div style={{ display: "flex", alignItems: "center", gap: 24, height: 52 }}>

          {/* Logo + Brand */}
          <Link href="/insights" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image
                src="/logo sin padding.png"
                alt="Capira"
                width={22}
                height={22}
                style={{ filter: "brightness(0) invert(1)", objectFit: "contain" }}
              />
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em", color: "#f4f4f5" }}>
                eMobility Insights
              </span>
            </span>
          </Link>

          {/* País selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(244,244,245,0.35)" }}>
              País
            </span>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.13)",
              borderRadius: 7,
              padding: "4px 10px",
              cursor: "default",
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>🇪🇸</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f4f4f5" }}>España</span>
              <span style={{ fontSize: 9, color: "rgba(244,244,245,0.35)", marginLeft: 2 }}>▼</span>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 4 }}>
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

          {/* Fuente selector */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(244,244,245,0.55)" }}>
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
                      padding: "4px 12px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 700,
                      border: active ? `1px solid ${o.color}44` : "1px solid transparent",
                      background: active ? `${o.color}18` : "transparent",
                      color: active ? o.color : "rgba(244,244,245,0.45)",
                      transition: "all 0.15s",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
