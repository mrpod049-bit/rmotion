import type { Locale } from "@/i18n/config";

// Les catégories d'articles sont stockées en français (champ libre en base).
// On les traduit à l'affichage pour la version anglaise.
const MAP: Record<string, string> = {
  "Technologie laser": "Laser technology",
  "Technologie CNC": "CNC technology",
  "Conseils": "Advice",
};

export function translateCategory(category: string | null, locale: Locale): string {
  if (!category) return "";
  if (locale !== "en") return category;
  return MAP[category] ?? category;
}
