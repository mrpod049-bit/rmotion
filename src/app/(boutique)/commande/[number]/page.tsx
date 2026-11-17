import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import pool from "@/lib/db";
import { requireUser } from "@/lib/shop/auth";
import { eur, fmtDateTime } from "@/lib/shop/core";
import { abandonOrder, retryPayment } from "../actions";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };

// Page de retour après paiement (succès / annulation Stripe) ou commande à 30 jours.
// L'état fait foi côté serveur (webhook Stripe), pas le paramètre d'URL.
export default async function OrderReturnPage({ params, searchParams }: {
  params: Promise<{ number: string }>; searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { number } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/commande/${number}`);
  const o = (await pool.query(
    "SELECT number, status, payment_status, payment_method, total_ttc, reserved_until, created_at FROM shop_orders WHERE number=$1 AND customer_id=$2",
    [number, user.customer_id])).rows[0];
  if (!o) notFound();

  const ok = o.status !== "pending_payment" && o.status !== "cancelled";
  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      {sp.err && <p className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sp.err}</p>}
      {ok ? (
        <>
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-semibold mb-2">Merci, commande {o.number} confirmée</h1>
          <p className="text-gray-600 mb-6">
            {o.payment_method === "net30" ? "Règlement à réception de facture." : "Paiement reçu."} Un email de confirmation vous a été envoyé. Nous préparons votre colis.
          </p>
        </>
      ) : o.status === "pending_payment" && o.payment_status === "processing" ? (
        <>
          <h1 className="text-2xl font-semibold mb-2">Commande {o.number} enregistrée</h1>
          <p className="text-gray-600 mb-6">Votre prélèvement SEPA est en cours de traitement (quelques jours ouvrés). Le stock vous est réservé ; vous serez prévenu par email dès confirmation.</p>
        </>
      ) : o.status === "pending_payment" ? (
        <>
          <h1 className="text-2xl font-semibold mb-2">Paiement {sp.paiement === "ok" ? "en cours de confirmation" : "non finalisé"}</h1>
          <p className="text-gray-600 mb-6">
            {sp.paiement === "ok"
              ? "Nous attendons la confirmation de votre banque, cela prend généralement quelques secondes. Rafraîchissez la page."
              : `Commande ${o.number} — ${eur(o.total_ttc)} TTC. Vos articles restent réservés jusqu'à ${fmtDateTime(o.reserved_until)}.`}
          </p>
          {sp.paiement !== "ok" && (
            <div className="flex justify-center gap-3">
              <form action={retryPayment}><input type="hidden" name="number" value={o.number} /><button className="rounded bg-gray-900 px-5 py-2 text-white">Payer maintenant</button></form>
              <form action={abandonOrder}><input type="hidden" name="number" value={o.number} /><button className="rounded border border-gray-300 px-5 py-2">Annuler et revenir au panier</button></form>
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-2">Commande {o.number} annulée</h1>
          <p className="text-gray-600 mb-6">Le délai de paiement a expiré ou la commande a été annulée. <Link href="/panier" className="underline">Retour au panier</Link></p>
        </>
      )}
      <div className="mt-8 flex justify-center gap-4 text-sm">
        <Link href={`/compte/commandes/${o.number}`} className="underline">Détail de la commande</Link>
        <Link href="/outils" className="underline">Continuer mes achats</Link>
      </div>
    </div>
  );
}
