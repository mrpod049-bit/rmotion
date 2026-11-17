import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import pool from "@/lib/db";
import { requireUser } from "@/lib/shop/auth";
import { eur, fmtDate, fmtDateTime, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/shop/core";
import { VAT_MENTIONS, type VatRegime } from "@/lib/shop/pricing";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };

export default async function CustomerOrder({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await requireUser(`/compte/commandes/${number}`);
  const o = (await pool.query("SELECT * FROM shop_orders WHERE number=$1 AND customer_id=$2", [number, user.customer_id])).rows[0];
  if (!o) notFound();
  const lines = (await pool.query("SELECT * FROM shop_order_lines WHERE order_id=$1 ORDER BY id", [o.id])).rows;
  const steps = ["confirmed", "preparing", "shipped", "delivered"];
  const reached = steps.indexOf(o.status);
  const a = o.shipping_address;
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/compte" className="text-sm text-gray-500 hover:underline">← Mon compte</Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">Commande {o.number}</h1>
      <p className="text-sm text-gray-500 mb-6">Passée le {fmtDateTime(o.created_at)}{o.customer_po && ` · votre réf. ${o.customer_po}`} · {ORDER_STATUS[o.status]} · {PAYMENT_STATUS[o.payment_status]}</p>

      {o.status !== "cancelled" && o.status !== "pending_payment" && (
        <ol className="mb-8 grid grid-cols-4 gap-2 text-xs">
          {["Confirmée", "En préparation", "Expédiée", "Livrée"].map((l, i) => (
            <li key={l} className={`rounded px-2 py-2 text-center ${i <= reached ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>{l}</li>
          ))}
        </ol>
      )}
      {o.status === "pending_payment" && (
        <p className="mb-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Paiement non finalisé. <Link href={`/commande/${o.number}`} className="underline">Finaliser le paiement</Link>
        </p>
      )}
      {o.tracking_number && <p className="mb-6 text-sm">Suivi {o.carrier} : <strong>{o.tracking_number}</strong> (expédiée le {fmtDate(o.shipped_at)})</p>}

      <table className="w-full text-sm mb-4">
        <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Réf.</th><th>Désignation</th><th className="text-right">Qté</th><th className="text-right">PU HT</th><th className="text-right">Total HT</th></tr></thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((l) => (
            <tr key={l.id}><td className="py-1 font-mono text-xs">{l.sku}</td><td>{l.label}</td><td className="text-right">{l.qty}</td><td className="text-right">{eur(l.unit_price_ht)}</td><td className="text-right">{eur(l.line_total_ht)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="text-sm text-right space-y-0.5 mb-8">
        <div>Port HT : {eur(o.shipping_ht)}</div>
        <div>Total HT : <strong>{eur(o.total_ht)}</strong></div>
        <div className="text-gray-600">{VAT_MENTIONS[o.vat_regime as VatRegime]} : {eur(o.vat_amount)}</div>
        <div className="text-base">Total TTC : <strong>{eur(o.total_ttc)}</strong></div>
        {o.payment_method === "net30" && <div className="text-gray-500">Règlement par virement, échéance le {fmtDate(o.due_date)}</div>}
      </div>
      <div className="text-sm"><div className="text-gray-500">Livraison</div>{a.company}{a.contact && ` — ${a.contact}`}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.postal_code} {a.city}</div>
      <p className="mt-8 text-xs text-gray-400">La facture vous sera transmise par voie électronique.</p>
    </div>
  );
}
