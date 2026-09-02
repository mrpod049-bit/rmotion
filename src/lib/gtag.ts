// Google Ads (gtag.js) — chargé uniquement après consentement (même logique que le pixel Meta).
// L'ID de conversion Google Ads n'est pas un secret : il est de toute façon visible côté navigateur.
export const GADS_ID = "AW-18425010143";

// Libellés des actions de conversion, créés dans Google Ads > Objectifs > Conversions.
// Format attendu : "AW-18425010143/xxxxxxxxxxxxxxxxxx" (ID de conversion + "/" + libellé).
// Tant qu'un libellé est vide, la conversion correspondante est un no-op silencieux.
export const GADS_CONVERSIONS = {
  devis: "", // ← à renseigner : action "Demande de devis" créée dans Google Ads
} as const;

type GadsConversion = keyof typeof GADS_CONVERSIONS;
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let ready = false;
let denied = false;
// Conversions émises avant que gtag soit prêt (ex. envoi du formulaire dans le même tick
// que l'acceptation du consentement). Rejouées au chargement.
const pending: Array<Record<string, unknown>> = [];

function flush(): void {
  if (!ready || typeof window === "undefined" || typeof window.gtag !== "function") return;
  while (pending.length) {
    const payload = pending.shift();
    if (payload) window.gtag("event", "conversion", payload);
  }
}

// Consentement refusé : on abandonne définitivement les conversions en attente.
export function denyGtag(): void {
  denied = true;
  pending.length = 0;
}

// Injecte gtag.js, l'initialise, configure le compte Google Ads, puis vide la file (idempotent).
export function loadGtag(): void {
  if (typeof window === "undefined" || ready) return;
  const dataLayer = (window.dataLayer = window.dataLayer || []);
  const gtag: Gtag = (...args: unknown[]) => {
    dataLayer.push(args);
  };
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GADS_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`;
  document.head.appendChild(script);

  ready = true;
  flush();
}

// Déclenche une conversion Google Ads. Mise en file si gtag n'est pas encore prêt ;
// no-op définitif si le consentement a été refusé ou si le libellé n'est pas configuré.
export function gtagConversion(name: GadsConversion, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || denied) return;
  const sendTo = GADS_CONVERSIONS[name];
  if (!sendTo) return; // libellé pas encore renseigné
  const payload = { send_to: sendTo, ...params };
  if (ready && typeof window.gtag === "function") window.gtag("event", "conversion", payload);
  else pending.push(payload);
}
