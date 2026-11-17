import "server-only";
import Stripe from "stripe";

// Client Stripe paresseux : sans STRIPE_SECRET_KEY, le paiement en ligne est
// simplement indisponible (le reste de la boutique fonctionne).
let client: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Paiement en ligne non configuré (STRIPE_SECRET_KEY manquante).");
  if (!client) client = new Stripe(key);
  return client;
}

/** true si la clé est une clé de TEST (sk_test_…) : affiché dans l'admin. */
export const stripeTestMode = () => (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");
