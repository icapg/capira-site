"use client";

import { useEffect, useRef } from "react";
import type { UbicacionConcesion } from "@/app/lib/insights/licitaciones-data";
import "leaflet/dist/leaflet.css";

const C = {
  bg:     "#050810",
  card:   "rgba(255,255,255,0.04)",
  cardSolid: "#0a0f1a",
  border: "rgba(255,255,255,0.10)",
  green:  "#34d399",
  blue:   "#38bdf8",
  purple: "#a78bfa",
  amber:  "#fbbf24",
  red:    "#f87171",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.72)",
};

function colorPorTipoHw(tipo?: string) {
  if (!tipo) return C.muted;
  const t = tipo.toLowerCase();
  if (t === "ac")    return C.purple;
  if (t === "dc")    return C.blue;
  if (t === "hpc")   return C.amber;
  if (t === "mixto") return C.green;
  return C.muted;
}

function popupHtml(u: UbicacionConcesion, idx: number) {
  const lineas: string[] = [];
  if (u.direccion || u.municipio) {
    lineas.push(`<div style="color:${C.muted};font-size:11px;margin-bottom:4px">${[u.direccion, u.municipio].filter(Boolean).join(" · ")}</div>`);
  }
  const chips: string[] = [];
  if (u.tipo_hw)             chips.push(`<span style="background:${colorPorTipoHw(u.tipo_hw)}33;color:${colorPorTipoHw(u.tipo_hw)};padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700">${u.tipo_hw.toUpperCase()}</span>`);
  if (u.es_existente)        chips.push(`<span style="background:${C.amber}22;color:${C.amber};padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700">EXISTENTE</span>`);
  if (u.es_opcional)         chips.push(`<span style="background:${C.amber}22;color:${C.amber};padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700">OPCIONAL</span>`);
  if (chips.length) lineas.push(`<div style="display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap">${chips.join("")}</div>`);

  const stats: string[] = [];
  if (u.cargadores_total != null) stats.push(`<span>🔌 <b style="color:${C.text}">${u.cargadores_total}</b></span>`);
  if (u.cargadores_ac != null)    stats.push(`<span style="color:${C.purple}">AC <b>${u.cargadores_ac}</b></span>`);
  if (u.cargadores_dc != null)    stats.push(`<span style="color:${C.blue}">DC <b>${u.cargadores_dc}</b></span>`);
  if (u.cargadores_dc_plus != null) stats.push(`<span style="color:${C.green}">DC+ <b>${u.cargadores_dc_plus}</b></span>`);
  if (u.cargadores_hpc != null)   stats.push(`<span style="color:${C.amber}">HPC <b>${u.cargadores_hpc}</b></span>`);
  if (u.potencia_total_kw != null) stats.push(`<span>⚡ <b style="color:${C.text}">${u.potencia_total_kw} kW</b></span>`);
  if (u.potencia_ac_kw != null)    stats.push(`<span style="color:${C.purple}">⚡AC <b>${u.potencia_ac_kw} kW</b></span>`);
  if (u.potencia_dc_kw != null)    stats.push(`<span style="color:${C.blue}">⚡DC <b>${u.potencia_dc_kw} kW</b></span>`);
  if (u.potencia_hpc_kw != null)   stats.push(`<span style="color:${C.amber}">⚡HPC <b>${u.potencia_hpc_kw} kW</b></span>`);
  if (stats.length) lineas.push(`<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:11px;color:${C.muted};margin-bottom:6px">${stats.join("")}</div>`);

  if (u.notas) {
    lineas.push(`<div style="font-size:11px;color:${C.muted};font-style:italic;margin-top:4px;padding-top:6px;border-top:1px solid ${C.border}">💬 ${escapeHtml(u.notas).slice(0, 320)}</div>`);
  }

  const links: string[] = [];
  if (u.google_maps_url) links.push(`<a href="${u.google_maps_url}" target="_blank" rel="noopener" style="font-size:10px;color:${C.blue};font-weight:700;text-decoration:none">Maps ↗</a>`);
  if (u.plano_url)       links.push(`<a href="${u.plano_url}" target="_blank" rel="noopener" style="font-size:10px;color:${C.purple};font-weight:700;text-decoration:none">📐 ${u.plano_label ?? "Plano"} ↗</a>`);
  if (links.length) lineas.push(`<div style="display:flex;gap:10px;margin-top:8px">${links.join("")}</div>`);

  return `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:${C.text};min-width:240px;max-width:320px">
      <div style="font-size:13px;font-weight:700;color:${C.text};margin-bottom:6px">📍 ${escapeHtml(u.nombre ?? `Ubicación ${idx + 1}`)}</div>
      ${lineas.join("")}
    </div>
  `;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function UbicacionesMapa({ ubicaciones }: { ubicaciones: UbicacionConcesion[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    let isMounted = true;
    const conCoord = ubicaciones.filter((u) => u.latitud != null && u.longitud != null);
    if (conCoord.length === 0 || !containerRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted || !containerRef.current) return;
      // Limpiar instancia previa si existe
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as L.Map).remove();
        mapInstanceRef.current = null;
      }

      // Bounds para encuadrar todos los puntos; si todos están en una ciudad,
      // zoom razonable. Si abarcan España, fitBounds se encarga.
      const lats = conCoord.map((u) => u.latitud!);
      const lons = conCoord.map((u) => u.longitud!);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons), maxLon = Math.max(...lons);
      const centro: [number, number] = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];

      const map = L.map(containerRef.current, {
        center: centro,
        zoom: 13,
        scrollWheelZoom: false, // evita capturar el scroll de la página
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Tile OSM color estándar
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Markers
      for (const u of conCoord) {
        const idx = ubicaciones.indexOf(u);
        const color = colorPorTipoHw(u.tipo_hw);
        const isExist = u.es_existente === true;
        const icon = L.divIcon({
          className: "capira-marker",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid ${isExist ? C.amber : "#fff"};box-shadow:0 2px 8px rgba(0,0,0,0.6);${isExist ? "" : ""}"></div>`,
        });
        const marker = L.marker([u.latitud!, u.longitud!], { icon }).addTo(map);
        marker.bindPopup(popupHtml(u, idx), { maxWidth: 360, className: "capira-popup" });
      }

      // Encuadrar todos los puntos
      if (conCoord.length > 1) {
        const bounds = L.latLngBounds(conCoord.map((u) => [u.latitud!, u.longitud!] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      // Ajuste de tamaño tras render
      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try { (mapInstanceRef.current as L.Map).remove(); } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [ubicaciones]);

  const conCoord = ubicaciones.filter((u) => u.latitud != null && u.longitud != null);
  const sinCoord = ubicaciones.length - conCoord.length;

  if (conCoord.length === 0) {
    return (
      <div style={{ padding: "20px 24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12, color: C.muted, textAlign: "center" }}>
        Ninguna ubicación tiene coordenadas (latitud/longitud) extraídas. El mapa no puede renderizarse.
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: C.muted }}>
          🗺 {conCoord.length} {conCoord.length === 1 ? "ubicación geolocalizada" : "ubicaciones geolocalizadas"}
          {sinCoord > 0 && <span style={{ color: C.amber, marginLeft: 8 }}>· {sinCoord} sin coordenadas</span>}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.muted, flexWrap: "wrap" }}>
          <Legend color={C.purple} label="AC" />
          <Legend color={C.blue}   label="DC" />
          <Legend color={C.amber}  label="HPC" />
          <Legend color={C.green}  label="Mixto" />
          <Legend color={C.muted}  label="Sin tipo" />
          <span style={{ marginLeft: 8 }}>· Borde ámbar = existente</span>
        </div>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: 460, background: C.bg }} />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", border: "1.5px solid rgba(255,255,255,0.5)" }} />
      {label}
    </span>
  );
}
