import pool from "@/lib/db";
import { Flash, Title, btn, btnDanger, input, label, th, td, type SP, LinkBtn } from "../../_ui";
import { saveCategory, deleteCategory } from "../actions";

function ParentSelect({ cats, value, self }: { cats: { id: number; name: string }[]; value?: number | null; self?: number }) {
  return (
    <select name="parent_id" defaultValue={value ?? ""} className={input}>
      <option value="">— aucune —</option>
      {cats.filter((c) => c.id !== self).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
}

export default async function CategoriesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const cats = (await pool.query(
    `SELECT c.*, p.name AS parent_name, (SELECT COUNT(*)::int FROM shop_products WHERE category_id=c.id) AS n
     FROM shop_categories c LEFT JOIN shop_categories p ON p.id=c.parent_id ORDER BY c.position, c.name`
  )).rows;
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Title action={<LinkBtn light href="/admin/boutique/produits">← Catalogue</LinkBtn>}>Catégories</Title>
      <Flash sp={sp} />
      <form action={saveCategory} className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-3 items-end rounded-lg border border-gray-200 p-4">
        <div><label className={label}>Nom *</label><input name="name" className={input} placeholder="Plaquettes de tournage" required /></div>
        <div><label className={label}>Slug</label><input name="slug" className={input} placeholder="auto" /></div>
        <div><label className={label}>Parente</label><ParentSelect cats={cats} /></div>
        <div><label className={label}>Ordre</label><input name="position" type="number" defaultValue={0} className={input} /></div>
        <button className={btn}>+ Ajouter</button>
        <div className="col-span-2 md:col-span-5"><label className={label}>Description (affichée sur la page catégorie)</label><input name="description" className={input} /></div>
      </form>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500"><tr>{["Nom", "Slug", "Parente", "Ordre", "Produits", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {cats.map((c) => (
              <tr key={c.id}>
                <td className={td} colSpan={6}>
                  <form action={saveCategory} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                    <input type="hidden" name="id" value={c.id} />
                    <input name="name" defaultValue={c.name} className={input} />
                    <input name="slug" defaultValue={c.slug} className={input} />
                    <ParentSelect cats={cats} value={c.parent_id} self={c.id} />
                    <input name="position" type="number" defaultValue={c.position} className={input} />
                    <span className="text-gray-500">{c.n} produit(s)</span>
                    <div className="flex gap-2 justify-end">
                      <button className={btn}>OK</button>
                      <button formAction={deleteCategory} className={btnDanger}>Suppr.</button>
                    </div>
                    <input type="hidden" name="description" value={c.description ?? ""} />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
