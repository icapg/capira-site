"use client";

import { useEffect } from "react";
import { trackEvent } from "@/app/lib/tracking";

export function GraciasClient() {
  useEffect(() => {
    // Fire Meta Pixel Lead event
    trackEvent("Lead");
  }, []);

  return null;
}
