import { ReactNode } from "react";
import { Container } from "./Container";

export function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-14 sm:py-20 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}
