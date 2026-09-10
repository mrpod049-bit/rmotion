import type { MetadataRoute } from "next";
import pool from "@/lib/db";

const SITE = "https://www.rmotion.fr";

// Chaque page existe en FR (racine) et en EN (/en). On déclare les deux versions
// et leurs alternances hreflang pour que les moteurs indexent les deux langues.
const alternates = (path: string) => ({
  languages: {
    fr: `${SITE}${path}`,
    en: `${SITE}/en${path}`,
    "x-default": `${SITE}${path}`,
  },
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages bilingues (FR à la racine + version /en traduite) -> alternances hreflang.
  const bilingualPaths = ["", "/products", "/projet", "/philosophie", "/articles", "/devis", "/contact"];
  // Pages uniquement en français (texte non traduit ; leur version /en se canonicalise
  // vers la version FR). Pas d'alternative hreflang « en » ici, sinon le sitemap
  // pointerait un hreflang vers une URL dont le canonical diffère (conflit Semrush).
  const frOnlyPaths = ["/cgu", "/confidentialite", "/mentions-legales"];

  const staticEntries: MetadataRoute.Sitemap = [
    ...bilingualPaths.map((p) => ({
      url: `${SITE}${p}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.7,
      // p="" pour l'accueil -> hreflang sans slash final (évite un 308 et un conflit
      // avec le <loc> qui, lui, n'a pas de slash). Ne pas remettre `p || "/"`.
      alternates: alternates(p),
    })),
    ...frOnlyPaths.map((p) => ({
      url: `${SITE}${p}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  let machineEntries: MetadataRoute.Sitemap = [];
  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const machines = await pool.query("SELECT slug, updated_at FROM machines WHERE published = true");
    machineEntries = machines.rows.map((m) => ({
      url: `${SITE}/products/${m.slug}`,
      lastModified: m.updated_at || new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: alternates(`/products/${m.slug}`),
    }));
    const articles = await pool.query(
      "SELECT slug, updated_at, published_at FROM articles WHERE published = true"
    );
    articleEntries = articles.rows.map((a) => ({
      url: `${SITE}/articles/${a.slug}`,
      lastModified: a.updated_at || a.published_at || new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: alternates(`/articles/${a.slug}`),
    }));
  } catch {
    // en cas d'indisponibilité de la base, on renvoie au moins les pages statiques
  }

  return [...staticEntries, ...machineEntries, ...articleEntries];
}
