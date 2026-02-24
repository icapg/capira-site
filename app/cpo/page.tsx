import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "../components/ui/Section";

const capabilities = [
  {
    title: "Ubicaciones",
    description: "Búsqueda de ubicaciones en territorio elegido para instalar cargadores.",
  },
  {
    title: "Instalación",
    description:
      "Planificación, anteproyecto, instalación, legalización y puesta en marcha de la infraestructura.",
  },
  {
    title: "Operación & SLA",
    description: "Monitoreo, alarmas y gestión de incidencias para alta disponibilidad.",
  },
  {
    title: "Integraciones (OCPP/APIs)",
    description: "Conexión con hardware y sistemas: OCPP, ERPs, CRMs y data lake.",
  },
];

export const metadata: Metadata = {
  title: "CPO / Operadores",
  description:
    "Operación de infraestructura con SLA, soporte, integraciones (OCPP/APIs) y control financiero con trazabilidad.",
  keywords: [
    "operador de puntos de carga",
    "servicios para CPO",
    "SLA cargadores eléctricos",
    "integración OCPP",
    "operación infraestructura de carga",
  ],
  alternates: {
    canonical: "/cpo",
  },
};

export default function CPOPage() {
  return (
    <main>
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <p className="text-sm font-medium text-zinc-700">CPO / Operadores de puntos carga</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            CPO / Operadores: operación de infraestructura con control end-to-end.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-zinc-600 sm:text-lg">
            Para equipos que operan infraestructura de carga y necesitan SLA, soporte, integraciones y control
            financiero con métricas confiables.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/contacto"
              className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.99]"
            >
              Hablar con CAPIRA
            </Link>
            <Link
              href="/casos"
              className="rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 active:scale-[0.99]"
            >
              Ver casos
            </Link>
          </div>
        </div>
      </section>

      <Section>
        <h2 className="text-xl font-semibold text-zinc-900">Capacidades clave</h2>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Operación real: disponibilidad, soporte, integraciones y revenue, con trazabilidad y reporting.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-base font-semibold text-zinc-900">{c.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{c.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-zinc-200 bg-zinc-50">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">1</p>
            <h3 className="mt-2 text-base font-semibold text-zinc-900">Arquitectura</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Hardware, protocolos (p. ej. OCPP), flujos de soporte y requerimientos de SLA.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">2</p>
            <h3 className="mt-2 text-base font-semibold text-zinc-900">Integración</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Conectores y APIs. Observabilidad desde el día 1 para detectar y resolver rápido.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">3</p>
            <h3 className="mt-2 text-base font-semibold text-zinc-900">Operación</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Gestión diaria, reportes y mejora continua con foco en disponibilidad y calidad de servicio.
            </p>
          </div>
        </div>
      </Section>

      <Section className="border-t border-zinc-200">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">
                ¿Querés mejorar SLA y reducir incidencias?
              </h2>
              <p className="mt-2 max-w-2xl text-zinc-600">
                Contanos cantidad de cargadores, marcas, región y operación. Te devolvemos un plan inicial.
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
