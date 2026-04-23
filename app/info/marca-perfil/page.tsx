import type { Metadata } from "next";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Marca · Perfil completo en España | Capira",
  description:
    "Perfil de cada marca de vehículos en España: parque activo, matriculaciones, mix tecnológico, geografía, sociología del cliente y envejecimiento. Datos DGT.",
  alternates: { canonical: "/info/marca-perfil" },
};

export default function MarcaPerfilPage() {
  return <Dashboard />;
}
