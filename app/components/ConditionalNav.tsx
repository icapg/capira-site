"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function ConditionalNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname?.startsWith("/landing") || pathname?.startsWith("/insights");

  return (
    <>
      {!isLanding && <Header />}
      <div className="min-h-screen bg-white">
        {children}
        {!isLanding && <Footer />}
      </div>
    </>
  );
}
