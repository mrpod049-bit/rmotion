import Link from "next/link";
import pool from "@/lib/db";
import { eur, fmtDate } from "@/lib/shop/core";
import { Badge, Flash, Title, btn, th, td, one, type SP } from "../_ui";
import { approve } from "./actions";

export default async function CustomersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const status = one(sp.status);
  const rows = (await pool.query(
    `SELECT c.*, u.email, u.name,
            (SELECT COUNT(*)::int FROM shop_orders o WHERE o.customer_id=c.id AND o.status<>'cancelled') AS n_orders,
            (SELECT COALESCE(SUM(total_ht),0)::float FROM shop_orders o WHERE o.customer_id=c.id AND o.status NOT IN ('cancelled','pending_payment')) AS revenue
     FROM shop_customers c
     LEFT JOIN LATERAL (SELECT email, name FROM shop_users WHERE customer_id=c.id ORDER BY (role='owner') DESC, id LIMIT 1) u ON true
     WHERE ($1 = '' OR c.status = $1)
     ORDER BY (c.status='pending') DESC, c.created_at DESC LIMIT 500`, [status])).rows;
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Title>Comptes clients</Title>
      <Flash sp={sp} />
      <div className="mb-4 flex gap-2 text-sm">
        {[["", "Tous"], ["pending", "À valider"], ["approved", "Validés"], ["suspended", "Suspendus"], ["rejected", "Refusés"]].map(([k, l]) => (
          <Link key={k} href={k ? `?status=${k}` : "?"} className={`rounded-full px-3 py-1 ${status === k ? "bg-gray-900 text-white" : "bg-gray-100"}`}>{l}</Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500"><tr>{["Société", "Contact", "SIRET / TVA", "Statut", "Conditions", "Commandes", "CA HT", "Créé", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className={td}><Link className="font-medium underline" href={`/admin/boutique/clients/${c.id}`}>{c.company_name}</Link><div className="text-xs text-gray-400">{c.country} {c.naf_code && `· NAF ${c.naf_code}`}</div></td>
                <td className={td}>{c.name}<div className="text-xs text-gray-500">{c.email}</div></td>
                <td className={`${td} text-xs`}>{c.siret || "—"}<div>{c.vat_number || "—"} {c.vat_valid === false && <span className="text-red-600">✗</span>}</div></td>
                <td className={td}><Badge s={c.status} /></td>
                <td className={`${td} text-xs`}>{Number(c.discount_pct) ? `-${Number(c.discount_pct)} %` : "Tarif public"}<div>{c.payment_terms === "net30" ? "30 jours" : "Paiement à la commande"}</div></td>
                <td className={td}>{c.n_orders}</td>
                <td className={td}>{eur(c.revenue)}</td>
                <td className={td}>{fmtDate(c.created_at)}</td>
                <td className={td}>{c.status === "pending" && (
                  <form action={approve}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="back" value="/admin/boutique/clients" /><button className={btn}>Valider</button></form>
                )}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className={td} colSpan={9}>Aucun compte.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
