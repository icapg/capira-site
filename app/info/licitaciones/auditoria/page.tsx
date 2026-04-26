import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { AuditoriaTable } from "./AuditoriaTable";

export const metadata: Metadata = {
  title: "Auditoría de extracción · Licitaciones | Capira",
  description: "Calidad y confiabilidad de la extracción automática de licitaciones PLACSP procesadas.",
  alternates: { canonical: "/info/licitaciones/auditoria" },
};

export default function AuditoriaPage() {
  const file = path.join(process.cwd(), "data", "licitaciones-auditoria.json");
  if (!fs.existsSync(file)) {
    return (
      <div style={{ padding: 32, color: "#f1f5f9", background: "#050810", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <h1 style={{ fontSize: 22 }}>Auditoría de extracción</h1>
        <p style={{ color: "rgba(241,245,249,0.6)" }}>
          Aún no hay datos de auditoría. Ejecutá <code>node scripts/placsp-auditoria.mjs</code> para generar
          <code> data/licitaciones-auditoria.json</code>.
        </p>
      </div>
    );
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return <AuditoriaTable data={data} />;
}
