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
  const staticPaths = ["", "/machines", "/projet", "/philosophie", "/articles", "/devis", "/contact", "/cgu", "/confidentialite", "/mentions-legales"];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
    alternates: alternates(p || "/"),
  }));

  let machineEntries: MetadataRoute.Sitemap = [];
  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const machines = await pool.query("SELECT slug FROM machines WHERE published = true");
    machineEntries = machines.rows.map((m) => ({
      url: `${SITE}/machines/${m.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: alternates(`/machines/${m.slug}`),
    }));
    const articles = await pool.query(
      "SELECT slug, published_at FROM articles WHERE published = true"
    );
    articleEntries = articles.rows.map((a) => ({
      url: `${SITE}/articles/${a.slug}`,
      lastModified: a.published_at || new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: alternates(`/articles/${a.slug}`),
    }));
  } catch {
    // en cas d'indisponibilité de la base, on renvoie au moins les pages statiques
  }

  return [...staticEntries, ...machineEntries, ...articleEntries];
}
