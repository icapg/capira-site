"use client";

import { useEffect, useMemo, useState } from "react";
import { useInsights } from "../InsightsContext";
import { useIsMobile } from "../../lib/useIsMobile";
import { MarcaSelector } from "./components/MarcaSelector";
import { StickyToc, type TocItem } from "./components/StickyToc";
import { PocosDatosBanner } from "./components/PocosDatosBanner";
import { HeroKpis } from "./sections/HeroKpis";
import { AdnMarca } from "./sections/AdnMarca";
import { Geografia } from "./sections/Geografia";
import { Evolucion } from "./sections/Evolucion";
import { Sociologia } from "./sections/Sociologia";
import { Parque } from "./sections/Parque";
import { useMarcaData } from "./useMarcaData";
import indexJson from "../../../data/dgt-marca-perfil-index.json";
import mercadoJson from "../../../data/dgt-marca-perfil-mercado.json";
import type { MarcaIndex, MercadoAgregados } from "./types";

const C = {
  bg:     "#050810",
  text:   "#f1f5f9",
  muted:  "rgba(241,245,249,0.42)",
  border: "rgba(255,255,255,0.11)",
};

const TOC_ITEMS: TocItem[] = [
  { id: "resumen",     label: "1 · Resumen" },
  { id: "adn",         label: "2 · Qué vende" },
  { id: "geografia",   label: "3 · Dónde manda" },
  { id: "evolucion",   label: "4 · Película" },
  { id: "sociologia",  label: "5 · Quién compra" },
  { id: "parque",      label: "6 · Flota activa" },
];

const IDX = indexJson as unknown as MarcaIndex;
const MERCADO = mercadoJson as unknown as MercadoAgregados;

function defaultSlugFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("m");
}

export function Dashboard() {
  const { countryName } = useInsights();
  const isMobile = useIsMobile();

  // SSR-safe: en cliente arranca desde URL, en servidor queda null y se re-hidrata.
  const [slug, setSlug] = useState<string | null>(defaultSlugFromUrl);

  useEffect(() => {
    const onPop = () => setSlug(defaultSlugFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const onSelect = (s: string) => {
    setSlug(s);
    const url = new URL(window.location.href);
    url.searchParams.set("m", s);
    window.history.pushState({}, "", url);
  };

  const { data: perfil, loading, error } = useMarcaData(slug);

  const marcasIndex = useMemo(() => IDX.marcas, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header con título + selector sticky */}
      <div
        style={{
          position: "sticky",
          top: 52,
          zIndex: 40,
          background: "rgba(5,8,16,0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: isMobile ? "12px 14px" : "14px 24px",
            display: "flex",
            alignItems: isMobile ? "stretch" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
              {perfil ? `${perfil.marca}` : "Marca · Perfil"}
              <span style={{ color: C.muted, fontWeight: 500, marginLeft: 8, fontSize: isMobile ? 11 : 13 }}>
                · {countryName}
              </span>
            </h1>
            <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>
              {perfil ? `${IDX.meta.total_marcas_visibles} marcas · datos a ${perfil.ultimo_periodo}` : `${IDX.meta.total_marcas_visibles} marcas disponibles`}
            </p>
          </div>
          <MarcaSelector marcas={marcasIndex} slugActivo={slug} onSelect={onSelect} />
        </div>
      </div>

      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: isMobile ? "16px 14px 48px" : "24px 24px 56px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "180px 1fr",
          gap: isMobile ? 12 : 28,
          alignItems: "start",
        }}
      >
        {/* ToC — desktop sticky lateral, mobile oculto en v1 */}
        {!isMobile && perfil && (
          <div style={{ minWidth: 0 }}>
            <StickyToc items={TOC_ITEMS} />
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          {!slug && <PickerHero marcas={marcasIndex} onSelect={onSelect} />}

          {slug && loading && <LoadingState />}
          {slug && error && <ErrorState msg={error} />}

          {perfil && (
            <>
              {perfil.pocos_datos && (
                <PocosDatosBanner marca={perfil.marca} totalHist={perfil.total_hist} />
              )}
              <HeroKpis perfil={perfil} />
              <AdnMarca perfil={perfil} />
              <Geografia perfil={perfil} />
              <Evolucion perfil={perfil} mercado={MERCADO} />
              <Sociologia perfil={perfil} />
              <Parque perfil={perfil} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(241,245,249,0.5)", fontSize: 13 }}>
      Cargando perfil…
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "#f87171", fontSize: 13 }}>
      ⚠ No se pudo cargar el perfil: {msg}
    </div>
  );
}

function PickerHero({ marcas, onSelect }: { marcas: MarcaIndex["marcas"]; onSelect: (s: string) => void }) {
  const destacadas = marcas.filter((m) => m.destacada).sort((a, b) => b.parque_activo - a.parque_activo).slice(0, 12);
  return (
    <div
      style={{
        padding: "28px 0 8px",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
        Elegí una marca para explorarla
      </h2>
      <p style={{ fontSize: 13, color: "rgba(241,245,249,0.55)", margin: "0 auto 24px", maxWidth: 520 }}>
        Perfil completo: parque activo, matriculaciones, mix tecnológico, geografía, sociología del cliente y envejecimiento de la flota. Todo por marca, con cifras DGT.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 720, margin: "0 auto" }}>
        {destacadas.map((m) => (
          <button
            key={m.slug}
            onClick={() => onSelect(m.slug)}
            style={{
              padding: "8px 14px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#f1f5f9",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {m.marca}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "rgba(241,245,249,0.35)", marginTop: 18 }}>
        O usá el buscador arriba para encontrar cualquiera de las {marcas.length} marcas.
      </p>
    </div>
  );
}
