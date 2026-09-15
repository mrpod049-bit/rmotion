import Link from "next/link";
import pool from "@/lib/db";
import ProductRowActions from "./ProductRowActions";
import { formatPriceFrom } from "@/lib/price";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits — Admin", robots: { index: false, follow: false } };

async function getMachines() {
  const res = await pool.query(
    `SELECT m.id, m.name, m.slug, m.price_range, m.published, m.featured,
            c.name AS category, c.type, COALESCE(array_length(m.images, 1), 0) AS nb_images
     FROM machines m LEFT JOIN categories c ON c.id = m.category_id
     ORDER BY c.type NULLS LAST, m.name`
  );
  return res.rows;
}

export default async function AdminProduitsPage() {
  const machines = await getMachines();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">
          Fiches produits <span className="text-gray-400 font-normal">({machines.length})</span>
        </h1>
        <Link
          href="/admin/produits/new"
          className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
        >
          + Nouvelle fiche
        </Link>
      </div>

      {machines.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune fiche produit.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                {["Nom", "Catégorie", "Prix", "Images", "Statut", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {machines.map((m) => (
                <tr key={m.id} className="align-middle">
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    {m.name}
                    {m.featured && <span className="ml-2 text-amber-600" title="Mise en avant">★</span>}
                    <div className="text-gray-400 text-xs font-normal">/{m.slug}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600">{m.category || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatPriceFrom(m.price_range, "fr", "dès") || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">{m.nb_images}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {m.published ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">Publié</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-600 px-2 py-0.5 text-xs">Brouillon</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <ProductRowActions id={m.id} name={m.name} published={m.published} />
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
