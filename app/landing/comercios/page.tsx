import type { Metadata } from "next";
import { ComerciosForm } from "../components/ComerciosForm";

export const metadata: Metadata = {
  title: "Cargadores para comercios | Genera ingresos | CAPIRA",
  description:
    "Instala cargadores eléctricos en tu negocio. Genera ingresos pasivos, atrae clientes, sin inversión inicial con CPO. Somos especialistas.",
  robots: {
    index: false,
    follow: false,
  },
};

const faqs = [
  {
    question: "¿Cuánto puedo ganar con los cargadores?",
    answer:
      "Los ingresos dependen de ubicación, flujo de clientes y modelo elegido. Típicamente oscilan entre EUR 300-1500/mes por punto de carga. Realizamos un análisis de rentabilidad personalizado.",
  },
  {
    question: "¿Qué diferencia hay entre CPO y proyecto propio?",
    answer:
      "CPO: CAPIRA invierte, tú cobras % de ingresos (sin coste inicial). Proyecto propio: tú inviertes, CAPIRA ayuda con diseño, instalación y operación. Ambos son rentables.",
  },
  {
    question: "¿Necesito hacer inversión inicial?",
    answer:
      "Con CPO: No. CAPIRA financia todo. Con proyecto propio: Sí, pero ofrecemos financiación flexible. En ambos casos, los ingresos cubren costos rápidamente.",
  },
  {
    question: "¿Atraerá clientes un cargador en mi negocio?",
    answer:
      "Sí. Usuarios de vehículos eléctricos buscan cargadores y pasan tiempo en comercios mientras cargan. Ideal para cafés, restaurantes, hoteles, gasolineras.",
  },
];

export default function ComerciosLanding() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-white py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Genera ingresos extra con cargadores en tu negocio
            </h1>
            <p className="text-xl text-zinc-600">
              Atraer clientes, obtener ingresos pasivos y sin inversión inicial. Somos expertos en
              infraestructura de carga en Europa y Latinoamérica.
            </p>
          </div>
        </div>
      </section>

      {/* Two Paths */}
      <section className="border-b border-zinc-200 bg-zinc-50 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Elige tu camino
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
              <div className="text-2xl">🔌</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Modelo CPO (sin inversión)</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-600">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--capira-brand)] font-bold">✓</span>
                  <span>CAPIRA financia 100% de la instalación</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--capira-brand)] font-bold">✓</span>
                  <span>Tú percibes porcentaje de ingresos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--capira-brand)] font-bold">✓</span>
                  <span>Sin riesgo ni inversión de tu parte</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--capira-brand)] font-bold">✓</span>
                  <span>Mantenimiento por CAPIRA</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
              <div className="text-2xl">🏢</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Proyecto propio</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-600">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--capira-brand)] font-bold">✓</span>
                  <span>Tú posees los cargadores</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--capira-brand)] font-bold">✓</span>
                  <span>100% de ingresos generados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--capira-brand)] font-bold">✓</span>
                  <span>Financiación flexible disponible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--capira-brand)] font-bold">✓</span>
                  <span>CAPIRA como socio operativo</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-zinc-200 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Beneficios clave
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">💵</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Ingresos pasivos</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Gana dinero mientras los usuarios cargan sus vehículos. ROI típico en 3-5 años.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">📍</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Atrae clientes</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Usuarios de eléctricos buscan cargadores y permanecen en tu negocio durante la carga.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">🛠️</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Operación completa</h3>
              <p className="mt-2 text-sm text-zinc-600">
                CAPIRA gestiona instalación, mantenimiento, cobro y atención al cliente 24/7.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-2xl">📊</div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">Datos e insights</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Acceso a dashboard con ingresos reales, uso de cargadores y análisis de rentabilidad.
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
              Descubre tu potencial de ingresos
            </h2>
            <p className="mt-2 text-zinc-600">
              Cuéntanos sobre tu negocio. Haremos un análisis de rentabilidad sin compromiso.
            </p>

            <div className="mt-8">
              <ComerciosForm />
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
