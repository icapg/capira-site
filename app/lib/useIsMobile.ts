"use client";

import { useEffect, useState } from "react";

/** Returns true when viewport is narrower than `breakpoint` (default 768px). SSR-safe. */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

/** Current viewport width with live updates. SSR-safe: returns 1280 before mount. */
export function useWindowWidth(): number {
  const [w, setW] = useState(1280);
  useEffect(() => {
    const set = () => setW(window.innerWidth);
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  return w;
}
