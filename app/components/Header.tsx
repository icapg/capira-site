"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_PRIMARY = [
  { href: "/residencial", label: "Residencial" },
  { href: "/comercios", label: "Comercios" },
  { href: "/flotas", label: "Flotas" },
  { href: "/cpo", label: "CPO" },
] as const;

const NAV_SECONDARY = [
  { href: "/recursos", label: "Recursos" },
  { href: "/sobre-capira", label: "Sobre CAPIRA" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      isActive(href) ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
    }`;

  return (
    <header className="border-b border-zinc-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 transition hover:opacity-80 active:opacity-60"
        >
          <span>CAPIRA</span>
          <Image
            src="/images/logo-capira.png"
            alt="Logo CAPIRA"
            width={24}
            height={24}
            sizes="24px"
            priority
            className="h-[2.5em] w-auto"
          />
        </Link>

        <div className="hidden flex-1 items-center sm:flex">
          <div className="flex flex-1 justify-center">
            <nav className="flex items-center gap-6">
              {NAV_PRIMARY.map((i) => (
                <Link key={i.href} href={i.href} className={linkClass(i.href)}>
                  {i.label}
                </Link>
              ))}
            </nav>
          </div>
          <nav className="flex items-center gap-6">
            {NAV_SECONDARY.map((i) => (
              <Link key={i.href} href={i.href} className={linkClass(i.href)}>
                {i.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] sm:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menu" : "Abrir menu"}
          >
            <span className="inline-block w-5 text-center">{open ? "X" : "="}</span>
          </button>
        </div>
      </div>

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
            {[...NAV_PRIMARY, ...NAV_SECONDARY].map((i) => (
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
