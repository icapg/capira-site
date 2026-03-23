import type { Metadata } from "next";
import Link from "next/link";
import { GraciasClient } from "../components/GraciasClient";

export const metadata: Metadata = {
  title: "Gracias | CAPIRA",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GraciasPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-zinc-50 to-white py-12 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center sm:p-12">
          <div className="text-5xl sm:text-6xl">✓</div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            ¡Gracias por tu solicitud!
          </h1>

          <p className="mt-4 text-lg text-zinc-600">
            Hemos recibido tu información correctamente.
          </p>

          <div className="mt-6 rounded-lg bg-zinc-50 p-6">
            <p className="font-semibold text-zinc-900">
              Te contactaremos en menos de 24 horas
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Nuestro equipo revisará tu solicitud y te enviará un presupuesto personalizado.
            </p>
          </div>

          <p className="mt-8 text-sm text-zinc-600">
            Mientras tanto, puedes conocer más sobre CAPIRA en nuestro sitio principal:
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--capira-brand)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--capira-brand-hover)]"
            >
              Volver a CAPIRA
            </Link>
          </div>
        </div>
      </div>

      {/* Client component to fire tracking event */}
      <GraciasClient />
    </main>
  );
}
