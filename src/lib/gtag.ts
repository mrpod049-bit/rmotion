// Google Ads (gtag.js) — Consent Mode v2.
// Le tag est chargé pour TOUS les visiteurs, avec un consentement publicitaire
// « refusé » par défaut (pings anonymes/modélisés, conformes RGPD), puis passé à
// « accordé » quand le visiteur accepte les cookies. C'est l'implémentation
// standard recommandée par Google : elle permet à Google de détecter le tag
// (fin des « Dépannage / tag non détecté ») et maximise la mesure tout en
// restant conforme. L'ID de conversion n'est pas un secret (visible navigateur).
export const GADS_ID = "AW-18425010143";

// Libellés des actions de conversion (Google Ads > Objectifs > Conversions).
// Format : "AW-18425010143/xxxx". Un libellé vide = conversion no-op.
export const GADS_CONVERSIONS = {
  devis: "AW-18425010143/v1riCL2wvPAcEN-v3dFE", // action "Demande de devis" (pondérée 25)
  newsletter: "AW-18425010143/sjQLCLn_u_AcEN-v3dFE", // action "Inscription newsletter"
  fiche_technique: "AW-18425010143/OSQECP3ds_AcEN-v3dFE", // action "Demande de fiche technique"
} as const;

type GadsConversion = keyof typeof GADS_CONVERSIONS;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Garantit dataLayer + la fonction gtag CANONIQUE : elle pousse l'objet `arguments`
// (exactement comme le snippet officiel Google). Ne PAS remplacer par un tableau —
// c'est cette forme que gtag.js reconnaît pour exécuter réellement les commandes.
function ensureGtag(): (...args: unknown[]) => void {
  const dl = (window.dataLayer = window.dataLayer || []);
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      dl.push(arguments);
    };
  }
  return window.gtag;
}

let initialized = false;

// À appeler une fois au chargement (composant GoogleTag), pour TOUS les visiteurs.
export function initGtag(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;
  const gtag = ensureGtag();

  // Consent Mode v2 : tout refusé par défaut, AVANT la config (RGPD).
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
  // gclid transmis via l'URL (sans cookie) + identifiants pub masqués tant que
  // le consentement n'est pas accordé.
  gtag("set", "url_passthrough", true);
  gtag("set", "ads_data_redaction", true);

  gtag("js", new Date());
  gtag("config", GADS_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`;
  document.head.appendChild(script);
}

// Met à jour le consentement publicitaire (clic Accepter / Refuser).
export function updateGtagConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  const gtag = ensureGtag();
  const v = granted ? "granted" : "denied";
  gtag("consent", "update", {
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
    analytics_storage: v,
  });
}

// Déclenche une conversion. gtag choisit seul un ping complet (consenti) ou
// modélisé/anonyme (refusé). No-op si le libellé n'est pas encore configuré.
export function gtagConversion(name: GadsConversion, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const sendTo = GADS_CONVERSIONS[name];
  if (!sendTo) return;
  ensureGtag()("event", "conversion", { send_to: sendTo, ...params });
}
