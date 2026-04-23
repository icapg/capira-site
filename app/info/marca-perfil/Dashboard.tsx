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

function slugsFromUrl(): { m: string | null; vs: string | null } {
  if (typeof window === "undefined") return { m: null, vs: null };
  const params = new URLSearchParams(window.location.search);
  return { m: params.get("m"), vs: params.get("vs") };
}

function pushUrl(m: string | null, vs: string | null) {
  const url = new URL(window.location.href);
  if (m) url.searchParams.set("m", m); else url.searchParams.delete("m");
  if (vs) url.searchParams.set("vs", vs); else url.searchParams.delete("vs");
  window.history.pushState({}, "", url);
}

export function Dashboard() {
  const { countryName } = useInsights();
  const isMobile = useIsMobile();

  const [slug, setSlug]     = useState<string | null>(() => slugsFromUrl().m);
  const [slugB, setSlugB]   = useState<string | null>(() => slugsFromUrl().vs);

  useEffect(() => {
    const onPop = () => {
      const s = slugsFromUrl();
      setSlug(s.m);
      setSlugB(s.vs);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const selectA = (s: string) => {
    // Si elegís A igual a B, limpio B (no compara consigo mismo)
    const nextB = s === slugB ? null : slugB;
    setSlug(s);
    setSlugB(nextB);
    pushUrl(s, nextB);
  };
  const selectB = (s: string | null) => {
    const nextB = s === slug ? null : s;
    setSlugB(nextB);
    pushUrl(slug, nextB);
  };

  const { data: perfil,  loading: lA, error: errA } = useMarcaData(slug);
  const { data: perfilB, loading: lB, error: errB } = useMarcaData(slugB);

  const marcasIndex = useMemo(() => IDX.marcas, []);

  const comparando = !!perfilB;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
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
              {perfil ? perfil.marca : "Marca · Perfil"}
              {perfilB && (
                <>
                  <span style={{ color: C.muted, fontWeight: 500, margin: "0 6px" }}>vs</span>
                  <span style={{ color: "#fb923c" }}>{perfilB.marca}</span>
                </>
              )}
              <span style={{ color: C.muted, fontWeight: 500, marginLeft: 8, fontSize: isMobile ? 11 : 13 }}>
                · {countryName}
              </span>
            </h1>
            <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>
              {perfil ? `${IDX.meta.total_marcas_visibles} marcas · datos a ${perfil.ultimo_periodo}` : `${IDX.meta.total_marcas_visibles} marcas disponibles`}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: isMobile ? "stretch" : "flex-end" }}>
            <MarcaSelector marcas={marcasIndex} slugActivo={slug} onSelect={selectA} />
            {slug && (
              comparando ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: isMobile ? "100%" : 360, flex: isMobile ? "1 0 100%" : undefined }}>
                  <MarcaSelector marcas={marcasIndex} slugActivo={slugB} onSelect={selectB} />
                  <button
                    onClick={() => selectB(null)}
                    aria-label="Quitar comparación"
                    title="Quitar comparación"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "rgba(251,146,60,0.15)",
                      border: "1px solid rgba(251,146,60,0.4)",
                      color: "#fb923c",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Abrir el selector B con una marca default distinta (la #2 del ranking)
                    const defaultB = marcasIndex.find((m) => m.destacada && m.slug !== slug)?.slug ?? null;
                    if (defaultB) selectB(defaultB);
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(251,146,60,0.08)",
                    border: "1px dashed rgba(251,146,60,0.4)",
                    color: "#fb923c",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  + Comparar con…
                </button>
              )
            )}
          </div>
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
        {!isMobile && perfil && (
          <div style={{ minWidth: 0 }}>
            <StickyToc items={TOC_ITEMS} />
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          {!slug && <PickerHero marcas={marcasIndex} onSelect={selectA} />}

          {slug && lA && <LoadingState />}
          {slug && errA && <ErrorState msg={errA} />}

          {perfil && (
            <>
              {perfil.pocos_datos && (
                <PocosDatosBanner marca={perfil.marca} totalHist={perfil.total_hist} />
              )}
              {perfilB?.pocos_datos && (
                <PocosDatosBanner marca={perfilB.marca} totalHist={perfilB.total_hist} />
              )}
              {slugB && lB && (
                <div style={{ padding: "8px 12px", color: "rgba(251,146,60,0.7)", fontSize: 12, textAlign: "center" }}>
                  Cargando {slugB}…
                </div>
              )}
              {slugB && errB && (
                <div style={{ padding: "8px 12px", color: "#f87171", fontSize: 12, textAlign: "center" }}>
                  Error cargando {slugB}: {errB}
                </div>
              )}

              <HeroKpis perfil={perfil} perfilB={perfilB ?? undefined} mercado={MERCADO} />
              <AdnMarca perfil={perfil} perfilB={perfilB ?? undefined} />
              <Geografia perfil={perfil} />
              <Evolucion perfil={perfil} perfilB={perfilB ?? undefined} mercado={MERCADO} />
              <Sociologia perfil={perfil} />
              <Parque perfil={perfil} perfilB={perfilB ?? undefined} />
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
    <div style={{ padding: "28px 0 8px", textAlign: "center" }}>
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
