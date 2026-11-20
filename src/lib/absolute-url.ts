const SITE_URL = "https://www.rmotion.fr";

// Renvoie une URL absolue valide pour les données structurées (schema.org), Merchant Center, etc.
// Les images peuvent être un chemin relatif ("/gammes/laser-1.jpg") ou déjà une URL complète
// (Vercel Blob : "https://….public.blob.vercel-storage.com/…") : on ne préfixe le domaine
// que dans le premier cas, sinon on obtient « https://www.rmotion.frhttps://… » (URL invalide).
export function absoluteUrl(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  return `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}
