import { ImageResponse } from "next/og";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { MarcaPerfil } from "../../../../info/marca-perfil/types";

export const runtime = "nodejs";

function fmt(n: number): string {
  return n.toLocaleString("es-ES");
}
function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return fmt(n);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("m");
  if (!slug) return new Response("missing ?m=<slug>", { status: 400 });

  const safe = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const jsonPath = join(process.cwd(), "public", "data", "marca-perfil", `${safe}.json`);
  if (!existsSync(jsonPath)) return new Response("marca no encontrada", { status: 404 });

  let perfil: MarcaPerfil;
  try {
    perfil = JSON.parse(readFileSync(jsonPath, "utf8")) as MarcaPerfil;
  } catch {
    return new Response("error leyendo marca", { status: 500 });
  }

  const topModelos = perfil.top_modelos_parque.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #050810 0%, #0b1020 100%)",
          color: "#f1f5f9",
          padding: "56px 64px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 34, background: "linear-gradient(180deg, #38bdf8, #8b5cf6)", borderRadius: 2 }} />
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#f1f5f9" }}>Capira · Marca Perfil</div>
          </div>
          <div style={{ fontSize: 16, color: "rgba(241,245,249,0.5)", fontWeight: 600 }}>
            {perfil.ultimo_periodo} · DGT
          </div>
        </div>

        <div style={{ marginTop: 36, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, color: "rgba(241,245,249,0.55)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Marca
          </div>
          <div style={{ fontSize: 100, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: "#f1f5f9" }}>
            {perfil.marca}
          </div>
        </div>

        <div style={{ marginTop: 40, display: "flex", gap: 20 }}>
          <Kpi label="Parque activo" value={fmtCompact(perfil.stats.parque_activo)} color="#38bdf8" />
          <Kpi label="Matric. YTD"   value={fmtCompact(perfil.stats.matric_ytd)}    color="#34d399" />
          <Kpi label="Cuota mercado" value={`${perfil.stats.cuota_mercado_ytd_pct.toFixed(2)}%`} color="#a78bfa" />
          <Kpi label="% enchufables" value={`${perfil.stats.cuota_bevphev_ytd_pct.toFixed(1)}%`} color="#fb923c" />
        </div>

        {topModelos.length > 0 && (
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 14, color: "rgba(241,245,249,0.5)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Modelos estrella
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {topModelos.map((m, i) => (
                <div
                  key={m.modelo}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(241,245,249,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    #{i + 1}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{m.modelo}</div>
                  <div style={{ fontSize: 12, color: "rgba(241,245,249,0.6)", fontWeight: 600 }}>
                    {fmtCompact(m.total)} veh.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ position: "absolute", bottom: 28, left: 64, right: 64, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "rgba(241,245,249,0.4)" }}>
          <div>Ranking nacional #{perfil.stats.ranking_ytd ?? "—"} · Edad media {perfil.stats.edad_media_parque.toFixed(1)} años</div>
          <div style={{ fontWeight: 700 }}>capira.es/info/marca-perfil?m={safe}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: "20px 24px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        flexDirection: "column",
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(241,245,249,0.5)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 40, fontWeight: 900, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
