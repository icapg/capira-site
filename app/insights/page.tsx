import type { Metadata } from "next";
import { Section } from "../components/ui/Section";
import { Card } from "../components/ui/Card";

export const metadata: Metadata = {
  title: "eMobility Insights by Capira",
  description:
    "Datos del mercado de movilidad eléctrica en España: matriculaciones, infraestructura de carga y tendencias.",
  alternates: { canonical: "/insights" },
};

const dashboards = [
  {
    href: "/insights/matriculaciones",
    title: "Matriculaciones de VE",
    description:
      "Evolución mensual y anual de registros de vehículos eléctricos (BEV y PHEV) en España. Datos ANFAC / DGT.",
    footer: (
      <span className="text-xs font-medium text-[var(--capira-brand)]">
        Ver dashboard →
      </span>
    ),
  },
];

const comingSoon = [
  {
    title: "Infraestructura de carga",
    description:
      "Puntos de recarga públicos por provincia y comunidad autónoma. MITECO / RECORE.",
  },
  {
    title: "Precio de la electricidad",
    description:
      "Evolución del precio del mercado mayorista (PVPC) y coste por kilómetro eléctrico vs combustión. REE.",
  },
  {
    title: "Cuota de mercado por modelo",
    description:
      "Ranking de vehículos eléctricos más vendidos en España por mes y año.",
  },
];

export default function InsightsPage() {
  return (
    <Section>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
          eMobility Insights
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-500">
          Datos del mercado de movilidad eléctrica en España, actualizados
          semanalmente desde fuentes oficiales y públicas.
        </p>
      </div>

      <div className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Dashboards disponibles
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((d) => (
            <Card key={d.href} {...d} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Próximamente
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoon.map((d) => (
            <div
              key={d.title}
              className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 opacity-60"
            >
              <div className="text-base font-semibold text-zinc-900">
                {d.title}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-500">
                {d.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
