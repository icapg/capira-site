import Link from "next/link";
import { Section } from "../components/ui/Section";

type Metric = { label: string; value: string };
type CaseStudy = {
  title: string;
  context: string;
  segment: "B2B" | "Flotas" | "CPO";
  highlights: string[];
  metrics: Metric[];
};

const cases: CaseStudy[] = [
  {
    title: "Operación de flota urbana — optimización y disponibilidad",
    context: "Operador con múltiples turnos y restricciones de energía/carga.",
    segment: "Flotas",
    highlights: [
      "Estandarización de incidencias y mantenimiento",
      "Tableros de disponibilidad y utilización",
      "Procesos operativos + métricas",
    ],
    metrics: [
      { label: "Disponibilidad", value: "+12 pts" },
      { label: "Incidencias", value: "-25%" },
      { label: "TCO", value: "-8%" },
    ],
  },
  {
    title: "Infraestructura de carga — mejora de SLA y soporte",
    context: "CPO con operación distribuida y necesidad de trazabilidad.",
    segment: "CPO",
    highlights: [
      "Monitoreo y alertas para equipos de operación",
      "Soporte con categorización y priorización",
      "Reportes de SLA y tiempos de resolución",
    ],
    metrics: [
      { label: "SLA", value: "+9 pts" },
      { label: "MTTR", value: "-18%" },
      { label: "Uptime", value: "99.2%" },
    ],
  },
  {
    title: "B2B — reporting, integraciones y control operativo",
    context: "Organización con requerimientos de compliance y reporting.",
    segment: "B2B",
    highlights: [
      "KPIs y exportables para stakeholders",
      "Integración con sistemas existentes",
      "Auditoría y trazabilidad de datos",
    ],
    metrics: [
      { label: "Tiempo reporte", value: "-60%" },
      { label: "Calidad datos", value: "+30%" },
      { label: "Visibilidad", value: "End-to-end" },
    ],
  },
];

function MetricPill({ label, value }: Metric) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function SegmentTag({ segment }: { segment: CaseStudy["segment"] }) {
  const map: Record<CaseStudy["segment"], string> = {
    B2B: "B2B",
    Flotas: "Flotas",
    CPO: "CPO / Operadores",
  };
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
      {map[segment]}
    </span>
  );
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Casos",
  description:
    "Casos con evidencia: contexto, enfoque y métricas (disponibilidad, SLA, MTTR, TCO) para flotas, empresas y operadores.",
};

export default function CasosPage() {
  return (
    <main>
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <p className="text-sm font-medium text-zinc-700">Casos</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Evidencia y resultados medibles.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-zinc-600 sm:text-lg">
            Casos con estructura real: contexto, enfoque, y métricas. (Placeholders listos para reemplazar
            por casos reales.)
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/contacto"
              className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.99]"
            >
              Consultar un caso
            </Link>
            <Link
              href="/soluciones"
              className="rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 active:scale-[0.99]"
            >
              Ver soluciones
            </Link>
          </div>
        </div>
      </section>

      <Section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Casos destacados</h2>
            <p className="mt-2 max-w-2xl text-zinc-600">
              Cada caso está pensado para comunicar operación (no marketing): procesos + métricas.
            </p>
          </div>
          <p className="text-sm text-zinc-500">Actualizable por región.</p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-zinc-900">{c.title}</h3>
                <SegmentTag segment={c.segment} />
              </div>

              <p className="mt-2 text-sm leading-6 text-zinc-600">{c.context}</p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {c.metrics.map((m) => (
                  <MetricPill key={m.label} {...m} />
                ))}
              </div>

              <ul className="mt-5 space-y-2 text-sm text-zinc-600">
                {c.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Link
                  href="/contacto"
                  className="text-sm font-medium text-zinc-900 hover:text-zinc-700"
                >
                  Pedir detalle → 
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-zinc-200 bg-zinc-50">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">Qué medimos</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Disponibilidad, SLA, tiempos de resolución, costos (TCO) y adopción según el caso.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">Cómo reportamos</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Tableros + exportables. Trazabilidad para equipos internos y stakeholders.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">Qué entregamos</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Plan inicial, implementación, operación y mejora continua basada en métricas.
            </p>
          </div>
        </div>
      </Section>

      <Section className="border-t border-zinc-200">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">¿Querés un caso similar al tuyo?</h2>
              <p className="mt-2 max-w-2xl text-zinc-600">
                Contanos región y contexto. Te compartimos un caso relevante y próximos pasos.
              </p>
            </div>
            <Link
              href="/contacto"
              className="inline-flex w-fit items-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.99]"
            >
              Contacto
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}
