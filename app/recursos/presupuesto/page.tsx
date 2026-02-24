import type { Metadata } from "next";
import Link from "next/link";
import PresupuestoCalculator from "./PresupuestoCalculator";

export const metadata: Metadata = {
  title: "Presupuesto | CAPIRA",
  description:
    "Solicitá un presupuesto personalizado para instalación de cargador residencial. Con o sin cargador. Sin coste.",
  keywords: [
    "presupuesto cargador eléctrico",
    "instalación de wallbox",
    "coste instalación cargador",
    "presupuesto movilidad eléctrica",
  ],
  alternates: {
    canonical: "/recursos/presupuesto",
  },
};

export default function PresupuestoPage() {
  return (
    <main>
      {/* HERO */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
          <p className="text-sm font-medium text-zinc-700">Presupuesto</p>

          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Presupuesta tu instalación (sin coste)
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

      <PresupuestoCalculator />
    </main>
  );
}
