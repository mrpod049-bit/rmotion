import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { eur, fmtDate, fmtDateTime } from "@/lib/shop/core";
import { VAT_MENTIONS, type VatRegime } from "@/lib/shop/pricing";
import { AddressBlock } from "../../_print";
import { Badge, Card, Flash, Title, btn, btnDanger, btnLight, input, label, th, td, type SP } from "../../_ui";
import { addNote, cancel, cancelReturn, closeReturn, openReturn, registerPayment, toDelivered, toPreparing, toShipped } from "../actions";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const sp = await searchParams;
  const o = (await pool.query("SELECT * FROM shop_orders WHERE id=$1", [Number(id)])).rows[0];
  if (!o) notFound();
  const [lines, events, returns] = await Promise.all([
    pool.query(
      `SELECT l.*, s.location FROM shop_order_lines l LEFT JOIN shop_stock s ON s.variant_id=l.variant_id
       WHERE l.order_id=$1 ORDER BY l.id`, [o.id]),
    pool.query("SELECT * FROM shop_order_events WHERE order_id=$1 ORDER BY created_at, id", [o.id]),
    pool.query("SELECT * FROM shop_returns WHERE order_id=$1 ORDER BY id", [o.id]),
  ]);
  const margin = lines.rows.reduce((s, l) => s + (l.unit_cost == null ? 0 : (Number(l.unit_price_ht) - Number(l.unit_cost)) * l.qty), 0);
  const hidden = <input type="hidden" name="id" value={o.id} />;
  const active = ["confirmed", "preparing"].includes(o.status);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Title action={<div className="flex flex-wrap gap-2">
        <Link target="_blank" className={btnLight} href={`/admin/boutique/commandes/${o.id}/preparation`}>Bon de préparation</Link>
        <Link target="_blank" className={btnLight} href={`/admin/boutique/commandes/${o.id}/livraison`}>Bon de livraison</Link>
        <Link className={btnLight} href="/admin/boutique/commandes">← Commandes</Link>
      </div>}>
        {o.number} <Badge s={o.status} /> <Badge s={o.payment_status} />
      </Title>
      <Flash sp={sp} />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card title="Client">
          <div className="font-medium">{o.customer_snapshot.company_name}</div>
          <div className="text-sm text-gray-600">{o.customer_snapshot.user_name} — {o.customer_snapshot.email}</div>
          <div className="text-xs text-gray-500">SIRET {o.customer_snapshot.siret || "—"} · TVA {o.customer_snapshot.vat_number || "—"}</div>
          <Link href={`/admin/boutique/clients/${o.customer_id}`} className="text-xs text-blue-700 underline">Fiche client</Link>
          {o.customer_po && <div className="mt-2 text-sm">Réf. commande client : <strong>{o.customer_po}</strong></div>}
          {o.customer_note && <div className="mt-2 text-sm rounded bg-amber-50 p-2">« {o.customer_note} »</div>}
        </Card>
        <Card title="Livraison"><div className="text-sm"><AddressBlock title="" a={o.shipping_address} /></div></Card>
        <Card title="Facturation"><div className="text-sm"><AddressBlock title="" a={o.billing_address} /></div></Card>
      </div>

      <Card className="mb-6">
        <table className="w-full text-sm">
          <thead className="text-gray-500"><tr>{["Réf.", "Désignation", "Empl.", "Qté", "PU catalogue", "Remise", "PU net HT", "Total HT"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {lines.rows.map((l) => (
              <tr key={l.id}>
                <td className={`${td} font-mono text-xs`}>{l.sku}</td>
                <td className={td}>{l.label}{l.pack_qty > 1 && <span className="text-gray-400"> (boîte de {l.pack_qty})</span>}{l.qty_returned > 0 && <span className="text-amber-700"> — {l.qty_returned} retourné(s)</span>}</td>
                <td className={td}>{l.location || "—"}</td>
                <td className={td}>{l.qty}</td>
                <td className={td}>{eur(l.list_price_ht)}</td>
                <td className={td}>{Number(l.discount_pct) ? `${Number(l.discount_pct)} %` : "—"}</td>
                <td className={td}>{eur(l.unit_price_ht)}</td>
                <td className={td}>{eur(l.line_total_ht)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 grid gap-1 text-sm text-right">
          <div>Sous-total HT : {eur(o.subtotal_ht)}</div>
          <div>Port HT : {eur(o.shipping_ht)} <span className="text-gray-400">({(o.total_weight_g / 1000).toFixed(2)} kg)</span></div>
          <div>Total HT : <strong>{eur(o.total_ht)}</strong></div>
          <div className="text-gray-600">{VAT_MENTIONS[o.vat_regime as VatRegime]} : {eur(o.vat_amount)}</div>
          <div className="text-base">Total TTC : <strong>{eur(o.total_ttc)}</strong></div>
          <div className="text-xs text-gray-500">Marge brute produits : {eur(margin)} · Paiement : {o.payment_method === "net30" ? `30 jours (échéance ${fmtDate(o.due_date)})` : "en ligne (Stripe)"}{o.stripe_payment_intent && ` · ${o.stripe_payment_intent}`}</div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card title="Actions">
          <div className="space-y-3">
            {o.status === "confirmed" && <form action={toPreparing}>{hidden}<button className={btn}>Passer en préparation</button></form>}
            {active && (
              <form action={toShipped} className="flex flex-wrap items-end gap-2">
                {hidden}
                <div><label className={label}>Transporteur</label><input name="carrier" className={`${input} w-36`} placeholder="Colissimo" /></div>
                <div><label className={label}>N° de suivi</label><input name="tracking" className={`${input} w-48`} /></div>
                <button className={btn}>Marquer expédiée</button>
              </form>
            )}
            {o.status === "shipped" && (
              <div className="text-sm">Expédiée le {fmtDate(o.shipped_at)} — {o.carrier} {o.tracking_number}
                <form action={toDelivered} className="mt-2">{hidden}<button className={btn}>Marquer livrée</button></form>
              </div>
            )}
            {o.payment_method === "net30" && o.payment_status !== "paid" && o.status !== "cancelled" && (
              <form action={registerPayment}>{hidden}<button className={btnLight}>Enregistrer le règlement reçu (virement)</button></form>
            )}
            {(o.status === "pending_payment" || active) && (
              <form action={cancel} className="border-t pt-3 flex flex-wrap items-end gap-2">
                {hidden}
                <div><label className={label}>Motif d&apos;annulation</label><input name="reason" className={`${input} w-56`} /></div>
                {o.payment_status === "paid" && o.stripe_payment_intent && (
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="refund" defaultChecked /> Rembourser via Stripe</label>
                )}
                <button className={btnDanger}>Annuler la commande</button>
              </form>
            )}
            {o.status === "cancelled" && <p className="text-sm text-gray-500">Commande annulée le {fmtDateTime(o.cancelled_at)}.</p>}
          </div>
        </Card>

        <Card title="Historique">
          <ul className="space-y-1 text-sm mb-3">
            {events.rows.map((e) => (
              <li key={e.id} className={e.kind === "stock_conflict" ? "text-red-700 font-medium" : ""}>
                <span className="text-gray-400">{fmtDateTime(e.created_at)}</span> — {e.detail || e.kind} <span className="text-gray-400">({e.actor})</span>
              </li>
            ))}
          </ul>
          <form action={addNote} className="flex gap-2">{hidden}<input name="note" className={input} placeholder="Ajouter une note interne…" /><button className={btnLight}>+</button></form>
        </Card>
      </div>

      {(["shipped", "delivered"].includes(o.status) || returns.rowCount! > 0) && (
        <Card title="Retours">
          {returns.rows.map((r) => (
            <div key={r.id} className="mb-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-mono">{r.number}</span> <Badge s={r.status} /> {r.reason && <span className="text-gray-600">{r.reason}</span>}
              {r.status === "open" && <>
                <form action={closeReturn}><input type="hidden" name="return_id" value={r.id} /><input type="hidden" name="back" value={`/admin/boutique/commandes/${o.id}`} /><button className={btn}>Colis reçu{r.restock ? " → remettre en stock" : ""}</button></form>
                <form action={cancelReturn}><input type="hidden" name="return_id" value={r.id} /><input type="hidden" name="back" value={`/admin/boutique/commandes/${o.id}`} /><button className={btnLight}>Annuler</button></form>
              </>}
            </div>
          ))}
          {["shipped", "delivered"].includes(o.status) && (
            <form action={openReturn} className="mt-3 border-t pt-3">
              {hidden}
              <p className="text-xs text-gray-500 mb-2">Nouveau retour : quantités retournées par ligne. L&apos;avoir sera émis via la facturation (jalon 6).</p>
              <table className="text-sm mb-2">
                <tbody>
                  {lines.rows.map((l) => (
                    <tr key={l.id}><td className="pr-3 font-mono text-xs">{l.sku}</td><td className="pr-3">{l.label}</td><td className="pr-3 text-gray-500">max {l.qty - l.qty_returned}</td>
                      <td><input name={`ret_${l.id}`} type="number" min="0" max={l.qty - l.qty_returned} className={`${input} w-20`} /></td></tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap items-end gap-2">
                <div><label className={label}>Motif</label><input name="reason" className={`${input} w-64`} /></div>
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="restock" defaultChecked /> Remettre en stock à réception</label>
                <button className={btn}>Ouvrir le retour</button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
