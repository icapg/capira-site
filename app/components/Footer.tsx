import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold text-zinc-900">CAPIRA</p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Integramos experiencia técnica, operativa y comercial para
              diseñar e implementar soluciones de movilidad eléctrica asegurando una
              transición sostenible.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-900">Soluciones</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><Link className="hover:text-zinc-900" href="/residencial">Residencial</Link></li>
              <li><Link className="hover:text-zinc-900" href="/comercios">Comercios</Link></li>
              <li><Link className="hover:text-zinc-900" href="/flotas">Flotas</Link></li>
              <li><Link className="hover:text-zinc-900" href="/cpo">CPO / Operadores</Link></li>
              <li><Link className="hover:text-zinc-900" href="/soluciones">Ver todas</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-900">Recursos</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><Link className="hover:text-zinc-900" href="/casos">Casos</Link></li>
              <li><Link className="hover:text-zinc-900" href="/recursos">Guías y noticias</Link></li>
              <li><Link className="hover:text-zinc-900" href="/sobre-capira">Sobre CAPIRA</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-900">Contacto</p>
            
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/contacto"
                className="inline-flex w-fit items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Escribir a CAPIRA
              </Link>

              {/* Placeholder: cuando tengas mail real o LinkedIn, lo conectamos */}
              <span className="text-xs text-zinc-500">
                Respuesta rápida.
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CAPIRA. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link className="hover:text-zinc-700" href="/sobre-capira">
              Términos
            </Link>
            <Link className="hover:text-zinc-700" href="/sobre-capira">
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

