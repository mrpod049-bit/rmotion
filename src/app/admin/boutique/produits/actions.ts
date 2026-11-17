"use server";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";
import { withTx } from "@/lib/shop/core";
import { attempt, refreshCatalog, str, int } from "../_server";

export type VariantInput = {
  id?: number; sku: string; label: string; iso_code: string; grade: string; material_groups: string;
  attributes: { key: string; value: string }[]; pack_qty: number; price_ht: number; cost_price: number | null;
  weight_g: number; ean: string; reorder_threshold: number; active: boolean;
};
export type ProductInput = {
  id?: number; category_id: number | null; name: string; slug: string; brand: string; description: string;
  specs: { label: string; value: string }[]; images: string[]; published: boolean;
  compat_ids: number[]; variants: VariantInput[];
};

const cleanMaterials = (s: string) =>
  Array.from(new Set((s || "").toUpperCase().replace(/[^PMKNSH]/g, "").split(""))).join("");

export async function saveProduct(data: ProductInput): Promise<{ ok: boolean; error?: string; id?: number }> {
  const name = (data.name || "").trim();
  if (!name) return { ok: false, error: "Le nom est obligatoire." };
  const slug = slugify(data.slug || name);
  if (!slug) return { ok: false, error: "Slug invalide." };
  const variants = (data.variants || []).map((v) => ({ ...v, sku: (v.sku || "").trim().toUpperCase() }));
  const skus = variants.map((v) => v.sku);
  if (skus.some((s) => !s)) return { ok: false, error: "Chaque déclinaison doit avoir une référence (SKU)." };
  if (new Set(skus).size !== skus.length) return { ok: false, error: "Deux déclinaisons ont la même référence." };
  for (const v of variants) {
    if (!(Number(v.price_ht) >= 0)) return { ok: false, error: `Prix invalide pour ${v.sku}.` };
    if (!(Number(v.pack_qty) >= 1)) return { ok: false, error: `Conditionnement invalide pour ${v.sku}.` };
  }
  if (data.published && variants.filter((v) => v.active).length === 0) {
    return { ok: false, error: "Un produit publié doit avoir au moins une déclinaison active." };
  }

  try {
    const id = await withTx(async (c) => {
      const vals = [
        data.category_id || null, name, slug, data.brand?.trim() || null, data.description?.trim() || null,
        JSON.stringify((data.specs || []).filter((s) => s.label?.trim() || s.value?.trim())),
        (data.images || []).filter(Boolean), Boolean(data.published),
      ];
      let pid = data.id;
      if (pid) {
        await c.query(
          `UPDATE shop_products SET category_id=$1, name=$2, slug=$3, brand=$4, description=$5, specs=$6::jsonb,
             images=$7, published=$8, updated_at=NOW() WHERE id=$9`, [...vals, pid]
        );
      } else {
        const r = await c.query(
          `INSERT INTO shop_products (category_id, name, slug, brand, description, specs, images, published)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8) RETURNING id`, vals
        );
        pid = r.rows[0].id as number;
      }

      // Déclinaisons : mise à jour / création ; celles retirées sont supprimées si
      // elles n'ont aucun historique, sinon simplement désactivées.
      const keep: number[] = [];
      for (const [i, v] of variants.entries()) {
        const attrs = Object.fromEntries((v.attributes || []).filter((a) => a.key?.trim()).map((a) => [a.key.trim(), (a.value || "").trim()]));
        const vv = [
          v.sku, v.label?.trim() || null, v.iso_code?.trim().toUpperCase() || null, v.grade?.trim() || null,
          cleanMaterials(v.material_groups) || null, JSON.stringify(attrs), Math.trunc(Number(v.pack_qty) || 1),
          Number(v.price_ht) || 0, v.cost_price == null || Number.isNaN(Number(v.cost_price)) ? null : Number(v.cost_price),
          Math.max(0, Math.trunc(Number(v.weight_g) || 0)), v.ean?.trim() || null,
          Math.max(0, Math.trunc(Number(v.reorder_threshold) || 0)), Boolean(v.active), i,
        ];
        if (v.id) {
          await c.query(
            `UPDATE shop_variants SET sku=$1, label=$2, iso_code=$3, grade=$4, material_groups=$5, attributes=$6::jsonb,
               pack_qty=$7, price_ht=$8, cost_price=$9, weight_g=$10, ean=$11, reorder_threshold=$12, active=$13, position=$14
             WHERE id=$15 AND product_id=$16`, [...vv, v.id, pid]
          );
          keep.push(v.id);
        } else {
          const r = await c.query(
            `INSERT INTO shop_variants (sku, label, iso_code, grade, material_groups, attributes, pack_qty, price_ht,
               cost_price, weight_g, ean, reorder_threshold, active, position, product_id)
             VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`, [...vv, pid]
          );
          keep.push(r.rows[0].id);
          await c.query("INSERT INTO shop_stock (variant_id) VALUES ($1) ON CONFLICT DO NOTHING", [r.rows[0].id]);
        }
      }
      const removed = await c.query(
        "SELECT id FROM shop_variants WHERE product_id=$1 AND NOT (id = ANY($2::int[]))", [pid, keep]
      );
      for (const r of removed.rows) {
        const used = await c.query(
          `SELECT EXISTS(SELECT 1 FROM shop_stock_movements WHERE variant_id=$1)
               OR EXISTS(SELECT 1 FROM shop_order_lines WHERE variant_id=$1)
               OR EXISTS(SELECT 1 FROM shop_purchase_order_lines WHERE variant_id=$1) AS used`, [r.id]
        );
        if (used.rows[0].used) await c.query("UPDATE shop_variants SET active=false WHERE id=$1", [r.id]);
        else await c.query("DELETE FROM shop_variants WHERE id=$1", [r.id]);
      }

      await c.query("DELETE FROM shop_product_compat WHERE product_id=$1 OR compatible_id=$1", [pid]);
      for (const cid of new Set(data.compat_ids || [])) {
        if (cid && cid !== pid) {
          await c.query("INSERT INTO shop_product_compat (product_id, compatible_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [pid, cid]);
        }
      }
      return pid;
    });
    refreshCatalog();
    revalidatePath("/admin/boutique/produits");
    return { ok: true, id };
  } catch (e) {
    const msg = (e as Error).message || "";
    if (/shop_products_slug_key/.test(msg)) return { ok: false, error: `Le slug « ${slug} » est déjà utilisé.` };
    if (/shop_variants_sku_key/.test(msg)) return { ok: false, error: "Une des références (SKU) existe déjà sur un autre produit." };
    return { ok: false, error: msg || "Échec de l'enregistrement." };
  }
}

export async function deleteProduct(fd: FormData) {
  const id = int(fd, "id");
  await attempt("/admin/boutique/produits", async () => {
    const used = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM shop_stock_movements m JOIN shop_variants v ON v.id=m.variant_id WHERE v.product_id=$1)
           OR EXISTS(SELECT 1 FROM shop_order_lines l JOIN shop_variants v ON v.id=l.variant_id WHERE v.product_id=$1)
           OR EXISTS(SELECT 1 FROM shop_purchase_order_lines l JOIN shop_variants v ON v.id=l.variant_id WHERE v.product_id=$1) AS used`, [id]
    );
    if (used.rows[0].used) throw new Error("Ce produit a un historique (stock, ventes ou achats) : dépubliez-le plutôt que de le supprimer.");
    await pool.query("DELETE FROM shop_products WHERE id=$1", [id]);
    refreshCatalog();
    return "Produit supprimé.";
  });
}

export async function saveCategory(fd: FormData) {
  await attempt("/admin/boutique/produits/categories", async () => {
    const id = int(fd, "id");
    const name = str(fd, "name");
    if (!name) throw new Error("Nom obligatoire.");
    const slug = slugify(str(fd, "slug") || name);
    const parent = int(fd, "parent_id");
    const vals = [name, slug, Number.isNaN(parent) ? null : parent, str(fd, "description") || null, int(fd, "position") || 0];
    try {
      if (!Number.isNaN(id)) {
        if (id === parent) throw new Error("Une catégorie ne peut pas être sa propre parente.");
        await pool.query("UPDATE shop_categories SET name=$1, slug=$2, parent_id=$3, description=$4, position=$5 WHERE id=$6", [...vals, id]);
      } else {
        await pool.query("INSERT INTO shop_categories (name, slug, parent_id, description, position) VALUES ($1,$2,$3,$4,$5)", vals);
      }
    } catch (e) {
      if (/shop_categories_slug_key/.test((e as Error).message)) throw new Error(`Le slug « ${slug} » existe déjà.`);
      throw e;
    }
    refreshCatalog();
    return "Catégorie enregistrée.";
  });
}

export async function deleteCategory(fd: FormData) {
  await attempt("/admin/boutique/produits/categories", async () => {
    await pool.query("DELETE FROM shop_categories WHERE id=$1", [int(fd, "id")]);
    refreshCatalog();
    return "Catégorie supprimée (les produits concernés sont sans catégorie).";
  });
}
