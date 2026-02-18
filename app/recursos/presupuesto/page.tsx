import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Presupuesto | CAPIRA",
  description:
    "Solicitá un presupuesto personalizado para instalación de cargador residencial. Con o sin cargador. Sin coste.",
};

export default function PresupuestoPage() {
  return (
    <main>
      {/* HERO */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          <p className="text-sm font-medium text-zinc-700">Presupuesto</p>

          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Presupuestá tu instalación (sin coste)
          </h1>

          <p className="mt-6 max-w-3xl text-lg text-zinc-600">
            Te damos una propuesta clara: materiales, mano de obra y opciones
            con distintas marcas. Si aplica, te orientamos con ayudas e incentivos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contacto"
              className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Pedir presupuesto por WhatsApp
            </Link>
            <Link
              href="/recursos/elegir-cargador"
              className="rounded-md border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
            >
              Antes: elegir cargador
            </Link>
          </div>
        </div>
      </section>

      {/* FORM “placeholder” */}
      <section className="bg-zinc-50 border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-zinc-900">
                Qué necesitamos para cotizar
              </h2>

              <ul className="mt-4 space-y-3 text-sm text-zinc-700">
                <li>• Tipo de vivienda y ubicación del punto de carga</li>
                <li>• Modelo de vehículo (o conector)</li>
                <li>• Distancia aproximada desde el cuadro eléctrico</li>
                <li>• Si querés cargador incluido o solo instalación</li>
              </ul>

              <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-700">
                  Si te resulta más fácil, mandanos fotos por WhatsApp:
                  cuadro eléctrico + plaza/garaje + recorrido aproximado.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-zinc-900">
                Enviarnos datos
              </h2>
              <p className="mt-3 text-sm text-zinc-600">
                Acá podés poner un formulario más adelante (Typeform, Tally,
                Formspree, etc.). Por ahora dejamos CTA directo.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/contacto"
                  className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Enviar por WhatsApp
                </Link>
                <Link
                  href="/contacto"
                  className="rounded-md border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                >
                  Enviar por email
                </Link>
              </div>

              <p className="mt-4 text-xs text-zinc-500">
                Tiempo típico de respuesta: 24–48h laborables.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
