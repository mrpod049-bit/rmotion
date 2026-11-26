/**
 * Utilitaires pour les descriptions de fiches produit en HTML riche (éditeur TipTap).
 * Gère aussi rétro-compatibilité avec les anciennes descriptions en texte brut.
 */
import { slugify } from "@/lib/slug";

/** Détecte si une chaîne contient déjà du balisage HTML (produit par l'éditeur). */
export function isHtml(s: string): boolean {
  return /<([a-z][a-z0-9]*)\b[^>]*>/i.test(s);
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Décode les entités HTML courantes (pour relire une valeur d'attribut sérialisée). */
const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ");

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

/**
 * Enveloppe chaque « section » de la description (image flottante + titre + texte)
 * dans un conteneur <section class="desc-sec"> qui établit un contexte de formatage
 * de bloc (CSS display:flow-root). Ainsi l'image reste contenue dans sa section :
 * le titre s'enroule à côté d'elle (aligné avec son paragraphe), sans déborder sur
 * la section suivante. Une section commence à une image, ou à un titre non précédé
 * d'une image. Garde-fou : si le découpage ne recouvre pas tout le HTML, on renvoie
 * l'original tel quel (jamais de perte de contenu).
 */
export function wrapSections(html: string): string {
  const src = html ?? "";
  const TOKEN =
    /<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>|<img\b[^>]*>|<hr\s*\/?>|<(ul|ol|blockquote)\b[^>]*>[\s\S]*?<\/\1>|<p\b[^>]*>[\s\S]*?<\/p>/gi;
  const toks = src.match(TOKEN);
  if (!toks || toks.length === 0) return src;
  // Garde-fou : le concat des blocs doit redonner le HTML d'origine (sinon on n'y touche pas).
  if (toks.join("") !== src.trim()) return src;

  const isH = (t: string) => /^<h[1-6]\b/i.test(t);
  const isImg = (t: string) => /^<img\b/i.test(t);
  const sections: string[][] = [];
  let cur: string[] = [];
  let prev = "";
  for (const t of toks) {
    const startNew = cur.length > 0 && (isImg(t) || (isH(t) && !isImg(prev)));
    if (startNew) {
      sections.push(cur);
      cur = [];
    }
    cur.push(t);
    prev = t;
  }
  if (cur.length) sections.push(cur);
  return sections.map((s) => `<section class="desc-sec">${s.join("")}</section>`).join("");
}

/** Une entrée de sommaire : un sous-titre H2 ou H3 de la description. */
export type TocItem = { id: string; text: string; level: 2 | 3 };

/**
 * Parcourt le HTML d'une description, injecte un identifiant (ancre) sur chaque
 * <h2>/<h3> et renvoie le HTML modifié + la liste des entrées de sommaire.
 * Les identifiants en doublon sont suffixés (-2, -3…). Sert au sommaire latéral
 * de la fiche produit (ancres cliquables).
 */
export function buildTocAndAnchors(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const out = (html ?? "").replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, levelStr: string, attrs: string, inner: string) => {
      const text = stripHtml(inner);
      if (!text) return match;
      // Titre explicitement exclu du sommaire (data-toc="off" posé par l'éditeur) :
      // on le laisse intact dans le texte mais on ne l'ajoute pas au sommaire.
      if (/data-toc\s*=\s*["']off["']/i.test(attrs)) return match;
      let id = slugify(text) || "section";
      const count = (used.get(id) ?? 0) + 1;
      used.set(id, count);
      if (count > 1) id = `${id}-${count}`;
      // Intitulé personnalisé pour le sommaire (data-toc-label posé par l'éditeur),
      // sinon on reprend le texte du titre.
      const labelMatch = attrs.match(/data-toc-label="([^"]*)"/i);
      const label = labelMatch ? decodeEntities(labelMatch[1]).trim() : "";
      toc.push({ id, text: label || text, level: Number(levelStr) as 2 | 3 });
      // Ne pas écraser un id déjà présent (l'éditeur n'en pose pas, mais par sûreté).
      if (/\sid\s*=/i.test(attrs)) return match;
      return `<h${levelStr}${attrs} id="${id}">${inner}</h${levelStr}>`;
    }
  );
  return { html: out, toc };
}
