import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { CriteriosMasterTable } from "./CriteriosMasterTable";

export const metadata: Metadata = {
  title: "Criterios maestros · Auditoría · Licitaciones | Capira",
  description: "Tabla maestra de criterios de adjudicación normalizados encontrados en todas las licitaciones procesadas.",
  alternates: { canonical: "/info/licitaciones/auditoria/criterios" },
};

export default function CriteriosMasterPage() {
  const file = path.join(process.cwd(), "data", "licitaciones-criterios-master.json");
  if (!fs.existsSync(file)) {
    return (
      <div style={{ padding: 32, color: "#f1f5f9", background: "#050810", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <h1 style={{ fontSize: 22 }}>Criterios maestros</h1>
        <p style={{ color: "rgba(241,245,249,0.6)" }}>
          Aún no hay datos. Ejecutá <code>node scripts/placsp-auditoria.mjs</code> para generar
          <code> data/licitaciones-criterios-master.json</code>.
        </p>
      </div>
    );
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return <CriteriosMasterTable data={data} />;
}
