import Link from "next/link";
import React from "react";

type CardProps = {
  title: React.ReactNode;          // 👈 antes seguramente era string
  description: React.ReactNode;    // opcional, pero suele venir bien
  href: string;
  footer?: React.ReactNode;
};

export function Card({ title, description, href, footer }: CardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="text-base font-semibold text-zinc-900">{title}</div>

      <div className="mt-2 text-sm leading-6 text-zinc-600">{description}</div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </Link>
  );
}
