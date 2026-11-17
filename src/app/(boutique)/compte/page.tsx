import Link from "next/link";
import type { Metadata } from "next";
import pool from "@/lib/db";
import { requireUser } from "@/lib/shop/auth";
import { eur, fmtDate, ORDER_STATUS, COUNTRY_NAMES } from "@/lib/shop/core";
import { outstanding } from "@/lib/shop/orders";
import { addColleague, deleteAddress, doLogout, saveAddress } from "./actions";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

const inp = "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser("/compte");
  const [orders, addresses, colleagues, out] = await Promise.all([
    pool.query(
      `SELECT number, status, payment_status, payment_method, total_ht, total_ttc, created_at, customer_po, due_date
       FROM shop_orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100`, [user.customer_id]),
    pool.query("SELECT * FROM shop_addresses WHERE customer_id=$1 ORDER BY kind, is_default DESC, id", [user.customer_id]),
    pool.query("SELECT name, email, role, active FROM shop_users WHERE customer_id=$1 ORDER BY id", [user.customer_id]),
    user.payment_terms === "net30" ? outstanding(user.customer_id) : Promise.resolve(0),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{user.company_name}</h1>
          <p className="text-sm text-gray-500">{user.name} — {user.email}</p>
        </div>
        <form action={doLogout}><button className="text-sm underline">Se déconnecter</button></form>
      </div>
      {sp.err && <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.err}</p>}
      {sp.ok && <p className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{sp.ok}</p>}
      {user.status === "pending" && <p className="mb-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Votre compte est en cours de validation par notre équipe. Vous recevrez un email dès son ouverture.</p>}
      {(user.status === "suspended" || user.status === "rejected") && <p className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Votre compte ne permet pas de commander actuellement. Contactez-nous : contact@rmotion.fr</p>}

      <div className="mb-8 grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-lg border border-gray-200 p-4"><div className="text-gray-500">Conditions</div><div className="font-medium">{user.discount_pct > 0 ? `Remise ${user.discount_pct} %` : "Tarif catalogue"}</div></div>
        <div className="rounded-lg border border-gray-200 p-4"><div className="text-gray-500">Règlement</div><div className="font-medium">{user.payment_terms === "net30" ? "Virement à 30 jours" : "Carte ou prélèvement SEPA"}</div></div>
        {user.payment_terms === "net30" && <div className="rounded-lg border border-gray-200 p-4"><div className="text-gray-500">Encours</div><div className="font-medium">{eur(out)}{user.credit_limit != null && <span className="text-gray-400"> / {eur(user.credit_limit)}</span>}</div></div>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Mes commandes</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 mb-10">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-3 py-2">N°</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Votre réf.</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2">Total HT</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {orders.rows.map((o) => (
              <tr key={o.number}>
                <td className="px-3 py-2"><Link href={`/compte/commandes/${o.number}`} className="font-medium underline">{o.number}</Link></td>
                <td className="px-3 py-2">{fmtDate(o.created_at)}</td>
                <td className="px-3 py-2">{o.customer_po || "—"}</td>
                <td className="px-3 py-2">{ORDER_STATUS[o.status]}{o.payment_method === "net30" && o.payment_status !== "paid" && o.status !== "cancelled" && <span className="text-xs text-gray-500"> · échéance {fmtDate(o.due_date)}</span>}</td>
                <td className="px-3 py-2">{eur(o.total_ht)}</td>
              </tr>
            ))}
            {orders.rowCount === 0 && <tr><td className="px-3 py-4 text-gray-500" colSpan={5}>Aucune commande pour l&apos;instant. <Link href="/outils" className="underline">Voir le catalogue</Link></td></tr>}
          </tbody>
        </table>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold mb-3">Adresses</h2>
          <ul className="space-y-2 text-sm mb-4">
            {addresses.rows.map((a) => (
              <li key={a.id} className="flex justify-between gap-2 rounded border border-gray-200 p-2">
                <span><span className="text-xs text-gray-400">{a.kind === "billing" ? "Facturation" : "Livraison"}{a.is_default && " · par défaut"}</span><br />
                  {a.company}{a.contact && ` — ${a.contact}`}<br />{a.line1}{a.line2 && `, ${a.line2}`}, {a.postal_code} {a.city} {a.country !== "FR" && (COUNTRY_NAMES[a.country] ?? a.country)}</span>
                <form action={deleteAddress}><input type="hidden" name="id" value={a.id} /><button className="text-xs text-red-600">Suppr.</button></form>
              </li>
            ))}
          </ul>
          <details className="rounded border border-gray-200 p-3">
            <summary className="cursor-pointer text-sm font-medium">+ Ajouter une adresse</summary>
            <form action={saveAddress} className="mt-3 grid grid-cols-2 gap-2">
              <select name="kind" className={inp}><option value="shipping">Livraison</option><option value="billing">Facturation</option></select>
              <select name="country" className={inp} defaultValue="FR">{Object.entries(COUNTRY_NAMES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
              <input name="company" placeholder="Société / site *" defaultValue={user.company_name} className={`${inp} col-span-2`} required />
              <input name="contact" placeholder="Contact (atelier, magasin…)" className={inp} />
              <input name="phone" placeholder="Téléphone" className={inp} />
              <input name="line1" placeholder="Adresse *" className={`${inp} col-span-2`} required />
              <input name="line2" placeholder="Complément" className={`${inp} col-span-2`} />
              <input name="postal_code" placeholder="Code postal *" className={inp} required />
              <input name="city" placeholder="Ville *" className={inp} required />
              <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" name="is_default" /> Par défaut</label>
              <button className="col-span-2 rounded bg-gray-900 py-1.5 text-sm text-white">Ajouter</button>
            </form>
          </details>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Utilisateurs du compte</h2>
          <ul className="space-y-1 text-sm mb-4">
            {colleagues.rows.map((c) => <li key={c.email} className={c.active ? "" : "opacity-50"}>{c.name || "—"} — {c.email} <span className="text-xs text-gray-400">{c.role === "owner" ? "administrateur" : "acheteur"}</span></li>)}
          </ul>
          {user.role === "owner" && (
            <form action={addColleague} className="flex flex-wrap gap-2">
              <input name="name" placeholder="Nom" className={`${inp} w-32`} />
              <input name="email" type="email" placeholder="collegue@societe.fr" className={`${inp} w-52`} required />
              <button className="rounded border border-gray-300 px-3 text-sm">+ Ajouter</button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
