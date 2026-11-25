/**
 * Utilitaires pour les descriptions de fiches produit en HTML riche (éditeur TipTap).
 * Gère aussi rétro-compatibilité avec les anciennes descriptions en texte brut.
 */

/** Détecte si une chaîne contient déjà du balisage HTML (produit par l'éditeur). */
export function isHtml(s: string): boolean {
  return /<([a-z][a-z0-9]*)\b[^>]*>/i.test(s);
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Convertit un ancien texte brut (paragraphes séparés par une ligne vide) en HTML.
 * Les paragraphes commençant par AVERTISSEMENT / SAFETY WARNING sont rendus en rouge gras,
 * comme le faisait l'ancien rendu.
 */
export function plainToHtml(s: string): string {
  return s
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const isWarning = /^(AVERTISSEMENT|SAFETY WARNING)/i.test(p);
      const body = escapeHtml(p).replace(/\n/g, "<br>");
      return isWarning
        ? `<p><strong style="color:#dc2626">${body}</strong></p>`
        : `<p>${body}</p>`;
    })
    .join("\n");
}

/** Renvoie du HTML prêt à afficher : tel quel si déjà HTML, sinon converti depuis le texte brut. */
export function descriptionToHtml(s: string | null | undefined): string {
  const v = (s ?? "").trim();
  if (!v) return "";
  return isHtml(v) ? v : plainToHtml(v);
}

/** Retire le balisage HTML et normalise les espaces — pour les balises meta et le JSON-LD. */
export function stripHtml(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrait court et propre pour une meta description (HTML ou texte brut). */
export function descriptionExcerpt(s: string | null | undefined, max = 160): string {
  const text = stripHtml(s);
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}
