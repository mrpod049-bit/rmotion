import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import pool from "@/lib/db";
import ProductGallery from "@/components/ProductGallery";
import PixelEvent from "@/components/PixelEvent";
import { getLocale, getT } from "@/i18n/server";
import { localizeHref, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPriceFrom } from "@/lib/price";
import Breadcrumbs from "@/components/Breadcrumbs";

const SITE = "https://www.rmotion.fr";

// Sélectionne les champs traduits (repli sur le FR) selon la locale.
const getMachine = cache(async (slug: string, en: boolean) => {
  const res = await pool.query(
    `SELECT m.id, m.slug, m.price_range, m.images,
            COALESCE(${en ? "m.name_en" : "NULL"}, m.name) AS name,
            COALESCE(${en ? "m.tagline_en" : "NULL"}, m.tagline) AS tagline,
            COALESCE(${en ? "m.description_en" : "NULL"}, m.description) AS description,
            COALESCE(${en ? "m.specs_en" : "NULL"}, m.specs) AS specs,
            COALESCE(${en ? "m.options_en" : "NULL"}, m.options) AS options,
            COALESCE(${en ? "c.name_en" : "NULL"}, c.name) AS category, c.type
     FROM machines m
     JOIN categories c ON c.id = m.category_id
     WHERE m.slug = $1 AND m.published = true`,
    [slug]
  );
  return res.rows[0] || null;
});

