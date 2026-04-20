import type { Metadata } from "next";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Parque Activo EV España — eMobility Insights",
  description:
    "Evolución del parque activo de vehículos electrificados en España: BEV, PHEV e híbridos. Datos DGT (microdatos MATRABA).",
  alternates: { canonical: "/info/parque" },
};

export default function ParquePage() {
  return <Dashboard />;
}
