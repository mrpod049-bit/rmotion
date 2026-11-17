import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { eur, fmtDate, getSettings } from "@/lib/shop/core";
import { AddressBlock, PrintDoc } from "../../../_print";

export default async function PrintPurchaseOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = (await pool.query(
    `SELECT po.*, s.name, s.contact, s.address, s.country, s.email, s.phone, s.vat_number AS supplier_vat, s.payment_terms, s.currency
     FROM shop_purchase_orders po JOIN shop_suppliers s ON s.id=po.supplier_id WHERE po.id=$1`, [Number(id)])).rows[0];
  if (!po) notFound();
  const lines = (await pool.query(
    `SELECT l.*, v.sku, v.label, p.name AS product_name FROM shop_purchase_order_lines l
     JOIN shop_variants v ON v.id=l.variant_id JOIN shop_products p ON p.id=v.product_id WHERE l.po_id=$1 ORDER BY l.id`, [po.id])).rows;
  const { company } = await getSettings();
  const total = lines.reduce((s, l) => s + l.qty_ordered * Number(l.unit_cost), 0);
  const money = (n: number) => po.currency === "EUR" ? eur(n) : `${n.toFixed(2)} ${po.currency}`;
  return (
    <PrintDoc company={company} title="Bon de commande" number={po.number} date={fmtDate(po.sent_at ?? po.created_at)}>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <AddressBlock title="Fournisseur" a={{ company: po.name, contact: po.contact, address: po.address, country: po.country, phone: po.phone }} />
        <AddressBlock title="Livrer à" a={{ company: company.name, line1: company.address, postal_code: company.postal_code, city: company.city }} />
      </div>
      {po.expected_at && <p className="mb-2">Livraison souhaitée : <strong>{fmtDate(po.expected_at)}</strong></p>}
      {po.payment_terms && <p className="mb-4">Conditions de paiement : {po.payment_terms}</p>}
      <table className="w-full border-collapse mb-4">
        <thead><tr className="border-b border-gray-400 text-left">
          <th className="py-1">Votre réf.</th><th>Notre réf.</th><th>Désignation</th><th className="text-right">Qté</th><th className="text-right">PU HT</th><th className="text-right">Total HT</th>
        </tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b border-gray-200">
              <td className="py-1 font-mono text-xs">{l.supplier_ref || "—"}</td>
              <td className="font-mono text-xs">{l.sku}</td>
              <td>{l.product_name} {l.label}</td>
              <td className="text-right">{l.qty_ordered}</td>
              <td className="text-right">{money(Number(l.unit_cost))}</td>
              <td className="text-right">{money(l.qty_ordered * Number(l.unit_cost))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right text-base font-semibold">Total HT : {money(total)}</div>
      {po.notes && <p className="mt-6 whitespace-pre-line">{po.notes}</p>}
      <p className="mt-10 text-xs text-gray-500">Merci de rappeler le numéro {po.number} sur le bon de livraison et la facture.</p>
    </PrintDoc>
  );
}
