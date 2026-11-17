import Link from "next/link";
import pool from "@/lib/db";
import { eur, fmtDateTime } from "@/lib/shop/core";
import { stockDrift } from "@/lib/shop/stock";
import { releaseExpiredReservations } from "@/lib/shop/orders";
import { Card, Flash, Title, btn, input, th, td, one, type SP } from "../_ui";
import { adjust, setLocation } from "./actions";

const KIND: Record<string, string> = {
  receipt: "Réception", sale: "Vente", return: "Retour", adjust: "Ajustement", inventory: "Inventaire", cancel: "Annulation",
};

export default async function StockPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  await releaseExpiredReservations();
  const like = q ? `%${q.toLowerCase()}%` : null;
  const rows = (await pool.query(
    `SELECT v.id, v.sku, v.label, v.reorder_threshold, v.cost_price, v.active, p.name AS product_name, p.id AS product_id,
            COALESCE(s.on_hand,0) AS on_hand, COALESCE(s.reserved,0) AS reserved, s.location
     FROM shop_variants v JOIN shop_products p ON p.id=v.product_id LEFT JOIN shop_stock s ON s.variant_id=v.id
     WHERE ($1::text IS NULL OR LOWER(v.sku) LIKE $1 OR LOWER(p.name) LIKE $1 OR LOWER(COALESCE(v.label,'')) LIKE $1)
     ORDER BY p.name, v.position, v.sku LIMIT 500`, [like]
  )).rows;
  const moves = (await pool.query(
    `SELECT m.*, v.sku FROM shop_stock_movements m JOIN shop_variants v ON v.id=m.variant_id
     WHERE ($1::text IS NULL OR LOWER(v.sku) LIKE $1)
     ORDER BY m.created_at DESC, m.id DESC LIMIT 150`, [like]
  )).rows;
  const drift = await stockDrift();
  const value = rows.reduce((s, r) => s + Number(r.on_hand) * Number(r.cost_price ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Title>Stock</Title>
      <Flash sp={sp} />
      {drift.length > 0 && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Incohérence journal / stock sur : {drift.map((d) => `${d.sku} (stock ${d.on_hand}, journal ${d.journal})`).join(", ")}. Faites un inventaire.
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Réf. ou produit…" className={input} /><button className={btn}>Filtrer</button></form>
        <span className="text-sm text-gray-500">Valeur du stock (au coût d&apos;achat) : <strong>{eur(value)}</strong></span>
        <span className="text-xs text-gray-400">Entrées de stock normales : via <Link className="underline" href="/admin/boutique/achats">Achats → réception</Link>.</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500"><tr>
            {["Réf.", "Produit", "Physique", "Réservé", "Disponible", "Seuil", "Emplacement", "Ajuster / inventaire"].map((h) => <th key={h} className={th}>{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const avail = Number(r.on_hand) - Number(r.reserved);
              const low = r.reorder_threshold > 0 && avail <= r.reorder_threshold;
              return (
                <tr key={r.id} className={r.active ? "" : "opacity-50"}>
                  <td className={`${td} font-mono text-xs`}>{r.sku}</td>
                  <td className={td}><Link href={`/admin/boutique/produits/${r.product_id}`} className="hover:underline">{r.product_name}</Link><div className="text-xs text-gray-400">{r.label}</div></td>
                  <td className={td}>{r.on_hand}</td>
                  <td className={td}>{r.reserved}</td>
                  <td className={`${td} font-medium ${avail <= 0 ? "text-red-600" : low ? "text-amber-600" : ""}`}>{avail}{low && " ⚠"}</td>
                  <td className={td}>{r.reorder_threshold || "—"}</td>
                  <td className={td}>
                    <form action={setLocation} className="flex gap-1">
                      <input type="hidden" name="variant_id" value={r.id} />
                      <input name="location" defaultValue={r.location ?? ""} className={`${input} w-24`} placeholder="A-01" />
                    </form>
                  </td>
                  <td className={td}>
                    <form action={adjust} className="flex flex-wrap gap-1 items-center">
                      <input type="hidden" name="variant_id" value={r.id} />
                      <input type="hidden" name="q" value={q} />
                      <select name="mode" className={`${input} w-28`} defaultValue="delta">
                        <option value="delta">± variation</option>
                        <option value="set">= inventaire</option>
                      </select>
                      <input name="value" type="number" className={`${input} w-20`} required />
                      <input name="note" className={`${input} w-36`} placeholder="Motif" />
                      <button className={btn}>OK</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td className={td} colSpan={8}>Aucune référence.</td></tr>}
          </tbody>
        </table>
      </div>

      <Card title="Journal des mouvements (150 derniers)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500"><tr>{["Date", "Réf.", "Mouvement", "Qté", "Origine", "Motif", "Par"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {moves.map((m) => (
                <tr key={m.id}>
                  <td className={td}>{fmtDateTime(m.created_at)}</td>
                  <td className={`${td} font-mono text-xs`}>{m.sku}</td>
                  <td className={td}>{KIND[m.kind] ?? m.kind}</td>
                  <td className={`${td} font-medium ${m.qty_delta < 0 ? "text-red-600" : "text-green-700"}`}>{m.qty_delta > 0 ? "+" : ""}{m.qty_delta}</td>
                  <td className={td}>
                    {m.ref_type === "order" ? <Link className="underline" href={`/admin/boutique/commandes/${m.ref_id}`}>Commande</Link>
                      : m.ref_type === "purchase_order" ? <Link className="underline" href={`/admin/boutique/achats/${m.ref_id}`}>Achat</Link>
                      : m.ref_type === "return" ? "Retour" : "—"}
                  </td>
                  <td className={td}>{m.note || ""}</td>
                  <td className={td}>{m.actor}</td>
                </tr>
              ))}
              {moves.length === 0 && <tr><td className={td} colSpan={7}>Aucun mouvement.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
