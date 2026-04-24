"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as echarts from "echarts";
import {
  licitaciones,
  licitacionesSummary,
  categoriasMeta,
  categoriaShort,
  categoriaColor,
  ESTADO_LABEL,
  ESTADO_COLOR,
  type CategoriaId,
  type LicitacionItem,
} from "../../lib/insights/licitaciones-data";
import { useWindowWidth } from "../../lib/useIsMobile";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  green:  "#34d399",
  blue:   "#38bdf8",
  purple: "#a78bfa",
  orange: "#fb923c",
  amber:  "#fbbf24",
  red:    "#f87171",
  teal:   "#06b6d4",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.42)",
  dim:    "rgba(241,245,249,0.20)",
  grid:   "rgba(255,255,255,0.045)",
};

const TT = {
  backgroundColor: "rgba(5,8,16,0.97)",
  borderColor: C.border,
  textStyle: { color: C.text, fontSize: 12 },
  extraCssText: "box-shadow:0 8px 32px rgba(0,0,0,0.7);border-radius:10px;padding:10px 14px;",
};

const CAT_IDS: CategoriaId[] = ["1","2","3","4","5","6","7","8","9","10","11"];

function fmtN(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function fmtEur(n: number | null | undefined, compact = true): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (!compact) return `${fmtN(n)} €`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)} B€`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)} M€`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)} k€`;
  return `${fmtN(n)} €`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVINCE MAP NORMALIZATION (reused from infraestructura)
// ─────────────────────────────────────────────────────────────────────────────

const GEO_PROV_MAP: Record<string, string> = {
  "Baleares":               "Islas Baleares",
  "Illes Balears":          "Islas Baleares",
  "Castellón de la Plana":  "Castellón",
  "Castellón":              "Castellón",
  "Guipúzcoa":              "Gipuzkoa",
  "Gipuzkoa":               "Gipuzkoa",
  "La Coruña":              "A Coruña",
  "A Coruña":               "A Coruña",
  "Lérida":                 "Lleida",
  "Lleida":                 "Lleida",
  "Orense":                 "Ourense",
  "Ourense":                "Ourense",
  "Gerona":                 "Girona",
  "Girona":                 "Girona",
  "Álava":                  "Álava",
  "Araba":                  "Álava",
  "Araba/Álava":            "Álava",
  "Bizkaia":                "Vizcaya",
  "Vizcaya":                "Vizcaya",
};

const CANARIAS_ISLAND_TO_PROV: Record<string, string> = {
  "Las Palmas":             "Las Palmas",
  "Gran Canaria":           "Las Palmas",
  "Fuerteventura":          "Las Palmas",
  "Lanzarote":              "Las Palmas",
  "Santa Cruz de Tenerife": "Santa Cruz de Tenerife",
  "Tenerife":               "Santa Cruz de Tenerife",
  "La Palma":               "Santa Cruz de Tenerife",
  "La Gomera":              "Santa Cruz de Tenerife",
  "El Hierro":              "Santa Cruz de Tenerife",
};
const CANAR_LNG = 4;
const CANAR_LAT = 8.4;
function shiftCoords(coords: any[], dlng: number, dlat: number): any[] {
  if (typeof coords[0] === "number") return [coords[0] + dlng, coords[1] + dlat];
  return coords.map((c) => shiftCoords(c, dlng, dlat));
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function EChart({ option, style }: { option: Record<string, any>; style?: React.CSSProperties }) {
  const ref      = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = echarts.init(ref.current, "dark");
    chartRef.current.setOption(option);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chartRef.current?.dispose(); };
  }, []);
  useEffect(() => { chartRef.current?.setOption(option, { notMerge: true }); }, [option]);
  return <div ref={ref} style={{ width: "100%", height: 300, ...style }} />;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: "linear-gradient(180deg,#a78bfa,#38bdf8)", flexShrink: 0 }} />
        <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.01em" }}>{children}</h2>
      </div>
      {sub && <p style={{ fontSize: 11, color: C.muted, marginTop: 4, marginLeft: 13 }}>{sub}</p>}
    </div>
  );
}

function KPI({ label, value, sub, color, icon, tag }: {
  label: string; value: string; sub?: string; color?: string; icon?: string; tag?: string;
}) {
  const glow = color ?? C.blue;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px 22px", flex: 1, minWidth: 160, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: "50%", background: `${glow}18`, filter: "blur(24px)", pointerEvents: "none" }} />
      <div style={{ minHeight: 72, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {icon && <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 6 }}>{icon}</div>}
        {tag && (
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: glow, textTransform: "uppercase", background: `${glow}18`, borderRadius: 4, padding: "2px 6px", marginBottom: 6, display: "inline-block", alignSelf: "flex-start" }}>
            {tag}
          </span>
        )}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: color ?? C.text, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", margin: "10px 0 8px" }}>{value}</p>
      {sub && <span style={{ fontSize: 11, color: C.muted }}>{sub}</span>}
    </div>
  );
}

function Pill({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: bg ?? `${color}18`, borderRadius: 5, padding: "2px 7px", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export function Dashboard() {
  const winW = useWindowWidth();
  const isMobile = winW < 768;
  const cols2 = isMobile ? "1fr" : "1fr 1fr";
  const GAP = isMobile ? 12 : 16;

  const [rankBy,  setRankBy]  = useState<"organos" | "adjudicatarios">("organos");
  const [catSel,  setCatSel]  = useState<"ALL" | CategoriaId>("ALL");
  const [estSel,  setEstSel]  = useState<"ALL" | "abiertas" | "RES" | "ADJ">("ALL");
  const [query,   setQuery]   = useState("");
  const [limit,   setLimit]   = useState(20);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError,  setMapError]  = useState<string | null>(null);

  // ── Universo (filtrado por catSel) ────────────────────────────────────────
  const scoped = useMemo(() => {
    if (catSel === "ALL") return licitaciones;
    return licitaciones.filter((l) => l.categoria === catSel);
  }, [catSel]);

  // ── KPIs derivados del scoped ────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = scoped.length;
    let importe_base = 0;
    let resueltas = 0, adj = 0, pub = 0, ev = 0, con_ue = 0;
    for (const l of scoped) {
      if (l.importe_base != null) importe_base += l.importe_base;
      if (l.estado === "RES") resueltas++;
      else if (l.estado === "ADJ") adj++;
      else if (l.estado === "PUB") pub++;
      else if (l.estado === "EV") ev++;
      if ((l.tags?.length ?? 0) > 0) con_ue++;
    }
    const cat1 = catSel === "ALL"
      ? (licitacionesSummary.por_categoria.find((c) => c.cat === "1")?.n ?? 0)
      : (catSel === "1" ? total : 0);
    return {
      total,
      pct_universo: (total / licitacionesSummary.total_universo) * 100,
      importe_base,
      adjudicadas: resueltas + adj,
      adjudicadas_pct: total ? ((resueltas + adj) / total) * 100 : 0,
      abiertas: pub + ev,
      concesiones: cat1,
      con_ue,
    };
  }, [scoped, catSel]);

  // ── Serie anual (re-agregada desde scoped si hay filtro) ──────────────────
  const serieAnual = useMemo(() => {
    if (catSel === "ALL") return licitacionesSummary.serie_anual;
    const map = new Map<number, { anio: number; total: number; por_cat: Partial<Record<CategoriaId, number>>; importe_base_total: number }>();
    for (const l of scoped) {
      const anio = l.fecha_publicacion ? +l.fecha_publicacion.slice(0, 4) : null;
      if (!anio) continue;
      if (!map.has(anio)) map.set(anio, { anio, total: 0, por_cat: {}, importe_base_total: 0 });
      const e = map.get(anio)!;
      e.total++;
      e.por_cat[l.categoria] = (e.por_cat[l.categoria] ?? 0) + 1;
      if (l.importe_base != null) e.importe_base_total += l.importe_base;
    }
    return [...map.values()].sort((a, b) => a.anio - b.anio);
  }, [scoped, catSel]);

  // ── Estados (re-agregados) ────────────────────────────────────────────────
  const porEstado = useMemo(() => {
    if (catSel === "ALL") return licitacionesSummary.por_estado;
    const m = new Map<string, number>();
    for (const l of scoped) { const k = l.estado ?? "—"; m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].map(([estado, n]) => ({ estado, n })).sort((a, b) => b.n - a.n);
  }, [scoped, catSel]);

  // ── Provincias (re-agregadas) ─────────────────────────────────────────────
  const provData = useMemo(() => {
    if (catSel === "ALL") return licitacionesSummary.por_provincia.filter((p) => p.provincia);
    const m = new Map<string, { provincia: string | null; ccaa: string | null; n: number; importe_base_total: number; por_cat: Partial<Record<CategoriaId, number>> }>();
    for (const l of scoped) {
      if (!l.provincia) continue;
      const k = l.provincia;
      if (!m.has(k)) m.set(k, { provincia: l.provincia, ccaa: l.ccaa ?? null, n: 0, importe_base_total: 0, por_cat: {} });
      const e = m.get(k)!;
      e.n++;
      if (l.importe_base != null) e.importe_base_total += l.importe_base;
      e.por_cat[l.categoria] = (e.por_cat[l.categoria] ?? 0) + 1;
    }
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [scoped, catSel]);
  const maxProvN = Math.max(...provData.map((p) => p.n), 1);

  // ── Top órganos / adjudicatarios (re-agregados) ──────────────────────────
  const topOrganos = useMemo(() => {
    if (catSel === "ALL") return licitacionesSummary.top_organos;
    const m = new Map<string, { nombre: string; nif?: string; n: number; importe_base_total: number; por_cat: Partial<Record<CategoriaId, number>> }>();
    for (const l of scoped) {
      const k = l.organo_nif || l.organo;
      if (!k) continue;
      if (!m.has(k)) m.set(k, { nombre: l.organo!, nif: l.organo_nif, n: 0, importe_base_total: 0, por_cat: {} });
      const e = m.get(k)!;
      e.n++;
      if (l.importe_base != null) e.importe_base_total += l.importe_base;
      e.por_cat[l.categoria] = (e.por_cat[l.categoria] ?? 0) + 1;
    }
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 60);
  }, [scoped, catSel]);

  const topAdjudicatarios = useMemo(() => {
    if (catSel === "ALL") return licitacionesSummary.top_adjudicatarios;
    const m = new Map<string, { nombre: string; nif?: string; n: number; importe_base_total: number; por_cat: Partial<Record<CategoriaId, number>> }>();
    for (const l of scoped) {
      for (const a of (l.adjudicatarios ?? [])) {
        const k = a.nif || a.nombre;
        if (!k) continue;
        if (!m.has(k)) m.set(k, { nombre: a.nombre, nif: a.nif, n: 0, importe_base_total: 0, por_cat: {} });
        const e = m.get(k)!;
        e.n++;
        if (l.importe_base != null) e.importe_base_total += l.importe_base;
        e.por_cat[l.categoria] = (e.por_cat[l.categoria] ?? 0) + 1;
      }
    }
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 60);
  }, [scoped, catSel]);

  // ── Listado filtrado (tabla) — hereda catSel del header ───────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter((l) => {
      if (estSel === "abiertas" && l.estado !== "PUB" && l.estado !== "EV") return false;
      if (estSel === "RES" && l.estado !== "RES") return false;
      if (estSel === "ADJ" && l.estado !== "ADJ") return false;
      if (!q) return true;
      return (
        (l.titulo?.toLowerCase().includes(q) ?? false) ||
        (l.organo?.toLowerCase().includes(q) ?? false) ||
        (l.expediente?.toLowerCase().includes(q) ?? false) ||
        (l.adjudicatarios ?? []).some((a) => a.nombre.toLowerCase().includes(q))
      );
    });
  }, [scoped, estSel, query]);

  // ─── Load Spain choropleth map ────────────────────────────────────────────
  useEffect(() => {
    const URLS = [
      "https://cdn.jsdelivr.net/gh/codeforamerica/click_that_hood@master/public/data/spain-provinces.geojson",
      "https://cdn.jsdelivr.net/gh/codeforgermany/click_that_hood@main/public/data/spain-provinces.geojson",
    ];
    let tried = 0;
    const tryNext = () => {
      if (tried >= URLS.length) { setMapError("No se pudo cargar el mapa"); return; }
      const url = URLS[tried++];
      fetch(url)
        .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
        .then((geo) => {
          const normalized = {
            ...geo,
            features: geo.features.map((f: any) => {
              const rawName: string = f.properties?.name ?? f.properties?.NAME ?? f.properties?.NAME_1 ?? "";
              const isCanaria = rawName in CANARIAS_ISLAND_TO_PROV;
              const displayName = isCanaria
                ? CANARIAS_ISLAND_TO_PROV[rawName]
                : (GEO_PROV_MAP[rawName] ?? rawName);
              const geom = isCanaria
                ? { ...f.geometry, coordinates: shiftCoords(f.geometry.coordinates, CANAR_LNG, CANAR_LAT) }
                : f.geometry;
              return { ...f, geometry: geom, properties: { ...f.properties, name: displayName } };
            }),
          };
          echarts.registerMap("spain-prov-lic", normalized);
          setMapLoaded(true);
        })
        .catch(tryNext);
    };
    tryNext();
  }, []);

  // ── OPT: Serie anual por categoría ────────────────────────────────────────
  const serieOpt: Record<string, any> = useMemo(() => {
    const years = serieAnual.map((y) => y.anio);
    const catsToRender: CategoriaId[] = catSel === "ALL" ? CAT_IDS : [catSel];
    const catSeries = catsToRender.map((cat) => ({
      name:  `${cat}. ${categoriaShort(cat)}`,
      type:  "bar",
      stack: "s",
      data:  serieAnual.map((y) => y.por_cat[cat] ?? 0),
      itemStyle: { color: categoriaColor(cat) },
      barMaxWidth: 40,
    }));
    const importeSerie = {
      name: "Importe base (M€)",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 5,
      yAxisIndex: 1,
      data: serieAnual.map((y) => +(y.importe_base_total / 1e6).toFixed(2)),
      lineStyle: { color: C.amber, width: 2, type: "dashed" },
      itemStyle: { color: C.amber },
    };
    return {
      backgroundColor: "transparent",
      tooltip: {
        ...TT, trigger: "axis",
        formatter: (params: Record<string, any>[]) => {
          const header = `<b style="color:${C.text}">${params[0].axisValue}</b>`;
          const catLines = params
            .filter((p) => p.seriesName !== "Importe base (M€)" && p.value > 0)
            .map((p) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${p.value}</b>`)
            .join("<br/>");
          const imp = params.find((p) => p.seriesName === "Importe base (M€)");
          const total = params.filter((p) => p.seriesName !== "Importe base (M€)").reduce((s, p) => s + (p.value as number), 0);
          return `${header}<br/>${catLines}<br/><span style="color:${C.muted}">Total licitaciones: <b>${total}</b></span>` +
            (imp ? `<br/><span style="color:${C.amber}">Importe base total: <b>${imp.value} M€</b></span>` : "");
        },
      },
      legend: { show: false },
      grid: { top: 16, right: 64, bottom: 36, left: 56 },
      xAxis: {
        type: "category",
        data: years,
        axisLine: { lineStyle: { color: C.grid } },
        axisLabel: { color: C.muted, fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
          axisLabel: { color: C.muted, fontSize: 10 },
        },
        {
          type: "value",
          name: "M€",
          position: "right",
          splitLine: { show: false },
          axisLabel: { color: C.muted, fontSize: 10 },
          nameTextStyle: { color: C.muted, fontSize: 9 },
        },
      ],
      series: [...catSeries, importeSerie],
    };
  }, [serieAnual, catSel]);

  // ── OPT: Donut de categorías (siempre universo, para contexto) ───────────
  const catDonutOpt: Record<string, any> = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: {
      ...TT,
      formatter: (p: Record<string, any>) =>
        `<b>${p.name}</b><br/>Licitaciones: <b>${p.value}</b><br/>Cuota: <b>${p.percent.toFixed(1)}%</b>`,
    },
    series: [{
      type: "pie",
      radius: ["42%", "72%"],
      center: ["50%", "50%"],
      data: licitacionesSummary.por_categoria.map((c) => ({
        name:  `${c.cat}. ${c.short}`,
        value: c.n,
        itemStyle: {
          color: c.color,
          opacity: catSel === "ALL" || catSel === c.cat ? 1 : 0.22,
        },
      })),
      label:     { show: true, fontSize: 11, color: C.muted, formatter: (p: Record<string, any>) => p.percent > 3 ? `${p.percent.toFixed(0)}%` : "" },
      labelLine: { lineStyle: { color: C.dim } },
      emphasis:  { scale: true, scaleSize: 8 },
    }],
  }), [catSel]);

  // ── OPT: Donut estados ────────────────────────────────────────────────────
  const estadoDonutOpt: Record<string, any> = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: {
      ...TT,
      formatter: (p: Record<string, any>) =>
        `<b>${ESTADO_LABEL[p.name] ?? p.name}</b><br/>Licitaciones: <b>${p.value}</b><br/>Cuota: <b>${p.percent.toFixed(1)}%</b>`,
    },
    series: [{
      type: "pie",
      radius: ["42%", "72%"],
      center: ["50%", "50%"],
      data: porEstado.map((e) => ({
        name:  e.estado,
        value: e.n,
        itemStyle: { color: ESTADO_COLOR[e.estado] ?? C.dim },
      })),
      label:     { show: true, fontSize: 11, color: C.muted, formatter: (p: Record<string, any>) => p.percent > 4 ? `${(ESTADO_LABEL[p.name] ?? p.name)}\n${p.percent.toFixed(0)}%` : "" },
      labelLine: { lineStyle: { color: C.dim } },
      emphasis:  { scale: true, scaleSize: 8 },
    }],
  }), [porEstado]);

  // ── OPT: Mapa España ──────────────────────────────────────────────────────
  const spainMapOpt: Record<string, any> | null = mapLoaded ? {
    backgroundColor: "transparent",
    tooltip: {
      ...TT,
      trigger:  "item",
      confine:  true,
      formatter: (p: any) => {
        if (!p.name) return "";
        const d = provData.find((x) => x.provincia === p.name);
        if (!d) return `<b style="color:${C.text}">${p.name}</b><br/><span style="color:${C.muted}">Sin datos</span>`;
        const topCats = Object.entries(d.por_cat).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3);
        const topCatHtml = topCats.map(([c, n]) =>
          `<span style="color:${categoriaColor(c as CategoriaId)}">●</span> ${categoriaShort(c as CategoriaId)}: <b>${n}</b>`,
        ).join("<br/>");
        return `<b style="color:${C.text}">${d.provincia}</b> <span style="color:${C.dim}">${d.ccaa ?? ""}</span><br/>` +
          `Licitaciones: <b>${d.n}</b><br/>Importe base: <b>${fmtEur(d.importe_base_total)}</b><br/>` +
          `<hr style="border:0;border-top:1px solid ${C.border};margin:6px 0"/>` +
          topCatHtml;
      },
    },
    visualMap: {
      type: "continuous",
      min: 0, max: maxProvN,
      calculable: true,
      orient: "horizontal", left: "center", bottom: 8,
      textStyle: { color: C.muted, fontSize: 10 },
      inRange: { color: ["#0b1220", "#1e3a8a", "#38bdf8", "#34d399", "#fbbf24", "#f87171"] },
    },
    series: [{
      type: "map",
      map:  "spain-prov-lic",
      roam: false,
      aspectScale: 0.85,
      layoutCenter: ["50%", "48%"],
      layoutSize: "95%",
      label: { show: false },
      emphasis: { itemStyle: { areaColor: "rgba(167,139,250,0.35)" }, label: { show: true, color: C.text, fontSize: 9 } },
      itemStyle: { borderColor: "rgba(255,255,255,0.1)", borderWidth: 0.5, areaColor: "rgba(255,255,255,0.04)" },
      data: provData.map((p) => ({ name: p.provincia, value: p.n })),
    }],
  } : null;

  // ── OPT: ranking horizontal (órganos o adjudicatarios) ───────────────────
  const rankRows = (rankBy === "organos" ? topOrganos : topAdjudicatarios).slice(0, 15);
  const rankOpt: Record<string, any> = {
    backgroundColor: "transparent",
    tooltip: {
      ...TT, trigger: "axis",
      formatter: (params: Record<string, any>[]) => {
        const p = params[0];
        const d = rankRows.find((r) => r.nombre === p.name);
        if (!d) return "";
        const topCats = Object.entries(d.por_cat).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3);
        const topCatHtml = topCats.map(([c, n]) =>
          `<span style="color:${categoriaColor(c as CategoriaId)}">●</span> ${categoriaShort(c as CategoriaId)}: <b>${n}</b>`,
        ).join("<br/>");
        return `<b style="color:${C.text}">${d.nombre}</b>${d.nif ? ` <span style="color:${C.dim}">· ${d.nif}</span>` : ""}<br/>` +
          `Licitaciones: <b>${d.n}</b><br/>Importe base: <b>${fmtEur(d.importe_base_total)}</b><br/>` +
          `<hr style="border:0;border-top:1px solid ${C.border};margin:6px 0"/>${topCatHtml}`;
      },
    },
    grid: { top: 8, right: 96, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: "value",
      splitLine: { lineStyle: { color: C.grid, type: "dashed" } },
      axisLabel: { color: C.muted, fontSize: 10 },
    },
    yAxis: {
      type: "category",
      data: [...rankRows].reverse().map((r) => r.nombre.length > 42 ? r.nombre.slice(0, 40) + "…" : r.nombre),
      axisLabel: { color: C.muted, fontSize: 10 },
      axisTick: { show: false }, axisLine: { show: false },
    },
    series: [{
      type: "bar",
      barMaxWidth: 18,
      data: [...rankRows].reverse().map((r) => ({
        value: r.n,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: rankBy === "organos" ? C.blue : C.purple },
            { offset: 1, color: rankBy === "organos" ? "rgba(56,189,248,0.25)" : "rgba(167,139,250,0.25)" },
          ]),
          borderRadius: [0, 4, 4, 0],
        },
      })),
      label: { show: true, position: "right", color: C.muted, fontSize: 10, formatter: (p: Record<string, any>) => String(p.value) },
    }],
  };

  // ── OPT: Top provincias bar ───────────────────────────────────────────────
  const provTopOpt: Record<string, any> = useMemo(() => {
    const top = [...provData].sort((a, b) => b.n - a.n).slice(0, 20);
    return {
      backgroundColor: "transparent",
      tooltip: {
        ...TT, trigger: "axis",
        formatter: (params: Record<string, any>[]) => {
          const d = top.find((x) => x.provincia === params[0].name);
          if (!d) return "";
          return `<b>${d.provincia}</b><br/>Licitaciones: <b>${d.n}</b><br/>Importe base: <b>${fmtEur(d.importe_base_total)}</b>`;
        },
      },
      grid: { top: 8, right: 64, bottom: 36, left: 8, containLabel: true },
      xAxis: {
        type: "category",
        data: top.map((p) => p.provincia!),
        axisLabel: { color: C.muted, fontSize: 9, interval: 0, rotate: 30 },
        axisLine: { lineStyle: { color: C.grid } },
        axisTick: { show: false },
      },
      yAxis: { type: "value", splitLine: { lineStyle: { color: C.grid, type: "dashed" } }, axisLabel: { color: C.muted, fontSize: 10 } },
      series: [{
        type: "bar",
        barMaxWidth: 28,
        data: top.map((p) => p.n),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: C.teal },
            { offset: 1, color: "rgba(6,182,212,0.25)" },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        label: { show: true, position: "top", color: C.muted, fontSize: 9, formatter: (p: Record<string, any>) => String(p.value) },
      }],
    };
  }, [provData]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Controls / sticky header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(5,8,16,0.88)", backdropFilter: "blur(16px)", position: "sticky", top: 52, zIndex: 40 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "0 12px" : "0 24px" }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", minHeight: isMobile ? undefined : 50, gap: isMobile ? 8 : 16, paddingTop: isMobile ? 8 : 0, paddingBottom: isMobile ? 8 : 0, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: C.dim, letterSpacing: "0.06em", textTransform: "uppercase" }}>España · PLACSP · Taxonomía v3</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Licitaciones públicas de e-movilidad</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>Categoría</span>
                <select
                  value={catSel}
                  onChange={(e) => { setCatSel(e.target.value as "ALL" | CategoriaId); setLimit(20); }}
                  style={{
                    padding: "6px 10px",
                    background: catSel === "ALL" ? "#ffffff" : `${categoriaColor(catSel)}22`,
                    color: "#0f172a",
                    fontSize: 12, fontWeight: 700,
                    border: `1px solid ${catSel === "ALL" ? C.border : `${categoriaColor(catSel)}55`}`,
                    borderRadius: 8, outline: "none", cursor: "pointer",
                    minWidth: 180,
                  }}
                >
                  <option value="ALL" style={{ color: "#0f172a", background: "#ffffff" }}>Todas (4.229)</option>
                  {licitacionesSummary.por_categoria.map((c) => (
                    <option key={c.cat} value={c.cat} style={{ color: "#0f172a", background: "#ffffff" }}>
                      {c.cat}. {c.short} ({c.n})
                    </option>
                  ))}
                </select>
              </label>
              <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>
                {licitacionesSummary.ventana.desde} → {licitacionesSummary.ventana.hasta} · {fmtN(kpis.total)} expedientes
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "20px 14px 48px" : "28px 24px 56px" }}>

        {/* ── Filtro activo ────────────────────────────────────────────────── */}
        {catSel !== "ALL" && (
          <div style={{ marginBottom: GAP, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `${categoriaColor(catSel)}0d`, border: `1px solid ${categoriaColor(catSel)}33`, borderRadius: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: categoriaColor(catSel), flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.text }}>
              Filtrado por <b style={{ color: categoriaColor(catSel) }}>{catSel}. {categoriasMeta[catSel as CategoriaId]?.label}</b>
              <span style={{ color: C.muted }}> · {fmtN(kpis.total)} expedientes</span>
            </span>
            <button
              onClick={() => setCatSel("ALL")}
              style={{ marginLeft: "auto", padding: "4px 10px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              Quitar filtro ✕
            </button>
          </div>
        )}

        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: GAP, marginBottom: GAP, flexWrap: "wrap" }}>
          <KPI label={catSel === "ALL" ? "Licitaciones e-mov" : "Licitaciones en categoría"} value={fmtN(kpis.total)} sub={catSel === "ALL" ? `${kpis.pct_universo.toFixed(2)}% del universo PLACSP` : `${kpis.pct_universo.toFixed(2)}% del universo PLACSP`} color={C.purple} icon="📋" tag={catSel === "ALL" ? "PLACSP" : `CAT ${catSel}`} />
          <KPI label="Importe base total"  value={fmtEur(kpis.importe_base)} sub="suma de importes base declarados" color={C.amber}  icon="€" />
          <KPI label="Adjudicadas"         value={`${kpis.adjudicadas_pct.toFixed(0)}%`} sub={`${fmtN(kpis.adjudicadas)} expedientes RES+ADJ`} color={C.green} icon="✓" />
          <KPI label="Abiertas ahora"      value={fmtN(kpis.abiertas)} sub="en publicación o evaluación" color={C.blue}   icon="🟢" />
          {catSel === "ALL"
            ? <KPI label="Concesiones demaniales" value={fmtN(kpis.concesiones)} sub="cat 1 · recarga en suelo público" color={C.teal} icon="🅿️" />
            : <KPI label="Adjudicatarios únicos"  value={fmtN(topAdjudicatarios.length)} sub="empresas ganadoras distintas" color={C.teal} icon="🏢" />
          }
          <KPI label="Con financiación UE" value={fmtN(kpis.con_ue)}    sub="Next Gen · DUS5000 · MOVES III · PSTD" color={C.orange} icon="🇪🇺" />
        </div>

        {/* ── Timeline anual + importe ─────────────────────────────────────── */}
        <Card style={{ marginBottom: GAP }}>
          <SectionTitle sub={catSel === "ALL"
            ? "Licitaciones publicadas por año y categoría · Línea ámbar = importe base total (M€)"
            : `Licitaciones publicadas por año en "${categoriasMeta[catSel as CategoriaId]?.short}" · Línea ámbar = importe base total (M€)`}>
            Evolución anual{catSel === "ALL" ? " por categoría" : ""}
          </SectionTitle>
          <EChart option={serieOpt} style={{ height: 340 }} />
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {CAT_IDS.map((cat) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: categoriaColor(cat) }} />
                <span style={{ fontSize: 10, color: C.muted }}>{cat}. {categoriaShort(cat)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Donut categorías + estados ──────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: cols2, gap: GAP, marginBottom: GAP }}>
          <Card>
            <SectionTitle sub={catSel === "ALL"
              ? `Distribución de los ${fmtN(licitacionesSummary.total_emov)} expedientes por categoría taxonómica v3`
              : `Distribución global · categoría activa resaltada`}>
              Mix por categoría
            </SectionTitle>
            <EChart option={catDonutOpt} style={{ height: 260 }} />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 6, marginTop: 12 }}>
              {licitacionesSummary.por_categoria.map((c) => (
                <div key={c.cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.muted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.cat}. {c.short}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.color, fontVariantNumeric: "tabular-nums" }}>{fmtN(c.n)}</span>
                  <span style={{ fontSize: 10, color: C.dim, width: 36, textAlign: "right" }}>{kpis.total ? (c.n / kpis.total * 100).toFixed(1) : "0"}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Estado actual del expediente — RES/ADJ = adjudicada · PUB/EV = abierta">
              Estado de los expedientes
            </SectionTitle>
            <EChart option={estadoDonutOpt} style={{ height: 260 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {porEstado.map((e) => (
                <div key={e.estado} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ESTADO_COLOR[e.estado] ?? C.dim, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>{ESTADO_LABEL[e.estado] ?? e.estado}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ESTADO_COLOR[e.estado] ?? C.text, fontVariantNumeric: "tabular-nums" }}>{fmtN(e.n)}</span>
                  <span style={{ fontSize: 10, color: C.dim, width: 36, textAlign: "right" }}>{kpis.total ? (e.n / kpis.total * 100).toFixed(1) : "0"}%</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: C.dim, marginTop: 12 }}>
              La coverage de PLACSP es del ~98 %. Cataluña, Euskadi y Andalucía publican buena parte en portales autonómicos (roadmap fase 2).
            </p>
          </Card>
        </div>

        {/* ── Mapa España ─────────────────────────────────────────────────── */}
        <Card style={{ marginBottom: GAP }}>
          <SectionTitle sub="Licitaciones e-mov por provincia del órgano contratante · color = número de expedientes">
            Distribución geográfica
          </SectionTitle>
          {mapError ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>{mapError}</div>
          ) : !mapLoaded ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>Cargando mapa…</div>
          ) : spainMapOpt ? (
            <EChart option={spainMapOpt} style={{ height: 540 }} />
          ) : null}
        </Card>

        {/* ── Top provincias bar ──────────────────────────────────────────── */}
        <Card style={{ marginBottom: GAP }}>
          <SectionTitle sub="Top 20 provincias por número de licitaciones e-mov">
            Ranking provincial
          </SectionTitle>
          <EChart option={provTopOpt} style={{ height: 300 }} />
        </Card>

        {/* ── Ranking órganos / adjudicatarios ─────────────────────────────── */}
        <Card style={{ marginBottom: GAP }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <SectionTitle sub={rankBy === "organos"
              ? "Top 15 órganos que más licitan e-mov en PLACSP"
              : "Top 15 empresas adjudicatarias en licitaciones e-mov (datos hoy: solo ganadores, participantes no ganadores en fase 2 LLM)"}>
              {rankBy === "organos" ? "Órganos contratantes" : "Adjudicatarios"}
            </SectionTitle>
            <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3 }}>
              {([
                { v: "organos",         l: "Órganos" },
                { v: "adjudicatarios",  l: "Adjudicatarios" },
              ] as const).map((o) => (
                <button key={o.v} onClick={() => setRankBy(o.v)} style={{
                  padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 700,
                  background: rankBy === o.v ? "linear-gradient(135deg,#a78bfa,#38bdf8)" : "transparent",
                  color: rankBy === o.v ? "#fff" : C.muted, transition: "all 0.15s",
                }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <EChart option={rankOpt} style={{ height: 420 }} />
        </Card>

        {/* ── Browser / listado filtrable ─────────────────────────────────── */}
        <Card style={{ marginBottom: GAP }}>
          <SectionTitle sub="Filtra por categoría, estado o texto (título, órgano, adjudicatario). Click para ver detalle.">
            Explorador de licitaciones
          </SectionTitle>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setLimit(20); }}
              placeholder="Buscar por título, órgano, expediente o adjudicatario…"
              style={{
                flex: 1, minWidth: 220, padding: "8px 12px",
                background: "rgba(255,255,255,0.04)", color: C.text, fontSize: 13,
                border: `1px solid ${C.border}`, borderRadius: 8, outline: "none",
              }}
            />
            <select value={estSel} onChange={(e) => { setEstSel(e.target.value as "ALL" | "abiertas" | "RES" | "ADJ"); setLimit(20); }} style={{
              padding: "8px 12px", background: "rgba(255,255,255,0.04)", color: C.text,
              fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 8,
            }}>
              <option value="ALL">Cualquier estado</option>
              <option value="abiertas">Abiertas (PUB/EV)</option>
              <option value="ADJ">Adjudicadas</option>
              <option value="RES">Resueltas</option>
            </select>
          </div>

          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
            {fmtN(filtered.length)} resultado{filtered.length === 1 ? "" : "s"}
          </div>

          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.slice(0, limit).map((l) => <LicitacionMobileRow key={l.slug} l={l} />)}
            </div>
          ) : (
            <div style={{ display: "table", width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <div style={{ display: "table-row", color: C.dim, fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {["Cat", "Título", "Órgano", "Provincia", "Estado", "Importe", "Fecha pub."].map((h, i) => (
                  <div key={h} style={{ display: "table-cell", padding: "6px 8px", borderBottom: `1px solid ${C.border}`, textAlign: i >= 5 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</div>
                ))}
              </div>
              {filtered.slice(0, limit).map((l) => <LicitacionTableRow key={l.slug} l={l} />)}
            </div>
          )}

          {filtered.length > limit && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={() => setLimit((n) => n + 40)} style={{
                padding: "8px 20px", background: "rgba(167,139,250,0.14)", color: C.purple,
                border: `1px solid ${C.purple}33`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
                Ver más ({fmtN(filtered.length - limit)} restantes)
              </button>
            </div>
          )}
        </Card>

        {/* Footer */}
        <p style={{ fontSize: 11, color: "rgba(241,245,249,0.22)", textAlign: "center", marginTop: 8 }}>
          Fuente: Plataforma de Contratación del Sector Público (PLACSP) · contrataciondelestado.es · Clasificación: taxonomía v3 Capira (recall 98.3 % vs AEDIVE) ·
          Ventana {licitacionesSummary.ventana.desde} → {licitacionesSummary.ventana.hasta} · Generado {licitacionesSummary.generated_at.slice(0, 10)}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST ROWS
// ─────────────────────────────────────────────────────────────────────────────

function LicitacionTableRow({ l }: { l: LicitacionItem }) {
  return (
    <Link href={`/info/licitaciones/${l.slug}`} style={{ display: "table-row", color: C.text, textDecoration: "none" }}>
      <div style={{ display: "table-cell", padding: "10px 8px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" }}>
        <Pill label={`${l.categoria}. ${categoriaShort(l.categoria)}`} color={categoriaColor(l.categoria)} />
      </div>
      <div style={{ display: "table-cell", padding: "10px 8px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle", maxWidth: 420 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.titulo}</div>
        {l.expediente && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Exp. {l.expediente}</div>}
      </div>
      <div style={{ display: "table-cell", padding: "10px 8px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle", maxWidth: 260, fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {l.organo ?? "—"}
      </div>
      <div style={{ display: "table-cell", padding: "10px 8px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle", fontSize: 11, color: C.muted }}>
        {l.provincia ?? "—"}
      </div>
      <div style={{ display: "table-cell", padding: "10px 8px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" }}>
        {l.estado ? <Pill label={ESTADO_LABEL[l.estado] ?? l.estado} color={ESTADO_COLOR[l.estado] ?? C.dim} /> : <span style={{ color: C.dim }}>—</span>}
      </div>
      <div style={{ display: "table-cell", padding: "10px 8px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle", textAlign: "right", fontSize: 11, fontVariantNumeric: "tabular-nums", color: C.text }}>
        {fmtEur(l.importe_base)}
      </div>
      <div style={{ display: "table-cell", padding: "10px 8px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle", textAlign: "right", fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>
        {l.fecha_publicacion ?? "—"}
      </div>
    </Link>
  );
}

function LicitacionMobileRow({ l }: { l: LicitacionItem }) {
  return (
    <Link href={`/info/licitaciones/${l.slug}`} style={{ display: "block", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, textDecoration: "none" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
        <Pill label={`${l.categoria}. ${categoriaShort(l.categoria)}`} color={categoriaColor(l.categoria)} />
        {l.estado && <Pill label={ESTADO_LABEL[l.estado] ?? l.estado} color={ESTADO_COLOR[l.estado] ?? C.dim} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{l.titulo}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{l.organo ?? "—"}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 11, color: C.dim }}>{l.provincia ?? "—"} · {l.fecha_publicacion ?? "—"}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{fmtEur(l.importe_base)}</span>
      </div>
    </Link>
  );
}

// Avoid duplicate of C namespace inside row components:
// (they reference the outer C because both are declared in the same module)
