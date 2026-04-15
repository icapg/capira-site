"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useInsights, FUENTE_OPTIONS } from "./InsightsContext";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { href: "/insights/matriculaciones", label: "Matriculaciones" },
  { href: "/insights/parque", label: "Parque activo" },
];

const moreItemsPublic = [
  { href: "/insights/infraestructura", label: "Infraestructura" },
  { href: "/insights/precios-energia", label: "Precios Energía", disabled: true },
  { href: "/insights/licitaciones", label: "Licitaciones", disabled: true },
];

const moreItemsAdmin = [
  ...moreItemsPublic,
  { href: "/insights/social", label: "Social" },
];

const countryGroups = [
  {
    region: null,
    items: [
      { code: "es", name: "España", flag: "🇪🇸", href: "/insights" },
    ],
  },
  {
    region: "Europa",
    items: [
      { code: "pt", name: "Portugal", flag: "🇵🇹" },
      { code: "fr", name: "Francia", flag: "🇫🇷" },
      { code: "de", name: "Alemania", flag: "🇩🇪" },
      { code: "it", name: "Italia", flag: "🇮🇹" },
      { code: "nl", name: "Países Bajos", flag: "🇳🇱" },
      { code: "no", name: "Noruega", flag: "🇳🇴" },
      { code: "se", name: "Suecia", flag: "🇸🇪" },
      { code: "gb", name: "Reino Unido", flag: "🇬🇧" },
    ],
  },
  {
    region: "Latinoamérica",
    items: [
      { code: "ar", name: "Argentina", flag: "🇦🇷" },
      { code: "br", name: "Brasil", flag: "🇧🇷" },
      { code: "cl", name: "Chile", flag: "🇨🇱" },
      { code: "co", name: "Colombia", flag: "🇨🇴" },
      { code: "mx", name: "México", flag: "🇲🇽" },
      { code: "uy", name: "Uruguay", flag: "🇺🇾" },
      { code: "pe", name: "Perú", flag: "🇵🇪" },
    ],
  },
];

function getCountryFromPath(pathname: string) {
  // In the future: /insights/ar, /insights/fr, etc.
  // For now, all /insights paths map to España
  return countryGroups[0].items[0];
}

export function InsightsNav() {
  const pathname = usePathname();
  const { fuente, setFuente, isAdmin } = useInsights();
  const moreItems = isAdmin ? moreItemsAdmin : moreItemsPublic;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const currentCountry = getCountryFromPath(pathname);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    if (showMore) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMore]);

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

          {/* Logo + Brand + country flag */}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w80/${currentCountry.code}.png`}
                alt={currentCountry.name}
                width={28}
                height={20}
                style={{ borderRadius: 3, objectFit: "cover", marginLeft: 4 }}
              />
            </span>
          </Link>

          {/* País selector */}
          <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.13)",
                borderRadius: 7,
                padding: "4px 10px",
                cursor: "pointer",
                color: "#f4f4f5",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700 }}>{currentCountry.name}</span>
              <span style={{ fontSize: 9, color: "rgba(244,244,245,0.35)" }}>▼</span>
            </button>

            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  minWidth: 180,
                  background: "#0f1623",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  padding: "6px 0",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                  zIndex: 100,
                }}
              >
                {countryGroups.map((group, gi) => (
                  <div key={gi}>
                    {group.region && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "rgba(244,244,245,0.25)",
                          padding: "10px 14px 4px",
                        }}
                      >
                        {group.region}
                      </div>
                    )}
                    {group.items.map((country) => {
                      const isActive = country.code === currentCountry.code;
                      const isAvailable = "href" in country && country.href;

                      if (isAvailable) {
                        return (
                          <Link
                            key={country.code}
                            href={(country as any).href}
                            onClick={() => setShowMenu(false)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "7px 14px",
                              textDecoration: "none",
                              background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                              cursor: "pointer",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://flagcdn.com/w20/${country.code}.png`} alt={country.name} width={18} height={13} style={{ borderRadius: 2, objectFit: "cover" }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>
                              {country.name}
                            </span>
                            {isActive && (
                              <span style={{ marginLeft: "auto", fontSize: 10, color: "#63d27f" }}>●</span>
                            )}
                          </Link>
                        );
                      }

                      return (
                        <div
                          key={country.code}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 14px",
                            cursor: "default",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`https://flagcdn.com/w20/${country.code}.png`} alt={country.name} width={18} height={13} style={{ borderRadius: 2, objectFit: "cover", opacity: 0.3 }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(244,244,245,0.3)" }}>
                            {country.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
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

            {/* Más dropdown */}
            <div ref={moreRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowMore((v) => !v)}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: moreItems.some(i => pathname.startsWith(i.href)) ? "#f4f4f5" : "rgba(244,244,245,0.55)",
                  background: moreItems.some(i => pathname.startsWith(i.href)) ? "rgba(255,255,255,0.08)" : "transparent",
                  border: "none",
                  padding: "5px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                Más
                <span style={{ fontSize: 9, opacity: 0.5 }}>▼</span>
              </button>

              {showMore && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    minWidth: 180,
                    background: "#0f1623",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "6px 0",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                    zIndex: 100,
                  }}
                >
                  {moreItems.map((item) => {
                    const active = pathname.startsWith(item.href);
                    if (item.disabled) {
                      return (
                        <div
                          key={item.href}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "7px 14px",
                            cursor: "default",
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(244,244,245,0.25)" }}>
                            {item.label}
                          </span>
                          <span style={{ fontSize: 10, color: "rgba(244,244,245,0.2)", letterSpacing: "0.05em" }}>
                            PRÓXIMO
                          </span>
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMore(false)}
                        style={{
                          display: "block",
                          padding: "7px 14px",
                          fontSize: 13,
                          fontWeight: 500,
                          color: active ? "#f4f4f5" : "rgba(244,244,245,0.65)",
                          textDecoration: "none",
                          background: active ? "rgba(255,255,255,0.06)" : "transparent",
                        }}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Fuente selector — solo admin */}
          {isAdmin && <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
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
          </div>}

        </div>
      </div>
    </div>
  );
}
