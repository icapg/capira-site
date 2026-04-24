import type { Metadata } from "next";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Licitaciones públicas de e-movilidad en España | Capira",
  description:
    "Dashboard de licitaciones públicas de e-movilidad publicadas en PLACSP: recarga, VE, buses eléctricos, micromovilidad y servicios asociados. 11 categorías, 4.229 expedientes clasificados.",
  alternates: { canonical: "/info/licitaciones" },
};

export default function LicitacionesPage() {
  return <Dashboard />;
}
