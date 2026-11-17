import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import pool from "@/lib/db";
import { requireUser } from "@/lib/shop/auth";
import { eur, getSettings, COUNTRY_NAMES } from "@/lib/shop/core";
import { cartLines, computeTotals, VAT_MENTIONS } from "@/lib/shop/pricing";
import { outstanding } from "@/lib/shop/orders";
import { stripeConfigured } from "@/lib/shop/stripe";
import { placeOrder } from "./actions";

export const metadata: Metadata = { title: "Validation de la commande", robots: { index: false } };

type Addr = { id: number; kind: string; company: string; contact: string | null; line1: string; line2: string | null; postal_code: string; city: string; country: string; is_default: boolean };
const fmtAddr = (a: Addr) => `${a.company}${a.contact ? ` — ${a.contact}` : ""}, ${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.postal_code} ${a.city}${a.country !== "FR" ? `, ${COUNTRY_NAMES[a.country] ?? a.country}` : ""}`;

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser("/commande");
  if (user.status !== "approved") redirect("/panier");
  const [lines, settings, addrRes] = await Promise.all([
    cartLines(user.id, user.discount_pct), getSettings(),
    pool.query("SELECT * FROM shop_addresses WHERE customer_id=$1 ORDER BY is_default DESC, id", [user.customer_id]),
  ]);
  if (lines.length === 0) redirect("/panier");
  const ships = addrRes.rows.filter((a: Addr) => a.kind === "shipping") as Addr[];
  const bills = addrRes.rows.filter((a: Addr) => a.kind === "billing") as Addr[];
  const ship = ships.find((a) => String(a.id) === sp.livraison) ?? ships[0];
  if (!ship || !bills[0]) {
    return <div className="max-w-3xl mx-auto px-6 py-10"><p>Ajoutez une adresse de livraison et de facturation dans <Link href="/compte" className="underline">votre compte</Link>.</p></div>;
  }
  const t = await computeTotals(lines, ship.country, user, settings);
  const out = user.payment_terms === "net30" ? await outstanding(user.customer_id) : 0;
  const net30Ok = user.payment_terms === "net30" && (user.credit_limit == null || out + t.total_ttc <= user.credit_limit);
  const online = stripeConfigured();
  const blocked = t.shipping_ht === null || (!online && !net30Ok) || t.subtotal_ht < settings.min_order_ht || lines.some((l) => !l.sellable || l.qty > l.available);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Validation de la commande</h1>
      {sp.err && <p className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sp.err}</p>}
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="font-semibold mb-2">Livraison</h2>
            <div className="space-y-2">
              {ships.map((a) => (
                <Link key={a.id} href={`/commande?livraison=${a.id}`} className={`block rounded border p-3 text-sm ${a.id === ship.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  {a.id === ship.id ? "● " : "○ "}{fmtAddr(a)}
                </Link>
              ))}
              <Link href="/compte" className="text-xs underline">Gérer mes adresses</Link>
            </div>
          </section>

          <form action={placeOrder} id="checkout" className="space-y-6">
            <input type="hidden" name="shipping_address_id" value={ship.id} />
            <section>
              <h2 className="font-semibold mb-2">Facturation</h2>
              <select name="billing_address_id" className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {bills.map((a) => <option key={a.id} value={a.id}>{fmtAddr(a)}</option>)}
              </select>
            </section>
            <section className="grid gap-3 sm:grid-cols-2">
              <div><label className="block text-xs text-gray-500 mb-1">Votre n° de commande interne (facultatif)</label>
                <input name="customer_po" maxLength={80} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Instruction de livraison (facultatif)</label>
                <input name="customer_note" maxLength={1000} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Horaires de réception, quai…" /></div>
            </section>
            <section>
              <h2 className="font-semibold mb-2">Règlement</h2>
              <div className="space-y-2 text-sm">
                {online && (
                  <label className="flex items-start gap-2 rounded border border-gray-200 p-3">
                    <input type="radio" name="payment_method" value="stripe" defaultChecked={!net30Ok} className="mt-1" />
                    <span><strong>Paiement en ligne sécurisé</strong> — carte bancaire ou prélèvement SEPA (Stripe). Le stock est réservé pendant le paiement.</span>
                  </label>
                )}
                {user.payment_terms === "net30" && (
                  <label className={`flex items-start gap-2 rounded border border-gray-200 p-3 ${net30Ok ? "" : "opacity-50"}`}>
                    <input type="radio" name="payment_method" value="net30" defaultChecked={net30Ok} disabled={!net30Ok} className="mt-1" />
                    <span><strong>Virement à {settings.net30_days} jours</strong> à réception de facture.
                      {!net30Ok && <span className="block text-red-600">Plafond d&apos;encours atteint ({eur(out)} / {eur(user.credit_limit ?? 0)}).</span>}</span>
                  </label>
                )}
                {!online && !net30Ok && <p className="text-red-600">Le paiement en ligne n&apos;est pas encore disponible. Contactez-nous pour commander.</p>}
              </div>
            </section>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="cgv" required className="mt-1" />
              <span>J&apos;ai lu et j&apos;accepte les <a href="/cgv" target="_blank" className="underline">conditions générales de vente</a>.</span>
            </label>
          </form>
        </div>

        <aside className="h-fit rounded-lg border border-gray-200 p-4 text-sm">
          <h2 className="font-semibold mb-3">Récapitulatif</h2>
          <ul className="mb-3 space-y-1">
            {lines.map((l) => <li key={l.variant_id} className="flex justify-between gap-2"><span>{l.qty} × <span className="font-mono text-xs">{l.sku}</span></span><span>{eur(l.line_total_ht)}</span></li>)}
          </ul>
          <div className="space-y-1 border-t pt-2">
            <div className="flex justify-between"><span>Sous-total HT</span><span>{eur(t.subtotal_ht)}</span></div>
            <div className="flex justify-between"><span>Port HT ({(t.weight_g / 1000).toFixed(2)} kg)</span><span>{t.shipping_ht === null ? "sur devis" : t.shipping_ht === 0 ? "offert" : eur(t.shipping_ht)}</span></div>
            <div className="flex justify-between font-medium"><span>Total HT</span><span>{eur(t.total_ht)}</span></div>
            <div className="flex justify-between text-gray-600"><span>{t.vat_regime === "fr" ? "TVA 20 %" : "TVA"}</span><span>{eur(t.vat_amount)}</span></div>
            {t.vat_regime !== "fr" && <p className="text-xs text-gray-500">{VAT_MENTIONS[t.vat_regime]}</p>}
            <div className="flex justify-between text-base font-semibold border-t pt-2"><span>Total TTC</span><span>{eur(t.total_ttc)}</span></div>
          </div>
          {t.shipping_ht === null && <p className="mt-3 text-red-600">Livraison non calculable pour cette destination : contactez-nous pour un devis.</p>}
          <button form="checkout" disabled={blocked} className="mt-4 w-full rounded bg-gray-900 py-2.5 text-white hover:bg-gray-700 disabled:bg-gray-300">
            Commander avec obligation de paiement
          </button>
          <Link href="/panier" className="mt-2 block text-center text-xs underline">Modifier le panier</Link>
        </aside>
      </div>
    </div>
  );
}
