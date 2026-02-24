import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terminos y Condiciones",
  description: "Terminos y condiciones de uso del sitio web de CAPIRA.",
  alternates: {
    canonical: "/terminos",
  },
};

const updatedAt = "24 de febrero de 2026";

export default function TerminosPage() {
  return (
    <main>
      <section className="border-b border-zinc-200 bg-zinc-50 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <p className="text-sm font-medium text-zinc-700">Legal</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Terminos y Condiciones
          </h1>
          <p className="mt-4 text-sm text-zinc-600">Ultima actualizacion: {updatedAt}</p>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-8 px-4 text-sm leading-7 text-zinc-700 sm:px-8 sm:text-base">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900">1. Aceptacion</h2>
            <p className="mt-2">
              Al acceder y usar este sitio web, aceptas estos Terminos y Condiciones. Si no
              estas de acuerdo, debes abstenerte de usar el sitio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">2. Titular del sitio</h2>
            <p className="mt-2">
              Este sitio es operado por CAPIRA. Para consultas legales o contractuales puedes
              contactarnos por medio de la pagina de{" "}
              <Link className="font-medium text-zinc-900 underline" href="/contacto">
                contacto
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">3. Uso permitido</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Usar el sitio con fines informativos y comerciales legitimos.</li>
              <li>No realizar usos ilicitos, fraudulentos o que afecten su funcionamiento.</li>
              <li>No intentar acceder a sistemas o datos sin autorizacion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">4. Propiedad intelectual</h2>
            <p className="mt-2">
              Los contenidos del sitio (textos, imagenes, marca, diseno, codigo y materiales) son
              de CAPIRA o de sus licenciantes. Queda prohibida su reproduccion, distribucion o uso
              no autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">5. Informacion del sitio</h2>
            <p className="mt-2">
              La informacion publicada es de caracter general y puede actualizarse en cualquier
              momento sin aviso previo. No constituye asesoramiento tecnico, legal, contable ni
              financiero personalizado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">6. Enlaces a terceros</h2>
            <p className="mt-2">
              El sitio puede incluir enlaces a paginas externas. CAPIRA no controla ni garantiza
              sus contenidos, politicas o disponibilidad, y no asume responsabilidad por su uso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">7. Limitacion de responsabilidad</h2>
            <p className="mt-2">
              En la maxima medida permitida por la ley aplicable, CAPIRA no sera responsable por
              danos indirectos, lucro cesante o perdidas derivadas del uso o imposibilidad de uso
              del sitio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">8. Disponibilidad y cambios</h2>
            <p className="mt-2">
              CAPIRA puede modificar, suspender o discontinuar total o parcialmente el sitio y sus
              contenidos en cualquier momento, sin generar derecho a indemnizacion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">9. Privacidad</h2>
            <p className="mt-2">
              El tratamiento de datos personales se regula por la Politica de Privacidad disponible
              en{" "}
              <Link className="font-medium text-zinc-900 underline" href="/privacidad">
                Privacidad
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">10. Legislacion aplicable</h2>
            <p className="mt-2">
              Estos terminos se interpretaran conforme a la normativa aplicable al titular del
              sitio y, cuando corresponda, a las normas de proteccion del consumidor de la
              jurisdiccion del usuario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">11. Modificaciones</h2>
            <p className="mt-2">
              CAPIRA puede actualizar estos terminos. La version vigente sera la publicada en esta
              pagina junto con su fecha de actualizacion.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
