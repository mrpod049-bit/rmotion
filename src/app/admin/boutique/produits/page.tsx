import Link from "next/link";
import { adminListProducts } from "@/lib/shop/catalog";
import { eur } from "@/lib/shop/core";
import { Flash, LinkBtn, Title, th, td, type SP, btnDanger } from "../_ui";
import { deleteProduct } from "./actions";

export default async function ShopProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const rows = await adminListProducts();
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Title action={<div className="flex gap-2"><LinkBtn light href="/admin/boutique/produits/categories">Catégories</LinkBtn><LinkBtn href="/admin/boutique/produits/new">+ Nouveau produit</LinkBtn></div>}>
        Catalogue outils <span className="text-gray-400 font-normal">({rows.length})</span>
      </Title>
      <Flash sp={sp} />
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun produit. Commencez par créer vos catégories (plaquettes, fraises, forets…) puis vos produits.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr>
              {["Produit", "Catégorie", "Réf.", "Dès (HT)", "Stock", "Réservé", "Statut", ""].map((h) => <th key={h} className={th}>{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className={td}>
                    <Link href={`/admin/boutique/produits/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                    <div className="text-xs text-gray-400">{p.brand || ""} /{p.slug}</div>
                  </td>
                  <td className={td}>{p.category_name || "—"}</td>
                  <td className={td}>{p.variant_count}</td>
                  <td className={td}>{p.min_price != null ? eur(p.min_price) : "—"}</td>
                  <td className={td}>{p.on_hand}</td>
                  <td className={td}>{p.reserved}</td>
                  <td className={td}>{p.published ? <span className="text-green-700">Publié</span> : <span className="text-gray-400">Brouillon</span>}</td>
                  <td className={`${td} text-right`}>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={btnDanger} title="Supprimer (uniquement sans historique)">Suppr.</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
