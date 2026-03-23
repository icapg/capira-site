export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

export type TrackingEventParams = Record<string, string | number | boolean>;

/**
 * Get UTM parameters from the current URL
 */
export function getUtmParams(): UtmParams {
  if (typeof window === "undefined") {
    return {};
  }

  const searchParams = new URLSearchParams(window.location.search);
  return {
    utm_source: searchParams.get("utm_source") || undefined,
    utm_medium: searchParams.get("utm_medium") || undefined,
    utm_campaign: searchParams.get("utm_campaign") || undefined,
  };
}

/**
 * Fire a Meta Pixel event
 */
export function trackEvent(eventName: string, params?: TrackingEventParams): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params || {});
  }
}

/**
 * Fire a Google Analytics 4 event
 */
export function trackGA4Event(eventName: string, params?: TrackingEventParams): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params || {});
  }
}

// Extend window types for Meta Pixel and GA4
declare global {
  interface Window {
    fbq?: (action: string, eventName: string, params?: TrackingEventParams) => void;
    gtag?: (action: string, eventName: string, params?: TrackingEventParams) => void;
  }
}
