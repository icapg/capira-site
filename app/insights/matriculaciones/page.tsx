import type { Metadata } from "next";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Mercado EV Global — Matriculaciones e Infraestructura",
  description:
    "Dashboard global de vehículos eléctricos: matriculaciones por mercado, infraestructura de carga y análisis cruzado. Fuentes: IEA, JATO, AEDIVE.",
  alternates: { canonical: "/insights/matriculaciones" },
};

export default function MatriculacionesPage() {
  return <Dashboard />;
}
