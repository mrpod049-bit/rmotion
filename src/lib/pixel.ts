// Pixel Meta — chargé uniquement après consentement (voir MetaPixel.tsx).
// L'ID de pixel n'est pas un secret : il est de toute façon visible côté navigateur.
export const META_PIXEL_ID = "3760686240780257";
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

let ready = false;
let denied = false;
// Événements émis avant que le pixel soit prêt (ex. ViewContent, dont l'effet enfant
// se déclenche avant l'effet parent qui charge le pixel). Envoyés au chargement.
// [event, params, options] — options porte l'eventID (déduplication avec le CAPI).
type PixelOptions = { eventID?: string };
const pending: Array<[string, Record<string, unknown> | undefined, PixelOptions | undefined]> = [];

function flush(): void {
  if (!ready || typeof window === "undefined" || typeof window.fbq !== "function") return;
  while (pending.length) {
    const item = pending.shift();
    if (item) window.fbq("track", item[0], item[1], item[2]);
  }
}

// Consentement refusé : on abandonne définitivement les événements en attente.
export function denyPixel(): void {
  denied = true;
  pending.length = 0;
}

// Injecte le code de base du pixel, l'initialise, puis vide la file d'attente (idempotent).
export function loadPixel(): void {
  if (typeof window === "undefined") return;
  if (!window.fbq) {
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
  ready = true;
  flush();
}

// Déclenche un événement. Mis en file si le pixel n'est pas encore prêt ;
// no-op définitif si le consentement a été refusé. `eventId` (optionnel) doit
// être identique à celui envoyé au serveur (CAPI) pour la déduplication Meta.
export function pixelTrack(event: string, params?: Record<string, unknown>, eventId?: string): void {
  if (typeof window === "undefined" || denied) return;
  const opts: PixelOptions | undefined = eventId ? { eventID: eventId } : undefined;
  if (ready && typeof window.fbq === "function") window.fbq("track", event, params, opts);
  else pending.push([event, params, opts]);
}
