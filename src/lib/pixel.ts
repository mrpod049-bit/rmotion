// Pixel Meta — chargé uniquement après consentement (voir MetaPixel.tsx).
// L'ID de pixel n'est pas un secret : il est de toute façon visible côté navigateur.
export const META_PIXEL_ID = "600758790713525";
export const CONSENT_KEY = "rm-consent-v1";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

// Injecte le code de base du pixel Meta et l'initialise (idempotent, sans PageView —
// le PageView est géré par le composant pour couvrir les navigations internes).
export function loadPixel(): void {
  if (typeof window === "undefined" || window.fbq) return;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", META_PIXEL_ID);
}

// Déclenche un événement — no-op si le pixel n'est pas chargé (consentement refusé/absent).
export function pixelTrack(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, params);
}
