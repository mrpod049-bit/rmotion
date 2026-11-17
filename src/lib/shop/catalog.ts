import "server-only";
import { unstable_cache } from "next/cache";
import pool from "@/lib/db";

// Lectures catalogue. Les lectures publiques sont mises en cache (comme le reste
// du site, pour ne pas réveiller Neon à chaque visite de robot) et invalidées
// immédiatement par les actions admin / mouvements de stock via ces tags.
export const SHOP_TAGS = { catalog: "shop:catalog", stock: "shop:stock" } as const;

export type Spec = { label: string; value: string };

export type Category = { id: number; parent_id: number | null; name: string; slug: string; description: string | null; position: number };

export type Variant = {
  id: number; product_id: number; sku: string; label: string | null; iso_code: string | null;
  grade: string | null; material_groups: string | null; attributes: Record<string, string>;
  pack_qty: number; price_ht: number; cost_price: number | null; weight_g: number; ean: string | null;
  reorder_threshold: number; active: boolean; position: number;
};

export type Product = {
  id: number; category_id: number | null; category_name?: string | null; category_slug?: string | null;
  name: string; slug: string; brand: string | null; description: string | null;
  specs: Spec[]; images: string[]; published: boolean;
};

export type ProductCard = Product & { min_price: number | null; variant_count: number };

const numVariant = (v: Record<string, unknown>): Variant => ({
  ...(v as unknown as Variant),
  price_ht: Number(v.price_ht),
  cost_price: v.cost_price == null ? null : Number(v.cost_price),
});

export const MATERIAL_GROUPS: Record<string, { label: string; color: string }> = {
  P: { label: "Acier", color: "bg-blue-600" },
  M: { label: "Inox", color: "bg-yellow-500" },
  K: { label: "Fonte", color: "bg-red-600" },
  N: { label: "Non ferreux / alu", color: "bg-green-600" },
  S: { label: "Superalliages / titane", color: "bg-orange-500" },
  H: { label: "Matériaux trempés", color: "bg-gray-500" },
};

// ─── Public (cache) ──────────────────────────────────────────────────────
export const getCategories = unstable_cache(
  async (): Promise<Category[]> =>
    (await pool.query("SELECT * FROM shop_categories ORDER BY position, name")).rows,
  ["shop-categories"], { revalidate: 3600, tags: [SHOP_TAGS.catalog] }
);

export const listPublishedProducts = unstable_cache(
  async (categorySlug: string | null, q: string | null, material: string | null): Promise<ProductCard[]> => {
    const where = ["p.published", "v.active"];
    const args: unknown[] = [];
    if (categorySlug) {
      args.push(categorySlug);
      // inclut les sous-catégories directes
      where.push(`(c.slug = $${args.length} OR c.parent_id = (SELECT id FROM shop_categories WHERE slug = $${args.length}))`);
    }
    if (q) {
      args.push(`%${q.toLowerCase().replace(/\s+/g, "%")}%`);
      const i = args.length;
      where.push(`(LOWER(p.name) LIKE $${i} OR LOWER(COALESCE(p.brand,'')) LIKE $${i} OR LOWER(v.sku) LIKE $${i}
                  OR LOWER(COALESCE(v.iso_code,'')) LIKE $${i} OR LOWER(COALESCE(v.label,'')) LIKE $${i}
                  OR LOWER(COALESCE(v.grade,'')) LIKE $${i})`);
    }
    if (material && /^[PMKNSH]$/.test(material)) {
      args.push(material);
      where.push(`POSITION($${args.length} IN COALESCE(v.material_groups,'')) > 0`);
    }
    const r = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              MIN(v.price_ht)::float AS min_price, COUNT(DISTINCT v.id)::int AS variant_count
       FROM shop_products p
       JOIN shop_variants v ON v.product_id = p.id
       LEFT JOIN shop_categories c ON c.id = p.category_id
       WHERE ${where.join(" AND ")}
       GROUP BY p.id, c.name, c.slug
       ORDER BY c.name NULLS LAST, p.name
       LIMIT 300`,
      args
    );
    return r.rows;
  },
  ["shop-products"], { revalidate: 3600, tags: [SHOP_TAGS.catalog] }
);

export const getPublishedProduct = unstable_cache(
  async (slug: string): Promise<{ product: Product; variants: Variant[]; compatible: ProductCard[] } | null> => {
    const p = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM shop_products p LEFT JOIN shop_categories c ON c.id = p.category_id
       WHERE p.slug=$1 AND p.published`, [slug]
    );
    if (!p.rows[0]) return null;
    const product = p.rows[0] as Product;
    const v = await pool.query(
      "SELECT * FROM shop_variants WHERE product_id=$1 AND active ORDER BY position, sku", [product.id]
    );
    const compat = await pool.query(
      `SELECT p.*, NULL::float AS min_price, 0 AS variant_count FROM shop_products p
       WHERE p.published AND p.id IN (
         SELECT compatible_id FROM shop_product_compat WHERE product_id=$1
         UNION SELECT product_id FROM shop_product_compat WHERE compatible_id=$1)
       ORDER BY p.name`, [product.id]
    );
    return { product, variants: v.rows.map(numVariant), compatible: compat.rows };
  },
  ["shop-product"], { revalidate: 3600, tags: [SHOP_TAGS.catalog] }
);

