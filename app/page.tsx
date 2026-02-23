import Image from "next/image";
import { Section } from "./components/ui/Section";
import { Button } from "./components/ui/Button";

const solutionPaths = [
  {
    href: "/residencial",
    title: "Residencial y comunidades",
    emoji: "\u{1F3E0}",
    description: "Viviendas, garajes y edificios: soluciones de carga a medida.",
  },
  {
    href: "/comercios",
    title: "Comercios",
    emoji: "\u{1F3EC}",
    description:
      "Carga para tus clientes y empleados con integración operativa y nuevos modelos de ingresos.",
  },
  {
    href: "/flotas",
    title: "Flotas",
    emoji: "\u{1F690}",
    description:
      "Diseño a medida, optimizando TCO para actualizar la flota de forma sostenible con diversas opciones de financiación.",
  },
  {
    href: "/cpo",
    title: "CPO / Operadores",
    emoji: "\u{1F50C}",
    description: "Ubicaciones, ingeniería, instalación, operación, SLA e integraciones.",
  },
];

const capabilities = [
  { title: "Diseño técnico-económico", icon: "📐" },
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
                , alineando decisiones técnicas, económicas y operativas.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/soluciones">Ver soluciones</Button>
                <Button href="/sobre-capira" variant="secondary">
                  Conocer CAPIRA
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                {capabilities.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-zinc-100 p-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                        {item.icon}
                      </span>
                      <p className="text-sm font-medium leading-5 text-zinc-800">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section className="border-y border-zinc-200 bg-zinc-50 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch">
          <div className="flex h-full flex-col">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Ecosistema de soluciones
            </h2>
            
            <div className="mt-6 flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <Image
                src="/images/Home%203.png"
                alt="Auto eléctrico cargando"
                width={1200}
                height={700}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-2">
            {solutionPaths.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group block rounded-2xl border border-zinc-200 bg-white p-4 transition duration-200 ease-out will-change-transform hover:scale-[1.01] hover:border-zinc-300 hover:shadow-md focus-visible:scale-[1.01] focus-visible:border-zinc-400 focus-visible:shadow-md focus-visible:outline-none"
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
              </a>
            ))}
          </div>
        </div>
      </Section>

      <Section className="py-10 sm:py-14">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                ¿Quieres evaluar tu proyecto de carga?
              </h2>
              <p className="mt-3 max-w-2xl text-zinc-600">
                Te ayudamos a definir por dónde empezar y cuál es la solución adecuada para tu
                contexto.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button href="/soluciones">Ir a soluciones</Button>
              <Button href="/contacto" variant="secondary">
                Hablar con CAPIRA
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
