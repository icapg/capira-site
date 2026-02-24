import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <div className="mt-3 grid grid-cols-[84px_1fr] items-start gap-0">
              <div className="flex flex-col items-start">
                <Image
                  src="/images/logo-capira.png"
                  alt="Logo CAPIRA"
                  width={112}
                  height={112}
                  sizes="112px"
                  className="h-28 w-20 shrink-0 object-contain object-left"
                />
              </div>
              <p className="text-left text-[13px] leading-6 text-zinc-600 sm:text-justify sm:text-sm">
                Integramos experiencia tecnica, operativa y comercial para disenar e
                implementar soluciones de movilidad electrica asegurando una transicion
                sostenible.
              </p>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold text-zinc-900">Soluciones</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>
                <Link className="hover:text-zinc-900" href="/residencial">
                  Residencial
                </Link>
              </li>
              <li>
                <Link className="hover:text-zinc-900" href="/comercios">
                  Comercios
                </Link>
              </li>
              <li>
                <Link className="hover:text-zinc-900" href="/flotas">
                  Flotas
                </Link>
              </li>
              <li>
                <Link className="hover:text-zinc-900" href="/cpo">
                  CPO
                </Link>
              </li>
              <li>
                <Link className="hover:text-zinc-900" href="/soluciones">
                  Ver todas
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold text-zinc-900">Recursos</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>
                <Link className="hover:text-zinc-900" href="/recursos">
                  Guias y noticias
                </Link>
              </li>
              <li>
                <Link className="hover:text-zinc-900" href="/sobre-capira">
                  Sobre CAPIRA
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 text-center lg:col-span-1 lg:text-left">
            <p className="text-sm font-semibold text-zinc-900">Contacto</p>

            <div className="mt-4 flex flex-col items-center gap-2 lg:items-start">
              <Link
                href="/contacto"
                className="inline-flex w-fit items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Escribir a CAPIRA
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} CAPIRA. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link className="hover:text-zinc-700" href="/terminos">
              Terminos
            </Link>
            <Link className="hover:text-zinc-700" href="/privacidad">
              Privacidad
            </Link>
            <div className="flex items-center gap-2">
              <label htmlFor="footer-language" className="text-xs font-medium text-zinc-600">
                Idioma
              </label>
              <select
                id="footer-language"
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none transition focus:border-zinc-400"
                defaultValue="es"
                aria-label="Seleccionar idioma"
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
                <option value="pt">Portugues</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
