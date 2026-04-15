import type { Metadata } from "next";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Mercado EV Global — Matriculaciones e Infraestructura",
  description:
    "Dashboard de matriculaciones de vehículos eléctricos en España. Fuente: DGT — Microdatos MATRABA.",
  alternates: { canonical: "/insights/matriculaciones" },
};

export default function MatriculacionesPage() {
  return <Dashboard />;
}
