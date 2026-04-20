import type { Metadata } from "next";
import { InfraDashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Infraestructura de Carga — Red Pública EV España",
  description:
    "Dashboard de infraestructura de carga eléctrica en España: evolución de la red pública, cobertura por provincia, operadores y análisis cruzado adopción vs carga.",
  alternates: { canonical: "/info/infraestructura" },
};

export default function InfraestructuraPage() {
  return <InfraDashboard />;
}
