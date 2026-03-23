import type { Metadata } from "next";
import { ResidencialForm } from "../components/ResidencialForm";

export const metadata: Metadata = {
  title: "Carga eléctrica residencial | CAPIRA",
  description:
    "Instala un cargador eléctrico en tu hogar con MOVES Corredores. Ahorra dinero, carga en casa y aprovecha las subvenciones disponibles.",
  robots: {
    index: false,
    follow: false,
  },
};

const faqs = [
  {
    question: "¿Cuánto cuesta instalar un cargador residencial?",
    answer:
      "El coste varía según tu vivienda y necesidades. Disponemos de opciones desde cargadores básicos hasta soluciones inteligentes. Solicita un presupuesto personalizado sin compromiso.",
  },
  {
    question: "¿Puedo acceder a subvenciones del MOVES Corredores?",
    answer:
      "Sí. En España existen subvenciones disponibles a través del programa MOVES Corredores para instalación de cargadores residenciales. Nuestro equipo te ayuda con todo el proceso.",
  },
  {
    question: "¿Cuánto tardo en ahorrar con un cargador en casa?",
    answer:
      "Con un cargador residencial ahorras hasta 75% en costes de electricidad vs. cargadores públicos. Además, cargas cuando quieras y con tarifas de madrugada más baratas.",
  },
  {
    question: "¿Qué tipo de cargador necesito?",
    answer:
      "Depende de tu vehículo y disponibilidad eléctrica. Nuestro diagnóstico técnico te recomienda la solución óptima: cargadores de 3.7kW, 7.4kW, 11kW o superiores.",
  },
];

export default function ResidencialLanding() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-white py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Carga tu auto eléctrico en casa
            </h1>
            <p className="text-xl text-zinc-600">
              Ahorra dinero, carga cuando quieras y aprovecha las subvenciones MOVES Corredores.
              Somos especialistas en infraestructura de carga en Europa y Latinoamérica.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="border-b border-zinc-200 bg-zinc-50 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-4 text-center">
              <p className="text-sm font-semibold text-zinc-900">10+ años</p>
              <p className="text-xs text-zinc-600">de experiencia</p>
            </div>
            <div className="rounded-lg bg-white p-4 text-center">
              <p className="text-sm font-semibold text-zinc-900">Europa & LATAM</p>
              <p className="text-xs text-zinc-600">presencia global</p>
            </div>
            <div className="rounded-lg bg-white p-4 text-center">
              <p className="text-sm font-semibold text-zinc-900">Expertos</p>
              <p className="text-xs text-zinc-600">técnicos y comerciales</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-zinc-200 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            ¿Por qué elegir un cargador en casa?
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">💰</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Ahorra dinero</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Carga a precios 75% menores vs. cargadores públicos, especialmente en horarios nocturnos.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">🏠</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Carga en casa</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Inicia cada día con batería llena sin depender de infraestructura pública.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">📋</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Subvenciones</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Acceso a MOVES Corredores y otros programas de ayuda disponibles en España.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">⚡</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Inteligente</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Cargadores inteligentes que optimizan consumo y se integran con energía renovable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="border-b border-zinc-200 bg-zinc-50 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-8">
          <div className="rounded-2xl bg-white p-6 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Solicita tu presupuesto gratis
            </h2>
            <p className="mt-2 text-zinc-600">
              Cuéntanos sobre tu vivienda y necesidades. Nos contactaremos en menos de 24 horas.
            </p>

            <div className="mt-8">
              <ResidencialForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Preguntas frecuentes
          </h2>

          <div className="mt-8 space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="font-semibold text-zinc-900">{faq.question}</h3>
                <p className="mt-3 text-sm text-zinc-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
