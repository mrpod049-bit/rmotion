import Link from "next/link";
import pool from "@/lib/db";
import { eur, fmtDateTime, ORDER_STATUS } from "@/lib/shop/core";
import { releaseExpiredReservations } from "@/lib/shop/orders";
import { Badge, Flash, Title, btn, input, th, td, one, type SP } from "../_ui";

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  await releaseExpiredReservations();
  const status = one(sp.status);
  const q = one(sp.q).trim();
  const r = await pool.query(
    `SELECT o.id, o.number, o.status, o.payment_status, o.payment_method, o.total_ht, o.total_ttc, o.created_at,
            o.due_date, o.customer_snapshot->>'company_name' AS company, o.customer_po
     FROM shop_orders o
     WHERE ($1 = '' AND o.status <> 'cancelled' OR o.status = $1 OR $1 = 'all')
       AND ($2 = '' OR LOWER(o.number) LIKE $3 OR LOWER(o.customer_snapshot->>'company_name') LIKE $3 OR LOWER(COALESCE(o.customer_po,'')) LIKE $3)
     ORDER BY o.created_at DESC LIMIT 300`,
    [status, q, `%${q.toLowerCase()}%`]
  );
  const counts = (await pool.query("SELECT status, COUNT(*)::int n FROM shop_orders GROUP BY status")).rows;
  const n = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const tabs = [["", "En cours"], ...Object.entries(ORDER_STATUS), ["all", "Toutes"]];
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Title>Commandes</Title>
      <Flash sp={sp} />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {tabs.map(([k, l]) => (
          <Link key={k} href={k ? `?status=${k}` : "?"} className={`rounded-full px-3 py-1 ${status === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>
            {l}{k && k !== "all" ? ` (${n(k)})` : ""}
          </Link>
        ))}
      </div>
      <form className="mb-4 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="N°, client, réf. client…" className={`${input} max-w-xs`} />
        <button className={btn}>Rechercher</button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500"><tr>{["N°", "Date", "Client", "Réf. client", "Statut", "Paiement", "HT", "TTC"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {r.rows.map((o) => (
              <tr key={o.id}>
                <td className={td}><Link href={`/admin/boutique/commandes/${o.id}`} className="font-medium underline">{o.number}</Link></td>
                <td className={td}>{fmtDateTime(o.created_at)}</td>
                <td className={td}>{o.company}</td>
                <td className={td}>{o.customer_po || ""}</td>
                <td className={td}><Badge s={o.status} /></td>
                <td className={td}><Badge s={o.payment_status} /> <span className="text-xs text-gray-500">{o.payment_method === "net30" ? "30 j" : "en ligne"}</span></td>
                <td className={td}>{eur(o.total_ht)}</td>
                <td className={td}>{eur(o.total_ttc)}</td>
              </tr>
            ))}
            {r.rowCount === 0 && <tr><td className={td} colSpan={8}>Aucune commande.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
