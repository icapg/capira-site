import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contactá a CAPIRA: contanos tu operación, contexto y objetivos, y te devolvemos un plan inicial.",
  keywords: [
    "contacto capira",
    "asesoría movilidad eléctrica",
    "proyecto de infraestructura de carga",
  ],
  alternates: {
    canonical: "/contacto",
  },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
