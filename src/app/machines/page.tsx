import Link from "next/link";
import pool from "@/lib/db";

async function getMachines() {
  const res = await pool.query(
    `SELECT m.id, m.name, m.slug, m.tagline, m.price_range, m.images, c.name as category, c.type
     FROM machines m
     JOIN categories c ON c.id = m.category_id
     WHERE m.published = true
     ORDER BY c.type, m.name`
  );
  return res.rows;
}

export default async function MachinesPage() {
  const machines = await getMachines();
  const laser = machines.filter((m) => m.type === "laser");
  const cnc = machines.filter((m) => m.type === "cnc");

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">Catalogue</h1>
      <p className="text-gray-500 mb-14">Machines laser et CNC sélectionnées pour les PME et TPE.</p>

      {[{ label: "Machines laser", items: laser }, { label: "Machines CNC", items: cnc }].map((group) => (
        <section key={group.label} className="mb-16">
          <h2 className="text-lg font-medium border-b border-gray-200 pb-3 mb-8">{group.label}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.items.map((m) => (
              <Link key={m.id} href={`/machines/${m.slug}`} className="group border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                {m.images?.[0] ? (
                  <div className="h-72 mb-5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.images[0]}
                      alt={m.name}
                      className="h-[85%] w-[85%] object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="h-72 bg-gray-100 rounded mb-5 flex items-center justify-center text-gray-400 text-xs uppercase tracking-wider">
                    {m.category}
                  </div>
                )}
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{m.category}</p>
                <h3 className="font-medium text-gray-900 mb-2 group-hover:underline">{m.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{m.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
