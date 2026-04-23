"use client";

import { useState, useRef, useEffect } from "react";
import type { TipoVehiculo } from "../lib/insights/dgt-bev-phev-data";
import { TIPO_LABELS, PROVINCIAS_ORDENADAS } from "../lib/insights/dgt-bev-phev-data";
import { useIsMobile } from "../lib/useIsMobile";

const BEV_COLOR  = "#38bdf8";
const PHEV_COLOR = "#fb923c";
const AMBOS_COLOR = "#34d399";
const BORDER_COLOR = "rgba(255,255,255,0.08)";

const TIPOS_ORDER: TipoVehiculo[] = [
  "turismo", "furgoneta", "moto_scooter", "trimoto",
  "quad_atv", "microcar", "camion", "autobus", "agricola", "especial", "remolque", "otros",
];

const TIPO_TOOLTIP: Record<TipoVehiculo, string> = {
  todos:             "Todos los tipos de vehículo",
  turismo:           "Turismos de pasajeros (M1) — incluye sedanes, SUVs y todoterrenos",
  furgoneta:         "Vehículo Comercial Ligero (VCL): N1 hasta 3.500 kg",
  moto_scooter:      "Motos y scooters (L3e–L5e). Excluye ciclomotores y trimotos",
  trimoto:           "Triciclos motorizados (L2e, L5e-A) — 3 ruedas motorizadas",
  quad_atv:          "Quad / ATV (L7e) — cuatriciclo todoterreno",
  microcar:          "Cuadriciclo ligero (L6e, L7e urbano) — Citroën Ami, Microlino…",
  camion:            "Vehículos industriales N2 y N3 — carga pesada >3.500 kg",
  autobus:           "Autobuses y minibuses (M2, M3) — más de 8+1 plazas",
  agricola:          "Maquinaria agrícola — tractores, cosechadoras",
  especial:          "Maquinaria industrial — carretillas, retroexcavadoras, dumpers",
  remolque:          "Remolques y semirremolques (O1–O4)",
  otros:             "Categorías residuales no clasificadas",
};

interface Props {
  filtro: "ambos" | "bev" | "phev";
  setFiltro: (f: "ambos" | "bev" | "phev") => void;
  tiposVehiculo: TipoVehiculo[];
  setTiposVehiculo: (fn: (prev: TipoVehiculo[]) => TipoVehiculo[]) => void;
  provincia?: string;
  setProvincia?: (p: string) => void;
  showTipo?: boolean;
}

