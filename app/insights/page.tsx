import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "eMobility Insights by Capira",
  description:
    "Datos del mercado de movilidad eléctrica en España: matriculaciones, infraestructura de carga y tendencias.",
  alternates: { canonical: "/insights" },
};

const dashboards = [
  {
    href: "/insights/matriculaciones",
    label: "Matriculaciones",
    metric: "200K+",
    metricLabel: "VE registrados en 2024",
    description: "Evolución mensual y anual de BEV y PHEV en España. Por marca, modelo y provincia.",
    live: true,
  },
  {
    href: "/insights/parque",
    label: "Parque activo",
    metric: "600K+",
    metricLabel: "vehículos eléctricos en circulación",
    description: "Flota activa real: matriculaciones menos bajas, desglosada por tipo de vehículo.",
    live: true,
  },
  {
    href: "/insights/infraestructura",
    label: "Infraestructura",
    metric: "56K+",
    metricLabel: "puntos de recarga públicos",
    description: "Red de carga pública por provincia y CCAA, cruzada con la adopción de VE.",
    live: true,
  },
  {
    href: null,
    label: "Licitaciones",
    metric: null,
    metricLabel: null,
    description: "Concursos públicos y licitaciones de infraestructura de recarga en España.",
    live: false,
  },
];

export default function InsightsPage() {
  return (
    <div
      style={{
        height: "calc(100vh - 52px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          minHeight: 0,
        }}
      >
        {/* Left — hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 56px",
            borderRight: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#f4f4f5",
              margin: 0,
            }}
          >
            El mercado eléctrico
            <br />
            español,{" "}
            <span style={{ color: "rgba(244,244,245,0.35)" }}>en números.</span>
          </h1>

          <p
            style={{
              marginTop: 20,
              fontSize: 15,
              lineHeight: 1.65,
              color: "rgba(244,244,245,0.5)",
              maxWidth: 420,
            }}
          >
            Datos actualizados desde registros oficiales.
            Matriculaciones, flota activa, infraestructura de carga y más.
          </p>

          {/* CTA sutil */}
          <div
            style={{
              marginTop: 48,
              paddingTop: 28,
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p style={{ fontSize: 13, color: "rgba(244,244,245,0.35)", marginBottom: 10 }}>
              Los dashboards públicos son una muestra.
            </p>
            <Link
              href="/contacto"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(244,244,245,0.65)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderBottom: "1px solid rgba(244,244,245,0.2)",
                paddingBottom: 1,
                transition: "color 0.15s",
              }}
            >
              Armamos análisis a medida para tu negocio →
            </Link>
          </div>
        </div>

        {/* Right — dashboard grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          {dashboards.map((d, i) => {
            const isLast = i === dashboards.length - 1;
            const inner = (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "28px 28px 24px",
                  borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  background: d.live && !d.href ? "transparent" : "transparent",
                  opacity: d.live ? 1 : 0.45,
                  transition: d.href ? "background 0.15s" : undefined,
                }}
                className={d.href ? "insights-card" : undefined}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(244,244,245,0.4)",
                      }}
                    >
                      {d.label}
                    </span>
                    {d.live ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#63d27f",
                          letterSpacing: "0.05em",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#63d27f",
                            display: "inline-block",
                          }}
                        />
                        LIVE
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "rgba(244,244,245,0.25)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        PRÓXIMO
                      </span>
                    )}
                  </div>

                  {d.metric && (
                    <div>
                      <div
                        style={{
                          fontSize: "clamp(26px, 3vw, 38px)",
                          fontWeight: 800,
                          letterSpacing: "-0.03em",
                          color: "#f4f4f5",
                          lineHeight: 1,
                        }}
                      >
                        {d.metric}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(244,244,245,0.4)",
                          marginTop: 4,
                        }}
                      >
                        {d.metricLabel}
                      </div>
                    </div>
                  )}

                  {!d.metric && (
                    <div
                      style={{
                        width: 40,
                        height: 4,
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.08)",
                        marginBottom: 8,
                      }}
                    />
                  )}
                </div>

                <div>
                  <p
                    style={{
                      fontSize: 12,
                      lineHeight: 1.55,
                      color: "rgba(244,244,245,0.4)",
                      margin: 0,
                    }}
                  >
                    {d.description}
                  </p>
                  {d.href && (
                    <div
                      style={{
                        marginTop: 14,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "rgba(244,244,245,0.5)",
                      }}
                    >
                      Ver dashboard →
                    </div>
                  )}
                </div>
              </div>
            );

            return d.href ? (
              <Link
                key={d.label}
                href={d.href}
                style={{ textDecoration: "none", display: "block", height: "100%" }}
              >
                {inner}
              </Link>
            ) : (
              <div key={d.label} style={{ height: "100%" }}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer strip */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 11, color: "rgba(244,244,245,0.25)" }}>
            Actualización mensual · día 16 de cada mes
          </span>
          <span style={{ fontSize: 11, color: "rgba(244,244,245,0.15)" }}>·</span>
          <span style={{ fontSize: 11, color: "rgba(244,244,245,0.25)" }}>
            Datos oficiales públicos
          </span>
        </div>
        <Link
          href="/"
          style={{
            fontSize: 11,
            color: "rgba(244,244,245,0.2)",
            textDecoration: "none",
          }}
        >
          capirapower.com
        </Link>
      </div>

      <style>{`
        .insights-card:hover {
          background: rgba(255,255,255,0.03) !important;
        }
      `}</style>
    </div>
  );
}
