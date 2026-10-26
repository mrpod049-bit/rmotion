import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { localizeHref, type Locale } from "@/i18n/config";
import type { CatalogMachine } from "@/lib/catalog";

// Corps d'une page catégorie (laser ou CNC) : titre, intro, grille de produits,
// et bloc d'aide. Réutilisé par /products/laser et /products/cnc.
export default function CategoryCatalog({
  locale,
  items,
  priceFromLabel,
  content,
  help,
}: {
  locale: Locale;
  items: CatalogMachine[];
  priceFromLabel: string;
  content: { title: string; subtitle: string; intro: readonly string[] };
  help: { title: string; text: string; project: string; quote: string };
}) {
  const L = (href: string) => localizeHref(href, locale);
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">{content.title}</h1>
      <p className="text-gray-500 mb-6">{content.subtitle}</p>
      <div className="max-w-3xl space-y-4 text-gray-600 leading-relaxed mb-14">
        {content.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {items.map((m, i) => (
          <ProductCard key={m.id} m={m} locale={locale} priceFromLabel={priceFromLabel} priority={i === 0} />
        ))}
      </div>

      <section className="border-t border-gray-200 pt-10">
        <h2 className="text-lg font-semibold mb-2">{help.title}</h2>
        <p className="text-gray-600 max-w-2xl mb-5 leading-relaxed">{help.text}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={L("/projet")} className="inline-block border border-gray-300 px-5 py-2.5 rounded hover:border-gray-500 transition-colors">
            {help.project}
          </Link>
          <Link href={L("/devis")} className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded hover:bg-gray-700 transition-colors">
            {help.quote}
          </Link>
        </div>
      </section>
    </div>
  );
}