/** Disponibilité publique, cache court (le contrôle qui fait foi a lieu à la commande). */
export const getPublicAvailability = unstable_cache(
  async (variantIds: number[]): Promise<Record<number, number>> => {
    if (variantIds.length === 0) return {};
    const r = await pool.query(
      "SELECT variant_id, on_hand - reserved AS a FROM shop_stock WHERE variant_id = ANY($1::int[])", [variantIds]
    );
    const out: Record<number, number> = Object.fromEntries(variantIds.map((id) => [id, 0]));
    for (const row of r.rows) out[row.variant_id] = Number(row.a);
    return out;
  },
  ["shop-availability"], { revalidate: 300, tags: [SHOP_TAGS.stock] }
);

// ─── Admin (lectures directes, sans cache) ───────────────────────────────
export async function adminListProducts() {
  const r = await pool.query(
    `SELECT p.id, p.name, p.slug, p.brand, p.published, c.name AS category_name,
            COUNT(v.id)::int AS variant_count, MIN(v.price_ht)::float AS min_price,
            COALESCE(SUM(s.on_hand),0)::int AS on_hand, COALESCE(SUM(s.reserved),0)::int AS reserved
     FROM shop_products p
     LEFT JOIN shop_categories c ON c.id = p.category_id
     LEFT JOIN shop_variants v ON v.product_id = p.id
     LEFT JOIN shop_stock s ON s.variant_id = v.id
     GROUP BY p.id, c.name ORDER BY c.name NULLS LAST, p.name`
  );
  return r.rows;
}

export async function adminGetProduct(id: number) {
  const p = await pool.query("SELECT * FROM shop_products WHERE id=$1", [id]);
  if (!p.rows[0]) return null;
  const v = await pool.query(
    `SELECT v.*, COALESCE(s.on_hand,0) AS on_hand, COALESCE(s.reserved,0) AS reserved
     FROM shop_variants v LEFT JOIN shop_stock s ON s.variant_id = v.id
     WHERE v.product_id=$1 ORDER BY v.position, v.sku`, [id]
  );
  const compat = await pool.query(
    `SELECT p.id, p.name FROM shop_products p WHERE p.id IN (
       SELECT compatible_id FROM shop_product_compat WHERE product_id=$1
       UNION SELECT product_id FROM shop_product_compat WHERE compatible_id=$1) ORDER BY p.name`, [id]
  );
  return {
    product: p.rows[0] as Product,
    variants: v.rows.map((x) => ({ ...numVariant(x), on_hand: Number(x.on_hand), reserved: Number(x.reserved) })),
    compatible: compat.rows as { id: number; name: string }[],
  };
}

export async function adminAllProductsLite(): Promise<{ id: number; name: string }[]> {
  return (await pool.query("SELECT id, name FROM shop_products ORDER BY name")).rows;
}

export async function adminAllVariantsLite(): Promise<{ id: number; sku: string; label: string | null; product_name: string; cost_price: number | null }[]> {
  const r = await pool.query(
    `SELECT v.id, v.sku, v.label, p.name AS product_name, v.cost_price::float AS cost_price
     FROM shop_variants v JOIN shop_products p ON p.id = v.product_id ORDER BY p.name, v.sku`
  );
  return r.rows;
}
