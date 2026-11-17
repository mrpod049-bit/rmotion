"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/shop/auth";

const MAX_QTY = 9999;

export async function addToCart(fd: FormData) {
  const variantId = Number(fd.get("variant_id"));
  const qty = Math.min(MAX_QTY, Math.max(1, Math.trunc(Number(fd.get("qty")) || 1)));
  const back = String(fd.get("back") || "/outils");
  const user = await getCurrentUser();
  if (!user) redirect(`/compte/connexion?next=${encodeURIComponent(back)}`);
  const ok = await pool.query(
    `SELECT 1 FROM shop_variants v JOIN shop_products p ON p.id=v.product_id WHERE v.id=$1 AND v.active AND p.published`, [variantId]
  );
  if (!ok.rowCount) redirect(`${back}?err=${encodeURIComponent("Référence indisponible.")}`);
  await pool.query(
    `INSERT INTO shop_cart_items (user_id, variant_id, qty) VALUES ($1,$2,$3)
     ON CONFLICT (user_id, variant_id) DO UPDATE SET qty = LEAST(shop_cart_items.qty + EXCLUDED.qty, ${MAX_QTY})`,
    [user.id, variantId, qty]
  );
  revalidatePath("/", "layout");
  redirect(`${back}?ajoute=${variantId}`);
}

export async function updateCart(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/compte/connexion?next=/panier");
  for (const [k, v] of fd.entries()) {
    const m = /^qty_(\d+)$/.exec(k);
    if (!m) continue;
    const q = Math.trunc(Number(v));
    if (!Number.isFinite(q)) continue;
    if (q <= 0) await pool.query("DELETE FROM shop_cart_items WHERE user_id=$1 AND variant_id=$2", [user.id, Number(m[1])]);
    else await pool.query("UPDATE shop_cart_items SET qty=$3 WHERE user_id=$1 AND variant_id=$2", [user.id, Number(m[1]), Math.min(q, MAX_QTY)]);
  }
  revalidatePath("/", "layout");
  redirect("/panier");
}

export async function removeFromCart(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/compte/connexion?next=/panier");
  await pool.query("DELETE FROM shop_cart_items WHERE user_id=$1 AND variant_id=$2", [user.id, Number(fd.get("variant_id"))]);
  revalidatePath("/", "layout");
  redirect("/panier");
}
