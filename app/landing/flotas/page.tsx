import type { Metadata } from "next";
import { FlotasForm } from "../components/FlotasForm";

export const metadata: Metadata = {
  title: "Electrificación de flotas | CAPIRA",
  description:
    "Electrifica tu flota sin sorpresas. Reduce TCO, carga inteligente, financiación disponible. Somos especialistas en soluciones B2B.",
  robots: {
    index: false,
    follow: false,
  },
};

const faqs = [
  {
    question: "¿Cuál es el ahorro real en TCO (Total Cost of Ownership)?",
    answer:
      "El ahorro típico es 30-50% vs. flotas de combustión, considerando combustible, mantenimiento y depreciación. Realizamos una comparación detallada para tu flota específica.",
  },
  {
    question: "¿Cómo funciona la carga inteligente?",
    answer:
      "Nuestro sistema optimiza tiempos de carga, detecta horarios baratos de electricidad, balancea demanda según disponibilidad y maximiza eficiencia operativa sin comprometer disponibilidad.",
  },
  {
    question: "¿Qué opciones de financiación hay?",
    answer:
      "Ofrecemos leasing operativo, financiación de CAPEX, OPEX puro, y acceso a líneas de crédito para vehículos y cargadores. Adaptamos estructura según flujo de caja.",
  },
  {
    question: "¿Puedo electrificar gradualmente mi flota?",
    answer:
      "Sí. Recomendamos fases según rutas, disponibilidad de presupuesto y madurez operativa. Comenzamos con pilotos y escalamos según aprendizaje.",
  },
];

export default function FlotasLanding() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-white py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Electrifica tu flota sin sorpresas
            </h1>
            <p className="text-xl text-zinc-600">
              Reduce costos operativos, implementa carga inteligente y accede a financiación flexible.
              Somos especialistas en soluciones de electrificación B2B en Europa y Latinoamérica.
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
              <p className="text-xs text-zinc-600">experiencia B2B</p>
            </div>
            <div className="rounded-lg bg-white p-4 text-center">
              <p className="text-sm font-semibold text-zinc-900">500+</p>
              <p className="text-xs text-zinc-600">puntos de carga</p>
            </div>
            <div className="rounded-lg bg-white p-4 text-center">
              <p className="text-sm font-semibold text-zinc-900">Integral</p>
              <p className="text-xs text-zinc-600">diseño a operación</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="border-b border-zinc-200 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Beneficios de electrificar con CAPIRA
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">💰</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Reducción de TCO</h3>
              <p className="mt-2 text-sm text-zinc-600">
                30-50% ahorro en costos operativos: combustible, mantenimiento y depreciación
                optimizados.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">⚡</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Carga inteligente</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Sistema que optimiza horarios, detecta tarifas baratas y balancea demanda para
                máxima eficiencia.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">💳</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Financiación flexible</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Leasing, CAPEX, OPEX puro. Estructuras adaptadas a tu flujo de caja y necesidades.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">🎯</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Implementación gradual</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Comienza con pilotos, escala según aprendizaje. Minimizamos riesgo operativo y
                financiero.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">📊</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Dashboard & Analytics</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Monitoreo en tiempo real de costos, consumo, disponibilidad y ROI por vehículo.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">🛠️</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Soporte integral</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Diagnóstico, diseño, instalación, training y operación 24/7. Partner end-to-end.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="border-b border-zinc-200 bg-zinc-50 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Nuestro proceso
          </h2>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--capira-brand)] text-sm font-bold text-white">
                  1
                </span>
                <div>
                  <h3 className="font-semibold text-zinc-900">Diagnóstico integral</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Analizamos rutas, perfiles de carga, infraestructura actual y opciones de
                    electrificación.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--capira-brand)] text-sm font-bold text-white">
                  2
                </span>
                <div>
                  <h3 className="font-semibold text-zinc-900">Plan de electrificación</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Roadmap con fases, costos, TCO proyectado, financiación y milestones.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--capira-brand)] text-sm font-bold text-white">
                  3
                </span>
                <div>
                  <h3 className="font-semibold text-zinc-900">Implementación y training</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Instalación, configuración, capacitación de equipo y puesta en operación.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--capira-brand)] text-sm font-bold text-white">
                  4
                </span>
                <div>
                  <h3 className="font-semibold text-zinc-900">Operación y optimización</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Monitoreo 24/7, mantenimiento, análisis de datos y mejora continua.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="border-b border-zinc-200 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-8">
          <div className="rounded-2xl bg-white p-6 border border-zinc-200 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Analiza tu potencial de electrificación
            </h2>
            <p className="mt-2 text-zinc-600">
              Cuéntanos sobre tu flota y operación. Te enviaremos un análisis personalizado sin
              compromiso.
            </p>

            <div className="mt-8">
              <FlotasForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-zinc-50 py-10 sm:py-14">
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
