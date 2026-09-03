// Attribution « first-touch » des leads web : capture le gclid et les
// paramètres de campagne (utm_*) à l'arrivée du visiteur et les conserve
// (localStorage) le temps qu'il navigue jusqu'au formulaire de devis.
// Donnée first-party : elle ne quitte le navigateur qu'au moment où le
// visiteur soumet volontairement sa demande.

const KEY = "rm-attr-v1";

export type Attribution = {
  gclid?: string; gbraid?: string; wbraid?: string;
  utm_source?: string; utm_medium?: string; utm_campaign?: string;
  utm_term?: string; utm_content?: string;
  landing_page?: string; referrer?: string;
};

// Paramètres d'URL reconnus (identiques aux clés de colonnes).
const PARAMS = [
  "gclid", "gbraid", "wbraid",
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
] as const;

// À appeler une fois au chargement. First-touch : ne réécrit jamais une
// attribution déjà mémorisée, et n'enregistre rien pour une visite directe.
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(KEY)) return; // origine déjà connue
    const url = new URL(window.location.href);
    const attr: Attribution = {};
    let hasAny = false;
    for (const p of PARAMS) {
      const v = url.searchParams.get(p);
      if (v) { (attr as Record<string, string>)[p] = v.slice(0, 300); hasAny = true; }
    }
    if (!hasAny) return; // visite directe / organique : rien à retenir
    attr.landing_page = url.pathname.slice(0, 300);
    attr.referrer = (document.referrer || "").slice(0, 300);
    localStorage.setItem(KEY, JSON.stringify(attr));
  } catch {
    /* localStorage indisponible (mode privé, etc.) : on ignore silencieusement */
  }
}

// Renvoie l'attribution mémorisée (objet vide si aucune / indisponible).
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}
