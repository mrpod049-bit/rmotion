import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { eur, fmtDate, fmtDateTime } from "@/lib/shop/core";
import { outstanding } from "@/lib/shop/orders";
import { Badge, Card, Flash, Title, btn, btnDanger, btnLight, input, label, th, td, type SP } from "../../_ui";
import { addUser, approve, changeStatus, saveTerms, toggleUser, vatCheck } from "../actions";

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const sp = await searchParams;
  const c = (await pool.query("SELECT * FROM shop_customers WHERE id=$1", [Number(id)])).rows[0];
  if (!c) notFound();
  const [users, addresses, orders, out] = await Promise.all([
    pool.query("SELECT * FROM shop_users WHERE customer_id=$1 ORDER BY id", [c.id]),
    pool.query("SELECT * FROM shop_addresses WHERE customer_id=$1 ORDER BY kind, id", [c.id]),
    pool.query("SELECT id, number, status, payment_status, total_ht, created_at FROM shop_orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 50", [c.id]),
    outstanding(c.id),
  ]);
  const hidden = <input type="hidden" name="id" value={c.id} />;
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Title action={<Link className={btnLight} href="/admin/boutique/clients">← Clients</Link>}>{c.company_name} <Badge s={c.status} /></Title>
      <Flash sp={sp} />
      <div className="mb-6 flex flex-wrap gap-2">
        {c.status !== "approved" && <form action={approve}>{hidden}<button className={btn}>Valider le compte</button></form>}
        {c.status === "pending" && <form action={changeStatus}>{hidden}<input type="hidden" name="status" value="rejected" /><button className={btnDanger}>Refuser</button></form>}
        {c.status === "approved" && <form action={changeStatus}>{hidden}<input type="hidden" name="status" value="suspended" /><button className={btnDanger}>Suspendre</button></form>}
        {c.partner_id && <Link className={btnLight} href="/admin/crm">Fiche CRM #{c.partner_id}</Link>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card title="Identité & conditions commerciales">
          <form action={saveTerms} className="grid grid-cols-2 gap-3">
            {hidden}
            <div className="col-span-2"><label className={label}>Raison sociale</label><input name="company_name" defaultValue={c.company_name} className={input} /></div>
            <div><label className={label}>SIRET</label><div className="text-sm py-1.5">{c.siret || "—"} <span className="text-gray-400">{c.naf_code && `NAF ${c.naf_code}`}</span></div></div>
            <div><label className={label}>N° TVA {c.vat_valid === true ? "✓" : c.vat_valid === false ? "✗" : ""}</label><input name="vat_number" defaultValue={c.vat_number ?? ""} className={input} /></div>
            <div><label className={label}>Remise (%)</label><input name="discount_pct" type="number" step="0.5" min="0" max="100" defaultValue={Number(c.discount_pct)} className={input} /></div>
            <div><label className={label}>Paiement</label>
              <select name="payment_terms" defaultValue={c.payment_terms} className={input}>
                <option value="prepaid">À la commande (carte / SEPA)</option>
                <option value="net30">Virement à 30 jours autorisé</option>
              </select></div>
            <div><label className={label}>Plafond d&apos;encours TTC (30 j)</label><input name="credit_limit" type="number" step="100" min="0" defaultValue={c.credit_limit ?? ""} placeholder="illimité" className={input} /></div>
            <div><label className={label}>Encours actuel</label><div className="text-sm py-1.5">{eur(out)}</div></div>
            <div className="col-span-2"><label className={label}>Notes internes</label><textarea name="notes" rows={2} defaultValue={c.notes ?? ""} className={input} /></div>
            <div className="col-span-2 flex gap-2"><button className={btn}>Enregistrer</button><button formAction={vatCheck} className={btnLight}>Vérifier la TVA (VIES)</button></div>
          </form>
          <p className="mt-2 text-xs text-gray-400">Créé le {fmtDate(c.created_at)}{c.approved_at && ` · validé le ${fmtDate(c.approved_at)}`}{c.vat_checked_at && ` · TVA vérifiée le ${fmtDate(c.vat_checked_at)}`}</p>
        </Card>

        <Card title="Utilisateurs">
          <ul className="space-y-2 text-sm mb-3">
            {users.rows.map((u) => (
              <li key={u.id} className={`flex items-center justify-between gap-2 ${u.active ? "" : "opacity-50"}`}>
                <span>{u.name || "—"} — {u.email} <span className="text-xs text-gray-400">{u.role === "owner" ? "admin" : "acheteur"} · dernière connexion {fmtDateTime(u.last_login_at)}</span></span>
                <form action={toggleUser}>{hidden}<input type="hidden" name="user_id" value={u.id} /><button className="text-xs underline">{u.active ? "Désactiver" : "Réactiver"}</button></form>
              </li>
            ))}
          </ul>
          <form action={addUser} className="flex flex-wrap gap-2">{hidden}
            <input name="name" placeholder="Nom" className={`${input} w-32`} />
            <input name="email" type="email" placeholder="email@societe.fr" className={`${input} w-48`} required />
            <button className={btnLight}>+ Ajouter</button>
          </form>
          <h3 className="mt-5 mb-2 text-sm font-semibold text-gray-700">Adresses</h3>
          <ul className="space-y-1 text-sm">
            {addresses.rows.map((a) => (
              <li key={a.id}><span className="text-xs text-gray-400">{a.kind === "billing" ? "Facturation" : "Livraison"}{a.is_default && " (défaut)"}</span> — {a.company}, {a.line1}, {a.postal_code} {a.city} {a.country}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Commandes">
        <table className="w-full text-sm">
          <thead className="text-gray-500"><tr>{["N°", "Date", "Statut", "Paiement", "HT"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {orders.rows.map((o) => (
              <tr key={o.id}>
                <td className={td}><Link className="underline" href={`/admin/boutique/commandes/${o.id}`}>{o.number}</Link></td>
                <td className={td}>{fmtDate(o.created_at)}</td>
                <td className={td}><Badge s={o.status} /></td>
                <td className={td}><Badge s={o.payment_status} /></td>
                <td className={td}>{eur(o.total_ht)}</td>
              </tr>
            ))}
            {orders.rowCount === 0 && <tr><td className={td} colSpan={5}>Aucune commande.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
