import type { Metadata } from "next";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Marca — Perfil tecnológico (BEV vs PHEV) | Capira",
  description:
    "Mix tecnológico por fabricante: % BEV vs PHEV de cada marca en España. Fuente: DGT.",
  alternates: { canonical: "/info/marca-perfil" },
};

export default function MarcaPerfilPage() {
  return <Dashboard />;
}
