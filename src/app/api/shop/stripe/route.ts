import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { getStripe } from "@/lib/shop/stripe";
import { cancelPending, markPaid, markPaymentFailed, markPaymentProcessing } from "@/lib/shop/orders";
import { SHOP_TAGS } from "@/lib/shop/catalog";
import pool from "@/lib/db";

// Webhook Stripe : SEULE source de vérité pour l'état de paiement.
// Événements à activer dans Stripe → Développeurs → Webhooks (URL /api/shop/stripe) :
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   checkout.session.async_payment_failed, checkout.session.expired
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, req.headers.get("stripe-signature") || "", secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (!event.type.startsWith("checkout.session.")) return NextResponse.json({ received: true });
  const s = event.data.object as Stripe.Checkout.Session;
  const orderId = Number(s.metadata?.order_id || s.client_reference_id);
  if (!orderId) return NextResponse.json({ received: true });
  const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;

  try {
    switch (event.type) {
      case "checkout.session.completed":
        if (s.payment_status === "paid") await markPaid(orderId, pi);
        else await markPaymentProcessing(orderId, pi); // SEPA : résultat dans quelques jours
        break;
      case "checkout.session.async_payment_succeeded":
        await markPaid(orderId, pi);
        break;
      case "checkout.session.async_payment_failed":
        await markPaymentFailed(orderId, "prélèvement refusé");
        break;
      case "checkout.session.expired": {
        // N'annule que si c'est bien la session courante de la commande (pas une ancienne relancée).
        const cur = await pool.query("SELECT stripe_session_id FROM shop_orders WHERE id=$1", [orderId]);
        if (cur.rows[0]?.stripe_session_id === s.id) await cancelPending(orderId, "Session de paiement expirée", "stripe");
        break;
      }
    }
  } catch (e) {
    console.error("[shop] webhook Stripe", event.type, orderId, e);
    // 500 → Stripe réessaiera (les traitements sont idempotents).
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }
  // Expiration immédiate (updateTag n'est pas disponible hors action serveur).
  revalidateTag(SHOP_TAGS.stock, { expire: 0 });
  return NextResponse.json({ received: true });
}
