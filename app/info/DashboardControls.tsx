"use client";

import type { TipoVehiculo } from "../lib/insights/dgt-bev-phev-data";
import { TIPO_LABELS } from "../lib/insights/dgt-bev-phev-data";
import { useIsMobile } from "../lib/useIsMobile";

const BEV_COLOR  = "#38bdf8";
const PHEV_COLOR = "#fb923c";
const BORDER_COLOR = "rgba(255,255,255,0.08)";

const TIPOS_ORDER: TipoVehiculo[] = ["turismo","furgoneta","moto_scooter","microcar","camion","autobus","otros"];

const TIPO_TOOLTIP: Record<TipoVehiculo, string> = {
  todos:       "Todos los tipos de vehículo",
  turismo:     "Categorías DGT: M1, M1G — Turismos y todoterrenos de pasajeros (hasta 8+1 plazas)",
  furgoneta:   "Categorías DGT: N1, N1G — Vehículos de carga ligera (hasta 3.500 kg)",
  moto_scooter:"Categorías DGT: L1E–L7E, *05, *06 — Ciclomotores, motos, scooters y triciclos eléctricos",
  microcar:    "Categorías DGT: *21, *27 — Cuadriciclos ligeros (Citroën Ami, Microlino, XEV Yoyo...)",
  camion:      "Categorías DGT: N2, N2G, N3, N3G — Vehículos de carga pesada (más de 3.500 kg)",
  autobus:     "Categorías DGT: M2, M3 — Autobuses y minibuses (más de 8+1 plazas)",
  otros:       "Resto de categorías: tractores agrícolas, quads/ATV, carretillas industriales y no clasificados",
};

interface Props {
  filtro: "ambos" | "bev" | "phev";
  setFiltro: (f: "ambos" | "bev" | "phev") => void;
  tiposVehiculo: TipoVehiculo[];
  setTiposVehiculo: (fn: (prev: TipoVehiculo[]) => TipoVehiculo[]) => void;
  showTipo?: boolean;
}

export function DashboardControls({ filtro, setFiltro, tiposVehiculo, setTiposVehiculo, showTipo = true }: Props) {
  const isMobile = useIsMobile();
  const tecOptions: { value: "ambos" | "bev" | "phev"; color?: string }[] = [
    { value: "ambos" },
    { value: "bev",  color: BEV_COLOR  },
    { value: "phev", color: PHEV_COLOR },
  ];

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
          gap: isMobile ? 8 : 16, flexWrap: "wrap",
          paddingTop: isMobile ? 8 : 6,
          paddingBottom: isMobile ? 8 : 6,
        }}>

          {/* Left: Tec. */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, color: "rgba(241,245,249,0.6)",
              letterSpacing: "0.03em", fontWeight: 600,
            }}>
              Tec.:
            </span>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, gap: 2, flexWrap: "wrap" }}>
              {/* Total — deshabilitado */}
              <button disabled title="Próximamente" style={{
                padding: "5px 14px", borderRadius: 7, cursor: "not-allowed", fontSize: 12, fontWeight: 700,
                border: "1px solid transparent", background: "transparent",
                color: "rgba(241,245,249,0.45)",
              }}>
                Todos
              </button>
              {/* No Enchufable — deshabilitado */}
              <button disabled title="Próximamente" style={{
                padding: "5px 14px", borderRadius: 7, cursor: "not-allowed", fontSize: 12, fontWeight: 700,
                border: "1px solid transparent", background: "transparent",
                color: "rgba(241,245,249,0.45)",
              }}>
                No Enchufable
              </button>
              {/* Separador */}
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "4px 2px" }} />
              {/* BEV+PHEV / BEV / PHEV */}
              {tecOptions.map((opt) => {
                const active = filtro === opt.value;
                const col = opt.color;
                const label = opt.value === "ambos"
                  ? active
                    ? <><span style={{ color: BEV_COLOR }}>BEV</span><span style={{ color: "rgba(244,244,245,0.7)" }}> + </span><span style={{ color: PHEV_COLOR }}>PHEV</span></>
                    : "BEV + PHEV"
                  : opt.value === "bev" ? "BEV" : "PHEV";
                return (
                  <button key={opt.value} onClick={() => setFiltro(opt.value)} style={{
                    padding: "5px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                    border: active
                      ? `1px solid ${col ? col + "44" : "rgba(255,255,255,0.2)"}`
                      : "1px solid transparent",
                    background: active
                      ? (col ? `${col}18` : "rgba(255,255,255,0.08)")
                      : "transparent",
                    color: active ? (col ?? "#f4f4f5") : "rgba(241,245,249,0.55)",
                    transition: "all 0.15s",
                  }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Tipo vehículo */}
          {showTipo && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "rgba(241,245,249,0.6)" }}>Tipo:</span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {TIPOS_ORDER.map((t) => {
                  const active = tiposVehiculo.includes(t);
                  return (
                    <button
                      key={t}
                      title={TIPO_TOOLTIP[t]}
                      onClick={() => setTiposVehiculo((prev) =>
                        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                      )}
                      style={{
                        padding: "3px 11px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700,
                        border: active ? "1px solid rgba(241,245,249,0.25)" : "1px solid transparent",
                        background: active ? "rgba(241,245,249,0.08)" : "rgba(255,255,255,0.04)",
                        color: active ? "#f4f4f5" : "rgba(241,245,249,0.35)",
                        transition: "all 0.15s",
                      }}
                    >
                      {TIPO_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
