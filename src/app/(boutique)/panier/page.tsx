import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/shop/auth";
import { eur, getSettings } from "@/lib/shop/core";
import { cartLines } from "@/lib/shop/pricing";
import { removeFromCart, updateCart } from "./actions";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default async function CartPage() {
  const user = await requireUser("/panier");
  const [lines, settings] = await Promise.all([cartLines(user.id, user.status === "approved" ? user.discount_pct : 0), getSettings()]);
  const subtotal = lines.reduce((s, l) => s + l.line_total_ht, 0);
  const problems = lines.filter((l) => !l.sellable || l.qty > l.available);
  const belowMin = subtotal < settings.min_order_ht;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Panier</h1>
      {lines.length === 0 ? (
        <p className="text-gray-500">Votre panier est vide. <Link href="/outils" className="underline">Parcourir le catalogue</Link></p>
      ) : (
        <>
          <form action={updateCart}>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-3 py-2">Article</th><th className="px-3 py-2">PU HT</th><th className="px-3 py-2">Quantité</th><th className="px-3 py-2 text-right">Total HT</th><th /></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((l) => (
                    <tr key={l.variant_id}>
                      <td className="px-3 py-2">
                        <Link href={`/outils/${l.product_slug}`} className="font-medium hover:underline">{l.product_name}</Link>
                        <div className="text-xs text-gray-500"><span className="font-mono">{l.sku}</span> {l.label !== l.product_name && l.label}{l.pack_qty > 1 && ` · boîte de ${l.pack_qty}`}</div>
                        {!l.sellable && <div className="text-xs text-red-600">Plus disponible à la vente — retirez cette ligne.</div>}
                        {l.sellable && l.qty > l.available && <div className="text-xs text-red-600">Stock disponible : {l.available}. Ajustez la quantité.</div>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{eur(l.unit_price_ht)}{l.discount_pct > 0 && <div className="text-xs text-gray-400 line-through">{eur(l.list_price_ht)}</div>}</td>
                      <td className="px-3 py-2"><input name={`qty_${l.variant_id}`} type="number" min="0" defaultValue={l.qty} className="w-20 rounded border border-gray-300 px-2 py-1" /></td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{eur(l.line_total_ht)}</td>
                      <td className="px-3 py-2 text-right"><button formAction={removeFromCart} name="variant_id" value={l.variant_id} className="text-xs text-red-600">Retirer</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between">
              <Link href="/outils" className="text-sm underline">← Continuer mes achats</Link>
              <button className="rounded border border-gray-300 px-3 py-1.5 text-sm">Mettre à jour les quantités</button>
            </div>
          </form>

          <div className="mt-8 ml-auto max-w-sm space-y-2 text-sm">
            <div className="flex justify-between"><span>Sous-total HT</span><strong>{eur(subtotal)}</strong></div>
            <p className="text-xs text-gray-500">Frais de port et TVA calculés à l&apos;étape suivante selon l&apos;adresse de livraison.{settings.free_shipping_ht > 0 && ` Port offert en France dès ${eur(settings.free_shipping_ht)} HT.`}</p>
            {belowMin && <p className="text-red-600">Minimum de commande : {eur(settings.min_order_ht)} HT.</p>}
            {user.status !== "approved" ? (
              <p className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">Votre compte doit être validé avant de pouvoir commander.</p>
            ) : problems.length > 0 || belowMin ? (
              <button disabled className="w-full rounded bg-gray-300 py-2.5 text-white">Commander</button>
            ) : (
              <Link href="/commande" className="block w-full rounded bg-gray-900 py-2.5 text-center text-white hover:bg-gray-700">Commander</Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
