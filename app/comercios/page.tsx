import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "../components/ui/Section";
import { ScrollToAnchorLink } from "../components/ui/ScrollToAnchorLink";

export const metadata: Metadata = {
  title: "Comercios (B2B)",
  description:
    "Rentabiliza plazas de aparcamiento con cargadores: opción sin inversión vía CPO u opción con inversión y proyecto propio.",
};

export default function ComerciosPage() {
  return (
    <main>
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-sm font-medium text-zinc-700">Comercios</p>
              <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                Rentabiliza tus plazas de aparcamiento instalando cargadores
              </h1>
              <p className="mt-6 max-w-2xl text-base text-zinc-600 sm:text-lg">
                Hoy puedes generar ingresos extra con carga de vehículos eléctricos. Hay{" "}
                <strong className="font-semibold text-zinc-900">dos</strong>{" "}
                formas de hacerlo, según tu estrategia de inversión y operación.
              </p>

              <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
                <ScrollToAnchorLink
                  href="#sin-invertir"
                  className="group rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-center transition hover:border-zinc-900 hover:shadow-sm"
                >
                  <span className="block text-base font-semibold text-zinc-900">🤝 Sin inversión 🤝</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    En asociación con un operador de recarga
                  </span>
                </ScrollToAnchorLink>
                <ScrollToAnchorLink
                  href="#proyecto-propio"
                  className="group rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-center transition hover:border-zinc-900 hover:shadow-sm"
                >
                  <span className="block text-base font-semibold text-zinc-900">💰 Con inversión 💰</span>
                  <span className="mt-1 block text-sm text-zinc-600">Proyecto propio integral</span>
                </ScrollToAnchorLink>
              </div>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200">
              <Image
                src="/images/comercios/Comercios.png"
                alt="Soluciones de carga para comercios"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

            <section id="sin-invertir" className="border-t border-zinc-200 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <article className="rounded-3xl border border-zinc-300 bg-gradient-to-b from-white to-zinc-50 p-6 shadow-sm sm:p-8">
            <p className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
              🤝 Opción colaboración 🤝
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Sin inversión: asociación con CPO</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Un CPO (Charge Point Operator) es un operador de puntos de recarga que busca
              asociarse con comercios para instalar cargadores en distintas ubicaciones del país,
              haciéndose cargo de todo el CAPEX y OPEX. Es la opción con menor dolor de cabeza y sin
              inversión inicial, aunque la que menores rendimientos ofrece a lo largo del contrato.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                💸 Sin CAPEX
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                🧾 Sin OPEX
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                🤝 Terciarizado
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                ⚡ Rápida activación
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                ✅ Sencillo
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                📉 Menos ingresos
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-zinc-900">Características principales</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                  <li>Activación rápida del servicio de recarga</li>
                  <li>Sin inversión inicial y sin carga operativa</li>
                  <li>Menor complejidad técnica, contractual y administrativa</li>
                  <li>Ingresos inmediatos pero menor rendimiento económico</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">Cómo te ayudamos (sin coste)</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                  <li>Hacemos un relevamiento de la ubicación</li>
                  <li>Catalogamos el emplazamiento según su potencial de recarga</li>
                  <li>Ofrecemos tu ubicación a diversos CPOs para recibir propuestas</li>
                  <li>Comparamos ofertas y te acompañamos en la mejor decisión</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/contacto"
                className="inline-flex rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Quiero evaluar ofertas CPO →
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section id="proyecto-propio" className="border-t border-zinc-200 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <article className="rounded-3xl border border-zinc-300 bg-gradient-to-b from-white to-zinc-50 p-6 shadow-sm sm:p-8">
            <p className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
              💰 Opción propiedad 💰
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Con inversión: proyecto propio</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Si quieres capturar el mayor valor económico del negocio, desarrollamos contigo un
              proyecto integral de principio a fin. CAPIRA diseña, implementa y puede operar y
              mantener la infraestructura para que tu equipo se enfoque en el negocio principal.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                💰 Con CAPEX
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                🧾 Con OPEX
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                🧭 Control propio
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                🏗️ Activo propio
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                📈 Más ingresos
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                🚀 Escalable
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-zinc-900">Características principales</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                  <li>CAPEX y OPEX para la ejecución y el mantenimiento</li>
                  <li>Mayor participación en ingresos de recarga</li>
                  <li>Control estratégico del activo y su evolución</li>
                  <li>Escalabilidad para crecer por etapas</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">Cómo te ayudamos</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                  <li>Diseño técnico, económico/financiero y plan de despliegue</li>
                  <li>Ejecución, puesta en marcha y configuración</li>
                  <li>Gestión y mantenimiento continuo de cargadores</li>
                  <li>Facturación y atención al cliente</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/contacto"
                className="inline-flex rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Quiero mi proyecto propio →
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="border-t border-zinc-200 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <h2 className="text-2xl font-semibold text-zinc-900">Comparativa rápida</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full table-fixed text-left text-base">
              <colgroup>
                <col className="w-[40%]" />
                <col className="w-[30%]" />
                <col className="w-[30%]" />
              </colgroup>
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th className="px-3 py-2 font-semibold"></th>
                  <th className="border-l border-zinc-200 px-3 py-2 text-center font-semibold">🤝 Colaboración con un CPO</th>
                  <th className="border-l border-zinc-200 px-3 py-2 text-center font-semibold">💰 Proyecto propio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr>
                  <td className="px-3 py-2">💸 Inversión inicial</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">🛠️ Instalación y mantenimiento</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">CAPIRA</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">🏗️ Propiedad de la infraestructura</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">⚡ Suministro de energía</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">📄 Burocracia</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio / CAPIRA</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">📊 Gestión de la infraestructura</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio / CAPIRA</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">🙋 Atención al cliente</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio / CAPIRA</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">🧾 Facturación</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio / CAPIRA</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">📈 Ingresos</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">5-15% de la facturación</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">&gt;75% de la facturación</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">🗓️ Contrato</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">Mayor a 10 años</td>
                  <td className="border-l border-zinc-200 px-3 py-2 text-center">Anual</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Section className="border-t border-zinc-200 bg-zinc-50">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="text-xl font-semibold text-zinc-900">¿No sabes qué opción te conviene más?</h2>
          <p className="mt-2 max-w-2xl text-zinc-600">
            Cuéntanos tu contexto y te preparamos una recomendación inicial para tomar una decisión rápida.
          </p>
          <Link
            href="/contacto"
            className="mt-6 inline-flex items-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Hablar con un especialista
          </Link>
        </div>
      </Section>
    </main>
  );
}
