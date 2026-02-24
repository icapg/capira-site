import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Información institucional de CAPIRA.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
        Sobre Capira
      </h1>

      <p className="mt-5 max-w-2xl text-base text-zinc-600 sm:mt-6 sm:text-lg">
        Esta es la página /about. Acá vamos a contar quiénes somos, qué hacemos y
        cómo trabajamos.
      </p>
    </section>
  );
}
