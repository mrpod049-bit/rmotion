import type { MetadataRoute } from "next";
import pool from "@/lib/db";

const SITE = "https://www.rmotion.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/machines", "/projet", "/philosophie", "/articles", "/devis", "/contact", "/cgu", "/confidentialite", "/mentions-legales"];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
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
    }));
    const articles = await pool.query(
      "SELECT slug, published_at FROM articles WHERE published = true"
    );
    articleEntries = articles.rows.map((a) => ({
      url: `${SITE}/articles/${a.slug}`,
      lastModified: a.published_at || new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    // en cas d'indisponibilité de la base, on renvoie au moins les pages statiques
  }

  return [...staticEntries, ...machineEntries, ...articleEntries];
}
