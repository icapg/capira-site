import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ScrollToAnchorLink } from "../components/ui/ScrollToAnchorLink";

export const metadata: Metadata = {
  title: "Carga residencial",
  description:
    "Instalación de cargadores para vehículos eléctricos en viviendas. Presupuesto personalizado, distintas marcas y ayuda con incentivos y subvenciones.",
  keywords: [
    "cargador residencial",
    "instalación wallbox en casa",
    "presupuesto cargador coche eléctrico",
    "subvenciones cargador residencial",
    "potencia para cargar coche eléctrico",
  ],
  alternates: {
    canonical: "/residencial",
  },
};

export default function B2CPage() {
  return (
    <main>
      {/* HERO */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-sm font-medium text-zinc-700">Residencial</p>

              <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Instala tu cargador en casa, de forma simple y segura
              </h1>

              <p className="mt-6 max-w-xl text-lg text-zinc-600">
                Diseñamos y presupuestamos instalaciones de carga residencial a medida,
                adaptadas a tu vivienda, tu vehículo y tu forma de uso.
              </p>

              <p className="mt-4 max-w-xl text-base text-zinc-600">
                Trabajamos con distintas marcas de cargadores y te acompañamos en todo el
                proceso, incluyendo la gestión de ayudas e incentivos disponibles.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contacto"
                  className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Hablar con un especialista
                </Link>
                <ScrollToAnchorLink
                  href="#hazlo-a-tu-ritmo"
                  className="rounded-md border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                >
                  Planifícalo tú mismo
                </ScrollToAnchorLink>
              </div>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200">
              <Image
                src="/images/residencial/cargador-residencial-proceso.png"
                alt="Instalación de cargador residencial para vehículo eléctrico"
                fill
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO TE AYUDAMOS */}
      <section className="bg-zinc-50 border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <h2 className="text-2xl font-semibold text-zinc-900">¿Cómo te ayudamos?</h2>

          <div className="mt-8 space-y-6">
            {/* ACOMPAÑAMIENTO TOTAL (DESTACADO) */}
            <Link
              href="/contacto"
              className="group block rounded-2xl border border-zinc-800 bg-white p-6 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                    ⭐ Acompañamiento total ⭐
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-zinc-900">
                    Un especialista se encarga de todo, de principio a fin
                  </h3>

                  <p className="mt-2 max-w-3xl text-sm text-zinc-600">
                    Te guiamos en la elección del cargador, revisamos tu instalación,
                    coordinamos la instalación y te acompañamos con ayudas/incentivos
                    cuando aplica. También por WhatsApp.
                  </p>
                </div>

                <div className="shrink-0">
                  <div className="inline-flex items-center rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition group-hover:bg-zinc-800">
                    Hablar con un especialista →
                  </div>
                  <p className="mt-2 text-center text-xs text-zinc-500">Respuesta rápida</p>
                </div>
              </div>
            </Link>

            {/* SEPARADOR */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-zinc-200" />
              <span
                id="hazlo-a-tu-ritmo"
                className="shrink-0 text-xs font-medium tracking-wide text-zinc-600"
              >
                O si prefieres, hazlo a tu ritmo
              </span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>

            {/* FLUJO 1 → 2 → 3 */}
            <div className="rounded-2xl border border-zinc-300 bg-white p-4 md:p-5">
              <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                🛠️ Hazlo a tu ritmo 🛠️
              </div>

              <div className="mt-3 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
                <div id="elegir-cargador">
                  <StepBox
                    number={1}
                    title="Elegir cargador"
                    description="Usa la herramienta y obtén la recomendación ideal."
                    href="/recursos/elegir-cargador"
                  />
                </div>
                <Arrow />
                <StepBox
                  number={2}
                  title="Presupuestar instalación"
                  description="Recibe un presupuesto personalizado sin coste."
                  href="/recursos/presupuesto"
                />
                <Arrow />
                <StepBox
                  number={3}
                  title="Planificar instalación"
                  description="Una vez que tengamos el presupuesto, coordinamos fecha de visita."
                  href="/contacto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-20">
          <h2 className="text-2xl font-semibold text-zinc-900">Preguntas frecuentes</h2>

          <div className="mt-8 space-y-4">
            {[
              {
                q: "¿Puedo instalar un cargador en cualquier vivienda?",
                a: "En la mayoría de los casos, sí. Revisamos tipo de vivienda, recorrido de cableado, distancia al punto de carga y estado de la instalación para proponerte una solución segura y eficiente. Si hay restricciones, te damos alternativas técnicas viables.",
              },
              {
                q: "¿Tengo que comprar el cargador antes?",
                a: "No. Podemos incluir el cargador en el presupuesto o instalar uno que ya tengas. En ambos casos validamos compatibilidad eléctrica, potencia, protecciones y funciones para evitar retrabajos o costos inesperados.",
              },
              {
                q: "¿Cuánto tarda la instalación?",
                a: "Depende de la complejidad, pero en instalaciones residenciales estándar suele resolverse en poco tiempo tras aprobar el proyecto. Dejamos definido alcance, materiales y protecciones antes de ejecutar para que la instalación sea ordenada y predecible.",
              },
              {
                q: "¿Me ayudan con ayudas o subvenciones?",
                a: "Sí. Te orientamos con los requisitos y documentación, y te indicamos qué justificantes guardar y qué plazos considerar. El objetivo es que el proceso sea claro y que presentes la solicitud correctamente desde el inicio.",
              },
              {
                q: "¿Me ayudan a definir qué potencia contratar?",
                a: "Sí. Hacemos un análisis de consumo y hábitos de carga para recomendar la potencia adecuada, minimizando costo fijo sin comprometer tiempos de carga. También evaluamos balanceo dinámico para evitar subir potencia innecesariamente.",
              },
              {
                q: "¿Se puede integrar el cargador con energía solar?",
                a: "Sí, en muchos casos. Podemos integrar el cargador con tu sistema fotovoltaico para priorizar excedentes solares y reducir costo por kWh cargado. Revisamos inversor, esquema de conexión y estrategia de control para que funcione de forma estable.",
              },
              {
                q: "¿El cargador puede conectarse y controlarse por app?",
                a: "Sí. Muchos modelos permiten app para iniciar o detener carga, programar horarios, ver consumo y recibir estados del equipo. Durante la puesta en marcha dejamos esa conectividad configurada y validada.",
              },
              {
                q: "Vivo en edificio o comunidad, ¿puedo instalar igual?",
                a: "Generalmente sí. Te ayudamos con el planteo técnico y con los pasos de coordinación con administración/comunidad cuando corresponde. Definimos una solución segura, preparada para futuras ampliaciones.",
              },
              {
                q: "¿Necesito monofásica o trifásica?",
                a: "Depende del vehículo, del cargador y de tu suministro disponible. Evaluamos tus objetivos de tiempo de carga y costo total para recomendar la alternativa más conveniente sin sobredimensionar la instalación.",
              },
              {
                q: "¿Qué pasa si se corta internet o falla la señal?",
                a: "Según modelo, muchos cargadores siguen operando en modo local aunque pierdan conectividad temporal. Te explicamos el comportamiento esperado y dejamos una configuración robusta para asegurar disponibilidad de carga.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-lg border border-zinc-200 bg-white p-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-zinc-900">
                  {faq.q}
                  <span className="ml-4 transition group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-3 text-sm text-zinc-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="-mb-16 bg-zinc-100 border-t border-zinc-200">
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-16 text-center sm:px-8">
          <h2 className="text-2xl font-semibold text-zinc-900">
            Empieza hoy con tu instalación residencial
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-600">
            Solicita tu presupuesto personalizado o habla con un especialista para
            resolver cualquier duda.
          </p>
          <Link
            href="/contacto"
            className="mt-6 inline-flex items-center rounded-md bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Hablar con un especialista
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ---------- COMPONENTES AUXILIARES ---------- */

function StepBox({
  number,
  title,
  description,
  href,
}: {
  number: number;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:bg-zinc-50"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
        {number}
      </span>
      <div>
        <h3 className="font-semibold text-zinc-900">{title}</h3>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>
    </Link>
  );
}

function Arrow() {
  return <div className="hidden md:flex justify-center text-zinc-400">→</div>;
}
