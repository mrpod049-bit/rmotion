import pool from "@/lib/db";
import { cachedRead, CACHE_TAGS } from "@/lib/cache";

// Type d'une machine du catalogue (liste et pages catégorie).
export type CatalogMachine = {
  id: number;
  slug: string;
  price_range: string | null;
  images: string[] | null;
  type: string; // "laser" | "cnc"
  name: string;
  tagline: string | null;
  category: string;
};

// Catalogue complet des machines publiées (champs traduits selon la locale).
// Lecture mise en cache (voir lib/cache.ts) : une requête par heure et par locale,
// réutilisée par /products, /products/laser, /products/cnc et le menu de navigation.
export const getMachines = cachedRead(
  async (en: boolean): Promise<CatalogMachine[]> => {
    const res = await pool.query(
      `SELECT m.id, m.slug, m.price_range, m.images, c.type,
              COALESCE(${en ? "m.name_en" : "NULL"}, m.name) AS name,
              COALESCE(${en ? "m.tagline_en" : "NULL"}, m.tagline) AS tagline,
              COALESCE(${en ? "c.name_en" : "NULL"}, c.name) AS category
       FROM machines m
       JOIN categories c ON c.id = m.category_id
       WHERE m.published = true
       ORDER BY c.type, m.name`
    );
    return res.rows as CatalogMachine[];
  },
  ["products-list"],
  [CACHE_TAGS.machines]
);
