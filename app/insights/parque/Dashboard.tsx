"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import {
  dgtParqueMeta,
  dgtParqueResumen,
  dgtParqueResumenPorTipo,
  dgtParqueMensual,
} from "../../lib/insights/dgt-parque-data";

// ─────────────────────────────────────────────────────────────────────────────
// PRE-COMPUTED
// ─────────────────────────────────────────────────────────────────────────────

const PERIODOS  = dgtParqueMensual.map((m) => m.periodo);
const PAR_BEV   = dgtParqueMensual.map((m) => m.parque_acumulado.BEV  ?? 0);
const PAR_PHEV  = dgtParqueMensual.map((m) => m.parque_acumulado.PHEV ?? 0);
const PAR_HEV   = dgtParqueMensual.map((m) => m.parque_acumulado.HEV  ?? 0);
const MAT_BEV   = dgtParqueMensual.map((m) => m.matriculaciones_mes.BEV  ?? 0);
const MAT_PHEV  = dgtParqueMensual.map((m) => m.matriculaciones_mes.PHEV ?? 0);
const MAT_HEV   = dgtParqueMensual.map((m) => m.matriculaciones_mes.HEV  ?? 0);
const BAJA_BEV  = dgtParqueMensual.map((m) => m.bajas_mes.BEV  ?? 0);
const BAJA_PHEV = dgtParqueMensual.map((m) => m.bajas_mes.PHEV ?? 0);
const BAJA_HEV  = dgtParqueMensual.map((m) => m.bajas_mes.HEV  ?? 0);

// Saldo neto mensual
const NET_BEV  = dgtParqueMensual.map((m) =>
  (m.matriculaciones_mes.BEV ?? 0) - (m.bajas_mes.BEV ?? 0));
const NET_PHEV = dgtParqueMensual.map((m) =>
  (m.matriculaciones_mes.PHEV ?? 0) - (m.bajas_mes.PHEV ?? 0));

// Resumen por tipo_grupo (último mes)
const tipoEntries = Object.entries(dgtParqueResumenPorTipo).map(([tg, cats]) => ({
  tipo: tg,
  BEV:  cats.BEV?.parque_activo  ?? 0,
  PHEV: cats.PHEV?.parque_activo ?? 0,
  HEV:  cats.HEV?.parque_activo  ?? 0,
  total: (cats.BEV?.parque_activo ?? 0) + (cats.PHEV?.parque_activo ?? 0) + (cats.HEV?.parque_activo ?? 0),
})).sort((a, b) => b.total - a.total);

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  bev:    "#38bdf8",
  phev:   "#fb923c",
  hev:    "#a78bfa",
  green:  "#34d399",
  red:    "#f87171",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.42)",
  dim:    "rgba(241,245,249,0.20)",
  grid:   "rgba(255,255,255,0.045)",
};

const TT = {
  backgroundColor: "rgba(5,8,16,0.97)",
  borderColor: C.border,
  textStyle: { color: C.muted, fontSize: 12 },
  extraCssText: "border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.6);padding:10px 14px;",
};

function hex2rgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

function linGrad(hex: string, a0 = 0.4, a1 = 0.04) {
  const rgb = hex2rgb(hex);
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `rgba(${rgb},${a0})` },
    { offset: 1, color: `rgba(${rgb},${a1})` },
  ]);
}

function fmtN(n: number) { return n.toLocaleString("es-ES"); }

