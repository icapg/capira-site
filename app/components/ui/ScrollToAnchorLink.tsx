"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

type ScrollToAnchorLinkProps = {
  href: `#${string}`;
  className?: string;
  children: ReactNode;
};

export function ScrollToAnchorLink({
  href,
  className,
  children,
}: ScrollToAnchorLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const id = href.slice(1);
    const target = document.getElementById(id);

    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
  };

  return (
    <Link href={href} scroll={false} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
