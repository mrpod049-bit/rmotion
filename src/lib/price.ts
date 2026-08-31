import type { Locale } from "@/i18n/config";

// price_range stocke le montant de départ en euros HT sous forme de texte (ex. "5399").
// Renvoie le libellé « À partir de … » localisé, null si vide, ou la valeur brute
// si elle n'est pas numérique (repli pour d'éventuelles fourchettes libres).
export function formatPriceFrom(
  raw: string | null | undefined,
  locale: Locale,
  fromLabel: string
): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return String(raw);
  const amount = new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR").format(n);
  return locale === "en"
    ? `${fromLabel} €${amount} excl. VAT`
    : `${fromLabel} ${amount} € HT`;
}
