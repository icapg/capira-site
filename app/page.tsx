import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "./components/ui/Section";
import { Button } from "./components/ui/Button";

export const metadata: Metadata = {
  title: {
    absolute: "CAPIRA | eMobility",
  },
  description:
    "CAPIRA diseña e implementa infraestructura de carga para hogares, comercios, flotas y operadores CPO.",
  keywords: [
    "movilidad eléctrica",
    "infraestructura de carga",
    "cargadores para autos eléctricos",
    "electrificación de flotas",
    "carga residencial",
    "carga para comercios",
    "operadores CPO",
  ],
  alternates: {
    canonical: "/",
  },
};

const solutionPaths = [
  {
    href: "/residencial",
    title: "Residencial y comunidades",
    emoji: "\u{1F3E0}",
    description: "Viviendas, garajes y edificios: soluciones de carga a medida",
  },
  {
    href: "/comercios",
    title: "Comercios",
    emoji: "\u{1F3EC}",
    description: "Convierte la carga eléctrica en una nueva fuente de ingresos",
  },
  {
    href: "/flotas",
    title: "Flotas",
    emoji: "\u{1F690}",
    description: "Carga para flotas con TCO optimizado y financiación",
  },
  {
    href: "/cpo",
    title: "CPO / Operadores",
    emoji: "\u{1F50C}",
    description: "Operación integral: ubicaciones, instalación y SLA",
  },
];

const capabilities = [
  { title: "Diseño técnico-económico", mobileTitle: "Diseño", icon: "📐" },
  { title: "Instalación", icon: "🛠️" },
  { title: "Financiación", icon: "💳" },
  { title: "Mantenimiento", icon: "🔧" },
  { title: "Operación 24/7", icon: "🕒" },
  { title: "Rentabilidad", icon: "📈" },
];

export default function Home() {
  return (
    <main>
      <section className="border-b border-zinc-200 bg-[radial-gradient(circle_at_top_right,_#fafafa,_#ffffff_55%)] py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                Movilidad eléctrica con criterio técnico y de negocio
              </h1>

              <p className="mt-6 max-w-2xl text-base text-zinc-600 sm:text-lg">
                Diseñamos, implementamos y operamos soluciones de carga para{" "}
                <span className="font-semibold text-zinc-900">
                  hogares, comercios, flotas y operadores (CPOs)
                </span>
                , que reducen costos y aceleran tu transición energética.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <Button href="/contacto" className="w-full sm:w-fit">
                  Solicita tu presupuesto gratis
                </Button>
                <Button href="/soluciones" variant="secondary" className="w-full sm:w-fit">
                  Ver soluciones
                </Button>
              </div>
            </div>

            <div className="bg-white sm:rounded-3xl sm:border sm:border-zinc-200 sm:p-8 sm:shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                {capabilities.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-zinc-100 p-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                        {item.icon}
                      </span>
                      <p className="min-w-0 text-sm font-medium leading-5 text-zinc-800 max-sm:text-[13px] max-sm:leading-4">
                        {item.mobileTitle ? (
                          <>
                            <span className="sm:hidden">{item.mobileTitle}</span>
                            <span className="hidden sm:inline">{item.title}</span>
                          </>
                        ) : (
                          item.title
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section className="border-b border-zinc-200 bg-white py-8 sm:py-10">
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900">10+ años experiencia</p>
            <p className="mt-1 text-sm text-zinc-600">En soluciones de movilidad eléctrica</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900">Europa & LATAM</p>
            <p className="mt-1 text-sm text-zinc-600">Experiencia real en mercados clave</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900">End-to-End</p>
            <p className="mt-1 text-sm text-zinc-600">Diseño, instalación, financiación y operación</p>
          </div>
        </div>
      </Section>

      <Section className="border-y border-zinc-200 bg-zinc-50 py-10 sm:py-14">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <div className="flex h-full flex-col">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Ecosistema de soluciones
            </h2>
            
            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:flex-1">
              <Image
                src="/images/Home%203.png"
                alt="Auto eléctrico cargando"
                width={1200}
                height={700}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-[220px] w-full object-cover object-top sm:h-full"
              />
            </div>
          </div>

          <div className="space-y-2 lg:flex lg:h-full lg:flex-col lg:space-y-3 lg:pt-14">
            {solutionPaths.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group block rounded-2xl border border-zinc-200 bg-white p-4 transition duration-200 ease-out will-change-transform hover:scale-[1.01] hover:border-zinc-300 hover:shadow-md focus-visible:scale-[1.01] focus-visible:border-zinc-400 focus-visible:shadow-md focus-visible:outline-none lg:flex-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 sm:text-base">
                      <span className="text-base sm:text-lg">{item.emoji}</span>
                      <span>{item.title}</span>
                    </h3>
                    <p className="mt-1.5 text-sm leading-5 text-zinc-600">{item.description}</p>
                  </div>
                  <span className="mt-0.5 text-sm font-medium text-zinc-800 transition-transform group-hover:translate-x-1">
                    Ver
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section className="py-10 sm:py-14">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-10">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                ¿Listo para dar el salto a la movilidad eléctrica?
              </h2>
              <p className="mt-3 max-w-2xl text-zinc-600">
                Te acompañamos en cada paso: desde el diagnóstico técnico hasta la operación
                completa de tu infraestructura de carga.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button href="/contacto">Solicita tu presupuesto gratis</Button>
              <Button href="/soluciones" variant="secondary">
                Ver soluciones
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section className="border-t border-zinc-200 bg-zinc-50 pb-10 pt-8 sm:pb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
              Diagnóstico
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Relevamiento técnico, necesidad real de uso vs. recursos necesarios.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
              Decisión
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Evaluamos CAPEX vs. OPEX, financiación, retorno y escalabilidad antes de ejecutar.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
              Operación
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Monitoreo, soporte y SLA para sostener calidad de servicio.
            </p>
          </div>
        </div>
      </Section>
    </main>
  );
}
