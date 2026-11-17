import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { fmtDate, getSettings } from "@/lib/shop/core";
import { AddressBlock, PrintDoc } from "../../../_print";

// Bon de préparation (picking list) : trié par emplacement, avec cases à cocher.
export default async function PickingList({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = (await pool.query("SELECT * FROM shop_orders WHERE id=$1", [Number(id)])).rows[0];
  if (!o) notFound();
  const lines = (await pool.query(
    `SELECT l.*, s.location FROM shop_order_lines l LEFT JOIN shop_stock s ON s.variant_id=l.variant_id
     WHERE l.order_id=$1 ORDER BY s.location NULLS LAST, l.sku`, [o.id])).rows;
  const { company } = await getSettings();
  return (
    <PrintDoc company={company} title="Bon de préparation" number={o.number} date={fmtDate(o.created_at)}>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <AddressBlock title="Livrer à" a={o.shipping_address} />
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Commande</div>
          <div>{o.customer_snapshot.company_name}</div>
          {o.customer_po && <div>Réf. client : {o.customer_po}</div>}
          <div>Poids théorique : {(o.total_weight_g / 1000).toFixed(2)} kg</div>
          {o.customer_note && <div className="mt-2 italic">« {o.customer_note} »</div>}
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead><tr className="border-b border-gray-400 text-left"><th className="py-1 w-8">✓</th><th>Empl.</th><th>Réf.</th><th>Désignation</th><th className="text-right">Qté</th></tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b border-gray-200">
              <td className="py-2"><span className="inline-block h-4 w-4 border border-gray-500" /></td>
              <td className="font-mono">{l.location || "—"}</td>
              <td className="font-mono text-xs">{l.sku}</td>
              <td>{l.label}{l.pack_qty > 1 && ` (boîte de ${l.pack_qty})`}</td>
              <td className="text-right text-base font-semibold">{l.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-10 grid grid-cols-2 gap-6 text-sm">
        <div>Préparé par : ____________________</div>
        <div>Nombre de colis : ______</div>
      </div>
    </PrintDoc>
  );
}
