import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elegir cargador",
  description:
    "Herramienta para elegir cargador de coche eléctrico según tipo de vehículo, uso semanal, instalación y energía solar.",
  keywords: [
    "elegir cargador coche eléctrico",
    "recomendador de wallbox",
    "cargador 7.4 o 11 kW",
    "cargador con solar",
  ],
  alternates: {
    canonical: "/recursos/elegir-cargador",
  },
};

export default function ElegirCargadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
