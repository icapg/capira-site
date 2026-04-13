import { notFound } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DgtStatus = {
  generado_en: string;
  mes_objetivo: string;
  matriculaciones: { ultimo_mes: string; al_dia: boolean; total_registros: number; total_meses: number };
  bajas:           { ultimo_mes: string; al_dia: boolean; total_registros: number; total_meses: number };
  historial: { periodo: string; matriculaciones: number; bajas: number }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("es-ES");
}

function mesLabel(periodo: string) {
  const [y, m] = periodo.split("-");
  const nombres = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${nombres[parseInt(m) - 1]} ${y}`;
}

function diffDias(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const dias = Math.floor(diff / 86_400_000);
  if (dias === 0) return "hoy";
  if (dias === 1) return "hace 1 día";
  return `hace ${dias} días`;
}

// ─── Estilos constantes ───────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "20px 24px",
};

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(244,244,245,0.4)",
  marginBottom: 6,
};

const value: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "#f4f4f5",
  lineHeight: 1.1,
};

const badge = (ok: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12,
  fontWeight: 600,
  padding: "3px 10px",
  borderRadius: 20,
  background: ok ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)",
  color: ok ? "#4ade80" : "#fbbf24",
  border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "rgba(251,191,36,0.3)"}`,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DgtStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken || token !== adminToken) {
    notFound();
  }

  // Leer status.json (generado localmente y commiteado al repo)
  let status: DgtStatus;
  try {
    const raw = readFileSync(join(process.cwd(), "data", "dgt-status.json"), "utf8");
    status = JSON.parse(raw);
  } catch {
    return (
      <div style={{ padding: 40, color: "#f87171" }}>
        ❌ No se encontró data/dgt-status.json. Ejecutá:{" "}
        <code>node scripts/dgt-update.mjs</code>
      </div>
    );
  }

  const { matriculaciones: mat, bajas, historial, generado_en, mes_objetivo } = status;
  const ambosAlDia = mat.al_dia && bajas.al_dia;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f4f4f5", margin: 0 }}>
            DGT — Status de datos
          </h1>
          <span style={badge(ambosAlDia)}>
            {ambosAlDia ? "✓ Al día" : "⚠ Pendiente"}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "rgba(244,244,245,0.4)", margin: 0 }}>
          Última revisión: {diffDias(generado_en)} ({new Date(generado_en).toLocaleString("es-ES")})
          &nbsp;·&nbsp;
          Mes objetivo DGT: <strong style={{ color: "rgba(244,244,245,0.7)" }}>{mesLabel(mes_objetivo)}</strong>
        </p>
      </div>

      {/* Alerta si hay datos pendientes */}
      {!ambosAlDia && (
        <div style={{
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.25)",
          borderRadius: 10,
          padding: "14px 18px",
          marginBottom: 28,
          fontSize: 13,
          color: "#fbbf24",
        }}>
          <strong>Datos pendientes para {mesLabel(mes_objetivo)}.</strong>{" "}
          DGT publica alrededor del día 15. Ejecutar manualmente:{" "}
          <code style={{ fontFamily: "monospace", fontSize: 12, background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>
            node scripts/dgt-update.mjs
          </code>
        </div>
      )}

      {/* Cards principales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>

        <div style={card}>
          <div style={label}>Matriculaciones</div>
          <div style={value}>{fmt(mat.total_registros)}</div>
          <div style={{ fontSize: 12, color: "rgba(244,244,245,0.4)", marginTop: 4 }}>
            {mat.total_meses} meses · último: {mesLabel(mat.ultimo_mes)}
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={badge(mat.al_dia)}>{mat.al_dia ? "Al día" : `Falta ${mes_objetivo}`}</span>
          </div>
        </div>

        <div style={card}>
          <div style={label}>Bajas</div>
          <div style={value}>{fmt(bajas.total_registros)}</div>
          <div style={{ fontSize: 12, color: "rgba(244,244,245,0.4)", marginTop: 4 }}>
            {bajas.total_meses} meses · último: {mesLabel(bajas.ultimo_mes)}
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={badge(bajas.al_dia)}>{bajas.al_dia ? "Al día" : `Falta ${mes_objetivo}`}</span>
          </div>
        </div>

        <div style={card}>
          <div style={label}>Total registros</div>
          <div style={value}>{fmt(mat.total_registros + bajas.total_registros)}</div>
          <div style={{ fontSize: 12, color: "rgba(244,244,245,0.4)", marginTop: 4 }}>
            matr. + bajas combinadas
          </div>
        </div>

        <div style={card}>
          <div style={label}>Cobertura</div>
          <div style={value}>{mat.total_meses}</div>
          <div style={{ fontSize: 12, color: "rgba(244,244,245,0.4)", marginTop: 4 }}>
            meses desde dic 2014
          </div>
        </div>

      </div>

      {/* Historial tabla */}
      <div style={card}>
        <div style={{ marginBottom: 16, fontSize: 13, fontWeight: 600, color: "rgba(244,244,245,0.7)" }}>
          Últimos {historial.length} meses
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ textAlign: "left", padding: "6px 12px", color: "rgba(244,244,245,0.4)", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Mes
                </th>
                <th style={{ textAlign: "right", padding: "6px 12px", color: "rgba(244,244,245,0.4)", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Matriculaciones
                </th>
                <th style={{ textAlign: "right", padding: "6px 12px", color: "rgba(244,244,245,0.4)", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Bajas
                </th>
                <th style={{ textAlign: "right", padding: "6px 12px", color: "rgba(244,244,245,0.4)", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {historial.map((row, i) => {
                const balance = row.matriculaciones - row.bajas;
                const isPendiente = row.periodo === mes_objetivo && (!mat.al_dia || !bajas.al_dia);
                return (
                  <tr
                    key={row.periodo}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: isPendiente ? "rgba(251,191,36,0.05)" : i === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "9px 12px", color: i === 0 ? "#f4f4f5" : "rgba(244,244,245,0.7)", fontWeight: i === 0 ? 600 : 400 }}>
                      {mesLabel(row.periodo)}
                      {isPendiente && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: "#fbbf24" }}>⏳ pendiente</span>
                      )}
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}>
                      {row.matriculaciones > 0 ? fmt(row.matriculaciones) : <span style={{ color: "rgba(244,244,245,0.2)" }}>—</span>}
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: "#f87171", fontVariantNumeric: "tabular-nums" }}>
                      {row.bajas > 0 ? fmt(row.bajas) : <span style={{ color: "rgba(244,244,245,0.2)" }}>—</span>}
                    </td>
                    <td style={{
                      padding: "9px 12px",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      color: balance >= 0 ? "#4ade80" : "#f87171",
                    }}>
                      {row.matriculaciones > 0 && row.bajas > 0
                        ? (balance >= 0 ? "+" : "") + fmt(balance)
                        : <span style={{ color: "rgba(244,244,245,0.2)" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comandos útiles */}
      <div style={{ ...card, marginTop: 24 }}>
        <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 600, color: "rgba(244,244,245,0.7)" }}>
          Comandos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { cmd: "node scripts/dgt-update.mjs", desc: "Actualización mensual automática (descarga + commit + push)" },
            { cmd: "node scripts/dgt-update.mjs --no-push", desc: "Actualizar sin push" },
            { cmd: "node scripts/dgt-matriculaciones.mjs --mes=YYYY-MM", desc: "Descargar un mes específico de matriculaciones" },
            { cmd: "node scripts/dgt-bajas.mjs --mes=YYYY-MM", desc: "Descargar un mes específico de bajas" },
            { cmd: "node scripts/dgt-fix-tipos.mjs", desc: "Reclasificar tipos de vehículo desconocidos" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <code style={{
                fontFamily: "monospace",
                fontSize: 12,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "3px 8px",
                borderRadius: 5,
                color: "#a5f3fc",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                {cmd}
              </code>
              <span style={{ fontSize: 12, color: "rgba(244,244,245,0.35)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task Scheduler info */}
      <div style={{ marginTop: 20, fontSize: 12, color: "rgba(244,244,245,0.25)", textAlign: "center" }}>
        Tarea programada: día 16 de cada mes a las 09:00 ·{" "}
        <code style={{ fontFamily: "monospace" }}>DGT-Update-Mensual</code> (Windows Task Scheduler)
      </div>
    </div>
  );
}
