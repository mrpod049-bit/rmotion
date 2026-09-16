"use server";
import pool from "@/lib/db";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";
import type { Spec, MachineInput } from "./types";

const cleanSpecs = (a?: Spec[]) =>
  (a ?? []).map((s) => ({ label: (s.label || "").trim(), value: (s.value || "").trim() })).filter((s) => s.label || s.value);
const cleanStrings = (a?: string[]) => (a ?? []).map((s) => (s || "").trim()).filter(Boolean);
const cleanImages = (a?: string[]) => (a ?? []).map((s) => (s || "").trim()).filter(Boolean);

async function revalidateAll(slug?: string) {
  revalidatePath("/admin/produits");
  revalidatePath("/products");
  revalidatePath("/");
  if (slug) revalidatePath(`/products/${slug}`);
  // Surfaces SEO générées depuis la base : à rafraîchir aussi pour que la gestion
  // autonome des fiches se reflète tout de suite (sinon ISR jusqu'à 1 h).
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
}

export async function saveMachine(data: MachineInput): Promise<{ ok: boolean; error?: string; id?: number; slug?: string }> {
  const name = (data.name || "").trim();
  if (!name) return { ok: false, error: "Le nom est obligatoire." };
  if (!data.category_id) return { ok: false, error: "La catégorie est obligatoire." };
  const slug = slugify(data.slug || name);
  if (!slug) return { ok: false, error: "Slug invalide." };

  const specs = JSON.stringify(cleanSpecs(data.specs));
  const specsEn = JSON.stringify(cleanSpecs(data.specs_en));
  const options = cleanStrings(data.options);
  const optionsEn = cleanStrings(data.options_en);
  const images = cleanImages(data.images);
  const price = data.price_range && String(data.price_range).trim() !== "" ? String(data.price_range).trim() : null;

  const vals = [
    data.category_id, name, data.name_en?.trim() || null, slug,
    data.tagline?.trim() || null, data.tagline_en?.trim() || null,
    data.description?.trim() || null, data.description_en?.trim() || null,
    specs, specsEn, options, optionsEn, price, images,
    Boolean(data.featured), Boolean(data.published),
  ];

  try {
    if (data.id) {
      await pool.query(
        `UPDATE machines SET category_id=$1, name=$2, name_en=$3, slug=$4, tagline=$5, tagline_en=$6,
           description=$7, description_en=$8, specs=$9::jsonb, specs_en=$10::jsonb, options=$11, options_en=$12,
           price_range=$13, images=$14, featured=$15, published=$16
         WHERE id=$17`,
        [...vals, data.id]
      );
    } else {
      const res = await pool.query(
        `INSERT INTO machines (category_id, name, name_en, slug, tagline, tagline_en, description, description_en,
           specs, specs_en, options, options_en, price_range, images, featured, published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16) RETURNING id`,
        vals
      );
      data.id = res.rows[0].id;
    }
  } catch (e) {
    const msg = (e as Error).message || "";
    if (/duplicate key|unique/i.test(msg)) return { ok: false, error: `Le slug « ${slug} » est déjà utilisé.` };
    return { ok: false, error: msg || "Échec de l'enregistrement." };
  }
  await revalidateAll(slug);
  return { ok: true, id: data.id!, slug };
}

export async function togglePublished(id: number, published: boolean): Promise<void> {
  const r = await pool.query("UPDATE machines SET published=$1 WHERE id=$2 RETURNING slug", [published, id]);
  await revalidateAll(r.rows[0]?.slug);
}

export async function deleteMachine(id: number): Promise<{ ok: boolean; error?: string }> {
  const client = await pool.connect();
  try {
    const cur = await client.query("SELECT slug, images FROM machines WHERE id=$1", [id]);
    if (cur.rowCount === 0) return { ok: false, error: "Fiche introuvable." };
    const slug: string = cur.rows[0].slug;
    const images: string[] = cur.rows[0].images || [];

    await client.query("BEGIN");
    // Détache les références sans ON DELETE (les liens CRM sont SET NULL / CASCADE en base).
    await client.query("UPDATE devis_requests SET machine_id=NULL WHERE machine_id=$1", [id]);
    await client.query("UPDATE ft_requests SET machine_id=NULL WHERE machine_id=$1", [id]);
    await client.query("DELETE FROM machines WHERE id=$1", [id]);
    await client.query("COMMIT");

    // Nettoyage best-effort des images Blob (pas les images locales /gammes).
    const blobUrls = images.filter((u) => u.includes(".public.blob.vercel-storage.com"));
    if (blobUrls.length) await del(blobUrls).catch(() => {});
    await revalidateAll(slug);
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return { ok: false, error: (e as Error).message || "Échec de la suppression." };
  } finally {
    client.release();
  }
}
