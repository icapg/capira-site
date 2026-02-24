import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "../components/ui/Section";

export const metadata: Metadata = {
  title: "Sobre CAPIRA",
  description:
    "Equipo internacional con experiencia real en movilidad eléctrica en Europa y LATAM: residencial, comercios, flotas y CPOs.",
  keywords: [
    "consultoría movilidad eléctrica",
    "equipo experto en infraestructura de carga",
    "capira",
    "proyectos de recarga en europa y latam",
  ],
  alternates: {
    canonical: "/sobre-capira",
  },
};

const values = [
  "Experiencia real por encima de la teoría",
  "Claridad para simplificar decisiones complejas",
  "Excelencia técnica con enfoque de negocio",
  "Compromiso con resultados sostenibles",
];

const highlights = [
  "🌍 Experiencia internacional en Europa y Latinoamérica",
  "🤝 Acompañamiento integral: técnico + comercial",
  "🧭 Decisiones orientadas a evitar errores costosos",
  "♻️ Enfoque en transiciones sostenibles y rentables",
  "💶 Estructuración y búsqueda de financiación",
];

export default function SobreCapiraPage() {
  return (
    <main>
      <section className="border-b border-zinc-200 bg-[radial-gradient(circle_at_top_left,_#eef2ff,_#ffffff_45%)] py-8 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium text-zinc-700">Sobre CAPIRA</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Experiencia real para implementar movilidad eléctrica sin fricción
            </h1>
            <p className="mt-6 max-w-3xl text-base text-zinc-600 sm:text-lg">
              Somos un equipo internacional de especialistas en movilidad eléctrica con años de
              experiencia en Europa y Latinoamérica, participando activamente en el desarrollo del
              ecosistema desde sus primeras etapas.
            </p>
            <p className="mt-4 max-w-3xl text-base text-zinc-600 sm:text-lg">
              Fuimos parte del despliegue de las primeras infraestructuras de recarga en
              Latinoamérica junto a automotrices y petroleras, y hemos desarrollado y escalado
              redes de recarga en Europa, trabajando desde el lado del operador (CPO), la
              ingeniería, la estrategia y la operación.
            </p>
            <p className="mt-4 text-lg font-semibold text-zinc-900">
              No hablamos desde la teoría. Hablamos desde la experiencia real.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/soluciones"
                className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Ver soluciones
              </Link>
              <Link
                href="/contacto"
                className="rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
              >
                Contacto
              </Link>
            </div>
          </div>

          <div className="relative min-h-[280px] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:h-full">
            <Image
              src="/images/CiudadSN2.png"
              alt="Movilidad eléctrica"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <Section className="py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/70 to-white p-6 shadow-sm sm:p-8">
            <div className="absolute left-0 right-0 top-0 h-1 bg-[var(--capira-brand)]" />
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--capira-brand)]">
                Misión
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              Acompañamiento con impacto real
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Acompañamos a hogares, comercios, flotas y operadores para que den el paso a la
              movilidad eléctrica de forma segura, rentable y sostenible.
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Convertimos un proceso complejo en un camino claro, con decisiones bien tomadas
              desde el inicio.
            </p>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/70 to-white p-6 shadow-sm sm:p-8">
            <div className="absolute left-0 right-0 top-0 h-1 bg-emerald-500" />
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Visión
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              Impulsar una transición bien hecha
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Queremos acelerar la transición hacia una movilidad sostenible en Europa y LATAM
              con proyectos bien diseñados, escalables y preparados para el largo plazo.
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              No se trata solo de instalar cargadores: se trata de crear infraestructura
              sostenible en el tiempo, tanto operativa como económicamente.
            </p>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-b from-amber-50/70 to-white p-6 shadow-sm sm:p-8">
            <div className="absolute left-0 right-0 top-0 h-1 bg-amber-500" />
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Valores
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">Cómo trabajamos</h2>
            <ul className="mt-4 space-y-3">
              {values.map((value) => (
                <li
                  key={value}
                  className="flex items-start gap-3 rounded-xl border border-amber-100 bg-white/90 px-3 py-2.5"
                >
                  <span className="mt-0.5 shrink-0 text-sm">⚡</span>
                  <span className="text-sm leading-6 text-zinc-700">{value}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      <Section className="border-y border-zinc-200 bg-zinc-50 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-stretch">
          <div className="h-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Nuestro expertise, de lo técnico a lo comercial
            </h2>
            <p className="mt-4 text-zinc-600">
              Desde la ingeniería hasta la estrategia comercial, trabajamos para que cada cliente
              transicione de forma adecuada, sin incurrir en gastos innecesarios ni en decisiones
              de las que luego se arrepienta.
            </p>
            <p className="mt-3 text-zinc-600">
              Vimos cómo se implementó la movilidad eléctrica en otros mercados, aprendimos de sus
              aciertos y errores, y aplicamos ese conocimiento para evitar problemas desde el día 1.
            </p>
            <p className="mt-4 border-l-4 border-[var(--capira-brand)] pl-4 font-medium text-zinc-900">
              Nuestro objetivo no es vender equipos. Es construir soluciones que funcionen y
              generen valor en el tiempo.
            </p>
          </div>

          <aside className="h-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--capira-brand)]">
              Enfoque CAPIRA
            </p>
            <div className="mt-4 space-y-3">
              {highlights.map((item) => (
                <p
                  key={item}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"
                >
                  {item}
                </p>
              ))}
            </div>
          </aside>
        </div>
      </Section>

      <Section className="py-10 sm:py-14">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">¿Quieres conversar tu caso?</h2>
              <p className="mt-2 max-w-2xl text-zinc-600">
                Contanos contexto y región. Te devolvemos un plan inicial con próximos pasos.
              </p>
            </div>
            <Link
              href="/contacto"
              className="inline-flex w-fit items-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Contacto
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}
