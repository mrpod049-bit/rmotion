import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import MachineForm from "../MachineForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fiche produit — Admin", robots: { index: false, follow: false } };

async function getCategories() {
  const res = await pool.query("SELECT id, name, type FROM categories ORDER BY type, name");
  return res.rows as { id: number; name: string; type: string }[];
}

async function getMachine(id: number) {
  const res = await pool.query(
    `SELECT id, category_id, name, name_en, slug, tagline, tagline_en, description, description_en,
            specs, specs_en, options, options_en, price_range, images, featured, published
     FROM machines WHERE id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

export default async function EditProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const categories = await getCategories();

  let machine = null;
  if (!isNew) {
    const numId = Number(id);
    if (!Number.isInteger(numId)) notFound();
    machine = await getMachine(numId);
    if (!machine) notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/admin/produits" className="text-sm text-gray-400 hover:text-gray-900 mb-6 block">← Retour aux fiches</Link>
      <h1 className="text-2xl font-semibold mb-8">{isNew ? "Nouvelle fiche produit" : `Modifier — ${machine.name}`}</h1>
      <MachineForm categories={categories} machine={machine} />
    </div>
  );
}
