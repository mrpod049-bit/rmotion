export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

// Déduit la locale à partir du chemin (usage client, ex. usePathname).
export function localeFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
}

// Préfixe un lien interne avec la locale (aucun préfixe pour le français, langue par défaut).
export function localizeHref(href: string, locale: Locale): string {
  if (locale !== "en") return href;
  if (!href.startsWith("/")) return href; // liens externes, ancres, mailto…
  if (href === "/en" || href.startsWith("/en/")) return href; // déjà préfixé
  return href === "/" ? "/en" : `/en${href}`;
}

// Locale de formatage des dates (Intl / toLocaleDateString).
export function dateLocale(locale: Locale): string {
  return locale === "en" ? "en-GB" : "fr-FR";
}
