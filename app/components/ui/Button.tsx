import Link from "next/link";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  children,
  href,
  variant = "primary",
  className,
  type = "button",
  disabled,
  onClick,
}: Props) {
  const base =
    "inline-flex w-fit items-center justify-center rounded-md px-5 py-3 text-sm font-medium transition active:scale-[0.99] disabled:opacity-60";

  const primary =
    "bg-[var(--capira-brand)] text-white hover:bg-[var(--capira-brand-hover)]";

  const secondary =
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50";

  const ghost = "text-zinc-900 hover:bg-zinc-50";

  const variantClass =
    variant === "primary" ? primary : variant === "secondary" ? secondary : ghost;

  const classes = clsx(base, variantClass, className);

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
