"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useInsights } from "./InsightsContext";
import { useState, useRef, useEffect } from "react";
import { DASHBOARDS, isUnlockedFor, isVisibleTo } from "./dashboards";
import { useIsMobile } from "../lib/useIsMobile";

const countryGroups = [
  {
    region: null,
    items: [
      { code: "es", name: "España", flag: "🇪🇸", href: "/info" },
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

function getCountryFromPath(_pathname: string) {
  return countryGroups[0].items[0];
}

export function InsightsNav() {
  const pathname = usePathname();
  const { isAdmin, setCountryName } = useInsights();
  const isMobile = useIsMobile();

  const visibleDashboards = DASHBOARDS.filter((d) => isVisibleTo(d, isAdmin));
  const navItems = visibleDashboards.filter((d) => d.topNav && !d.adminOnly);
  const moreItems = visibleDashboards.filter((d) => !d.topNav || d.adminOnly);
  const allItems = [...navItems, ...moreItems];
  const currentDashboard = allItems.find((d) => pathname.startsWith(d.href));

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [showUnified, setShowUnified] = useState(false);
  const unifiedRef = useRef<HTMLDivElement>(null);

  const currentCountry = getCountryFromPath(pathname);

  useEffect(() => {
    setCountryName(currentCountry.name);
  }, [currentCountry.name, setCountryName]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    if (showMenu) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showMenu]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
    }
    if (showMore) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showMore]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (unifiedRef.current && !unifiedRef.current.contains(e.target as Node)) setShowUnified(false);
    }
    if (showUnified) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showUnified]);

  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(6,9,15,0.92)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "0 10px" : "0 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "auto 1fr auto" : "1fr auto 1fr",
          alignItems: "center",
          height: 52,
          gap: isMobile ? 6 : 0,
        }}>

          {/* LEFT — logo + brand */}
          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Link href="/info" style={{ textDecoration: "none" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Image
                  src="/logo sin padding.png"
                  alt="Capira"
                  width={22}
                  height={22}
                  style={{ filter: "brightness(0) invert(1)", objectFit: "contain" }}
                />
                {!isMobile && (
                  <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em", color: "#f4f4f5" }}>
                    eMobility Insights{" "}
                    <span style={{ fontWeight: 400, color: "rgba(244,244,245,0.4)" }}>by CAPIRA</span>
                  </span>
                )}
              </span>
            </Link>
          </div>

          {/* CENTER — nav links */}
          {isMobile ? (
            <div className="insights-nav-scroll" style={{
              display: "flex", gap: 4, alignItems: "center",
              justifyContent: "flex-start",
              overflowX: "auto",
              minWidth: 0,
            }}>
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                const unlocked = isUnlockedFor(item, isAdmin);
                if (!unlocked) {
                  return (
                    <span
                      key={item.href}
                      title="Próximamente"
                      style={{
                        fontSize: 12, fontWeight: 500,
                        color: "rgba(244,244,245,0.3)",
                        padding: "5px 8px", borderRadius: 6,
                        cursor: "default", flexShrink: 0,
                        display: "inline-flex", alignItems: "center", gap: 6,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </span>
                  );
                }
                return (
                  <Link key={item.href} href={item.href} style={{
                    fontSize: 12, fontWeight: 500,
                    color: active ? "#f4f4f5" : "rgba(244,244,245,0.55)",
                    textDecoration: "none", padding: "5px 8px", borderRadius: 6,
                    background: active ? "rgba(255,255,255,0.08)" : "transparent",
                    transition: "color 0.15s, background 0.15s",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {item.label}
                  </Link>
                );
              })}

              {/* Más dropdown (mobile) */}
              <div ref={moreRef} style={{ position: "relative", flexShrink: 0 }}>
                <button
                  onClick={() => setShowMore((v) => !v)}
                  style={{
                    fontSize: 12, fontWeight: 500,
                    color: moreItems.some(i => pathname.startsWith(i.href)) ? "#f4f4f5" : "rgba(244,244,245,0.55)",
                    background: moreItems.some(i => pathname.startsWith(i.href)) ? "rgba(255,255,255,0.08)" : "transparent",
                    border: "none", padding: "5px 8px", borderRadius: 6, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                    transition: "color 0.15s, background 0.15s",
                  }}
                >
                  Más <span style={{ fontSize: 9, opacity: 0.5 }}>▼</span>
                </button>
                {showMore && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", left: "50%",
                    transform: "translateX(-50%)",
                    minWidth: 260, background: "#0f1623",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                    padding: "6px 0", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 100,
                  }}>
                    {moreItems.map((item) => {
                      const active = pathname.startsWith(item.href);
                      const unlocked = isUnlockedFor(item, isAdmin);
                      if (!unlocked) {
                        return (
                          <div key={item.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "7px 14px", cursor: "default" }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(244,244,245,0.3)", whiteSpace: "nowrap" }}>{item.label}</span>
                            <span style={{ fontSize: 10, color: "rgba(244,244,245,0.35)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>PRÓXIMAMENTE</span>
                          </div>
                        );
                      }
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setShowMore(false)} style={{
                          display: "block", padding: "7px 14px", fontSize: 13, fontWeight: 500,
                          color: active ? "#f4f4f5" : "rgba(244,244,245,0.65)",
                          textDecoration: "none",
                          background: active ? "rgba(255,255,255,0.06)" : "transparent",
                        }}>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div ref={unifiedRef} style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <button
                onClick={() => setShowUnified((v) => !v)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontSize: 13, fontWeight: 600,
                  color: "#f4f4f5",
                  background: showUnified ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                  transition: "background 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {currentDashboard?.label ?? "Dashboards"}
                <span style={{ fontSize: 9, color: "rgba(244,244,245,0.5)" }}>▼</span>
              </button>
              {showUnified && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: "50%",
                  transform: "translateX(-50%)",
                  minWidth: 320, background: "#0f1623",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  padding: "6px 0", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 100,
                }}>
                  {allItems.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const unlocked = isUnlockedFor(item, isAdmin);
                    if (!unlocked) {
                      return (
                        <div key={item.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "8px 14px", cursor: "default" }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(244,244,245,0.3)", whiteSpace: "nowrap" }}>{item.label}</span>
                          <span style={{ fontSize: 10, color: "rgba(244,244,245,0.35)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>PRÓXIMAMENTE</span>
                        </div>
                      );
                    }
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setShowUnified(false)} style={{
                        display: "block", padding: "8px 14px", fontSize: 13, fontWeight: 500,
                        color: active ? "#f4f4f5" : "rgba(244,244,245,0.7)",
                        textDecoration: "none",
                        background: active ? "rgba(255,255,255,0.06)" : "transparent",
                      }}>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* RIGHT — bandera + selector país */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 10, justifyContent: "flex-end", flexShrink: 0 }}>
            {!isMobile && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`https://flagcdn.com/w80/${currentCountry.code}.png`}
                alt={currentCountry.name}
                width={28}
                height={20}
                style={{ borderRadius: 3, objectFit: "cover" }}
              />
            )}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  borderRadius: 7, padding: isMobile ? "4px 8px" : "4px 10px",
                  cursor: "pointer", color: "#f4f4f5",
                }}
              >
                {isMobile && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={`https://flagcdn.com/w40/${currentCountry.code}.png`} alt={currentCountry.name} width={18} height={13} style={{ borderRadius: 2, objectFit: "cover" }} />
                )}
                {!isMobile && <span style={{ fontSize: 12, fontWeight: 700 }}>{currentCountry.name}</span>}
                <span style={{ fontSize: 9, color: "rgba(244,244,245,0.35)" }}>▼</span>
              </button>

              {showMenu && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  minWidth: 180, background: "#0f1623",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  padding: "6px 0", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 100,
                }}>
                  {countryGroups.map((group, gi) => (
                    <div key={gi}>
                      {group.region && (
                        <div style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                          textTransform: "uppercase", color: "rgba(244,244,245,0.25)",
                          padding: "10px 14px 4px",
                        }}>
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
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "7px 14px", textDecoration: "none",
                                background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`https://flagcdn.com/w20/${country.code}.png`} alt={country.name} width={18} height={13} style={{ borderRadius: 2, objectFit: "cover" }} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>{country.name}</span>
                              {isActive && <span style={{ marginLeft: "auto", fontSize: 10, color: "#63d27f" }}>●</span>}
                            </Link>
                          );
                        }

                        return (
                          <div key={country.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", cursor: "default" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://flagcdn.com/w20/${country.code}.png`} alt={country.name} width={18} height={13} style={{ borderRadius: 2, objectFit: "cover", opacity: 0.3 }} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(244,244,245,0.3)" }}>{country.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