export function DashboardControls({ filtro, setFiltro, tiposVehiculo, setTiposVehiculo, provincia, setProvincia, showTipo = true }: Props) {
  const isMobile = useIsMobile();
  const [tipoOpen, setTipoOpen] = useState(false);
  const [provOpen, setProvOpen] = useState(false);
  const tipoRef = useRef<HTMLDivElement | null>(null);
  const provRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!tipoOpen && !provOpen) return;
    const onDown = (e: MouseEvent) => {
      if (tipoOpen && tipoRef.current && !tipoRef.current.contains(e.target as Node)) setTipoOpen(false);
      if (provOpen && provRef.current && !provRef.current.contains(e.target as Node)) setProvOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [tipoOpen, provOpen]);

  const tecOptions: { value: "ambos" | "bev" | "phev"; color?: string }[] = [
    { value: "ambos", color: AMBOS_COLOR },
    { value: "bev",   color: BEV_COLOR  },
    { value: "phev",  color: PHEV_COLOR },
  ];

  const activeCount = tiposVehiculo.filter((t) => t !== "todos").length;
  const tipoButtonLabel =
    tiposVehiculo.length === 0
      ? "Ninguno"
      : tiposVehiculo.length === TIPOS_ORDER.length
        ? "Todos"
        : `${activeCount} de ${TIPOS_ORDER.length}`;

  const currentProvNombre = provincia && provincia !== "todas"
    ? (PROVINCIAS_ORDENADAS.find((p) => p.cod === provincia)?.nombre ?? provincia)
    : null;
  const provButtonLabel = currentProvNombre ?? "Provincias: Todas";

  return (
    <div style={{
      borderBottom: `1px solid ${BORDER_COLOR}`,
      background: "rgba(5,8,16,0.88)",
      backdropFilter: "blur(16px)",
      position: "sticky",
      top: 52,
      zIndex: 40,
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "0 12px" : "0 24px" }}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          minHeight: isMobile ? undefined : 50,
          gap: 0, flexWrap: "wrap",
          paddingTop: isMobile ? 8 : 6,
          paddingBottom: isMobile ? 8 : 6,
        }}>

          {/* Left: Tec. */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap" }}>
            {!isMobile && (
              <span style={{
                fontSize: 11, color: "rgba(241,245,249,0.6)",
                letterSpacing: "0.03em", fontWeight: 600,
              }}>
                Tec.:
              </span>
            )}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, gap: 2, flexWrap: "nowrap" }}>
              {/* Total — deshabilitado */}
              <button disabled title="Próximamente" style={{
                padding: isMobile ? "5px 6px" : "5px 10px", borderRadius: 7, cursor: "not-allowed", fontSize: isMobile ? 11 : 12, fontWeight: 700,
                border: "1px solid transparent", background: "transparent",
                color: "rgba(241,245,249,0.45)", whiteSpace: "nowrap",
              }}>
                Todos
              </button>
              {/* No Enchufable — deshabilitado */}
              <button disabled title="Próximamente" style={{
                padding: isMobile ? "5px 6px" : "5px 10px", borderRadius: 7, cursor: "not-allowed", fontSize: isMobile ? 11 : 12, fontWeight: 700,
                border: "1px solid transparent", background: "transparent",
                color: "rgba(241,245,249,0.45)", whiteSpace: "nowrap",
              }}>
                {isMobile ? "No ench." : "No Enchufable"}
              </button>
              {/* Separador */}
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "4px 2px" }} />
              {/* BEV+PHEV / BEV / PHEV */}
              {tecOptions.map((opt) => {
                const active = filtro === opt.value;
                const col = opt.color;
                const label = opt.value === "ambos"
                  ? active
                    ? <><span style={{ color: BEV_COLOR }}>BEV</span><span style={{ color: AMBOS_COLOR }}> + </span><span style={{ color: PHEV_COLOR }}>PHEV</span></>
                    : "BEV + PHEV"
                  : opt.value === "bev" ? "BEV" : "PHEV";
                return (
                  <button key={opt.value} onClick={() => setFiltro(opt.value)} style={{
                    padding: isMobile ? "5px 6px" : "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: isMobile ? 11 : 12, fontWeight: 700,
                    border: active
                      ? `1px solid ${col ? col + "44" : "rgba(255,255,255,0.2)"}`
                      : "1px solid transparent",
                    background: active
                      ? (col ? `${col}18` : "rgba(255,255,255,0.08)")
                      : "transparent",
                    color: active ? (col ?? "#f4f4f5") : "rgba(241,245,249,0.55)",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Middle+Right: Provincia + Tipo (mobile en la misma row) */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: isMobile ? "nowrap" : "wrap",
            paddingTop: isMobile ? 10 : 0,
            marginTop: isMobile ? 6 : 0,
            borderTop: isMobile ? "1px solid rgba(255,255,255,0.22)" : "none",
            width: isMobile ? "100%" : undefined,
          }}>

            {/* Provincia */}
            {setProvincia && (isMobile ? (
              <div ref={provRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => setProvOpen((v) => !v)}
                  style={{
                    padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "#0b1020",
                    color: "#f4f4f5",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {provButtonLabel}
                </button>
                {provOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    minWidth: 220,
                    maxHeight: 320,
                    overflowY: "auto",
                    background: "#0b1020",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    zIndex: 50,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  }}>
                    <button
                      onClick={() => { setProvincia("todas"); setProvOpen(false); }}
                      style={{
                        padding: "6px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 700,
                        border: "1px solid transparent",
                        background: (!provincia || provincia === "todas") ? "rgba(241,245,249,0.08)" : "transparent",
                        color: (!provincia || provincia === "todas") ? "#f4f4f5" : "rgba(241,245,249,0.55)",
                        textAlign: "left",
                      }}
                    >
                      Todas
                    </button>
                    {PROVINCIAS_ORDENADAS.map((p) => {
                      const active = provincia === p.cod;
                      return (
                        <button
                          key={p.cod}
                          onClick={() => { setProvincia(p.cod); setProvOpen(false); }}
                          style={{
                            padding: "6px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 700,
                            border: "1px solid transparent",
                            background: active ? "rgba(241,245,249,0.08)" : "transparent",
                            color: active ? "#f4f4f5" : "rgba(241,245,249,0.55)",
                            textAlign: "left",
                          }}
                        >
                          {p.nombre}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{
                  fontSize: 11, color: "rgba(241,245,249,0.6)",
                  letterSpacing: "0.03em", fontWeight: 600,
                }}>
                  Prov.:
                </span>
                <select
                  value={provincia ?? "todas"}
                  onChange={(e) => setProvincia(e.target.value)}
                  style={{
                    padding: "4px 8px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "#0b1020",
                    color: "#f4f4f5",
                    cursor: "pointer",
                    maxWidth: 200,
                    minWidth: 0,
                    appearance: "none",
                    WebkitAppearance: "none",
                    textAlign: "center",
                    textAlignLast: "center" as any,
                  }}
                >
                  <option value="todas" style={{ background: "#0b1020", color: "#f4f4f5" }}>Todas</option>
                  {PROVINCIAS_ORDENADAS.map((p) => (
                    <option key={p.cod} value={p.cod} style={{ background: "#0b1020", color: "#f4f4f5" }}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* Tipo — desktop: 4 chips primarios + "Más" popover. Mobile: un solo botón con seleccionados truncados + popover con todos. */}
            {showTipo && (() => {
              const PRIMARIOS: TipoVehiculo[] = ["turismo", "furgoneta", "camion", "autobus"];
              const EXTRA = TIPOS_ORDER.filter((t) => !PRIMARIOS.includes(t));
              const extraActiveCount = tiposVehiculo.filter((t) => EXTRA.includes(t)).length;
              const toggle = (t: TipoVehiculo) => setTiposVehiculo((prev) =>
                prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
              );

              // ── Mobile: dropdown único con label de seleccionados (truncado) ──
              if (isMobile) {
                const selectedLabel = tiposVehiculo.length === 0
                  ? "Ninguno"
                  : tiposVehiculo.length === TIPOS_ORDER.length
                    ? "Todos"
                    : tiposVehiculo.map((t) => TIPO_LABELS[t]).join(", ");
                return (
                  <div ref={tipoRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
                    <button
                      onClick={() => setTipoOpen((v) => !v)}
                      style={{
                        padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "#0b1020",
                        color: "#f4f4f5",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Tipo: {selectedLabel}
                    </button>
                    {tipoOpen && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0, right: 0,
                        maxHeight: 360,
                        overflowY: "auto",
                        background: "#0b1020",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        padding: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        zIndex: 50,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                      }}>
                        <div style={{ display: "flex", gap: 4, padding: "2px 4px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
                          <button
                            onClick={() => setTiposVehiculo(() => [...TIPOS_ORDER])}
                            style={{
                              flex: 1, padding: "4px 8px", borderRadius: 5, cursor: "pointer",
                              fontSize: 11, fontWeight: 700,
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "transparent", color: "rgba(241,245,249,0.7)",
                            }}
                          >Todos</button>
                          <button
                            onClick={() => setTiposVehiculo(() => [])}
                            style={{
                              flex: 1, padding: "4px 8px", borderRadius: 5, cursor: "pointer",
                              fontSize: 11, fontWeight: 700,
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "transparent", color: "rgba(241,245,249,0.7)",
                            }}
                          >Ninguno</button>
                        </div>
                        {TIPOS_ORDER.map((t) => {
                          const active = tiposVehiculo.includes(t);
                          return (
                            <button
                              key={t}
                              title={TIPO_TOOLTIP[t]}
                              onClick={() => toggle(t)}
                              style={{
                                padding: "6px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 600,
                                border: "1px solid transparent",
                                background: active ? "rgba(56,189,248,0.08)" : "transparent",
                                color: active ? "#f4f4f5" : "rgba(241,245,249,0.6)",
                                textAlign: "left",
                                display: "flex", alignItems: "center", gap: 10,
                              }}
                            >
                              <span style={{
                                width: 14, height: 14, borderRadius: 3,
                                border: `1px solid ${active ? "#38bdf8" : "rgba(241,245,249,0.3)"}`,
                                background: active ? "#38bdf8" : "transparent",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                color: "#0b1020", fontSize: 10, fontWeight: 900,
                                flexShrink: 0,
                              }}>{active ? "✓" : ""}</span>
                              {TIPO_LABELS[t]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Desktop: chips primarios + "Más (N)" popover con extras ──
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
                  <span style={{
                    fontSize: 11, color: "rgba(241,245,249,0.6)",
                    letterSpacing: "0.03em", fontWeight: 600,
                  }}>
                    Tipo:
                  </span>
                  <div style={{ display: "inline-flex", gap: 3, padding: 2, background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                    {PRIMARIOS.map((t) => {
                      const active = tiposVehiculo.includes(t);
                      return (
                        <button
                          key={t}
                          title={TIPO_TOOLTIP[t]}
                          onClick={() => toggle(t)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                            border: "1px solid transparent",
                            background: active ? "rgba(241,245,249,0.10)" : "transparent",
                            color: active ? "#f4f4f5" : "rgba(241,245,249,0.45)",
                            whiteSpace: "nowrap",
                            transition: "all 0.15s",
                          }}
                        >
                          {TIPO_LABELS[t]}
                        </button>
                      );
                    })}
                    <div ref={tipoRef} style={{ position: "relative" }}>
                      <button
                        onClick={() => setTipoOpen((v) => !v)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                          border: "1px solid transparent",
                          background: "transparent",
                          color: "rgba(241,245,249,0.6)",
                          whiteSpace: "nowrap",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}
                      >
                        <span>Más ({extraActiveCount})</span>
                        <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
                      </button>
                      {tipoOpen && (
                        <div style={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          right: 0,
                          minWidth: 240,
                          maxHeight: 360,
                          overflowY: "auto",
                          background: "#0b1020",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 8,
                          padding: 6,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          zIndex: 50,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                        }}>
                          <div style={{ display: "flex", gap: 4, padding: "2px 4px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
                            <button
                              onClick={() => setTiposVehiculo((prev) => Array.from(new Set([...prev, ...EXTRA])))}
                              style={{
                                flex: 1, padding: "4px 8px", borderRadius: 5, cursor: "pointer",
                                fontSize: 11, fontWeight: 700,
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: "transparent", color: "rgba(241,245,249,0.7)",
                              }}
                            >Todos</button>
                            <button
                              onClick={() => setTiposVehiculo((prev) => prev.filter((t) => !EXTRA.includes(t)))}
                              style={{
                                flex: 1, padding: "4px 8px", borderRadius: 5, cursor: "pointer",
                                fontSize: 11, fontWeight: 700,
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: "transparent", color: "rgba(241,245,249,0.7)",
                              }}
                            >Ninguno</button>
                          </div>
                          {EXTRA.map((t) => {
                            const active = tiposVehiculo.includes(t);
                            return (
                              <button
                                key={t}
                                title={TIPO_TOOLTIP[t]}
                                onClick={() => toggle(t)}
                                style={{
                                  padding: "6px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 600,
                                  border: "1px solid transparent",
                                  background: active ? "rgba(56,189,248,0.08)" : "transparent",
                                  color: active ? "#f4f4f5" : "rgba(241,245,249,0.6)",
                                  textAlign: "left",
                                  display: "flex", alignItems: "center", gap: 10,
                                }}
                              >
                                <span style={{
                                  width: 14, height: 14, borderRadius: 3,
                                  border: `1px solid ${active ? "#38bdf8" : "rgba(241,245,249,0.3)"}`,
                                  background: active ? "#38bdf8" : "transparent",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  color: "#0b1020", fontSize: 10, fontWeight: 900,
                                  flexShrink: 0,
                                }}>{active ? "✓" : ""}</span>
                                {TIPO_LABELS[t]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

        </div>
      </div>
    </div>
  );
}
