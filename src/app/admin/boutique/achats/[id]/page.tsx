import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { adminAllVariantsLite } from "@/lib/shop/catalog";
import { fmtDate } from "@/lib/shop/core";
import { Badge, Card, Flash, Title, btn, btnDanger, btnLight, input, th, td, type SP } from "../../_ui";
import { cancelPo, receivePo, sendPo } from "../actions";
import PoEditor from "./PoEditor";

export default async function PurchaseOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const sp = await searchParams;
  const po = (await pool.query(
    "SELECT po.*, s.name AS supplier_name FROM shop_purchase_orders po JOIN shop_suppliers s ON s.id=po.supplier_id WHERE po.id=$1",
    [Number(id)])).rows[0];
  if (!po) notFound();
  const lines = (await pool.query(
    `SELECT l.*, v.sku, v.label, p.name AS product_name FROM shop_purchase_order_lines l
     JOIN shop_variants v ON v.id=l.variant_id JOIN shop_products p ON p.id=v.product_id
     WHERE l.po_id=$1 ORDER BY l.id`, [po.id])).rows;
  const variants = await adminAllVariantsLite();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Title action={<div className="flex gap-2">
        <Link href={`/admin/boutique/achats/${po.id}/imprimer`} className={btnLight} target="_blank">Imprimer / PDF</Link>
        <Link href="/admin/boutique/achats" className={btnLight}>← Achats</Link>
      </div>}>
        {po.number} <span className="text-gray-400 font-normal">— {po.supplier_name}</span> <Badge s={po.status} />
      </Title>
      <Flash sp={sp} />
      <p className="text-sm text-gray-500 mb-6">Créé le {fmtDate(po.created_at)}{po.sent_at && ` · envoyé le ${fmtDate(po.sent_at)}`}{po.received_at && ` · reçu le ${fmtDate(po.received_at)}`}</p>

      <PoEditor
        poId={po.id}
        editable={po.status === "draft"}
        initial={{
          expected_at: po.expected_at ? new Date(po.expected_at).toISOString().slice(0, 10) : "",
          notes: po.notes ?? "",
          lines: lines.map((l) => ({ variant_id: l.variant_id, supplier_ref: l.supplier_ref ?? "", qty_ordered: l.qty_ordered, unit_cost: Number(l.unit_cost) })),
        }}
        variants={variants}
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {po.status === "draft" && (
          <form action={sendPo}><input type="hidden" name="id" value={po.id} /><button className={btn}>Marquer comme envoyé au fournisseur</button></form>
        )}
        {["draft", "sent"].includes(po.status) && (
          <form action={cancelPo}><input type="hidden" name="id" value={po.id} /><button className={btnDanger}>Annuler le BCF</button></form>
        )}
      </div>

      {["sent", "partial"].includes(po.status) && (
        <Card title="Réception de marchandise → entrée en stock" className="mt-8">
          <p className="text-xs text-gray-500 mb-3">Saisissez les quantités effectivement reçues (en unités de vente). Le stock et le coût d&apos;achat des références sont mis à jour immédiatement.</p>
          <form action={receivePo}>
            <input type="hidden" name="id" value={po.id} />
            <table className="w-full text-sm mb-3">
              <thead className="text-gray-500"><tr>{["Réf.", "Désignation", "Commandé", "Déjà reçu", "Reçu maintenant"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td className={`${td} font-mono text-xs`}>{l.sku}</td>
                    <td className={td}>{l.product_name} <span className="text-gray-400">{l.label}</span></td>
                    <td className={td}>{l.qty_ordered}</td>
                    <td className={td}>{l.qty_received}</td>
                    <td className={td}><input name={`recv_${l.id}`} type="number" min="0" className={`${input} w-24`} defaultValue={Math.max(0, l.qty_ordered - l.qty_received) || ""} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className={btn}>Valider la réception</button>
          </form>
        </Card>
      )}
    </div>
  );
}
