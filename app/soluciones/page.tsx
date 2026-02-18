import type { Metadata } from "next";
import { Card } from "../components/ui/Card";

const landings = [
  {
    href: "/residencial",
    title: "Residencial",
    emoji: "🏠",
    description:
      "Diseñamos y presupuestamos soluciones de carga residencial totalmente a medida",
  },
  {
    href: "/comercios",
    title: "Comercios",
    emoji: "🏬",
    description:
      "Soluciones para generar ingresos adicionales en tu emplazamiento mediante carga",
  },
  {
    href: "/flotas",
    title: "Flotas",
    emoji: "🚐",
    description:
      "Optimización TCO (CAPEX vs OPEX), Energía-Potencia, Búsqueda de emplazamientos",
  },
  {
    href: "/cpo",
    title: "CPO / Operadores",
    emoji: "🔌",
    description: "Ubicaciones, ingeniería, instalación, operación, SLAs e integraciones",
  },
];

export const metadata: Metadata = {
  title: "Soluciones",
  description:
    "Portafolio de CAPIRA para movilidad y energía: comercios (B2B), flotas, operadores (CPO) y usuarios.",
};

export default function SolucionesPage() {
  return (
    <main>
      <section className="bg-gradient-to-b from-zinc-50 to-white pt-8 pb-0 sm:pt-12 sm:pb-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <p className="text-sm font-medium text-zinc-700">Soluciones</p>

          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Infraestructura de carga diseñada para cada contexto
          </h1>

          <p className="mt-6 max-w-5xl text-base text-zinc-600 sm:text-lg">
            Acompañamos a nuestros clientes a lo largo de todo el ciclo del proyecto, desde la
            estrategia y el diseño hasta la implementación, operación y mantenimiento, alineando
            decisiones técnicas, económicas y financieras.
          </p>

          {/* Cards dentro del hero */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {landings.map((i) => (
              <Card
                key={i.href}
                title={
                  <div className="flex items-center gap-2">
                    <span>{i.title}</span>
                    <span className="inline-block text-xl transition-transform origin-left group-hover:scale-110">
                      {i.emoji}
                    </span>
                  </div>
                }
                description={i.description}
                href={i.href}
                footer={<p className="text-sm font-medium text-zinc-900">Ver detalle →</p>}
              />
            ))}
          </div>
        </div>
      </section>

      
    </main>
  );
}



