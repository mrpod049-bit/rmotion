import { unstable_cache } from "next/cache";

// Cache des LECTURES PUBLIQUES (fiches produits, articles…).
//
// Contexte : tout le site est rendu dynamiquement (l'i18n lit un en-tête HTTP),
// donc sans cache chaque visite — y compris chaque passage de bot/crawler —
// réveille Postgres. Neon facturant le temps d'éveil du compute, ça épuise le
// quota. On enveloppe donc les lectures dans le cache de données de Next : la
// base n'est interrogée qu'une fois par heure et par clé, quel que soit le
// volume de trafic. L'édition d'une fiche en admin invalide tout de suite via
// revalidateTag (voir admin/produits/actions.ts).

export const CACHE_TAGS = {
  machines: "public:machines",
  articles: "public:articles",
} as const;

// Durée de vie (secondes) avant re-lecture de la base.
export const PUBLIC_TTL = 3600;

// Enveloppe une fonction de lecture pure (ses arguments font partie de la clé).
export function cachedRead<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
  tags: string[],
): (...args: A) => Promise<R> {
  return unstable_cache(fn, keyParts, { revalidate: PUBLIC_TTL, tags });
}
