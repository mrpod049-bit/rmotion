import Link from "next/link";
import type { Metadata } from "next";
import pool from "@/lib/db";
import { getLocale, getT } from "@/i18n/server";
import { localizeHref } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t.machines.metaTitle,
    description: t.machines.metaDesc,
    alternates: {
      canonical: localizeHref("/machines", locale),
      languages: { fr: "/machines", en: "/en/machines", "x-default": "/machines" },
    },
  };
}

// Taille d'affichage de la photo dans sa cellule (% de la cellule). Défaut : 85.
const IMG_SCALE: Record<string, number> = {
  "laser-ferme-20-30w": 91,
  "laser-ferme-60-100w": 70,
  "laser-ouvert-30-100w": 70,
  "centre-usinage-xh7115": 65,
};

async function getMachines(en: boolean) {
  const res = await pool.query(
    `SELECT m.id, m.slug, m.price_range, m.images, c.type,
            COALESCE(${en ? "m.name_en" : "NULL"}, m.name) AS name,
            COALESCE(${en ? "m.tagline_en" : "NULL"}, m.tagline) AS tagline,
            COALESCE(${en ? "c.name_en" : "NULL"}, c.name) AS category
     FROM machines m
     JOIN categories c ON c.id = m.category_id
     WHERE m.published = true
     ORDER BY c.type, m.name`
  );
  return res.rows;
}

export default async function MachinesPage() {
  const { locale, t } = await getT();
  const machines = await getMachines(locale === "en");
  const L = (href: string) => localizeHref(href, locale);
  const laser = machines.filter((m) => m.type === "laser");
  const cnc = machines.filter((m) => m.type === "cnc");

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">{t.machines.title}</h1>
      <p className="text-gray-500 mb-14">{t.machines.subtitle}</p>

      {[{ label: t.machines.laserGroup, items: laser }, { label: t.machines.cncGroup, items: cnc }].map((group) => (
        <section key={group.label} className="mb-16">
          <h2 className="text-lg font-medium border-b border-gray-200 pb-3 mb-8">{group.label}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.items.map((m) => (
              <Link key={m.id} href={L(`/machines/${m.slug}`)} className="group border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                {m.images?.[0] ? (
                  <div className="h-72 mb-5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.images[0]}
                      alt={m.name}
                      style={{ height: `${IMG_SCALE[m.slug] ?? 85}%`, width: "auto" }}
                      className="max-w-full object-contain rounded"
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
