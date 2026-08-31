import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import pool from "@/lib/db";
import { getT } from "@/i18n/server";
import { localizeHref, type Locale } from "@/i18n/config";
import { formatPriceFrom } from "@/lib/price";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t.machines.metaTitle,
    description: t.machines.metaDesc,
    alternates: {
      canonical: localizeHref("/products", locale),
      languages: { fr: "/products", en: "/en/products", "x-default": "/products" },
    },
  };
}

// Taille d'affichage de la photo dans sa cellule (% de la cellule). Défaut : 85.
const IMG_SCALE: Record<string, number> = {
  "scl-series": 91,
  "bcl-series": 70,
  "ol-series": 70,
  "scs-series": 65,
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

      {[{ label: t.machines.laserGroup, items: laser }, { label: t.machines.cncGroup, items: cnc }].map((group, gi) => (
        <section key={group.label} className="mb-16">
          <h2 className="text-lg font-medium border-b border-gray-200 pb-3 mb-8">{group.label}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.items.map((m, mi) => {
              const price = formatPriceFrom(m.price_range, locale as Locale, t.machine.priceFrom);
              return (
                <Link key={m.id} href={L(`/products/${m.slug}`)} className="group border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  {m.images?.[0] ? (
                    <div className="h-72 mb-5 flex items-center justify-center">
                      <div className="relative w-full" style={{ height: `${IMG_SCALE[m.slug] ?? 85}%` }}>
                        <Image
                          src={m.images[0]}
                          alt={m.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          priority={gi === 0 && mi === 0}
                          className="object-contain rounded"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-72 bg-gray-100 rounded mb-5 flex items-center justify-center text-gray-400 text-xs uppercase tracking-wider">
                      {m.category}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{m.category}</p>
                  <h3 className="font-medium text-gray-900 mb-2 group-hover:underline">{m.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{m.tagline}</p>
                  {price && <p className="text-sm font-semibold text-gray-900 mt-3">{price}</p>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
