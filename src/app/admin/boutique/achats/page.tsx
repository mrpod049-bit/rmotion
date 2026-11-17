import Link from "next/link";
import pool from "@/lib/db";
import { eur, fmtDate } from "@/lib/shop/core";
import { lowStock } from "@/lib/shop/purchasing";
import { Badge, Card, Flash, Title, btn, input, th, td, type SP } from "../_ui";
import { newPurchaseOrder } from "./actions";

export default async function PurchasesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [pos, suppliers, low] = await Promise.all([
    pool.query(
      `SELECT po.*, s.name AS supplier_name,
              COALESCE(SUM(l.qty_ordered * l.unit_cost),0)::float AS total,
              COALESCE(SUM(l.qty_ordered),0)::int AS q_ord, COALESCE(SUM(l.qty_received),0)::int AS q_rec
       FROM shop_purchase_orders po JOIN shop_suppliers s ON s.id=po.supplier_id
       LEFT JOIN shop_purchase_order_lines l ON l.po_id=po.id
       GROUP BY po.id, s.name ORDER BY po.created_at DESC LIMIT 200`),
    pool.query("SELECT id, name FROM shop_suppliers WHERE active ORDER BY name"),
    lowStock(),
  ]);
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Title>Achats fournisseurs</Title>
      <Flash sp={sp} />
      <form action={newPurchaseOrder} className="mb-6 flex flex-wrap items-end gap-2">
        <select name="supplier_id" className={`${input} w-64`} required defaultValue="">
          <option value="" disabled>Fournisseur…</option>
          {suppliers.rows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className={btn}>+ Nouveau bon de commande</button>
        {suppliers.rowCount === 0 && <Link href="/admin/boutique/fournisseurs" className="text-sm text-blue-700 underline">Créer d&apos;abord un fournisseur</Link>}
      </form>

      {low.length > 0 && (
        <Card title={`À réapprovisionner (${low.length})`} className="mb-6">
          <table className="w-full text-sm">
            <thead className="text-gray-500"><tr>{["Réf.", "Produit", "Disponible", "Seuil", "Déjà commandé"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {low.map((r) => (
                <tr key={r.id}>
                  <td className={`${td} font-mono text-xs`}>{r.sku}</td>
                  <td className={td}>{r.product_name}</td>
                  <td className={`${td} text-red-600`}>{Number(r.on_hand) - Number(r.reserved)}</td>
                  <td className={td}>{r.reorder_threshold}</td>
                  <td className={td}>{r.incoming || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500"><tr>{["N°", "Fournisseur", "Statut", "Créé", "Attendu", "Reçu", "Montant HT"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {pos.rows.map((p) => (
              <tr key={p.id}>
                <td className={td}><Link href={`/admin/boutique/achats/${p.id}`} className="font-medium underline">{p.number}</Link></td>
                <td className={td}>{p.supplier_name}</td>
                <td className={td}><Badge s={p.status} /></td>
                <td className={td}>{fmtDate(p.created_at)}</td>
                <td className={td}>{fmtDate(p.expected_at)}</td>
                <td className={td}>{p.q_rec} / {p.q_ord}</td>
                <td className={td}>{eur(p.total)}</td>
              </tr>
            ))}
            {pos.rowCount === 0 && <tr><td className={td} colSpan={7}>Aucun bon de commande.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
