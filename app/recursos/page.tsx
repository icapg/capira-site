import type { Metadata } from "next";
import { Section } from "../components/ui/Section";
import ResourceRows from "./ResourceRows";

export const metadata: Metadata = {
  title: "Recursos",
  description:
    "Recursos por segmento para evaluar movilidad eléctrica: general, residencial, comercios y flotas.",
};

export default function RecursosPage() {
  return (
    <main>
      <section className="bg-gradient-to-b from-zinc-50 to-white py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <p className="text-sm font-medium text-zinc-700">Recursos</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Biblioteca por segmento
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href="#general"
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              🌍 General
            </a>
            <a
              href="#residencial"
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              🏠 Residencial
            </a>
            <a
              href="#comercios"
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              🏬 Comercios
            </a>
            <a
              href="#flotas"
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              🚐 Flotas
            </a>
          </div>
        </div>
      </section>

      <Section className="bg-white pb-10 pt-2 sm:pb-12 sm:pt-3">
        <ResourceRows />
      </Section>
    </main>
  );
}
