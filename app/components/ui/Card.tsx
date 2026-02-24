import Link from "next/link";
import React from "react";

type CardProps = {
  title: React.ReactNode;          // 👈 antes seguramente era string
  description: React.ReactNode;    // opcional, pero suele venir bien
  href: string;
  footer?: React.ReactNode;
  className?: string;
  compactMobile?: boolean;
};

export function Card({
  title,
  description,
  href,
  footer,
  className,
  compactMobile = false,
}: CardProps) {
  return (
    <Link
      href={href}
      className={[
        "group block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="text-base font-semibold text-zinc-900">{title}</div>

      <div
        className={[
          "text-sm text-zinc-600",
          compactMobile ? "mt-1.5 leading-5 sm:mt-2 sm:leading-6" : "mt-2 leading-6",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {description}
      </div>

      {footer ? (
        <div className={compactMobile ? "mt-3 sm:mt-4" : "mt-4"}>
          {footer}
        </div>
      ) : null}
    </Link>
  );
}
