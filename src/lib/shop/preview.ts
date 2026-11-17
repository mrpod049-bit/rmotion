// Accès « aperçu » à la boutique tant qu'elle n'est pas ouverte au public.
//
// L'admin (authentifié par l'auth basique de /admin) visite /admin/boutique/apercu,
// qui pose un cookie contenant une signature HMAC dérivée d'un secret serveur.
// Le middleware et les pages boutique acceptent alors le visiteur ; les autres
// voient la page « Boutique en construction ».
// Fichier sans dépendance Node : utilisable dans le middleware (Web Crypto).

export const PREVIEW_COOKIE = "rm_shop_preview";
export const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

/** Chemins publics de la boutique (hors /en). */
export const SHOP_PATH = /^\/(outils|panier|commande|compte|cgv)(\/|$)/;

function secret(): string | null {
  return process.env.SHOP_PREVIEW_SECRET || process.env.ADMIN_PASSWORD || null;
}

/** Valeur attendue du cookie d'aperçu (null si aucun secret configuré). */
export async function previewToken(): Promise<string | null> {
  const s = secret();
  if (!s) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(s), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("rmotion-shop-preview-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isPreviewValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const expected = await previewToken();
  if (!expected || value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const shopIsOpen = () => process.env.SHOP_ENABLED === "true";
