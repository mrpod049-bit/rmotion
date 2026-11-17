import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { fmtDate, getSettings } from "@/lib/shop/core";
import { AddressBlock, PrintDoc } from "../../../_print";

// Bon de livraison : joint au colis, sans prix.
export default async function DeliveryNote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = (await pool.query("SELECT * FROM shop_orders WHERE id=$1", [Number(id)])).rows[0];
  if (!o) notFound();
  const lines = (await pool.query("SELECT * FROM shop_order_lines WHERE order_id=$1 ORDER BY id", [o.id])).rows;
  const { company } = await getSettings();
  return (
    <PrintDoc company={company} title="Bon de livraison" number={o.number.replace(/^CMD/, "BL")} date={fmtDate(o.shipped_at ?? new Date())}>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <AddressBlock title="Livré à" a={o.shipping_address} />
        <div>
          <AddressBlock title="Client" a={o.billing_address} />
          <div className="mt-2">Commande {o.number} du {fmtDate(o.created_at)}</div>
          {o.customer_po && <div>Votre référence : <strong>{o.customer_po}</strong></div>}
          {o.carrier && <div>Transporteur : {o.carrier} {o.tracking_number}</div>}
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead><tr className="border-b border-gray-400 text-left"><th className="py-1">Réf.</th><th>Désignation</th><th className="text-right">Qté commandée</th><th className="text-right">Qté livrée</th></tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b border-gray-200">
              <td className="py-1 font-mono text-xs">{l.sku}</td>
              <td>{l.label}{l.pack_qty > 1 && ` (boîte de ${l.pack_qty})`}</td>
              <td className="text-right">{l.qty}</td>
              <td className="text-right">{l.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-12 grid grid-cols-2 gap-6 text-sm">
        <div>Réserves éventuelles à indiquer sur le bon du transporteur et à nous signaler sous 48 h.</div>
        <div>Date et signature du destinataire :<div className="mt-10 border-b border-gray-400" /></div>
      </div>
    </PrintDoc>
  );
}
