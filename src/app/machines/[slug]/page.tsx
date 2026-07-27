import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import pool from "@/lib/db";
import ProductGallery from "@/components/ProductGallery";

const getMachine = cache(async (slug: string) => {
  const res = await pool.query(
    `SELECT m.*, c.name as category, c.type
     FROM machines m
     JOIN categories c ON c.id = m.category_id
     WHERE m.slug = $1 AND m.published = true`,
    [slug]
  );
  return res.rows[0] || null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const machine = await getMachine(slug);
  if (!machine) return { title: "Produit introuvable" };
  const desc: string =
    (machine.description ? String(machine.description).split("\n")[0] : "") ||
    machine.tagline ||
    "";
  const image: string | undefined = machine.images?.[0];
  return {
    title: `${machine.name} — ${machine.category}`,
    description: desc,
    alternates: { canonical: `/machines/${slug}` },
    openGraph: {
      title: `${machine.name} — Rmotion`,
      description: desc,
      url: `https://www.rmotion.fr/machines/${slug}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function MachinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const machine = await getMachine(slug);
  if (!machine) notFound();

  // Les specs peuvent être un objet {label: valeur} ou une liste ordonnée [{label, value}]
  // (la liste garantit l'ordre d'affichage, que jsonb ne préserve pas).
  const rawSpecs = machine.specs;
  const specEntries: [string, string][] = Array.isArray(rawSpecs)
    ? (rawSpecs as { label: string; value: string }[]).map((s) => [s.label, s.value])
    : Object.entries((rawSpecs ?? {}) as Record<string, string>);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: machine.name,
    description: machine.description
      ? String(machine.description).replace(/\n+/g, " ")
      : machine.tagline || "",
    category: machine.category,
    ...(machine.images?.[0]
      ? { image: `https://www.rmotion.fr${machine.images[0]}` }
      : {}),
    brand: { "@type": "Brand", name: "Rmotion" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.rmotion.fr" },
      { "@type": "ListItem", position: 2, name: "Catalogue", item: "https://www.rmotion.fr/machines" },
      { "@type": "ListItem", position: 3, name: machine.name, item: `https://www.rmotion.fr/machines/${slug}` },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Link href="/machines" className="text-sm text-gray-400 hover:text-gray-900 mb-8 block">← Retour au catalogue</Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Visuel */}
        {machine.images?.length ? (
          <ProductGallery images={machine.images} alt={machine.name} />
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

          {/* Infos service — identiques pour toutes les machines, au-dessus des specs */}
          <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 text-sm mb-8">
            <li className="flex items-start gap-3 px-4 py-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span className="text-gray-700">Garantie 1 an</span>
            </li>
            <li className="flex items-start gap-3 px-4 py-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span className="text-gray-700">Stock : <span className="text-gray-900 font-medium">Hors stock pour le moment</span>, délai de livraison 45 / 60 jours</span>
            </li>
            <li className="flex items-start gap-3 px-4 py-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-gray-700">SAV et référents techniques joignables de 8h à 17h du lundi au vendredi</span>
            </li>
          </ul>

          {/* Specs */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Caractéristiques</h2>
            <dl className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {specEntries.map(([key, val]) => (
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
        <div className="space-y-4">
          {String(machine.description || "")
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((para, idx) => {
              const isWarning = /^AVERTISSEMENT/i.test(para.trim());
              return (
                <p
                  key={idx}
                  className={`leading-relaxed whitespace-pre-line ${
                    isWarning ? "text-red-600 font-bold" : "text-gray-600"
                  }`}
                >
                  {para}
                </p>
              );
            })}
        </div>
      </div>
    </div>
  );
}
