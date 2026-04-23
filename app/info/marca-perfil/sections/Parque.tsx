"use client";

import { Card } from "../../_components/Card";
import { SectionTitle } from "../../_components/SectionTitle";
import { useIsMobile } from "../../../lib/useIsMobile";
import { ChartPiramideEdad } from "./parque/ChartPiramideEdad";
import { ChartDistintivo } from "./parque/ChartDistintivo";
import type { MarcaPerfil } from "../types";

type Props = { perfil: MarcaPerfil; perfilB?: MarcaPerfil };

function fmt(n: number): string {
  return n.toLocaleString("es-ES", { useGrouping: "always" });
}

/**
 * Sección "Flota activa" — foto del parque actual:
 *   - Pirámide de edad por tecnología.
 *   - Mix de distintivos ambientales DGT.
 *   - Mini-KPIs: edad media, ratio de renovación (bajas/matric YTD), % CERO/ECO.
 */
export function Parque({ perfil, perfilB }: Props) {
  const isMobile = useIsMobile();
  const { stats, distintivo_ambiental } = perfil;

  const totalDist = Object.values(distintivo_ambiental).reduce((s, n) => s + n, 0);
  const pctCero = totalDist > 0 ? (distintivo_ambiental.CERO / totalDist) * 100 : 0;
  const pctEco  = totalDist > 0 ? (distintivo_ambiental.ECO  / totalDist) * 100 : 0;
  const pctSin  = totalDist > 0 ? (distintivo_ambiental.SIN  / totalDist) * 100 : 0;

  return (
    <section id="parque" style={{ scrollMarginTop: 140, marginTop: 28 }}>
      <SectionTitle
        sub="Composición y antigüedad del parque activo · restricciones ZBE"
        tooltip="Distribución por años desde la primera matriculación (pirámide de edad), mix de distintivos ambientales DGT (que determina acceso a las Zonas de Bajas Emisiones) y ratio de renovación aproximado (bajas / matriculaciones en YTD)."
      >
        Flota activa
      </SectionTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 14,
        }}
      >
        <Card style={{ minWidth: 0 }}>
          <SectionTitle sub="Parque activo por años desde primera matrícula · tecnología apilada">
            Pirámide de edad
          </SectionTitle>
          <ChartPiramideEdad perfil={perfil} height={isMobile ? 380 : 460} />
        </Card>

        <div style={{ display: "grid", gridTemplateRows: "auto auto", gap: 14, minWidth: 0 }}>
          <Card style={{ minWidth: 0 }}>
            <SectionTitle sub="Distribución por etiqueta DGT · clave para acceso a ZBE">
              Distintivo ambiental
            </SectionTitle>
            <ChartDistintivo
              distintivo={distintivo_ambiental}
              distintivoB={perfilB?.distintivo_ambiental}
              etiquetaA={perfil.marca}
              etiquetaB={perfilB?.marca}
              height={perfilB ? 200 : 140}
            />
          </Card>

          <Card style={{ minWidth: 0 }}>
            <SectionTitle sub="Flota activa · YTD">
              Métricas clave
            </SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 10,
                marginTop: 4,
              }}
            >
              <MiniKpi
                label="Edad media"
                value={`${stats.edad_media_parque.toFixed(1)} a`}
                color="#f472b6"
                tooltip="Edad media ponderada del parque activo por año de primera matriculación."
              />
              <MiniKpi
                label="CERO + ECO"
                value={`${(pctCero + pctEco).toFixed(1)}%`}
                color="#10b981"
                tooltip="Proporción del parque activo con etiqueta CERO (BEV/PHEV/FCEV) o ECO (HEV/GLP/GNC) — sin restricciones en la mayoría de ZBE."
              />
              <MiniKpi
                label="Sin distintivo"
                value={`${pctSin.toFixed(1)}%`}
                color={pctSin > 20 ? "#f87171" : "#94a3b8"}
                tooltip="Parque pre-2000 gasolina o pre-2006 diésel. No pueden entrar en las ZBE."
              />
              <MiniKpi
                label="Renovación YTD"
                value={`${stats.ratio_bajas_matric_ytd.toFixed(1)}%`}
                color={stats.ratio_bajas_matric_ytd > 100 ? "#f87171" : "#38bdf8"}
                tooltip="Ratio bajas/matriculaciones YTD. >100% significa que se dan de baja más vehículos que los que se matriculan — flota en declive."
              />
            </div>
            <p style={{ fontSize: 10, color: "rgba(241,245,249,0.4)", marginTop: 12, marginBottom: 0, lineHeight: 1.4 }}>
              Total parque: <b>{fmt(perfil.parque_activo)}</b> vehículos · datos a {perfil.ultimo_periodo}.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

function MiniKpi({ label, value, color, tooltip }: { label: string; value: string; color: string; tooltip?: string }) {
  return (
    <div
      title={tooltip}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: tooltip ? "help" : undefined,
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(241,245,249,0.45)", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
