import Link from "next/link";
import pool from "@/lib/db";

async function getFeaturedMachines() {
  const res = await pool.query(
    `SELECT m.id, m.name, m.slug, m.tagline, m.price_range, c.name as category
     FROM machines m
     JOIN categories c ON c.id = m.category_id
     WHERE m.featured = true AND m.published = true
     ORDER BY m.id`
  );
  return res.rows;
}

export default async function HomePage() {
  const machines = await getFeaturedMachines();

  return (
    <>
      {/* Hero */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-4">Machines laser & CNC</p>
          <h1 className="text-5xl font-semibold leading-tight mb-6 max-w-2xl">
            Machines compétitives, pensées pour votre entreprise
          </h1>
          <p className="text-gray-300 text-lg mb-10 max-w-xl">
            Rmotion sélectionne et distribue des machines laser et CNC fiables pour les PME et TPE. Pas de ligne de production — des équipements adaptés à votre échelle.
          </p>
          <div className="flex gap-4">
            <Link href="/machines" className="bg-white text-gray-900 px-6 py-3 rounded font-medium hover:bg-gray-100 transition-colors">
              Voir le catalogue
            </Link>
            <Link href="/devis" className="border border-gray-500 text-white px-6 py-3 rounded hover:border-white transition-colors">
              Demander un devis
            </Link>
          </div>
        </div>
      </section>

      {/* Machines phares */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="text-2xl font-semibold">Machines phares</h2>
          <Link href="/machines" className="text-sm text-gray-500 hover:text-gray-900">Tout voir →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {machines.map((m) => (
            <Link key={m.id} href={`/machines/${m.slug}`} className="group border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
              <div className="h-32 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-400 text-xs uppercase tracking-wider">
                {m.category}
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{m.category}</p>
              <h3 className="font-medium text-gray-900 mb-1 group-hover:underline">{m.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{m.tagline}</p>
              <p className="mt-3 text-sm font-medium text-gray-700">{m.price_range}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Promesse */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-3 gap-10 text-sm">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Sélection rigoureuse</p>
            <p className="text-gray-500">Nous testons chaque machine avant de la proposer. Que du matériel fiable, avec support pièces disponible.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Devis sur mesure</p>
            <p className="text-gray-500">Pas de prix catalogue fixe. Chaque atelier a ses besoins — on adapte la configuration et le budget.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Accompagnement technique</p>
            <p className="text-gray-500">Installation, prise en main, formation : on ne livre pas une machine, on met en place un outil de production.</p>
          </div>
        </div>
      </section>

      {/* CTA articles */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-semibold">Comprendre les technologies</h2>
          <Link href="/articles" className="text-sm text-gray-500 hover:text-gray-900">Tous les articles →</Link>
        </div>
        <p className="text-gray-500 max-w-xl">
          Laser CO2, fibre, CNC bois ou métal — nos guides techniques pour choisir le bon outil sans vous noyer dans les specs.
        </p>
      </section>
    </>
  );
}
