"use client";

import { useState, useMemo } from "react";
import { useInsights } from "../InsightsContext";
import { DashboardControls } from "../DashboardControls";
import { useWindowWidth } from "../../lib/useIsMobile";
import type { TipoVehiculo } from "../../lib/insights/dgt-bev-phev-data";
import { getDgtMarcas, dgtAñosDisponibles } from "../../lib/insights/dgt-marcas-provincias-data";
import { Card } from "../_components/Card";
import { SectionTitle } from "../_components/SectionTitle";
import { EChart } from "../../components/ui/EChart";

const C = {
  bg:     "#050810",
  border: "rgba(255,255,255,0.11)",
  bev:    "#38bdf8",
  phev:   "#fb923c",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.42)",
  grid:   "rgba(255,255,255,0.045)",
};

const TT = {
  backgroundColor: "rgba(5,8,16,0.97)",
  borderColor: C.border,
  textStyle: { color: C.text, fontSize: 12 },
  extraCssText: "box-shadow:0 8px 32px rgba(0,0,0,0.7);border-radius:10px;padding:10px 14px;",
};

function fmtN(n: number) {
  return n.toLocaleString("es-ES", { useGrouping: "always" });
}

const TIPOS_DEFAULT: TipoVehiculo[] = ["turismo","furgoneta","camion","autobus"];

export function Dashboard() {
  const { countryName } = useInsights();
  const [filtro, setFiltro] = useState<"ambos"|"bev"|"phev">("ambos");
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculo[]>(TIPOS_DEFAULT);
  const [provincia, setProvincia] = useState<string>("todas");
  const [marcaMixYear, setMarcaMixYear] = useState<"todos" | number>("todos");

  const winW = useWindowWidth();
  const isMobile = winW < 768;
  const outerPad = isMobile ? "20px 14px 48px" : "28px 24px 56px";

  const mixYearsAvailable: ("todos" | number)[] = ["todos", ...dgtAñosDisponibles];

  const abbrevMarca = (m: string) => {
    if (!isMobile) return m;
    const up = m.toUpperCase();
    if (up.includes("MERCEDES")) return "MB";
    if (up.includes("VOLKSWAGEN")) return "VW";
    return m;
  };

  const mixMarcasData = useMemo(() => {
    const year = marcaMixYear === "todos" ? "todos" : Number(marcaMixYear);
    return getDgtMarcas(year, tiposVehiculo.length > 0 ? tiposVehiculo : undefined, provincia).map((m) => {
      const total = m.bev + m.phev;
      return {
        marca: m.marca,
        displayMarca: abbrevMarca(m.marca),
        bevPct:  total > 0 ? +((m.bev  / total) * 100).toFixed(1) : 0,
        phevPct: total > 0 ? +((m.phev / total) * 100).toFixed(1) : 0,
        bev: m.bev, phev: m.phev, total,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcaMixYear, tiposVehiculo, provincia, isMobile]);

  const mixMarcasOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const axisLabel = params[0]?.axisValue;
        const d = mixMarcasData.find((m) => m.displayMarca === axisLabel);
        if (!d) return "";
        const totLabel = d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : fmtN(d.total);
        return `<b style="color:${C.text}">${d.marca}</b><br/>` +
          `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.bev};margin-right:6px"></span>BEV: <b>${d.bevPct}%</b> (${fmtN(d.bev)})<br/>` +
          `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.phev};margin-right:6px"></span>PHEV: <b>${d.phevPct}%</b> (${fmtN(d.phev)})<br/>` +
          `Total: <b>${totLabel}</b>`;
      },
    },
    grid: { top: 8, right: 52, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: "value", max: 100,
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10, formatter: (v: number) => `${v}%` },
    },
    yAxis: {
      type: "category",
      data: mixMarcasData.map((m) => m.displayMarca),
      axisLabel: { color: C.muted, fontSize: 11 },
      axisLine: { lineStyle: { color: C.grid } },
      axisTick: { show: false },
      inverse: true,
    },
    series: [
      {
        name: "BEV", type: "bar", stack: "s",
        data: mixMarcasData.map((m) => m.bevPct),
        itemStyle: { color: C.bev, borderRadius: [3, 0, 0, 3] },
        barMaxWidth: 22,
        label: { show: true, position: "inside", formatter: (p: any) => p.value >= 10 ? `${p.value}%` : "", color: "#0f172a", fontSize: 9, fontWeight: 700 },
      },
      {
        name: "PHEV", type: "bar", stack: "s",
        data: mixMarcasData.map((m) => m.phevPct),
        itemStyle: { color: C.phev, borderRadius: [0, 3, 3, 0] },
        barMaxWidth: 22,
        label: { show: true, position: "inside", formatter: (p: any) => p.value >= 10 ? `${p.value}%` : "", color: "#0f172a", fontSize: 9, fontWeight: 700 },
      },
      {
        type: "bar", stack: "s", silent: true,
        data: mixMarcasData.map((m) => ({ value: 0, label: { formatter: () => m.total >= 1000 ? `${(m.total / 1000).toFixed(0)}k` : String(m.total) } })),
        itemStyle: { color: "transparent" },
        barMaxWidth: 22,
        label: { show: true, position: "right", color: C.muted, fontSize: 10, fontWeight: 600 },
        tooltip: { show: false },
      },
    ],
  };

  // Filtro `filtro` declarado para mantener la firma de DashboardControls;
  // el chart muestra siempre BEV vs PHEV para que tenga sentido el "perfil".
  void filtro;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "14px 14px 0" : "18px 24px 0", textAlign: "center" }}>
        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
          Marca — Perfil tecnológico en {countryName}
        </h1>
      </div>

      <DashboardControls
        filtro={filtro}
        setFiltro={setFiltro}
        tiposVehiculo={tiposVehiculo}
        setTiposVehiculo={setTiposVehiculo}
        provincia={provincia}
        setProvincia={setProvincia}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: outerPad }}>
        <Card style={{ minWidth: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, gap: 8, flexWrap: "wrap" }}>
            <SectionTitle sub="% BEV vs PHEV por fabricante · DGT" tooltip="Para cada fabricante, muestra qué proporción de sus matriculaciones enchufables son BEV y cuáles PHEV. Permite ver la apuesta tecnológica de cada marca: las que van a por el eléctrico puro vs las que mantienen el híbrido enchufable como producto principal.">
              Mix por marca
            </SectionTitle>
            <select
              value={marcaMixYear}
              onChange={(e) => setMarcaMixYear(e.target.value === "todos" ? "todos" : Number(e.target.value))}
              style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#1e293b", border: `1px solid rgba(255,255,255,0.25)`, color: "#ffffff", cursor: "pointer", outline: "none", colorScheme: "dark" } as React.CSSProperties}
            >
              {mixYearsAvailable.map((y) => (
                <option key={y} value={y}>{y === "todos" ? "Todos" : y}</option>
              ))}
            </select>
          </div>
          <div style={{
            maxHeight: isMobile ? 8 * 34 + 20 : 14 * 34 + 20,
            overflowY: "auto",
          }}>
            <EChart theme="dark" option={mixMarcasOpt} style={{ height: Math.max(mixMarcasData.length * 34 + 16, 60) }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