function kLabel(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

function useChart(
  ref: React.RefObject<HTMLDivElement | null>,
  build: () => Record<string, any>
) {
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    chart.setOption(build());
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => { chart.dispose(); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, badge,
}: { label: string; value: string; sub?: string; color: string; badge?: string }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        {badge && (
          <span style={{ fontSize: 11, background: `rgba(${hex2rgb(color)},0.15)`, color, borderRadius: 4, padding: "2px 7px" }}>
            {badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 12, color: C.muted }}>{sub}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARTS
// ─────────────────────────────────────────────────────────────────────────────

function ChartParqueEvolucion() {
  const ref = useRef<HTMLDivElement>(null);
  useChart(ref, () => ({
    backgroundColor: "transparent",
    grid: { top: 28, right: 24, bottom: 48, left: 64 },
    tooltip: { ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const p = params[0].axisValue;
        return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p}</div>` +
          params.map((s: any) =>
            `<div style="display:flex;gap:12px;justify-content:space-between">` +
            `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
            `<span style="font-weight:600;color:${C.text}">${fmtN(s.value)}</span></div>`
          ).join("")
      }
    },
    legend: { top: 0, right: 0, textStyle: { color: C.muted, fontSize: 12 } },
    xAxis: { type: "category", data: PERIODOS,
      axisLabel: { color: C.muted, fontSize: 11,
        formatter: (v: string) => {
          const [y, m] = v.split("-");
          return m === "01" ? y : (m === "06" ? `Jun ${y}` : "");
        }
      },
      axisLine: { lineStyle: { color: C.grid } },
      splitLine: { show: false },
    },
    yAxis: { type: "value",
      axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
      splitLine: { lineStyle: { color: C.grid } },
    },
    series: [
      {
        name: "HEV", type: "line", data: PAR_HEV, smooth: true, symbol: "none",
        lineStyle: { color: C.hev, width: 2 },
        areaStyle: { color: linGrad(C.hev, 0.25, 0.02) },
      },
      {
        name: "PHEV", type: "line", data: PAR_PHEV, smooth: true, symbol: "none",
        lineStyle: { color: C.phev, width: 2 },
        areaStyle: { color: linGrad(C.phev, 0.25, 0.02) },
      },
      {
        name: "BEV", type: "line", data: PAR_BEV, smooth: true, symbol: "none",
        lineStyle: { color: C.bev, width: 2 },
        areaStyle: { color: linGrad(C.bev, 0.25, 0.02) },
      },
    ],
  }));
  return <div ref={ref} style={{ width: "100%", height: 320 }} />;
}

function ChartSaldoNeto() {
  const ref = useRef<HTMLDivElement>(null);
  // Show only from 2019 onwards for readability
  const from = PERIODOS.findIndex((p) => p >= "2019-01");
  const periodos = PERIODOS.slice(from);
  const netBev   = NET_BEV.slice(from);
  const netPhev  = NET_PHEV.slice(from);

  useChart(ref, () => ({
    backgroundColor: "transparent",
    grid: { top: 28, right: 24, bottom: 48, left: 64 },
    tooltip: { ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const p = params[0].axisValue;
        return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p}</div>` +
          params.map((s: any) =>
            `<div style="display:flex;gap:12px;justify-content:space-between">` +
            `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
            `<span style="font-weight:600;color:${s.value >= 0 ? C.green : C.red}">${s.value >= 0 ? "+" : ""}${fmtN(s.value)}</span></div>`
          ).join("")
      }
    },
    legend: { top: 0, right: 0, textStyle: { color: C.muted, fontSize: 12 } },
    xAxis: { type: "category", data: periodos,
      axisLabel: { color: C.muted, fontSize: 11,
        formatter: (v: string) => {
          const [y, m] = v.split("-");
          return m === "01" ? y : (m === "07" ? `Jul ${y.slice(2)}` : "");
        }
      },
      axisLine: { lineStyle: { color: C.grid } },
      splitLine: { show: false },
    },
    yAxis: { type: "value",
      axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => fmtN(v) },
      splitLine: { lineStyle: { color: C.grid } },
    },
    series: [
      {
        name: "BEV neto", type: "bar", data: netBev, barMaxWidth: 10,
        itemStyle: { color: (p: any) => p.value >= 0 ? C.bev : C.red, borderRadius: 2 },
      },
      {
        name: "PHEV neto", type: "bar", data: netPhev, barMaxWidth: 10,
        itemStyle: { color: (p: any) => p.value >= 0 ? C.phev : C.red, borderRadius: 2 },
      },
    ],
  }));
  return <div ref={ref} style={{ width: "100%", height: 280 }} />;
}

