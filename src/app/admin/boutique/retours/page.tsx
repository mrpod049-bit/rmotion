import Link from "next/link";
import pool from "@/lib/db";
import { fmtDate } from "@/lib/shop/core";
import { Badge, Flash, Title, btn, btnLight, th, td, type SP } from "../_ui";
import { cancelReturn, closeReturn } from "../commandes/actions";

export default async function ReturnsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const rows = (await pool.query(
    `SELECT r.*, o.number AS order_number, o.id AS order_id, o.customer_snapshot->>'company_name' AS company,
            (SELECT SUM(qty)::int FROM shop_return_lines WHERE return_id=r.id) AS qty
     FROM shop_returns r JOIN shop_orders o ON o.id=r.order_id ORDER BY (r.status='open') DESC, r.created_at DESC LIMIT 200`)).rows;
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Title>Retours</Title>
      <Flash sp={sp} />
      <p className="text-sm text-gray-500 mb-4">Un retour s&apos;ouvre depuis la fiche d&apos;une commande expédiée. À réception du colis, validez-le ici : le stock est réintégré si demandé. L&apos;avoir sera émis par la facturation (jalon 6).</p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500"><tr>{["N°", "Commande", "Client", "Qté", "Motif", "Statut", "Ouvert le", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={`${td} font-mono`}>{r.number}</td>
                <td className={td}><Link className="underline" href={`/admin/boutique/commandes/${r.order_id}`}>{r.order_number}</Link></td>
                <td className={td}>{r.company}</td>
                <td className={td}>{r.qty}</td>
                <td className={td}>{r.reason}</td>
                <td className={td}><Badge s={r.status} /></td>
                <td className={td}>{fmtDate(r.created_at)}</td>
                <td className={td}>
                  {r.status === "open" && (
                    <div className="flex gap-2">
                      <form action={closeReturn}><input type="hidden" name="return_id" value={r.id} /><button className={btn}>Reçu</button></form>
                      <form action={cancelReturn}><input type="hidden" name="return_id" value={r.id} /><button className={btnLight}>Annuler</button></form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className={td} colSpan={8}>Aucun retour.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
