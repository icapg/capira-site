"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/soluciones", label: "Soluciones" },
  { href: "/casos", label: "Casos" },
  { href: "/recursos", label: "Recursos" },
  { href: "/sobre-capira", label: "Sobre CAPIRA" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("es");

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      isActive(href) ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
    }`;

  return (
    <header className="border-b border-zinc-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="text-lg font-semibold text-zinc-900 hover:opacity-80 active:opacity-60 transition">
          CAPIRA
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-6 sm:flex">
          {NAV.map((i) => (
            <Link key={i.href} href={i.href} className={linkClass(i.href)}>
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <label className="hidden text-xs font-medium text-zinc-600 sm:block">Idioma</label>
          <select
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Seleccionar idioma"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] sm:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            <span className="inline-block w-5 text-center">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu (animated) */}
      <div
        id="mobile-menu"
        className={[
          "sm:hidden overflow-hidden border-t border-zinc-200 bg-white",
          "transition-all duration-200 ease-out",
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <nav className="mx-auto max-w-6xl px-4 py-3">
          <div
            className={[
              "flex flex-col gap-1",
              "transition-transform duration-200 ease-out",
              open ? "translate-y-0" : "-translate-y-2",
            ].join(" ")}
          >
            {NAV.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={[
                  "rounded-md px-3 py-2 transition",
                  "hover:bg-zinc-50 active:bg-zinc-100",
                  linkClass(i.href),
                ].join(" ")}
              >
                {i.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
