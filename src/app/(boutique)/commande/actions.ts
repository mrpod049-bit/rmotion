"use server";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/shop/auth";
import { cancelPending, createCheckoutSession, createOrder, OrderError } from "@/lib/shop/orders";
import { SHOP_TAGS } from "@/lib/shop/catalog";

const err = (path: string, m: string) => redirect(`${path}?err=${encodeURIComponent(m)}`);

export async function placeOrder(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/compte/connexion?next=/commande");
  if (fd.get("cgv") == null) err("/commande", "Merci d'accepter les conditions générales de vente.");
  let result: { number: string; checkoutUrl: string | null };
  try {
    result = await createOrder(user, {
      shipping_address_id: Number(fd.get("shipping_address_id")),
      billing_address_id: Number(fd.get("billing_address_id")),
      payment_method: fd.get("payment_method") === "net30" ? "net30" : "stripe",
      customer_po: String(fd.get("customer_po") ?? ""),
      customer_note: String(fd.get("customer_note") ?? ""),
    });
  } catch (e) {
    if (!(e instanceof OrderError)) console.error("[shop] commande :", e);
    err("/commande", e instanceof OrderError ? e.message : "Une erreur est survenue, votre panier est conservé.");
  }
  updateTag(SHOP_TAGS.stock);
  revalidatePath("/", "layout");
  redirect(result!.checkoutUrl ?? `/commande/${result!.number}?confirmee=1`);
}

async function ownPendingOrder(number: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/compte/connexion?next=/commande/${number}`);
  const o = (await pool.query(
    "SELECT id, status FROM shop_orders WHERE number=$1 AND customer_id=$2", [number, user.customer_id]
  )).rows[0];
  if (!o) redirect("/compte");
  return o as { id: number; status: string };
}

export async function retryPayment(fd: FormData) {
  const number = String(fd.get("number"));
  const o = await ownPendingOrder(number);
  let url: string;
  try {
    url = await createCheckoutSession(o.id);
  } catch (e) {
    err(`/commande/${number}`, (e as Error).message || "Paiement indisponible.");
  }
  redirect(url!);
}

export async function abandonOrder(fd: FormData) {
  const number = String(fd.get("number"));
  const o = await ownPendingOrder(number);
  await cancelPending(o.id, "Annulée par le client avant paiement", "client", true);
  updateTag(SHOP_TAGS.stock);
  revalidatePath("/", "layout");
  redirect("/panier");
}
