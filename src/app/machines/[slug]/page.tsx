import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";

// Taille d'affichage de la photo dans son cadre (% du cadre). Défaut : 100.
const DETAIL_SCALE: Record<string, number> = {
  "laser-ferme-20-30w": 70,
};

async function getMachine(slug: string) {
  const res = await pool.query(
    `SELECT m.*, c.name as category, c.type
     FROM machines m
     JOIN categories c ON c.id = m.category_id
     WHERE m.slug = $1 AND m.published = true`,
    [slug]
  );
  return res.rows[0] || null;
}

export default async function MachinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const machine = await getMachine(slug);
  if (!machine) notFound();

  const specs = machine.specs as Record<string, string>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <Link href="/machines" className="text-sm text-gray-400 hover:text-gray-900 mb-8 block">← Retour au catalogue</Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Visuel */}
        {machine.images?.[0] ? (
          <div className="h-96 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={machine.images[0]}
              alt={machine.name}
              style={{ height: `${DETAIL_SCALE[machine.slug] ?? 100}%`, width: "auto" }}
              className="max-w-full object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm uppercase tracking-wider">
            {machine.category}
          </div>
        )}

        {/* Infos */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{machine.category}</p>
          <h1 className="text-3xl font-semibold mb-3">{machine.name}</h1>
          <p className="text-gray-500 mb-8">{machine.tagline}</p>

          <Link
            href={`/devis?machine=${machine.id}&nom=${encodeURIComponent(machine.name)}`}
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors mb-10"
          >
            Demander un devis pour cette machine
          </Link>

          {/* Specs */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Caractéristiques</h2>
            <dl className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {Object.entries(specs).map(([key, val]) => (
                <div key={key} className="grid grid-cols-2 px-4 py-3 text-sm">
                  <dt className="text-gray-500 first-letter:uppercase">{key.replace(/_/g, " ")}</dt>
                  <dd className="text-gray-900 font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-16 max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Description</h2>
        <p className="text-gray-600 leading-relaxed">{machine.description}</p>
      </div>
    </div>
  );
}