// Guides liés : articles publiés de la même famille (laser / cnc) — maillage interne.
const getRelatedArticles = cache(async (type: string, en: boolean) => {
  const res = await pool.query(
    `SELECT slug, COALESCE(${en ? "title_en" : "NULL"}, title) AS title
     FROM articles
     WHERE published = true AND category ILIKE $1
     ORDER BY published_at DESC NULLS LAST
     LIMIT 3`,
    [type === "laser" ? "%laser%" : "%cnc%"]
  );
  return res.rows as { title: string; slug: string }[];
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const machine = await getMachine(slug, locale === "en");
  if (!machine) return { title: getDictionary(locale).machine.notFound };
  const desc: string =
    (machine.description ? String(machine.description).split("\n")[0] : "") ||
    machine.tagline ||
    "";
  const image: string | undefined = machine.images?.[0];
  return {
    title: `${machine.name} — ${machine.category}`,
    description: desc,
    alternates: {
      canonical: localizeHref(`/products/${slug}`, locale),
      languages: { fr: `/products/${slug}`, en: `/en/products/${slug}`, "x-default": `/products/${slug}` },
    },
    openGraph: {
      title: `${machine.name} — Rmotion`,
      description: desc,
      url: `https://www.rmotion.fr${localizeHref(`/products/${slug}`, locale)}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function MachinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, t: dict } = await getT();
  const t = dict.machine;
  const L = (href: string) => localizeHref(href, locale as Locale);
  const machine = await getMachine(slug, locale === "en");
  if (!machine) notFound();

  const relatedArticles = await getRelatedArticles(machine.type, locale === "en");

  // Les specs peuvent être un objet {label: valeur} ou une liste ordonnée [{label, value}]
  // (la liste garantit l'ordre d'affichage, que jsonb ne préserve pas).
  const rawSpecs = machine.specs;
  const specEntries: [string, string][] = Array.isArray(rawSpecs)
    ? (rawSpecs as { label: string; value: string }[]).map((s) => [s.label, s.value])
    : Object.entries((rawSpecs ?? {}) as Record<string, string>);

  // Prix « à partir de » : price_range contient le montant en euros HT (ex. "5399").
  const priceAmount = Number(machine.price_range);
  const hasNumericPrice =
    machine.price_range != null &&
    String(machine.price_range).trim() !== "" &&
    Number.isFinite(priceAmount) &&
    priceAmount > 0;
  const priceLabel = formatPriceFrom(machine.price_range, locale as Locale, t.priceFrom);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: machine.name,
    description: machine.description
      ? String(machine.description).replace(/\n+/g, " ")
      : machine.tagline || "",
    category: machine.category,
    sku: machine.slug,
    ...(machine.images?.length
      ? { image: (machine.images as string[]).map((i) => `${SITE}${i}`) }
      : {}),
    brand: { "@type": "Brand", name: "Rmotion" },
    ...(specEntries.length
      ? {
          additionalProperty: specEntries.map(([name, value]) => ({
            "@type": "PropertyValue",
            name: name.replace(/_/g, " "),
            value,
          })),
        }
      : {}),
    offers: {
      "@type": hasNumericPrice ? "AggregateOffer" : "Offer",
      availability: "https://schema.org/BackOrder",
      itemCondition: "https://schema.org/NewCondition",
      priceCurrency: "EUR",
      ...(hasNumericPrice ? { lowPrice: priceAmount } : {}),
      url: `${SITE}${L(`/products/${slug}`)}`,
      seller: { "@type": "Organization", name: "Rmotion" },
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `https://www.rmotion.fr${L("/")}` },
      { "@type": "ListItem", position: 2, name: t.breadcrumbCatalog, item: `https://www.rmotion.fr${L("/products")}` },
      { "@type": "ListItem", position: 3, name: machine.name, item: `https://www.rmotion.fr${L(`/products/${slug}`)}` },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PixelEvent
        event="ViewContent"
        params={{
          content_type: "product",
          content_ids: [machine.slug],
          content_name: machine.name,
          content_category: machine.category,
        }}
      />
      <Breadcrumbs
        items={[
          { label: t.breadcrumbHome, href: L("/") },
          { label: t.breadcrumbCatalog, href: L("/products") },
          { label: machine.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 items-start">
        {/* Galerie — colonne gauche, ligne 1 (reste tout en haut sur mobile) */}
        <div className="lg:col-start-1 lg:row-start-1">
          {machine.images?.length ? (
            <ProductGallery images={machine.images} alt={machine.name} />
          ) : (
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm uppercase tracking-wider">
              {machine.category}
            </div>
          )}
        </div>

        {/* Colonne droite : nom, prix, CTA, specs (décalée de 50px).
            Sur mobile, ce bloc remonte juste sous la photo → prix + CTA visibles au 1er scroll. */}
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:pl-[50px] mt-10 lg:mt-0">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{machine.category}</p>
          <h1 className="text-3xl font-semibold mb-3">{machine.name}</h1>
          <p className="text-gray-500 mb-6">{machine.tagline}</p>

          {priceLabel && (
            <p className="text-2xl font-semibold text-gray-900 mb-8">{priceLabel}</p>
          )}

          <Link
            href={L(`/devis?machine=${machine.id}&nom=${encodeURIComponent(machine.name)}`)}
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors mb-10"
          >
            {t.quoteCta}
          </Link>

          {/* Infos service — identiques pour toutes les machines, au-dessus des specs */}
          <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 text-sm mb-8">
            <li className="flex items-start gap-3 px-4 py-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span className="text-gray-700">{t.warranty}</span>
            </li>
            <li className="flex items-start gap-3 px-4 py-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span className="text-gray-700">{t.stockLabel} <span className="text-gray-900 font-medium">{t.stockValue}</span>, {t.stockTail}</span>
            </li>
            <li className="flex items-start gap-3 px-4 py-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-gray-700">{t.support}</span>
            </li>
          </ul>

          {/* Options */}
          {machine.options?.length ? (
            <div className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">{t.options}</h2>
              <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 text-sm">
                {(machine.options as string[]).map((opt) => (
                  <li key={opt} className="flex items-center gap-3 px-4 py-3">
                    <svg className="w-4 h-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="text-gray-700">{opt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Caractéristiques */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">{t.specs}</h2>
            <dl className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {specEntries.map(([key, val], i) => (
                <div key={`${key}-${i}`} className="grid grid-cols-2 px-4 py-3 text-sm">
                  <dt className="text-gray-500 first-letter:uppercase">{key.replace(/_/g, " ")}</dt>
                  <dd className="text-gray-900 font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Description — colonne gauche sous la galerie ; passe en dernier sur mobile */}
        <div className="lg:col-start-1 lg:row-start-2 mt-10">
          <h2 className="text-lg font-semibold mb-4">{t.description}</h2>
          <div className="space-y-4">
            {String(machine.description || "")
              .split(/\n{2,}/)
              .filter((p) => p.trim())
              .map((para, idx) => {
                const isWarning = /^(AVERTISSEMENT|SAFETY WARNING)/i.test(para.trim());
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

      {/* FAQ — visible + JSON-LD FAQPage (utile référencement Google et IA) */}
      <div className="mt-16 max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">{t.faqTitle}</h2>
        <dl className="divide-y divide-gray-200 border-t border-gray-200">
          {t.faq.map((f) => (
            <div key={f.q} className="py-4">
              <dt className="font-medium text-gray-900">{f.q}</dt>
              <dd className="mt-1 text-gray-600 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Guides liés — maillage interne vers les articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-16 max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">{t.learnMore}</h2>
          <ul className="space-y-2">
            {relatedArticles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={L(`/articles/${a.slug}`)}
                  className="text-gray-700 hover:text-gray-900 underline underline-offset-2"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