function ChartMatVsBajas() {
  const ref = useRef<HTMLDivElement>(null);
  const from = PERIODOS.findIndex((p) => p >= "2020-01");
  const periodos = PERIODOS.slice(from);
  const matBev  = MAT_BEV.slice(from);
  const bajBev  = BAJA_BEV.slice(from).map((v) => -v);

  useChart(ref, () => ({
    backgroundColor: "transparent",
    grid: { top: 28, right: 24, bottom: 48, left: 64 },
    tooltip: { ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const p = params[0].axisValue;
        return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${p} — BEV</div>` +
          `<div>Nuevas: <strong style="color:${C.bev}">${fmtN(matBev[params[0].dataIndex])}</strong></div>` +
          `<div>Bajas: <strong style="color:${C.red}">${fmtN(BAJA_BEV.slice(from)[params[0].dataIndex])}</strong></div>`
      }
    },
    xAxis: { type: "category", data: periodos,
      axisLabel: { color: C.muted, fontSize: 11,
        formatter: (v: string) => {
          const [y, m] = v.split("-");
          return m === "01" ? y : (m === "07" ? `Jul ${y.slice(2)}` : "");
        }
      },
      axisLine: { lineStyle: { color: C.grid } },
      splitLine: { show: false },
    },
    yAxis: { type: "value",
      axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => fmtN(Math.abs(v)) },
      splitLine: { lineStyle: { color: C.grid } },
    },
    series: [
      {
        name: "Matriculaciones BEV", type: "bar", data: matBev, stack: "bev",
        barMaxWidth: 16,
        itemStyle: { color: C.bev, opacity: 0.9, borderRadius: [2, 2, 0, 0] },
      },
      {
        name: "Bajas BEV", type: "bar", data: bajBev, stack: "bev",
        barMaxWidth: 16,
        itemStyle: { color: C.red, opacity: 0.8, borderRadius: [0, 0, 2, 2] },
      },
    ],
  }));
  return <div ref={ref} style={{ width: "100%", height: 260 }} />;
}

function ChartPorTipo() {
  const ref = useRef<HTMLDivElement>(null);
  const tipos   = tipoEntries.map((t) => t.tipo.replace("_", " "));
  const bevData  = tipoEntries.map((t) => t.BEV);
  const phevData = tipoEntries.map((t) => Math.max(t.PHEV, 0));
  const hevData  = tipoEntries.map((t) => t.HEV);

  useChart(ref, () => ({
    backgroundColor: "transparent",
    grid: { top: 8, right: 80, bottom: 8, left: 110, containLabel: false },
    tooltip: { ...TT, trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (params: Record<string, any>[]) => {
        const tg = params[0].axisValue;
        return `<div style="color:${C.text};font-size:13px;font-weight:600;margin-bottom:6px">${tg}</div>` +
          params.filter((s: any) => s.value > 0).map((s: any) =>
            `<div style="display:flex;gap:12px;justify-content:space-between">` +
            `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.seriesName}</span>` +
            `<span style="font-weight:600;color:${C.text}">${fmtN(s.value)}</span></div>`
          ).join("")
      }
    },
    legend: { orient: "vertical", right: 0, top: "center", textStyle: { color: C.muted, fontSize: 11 } },
    xAxis: { type: "value",
      axisLabel: { color: C.muted, fontSize: 11, formatter: (v: number) => kLabel(v) },
      splitLine: { lineStyle: { color: C.grid } },
    },
    yAxis: { type: "category", data: tipos.slice().reverse(),
      axisLabel: { color: C.muted, fontSize: 12 },
      axisLine: { show: false },
    },
    series: [
      { name: "BEV",  type: "bar", data: bevData.slice().reverse(),  stack: "t", barMaxWidth: 24,
        itemStyle: { color: C.bev,  borderRadius: 0 } },
      { name: "PHEV", type: "bar", data: phevData.slice().reverse(), stack: "t", barMaxWidth: 24,
        itemStyle: { color: C.phev, borderRadius: 0 } },
      { name: "HEV",  type: "bar", data: hevData.slice().reverse(),  stack: "t", barMaxWidth: 24,
        itemStyle: { color: C.hev,  borderRadius: [0, 3, 3, 0] } },
    ],
  }));
  return <div ref={ref} style={{ width: "100%", height: 280 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

const sec: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px",
};

const sTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16, letterSpacing: "-0.01em",
};

const sDesc: React.CSSProperties = {
  fontSize: 12, color: C.muted, marginTop: -10, marginBottom: 16,
};

export function Dashboard() {
  const R = dgtParqueResumen;

  const totalEv = (R.BEV?.parque_activo ?? 0) + (R.PHEV?.parque_activo ?? 0) +
                  (R.HEV?.parque_activo ?? 0) + (R.REEV?.parque_activo ?? 0) +
                  (R.FCEV?.parque_activo ?? 0);

  const lastMes = dgtParqueMensual[dgtParqueMensual.length - 1];
  const lastNetBev = (lastMes.matriculaciones_mes.BEV ?? 0) - (lastMes.bajas_mes.BEV ?? 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Parque activo EV — España
          </h1>
          <p style={{ color: C.muted, fontSize: 14, margin: "6px 0 0" }}>
            Vehículos electrificados en circulación.
            Datos DGT microdatos MATRABA · Hasta {dgtParqueMeta.ultimo_periodo}
          </p>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          <KpiCard
            label="Parque total electrificado"
            value={kLabel(totalEv)}
            sub={`${fmtN(totalEv)} vehículos`}
            color={C.green}
            badge="BEV+PHEV+HEV"
          />
          <KpiCard
            label="Parque BEV"
            value={fmtN(R.BEV?.parque_activo ?? 0)}
            sub={`${R.BEV?.tasa_baja_pct}% tasa de baja acumulada`}
            color={C.bev}
            badge="100% eléctrico"
          />
          <KpiCard
            label="Parque PHEV"
            value={fmtN(R.PHEV?.parque_activo ?? 0)}
            sub={`${R.PHEV?.tasa_baja_pct}% tasa de baja`}
            color={C.phev}
            badge="Enchufable"
          />
          <KpiCard
            label="Parque HEV"
            value={fmtN(R.HEV?.parque_activo ?? 0)}
            sub={`${R.HEV?.tasa_baja_pct}% tasa de baja`}
            color={C.hev}
            badge="Híbrido"
          />
          <KpiCard
            label="Saldo neto BEV (último mes)"
            value={`${lastNetBev >= 0 ? "+" : ""}${fmtN(lastNetBev)}`}
            sub={`${lastMes.periodo} · mats ${fmtN(lastMes.matriculaciones_mes.BEV ?? 0)} · bajas ${fmtN(lastMes.bajas_mes.BEV ?? 0)}`}
            color={lastNetBev >= 0 ? C.green : C.red}
          />
        </div>

        {/* Parque evolution */}
        <div style={{ ...sec, marginBottom: 20 }}>
          <div style={sTitle}>Evolución del parque activo</div>
          <div style={sDesc}>Vehículos en circulación cada mes (matriculaciones acumuladas − bajas acumuladas)</div>
          <ChartParqueEvolucion />
        </div>

        {/* 2-col row: saldo neto + mat vs bajas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div style={sec}>
            <div style={sTitle}>Saldo neto mensual BEV + PHEV</div>
            <div style={sDesc}>Matriculaciones menos bajas. Verde = creció el parque, rojo = se redujo</div>
            <ChartSaldoNeto />
          </div>
          <div style={sec}>
            <div style={sTitle}>Matriculaciones vs bajas BEV (desde 2020)</div>
            <div style={sDesc}>Nuevas altas en verde, bajas en rojo</div>
            <ChartMatVsBajas />
          </div>
        </div>

        {/* Por tipo de vehículo */}
        <div style={{ ...sec, marginBottom: 20 }}>
          <div style={sTitle}>Parque activo por tipo de vehículo</div>
          <div style={sDesc}>Turismo, furgoneta, moto, camión… desglosado por BEV/PHEV/HEV</div>
          <ChartPorTipo />
        </div>

        {/* Tabla resumen */}
        <div style={sec}>
          <div style={sTitle}>Resumen por categoría</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Categoría", "Matriculadas", "Bajas", "Parque activo", "Tasa de baja"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Categoría" ? "left" : "right", padding: "8px 12px", color: C.muted, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(R).map(([cat, d]) => {
                const color = cat === "BEV" ? C.bev : cat === "PHEV" ? C.phev : cat === "HEV" ? C.hev : C.muted;
                return (
                  <tr key={cat} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: `rgba(${hex2rgb(color)},0.15)`, color, borderRadius: 4, padding: "2px 8px", fontWeight: 600, fontSize: 12 }}>{cat}</span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: C.text }}>{fmtN(d.matriculadas)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: C.red }}>{fmtN(d.bajas)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color, fontWeight: 700 }}>{fmtN(d.parque_activo)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: C.muted }}>{d.tasa_baja_pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 16, fontSize: 11, color: C.dim }}>
            Fuente: DGT — Microdatos MATRABA (matriculaciones + bajas) · Datos hasta {dgtParqueMeta.ultimo_periodo} · Actualizado {dgtParqueMeta.ultima_actualizacion}
          </div>
        </div>

      </div>
    </div>
  );
}
