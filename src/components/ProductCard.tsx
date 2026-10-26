import Link from "next/link";
import Image from "next/image";
import { localizeHref, type Locale } from "@/i18n/config";
import { formatPriceFrom } from "@/lib/price";
import type { CatalogMachine } from "@/lib/catalog";

// Taille d'affichage de la photo dans sa cellule (% de la cellule). Défaut : 85.
const IMG_SCALE: Record<string, number> = {
  "scl-series": 91,
  "bcl-series": 70,
  "ol-series": 70,
  "scs-series": 65,
};

// Carte produit du catalogue — réutilisée par /products et les pages catégorie.
export default function ProductCard({
  m,
  locale,
  priceFromLabel,
  priority = false,
}: {
  m: CatalogMachine;
  locale: Locale;
  priceFromLabel: string;
  priority?: boolean;
}) {
  const price = formatPriceFrom(m.price_range, locale, priceFromLabel);
  return (
    <Link
      href={localizeHref(`/products/${m.slug}`, locale)}
      className="group border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors"
    >
      {m.images?.[0] ? (
        <div className="h-72 mb-5 flex items-center justify-center">
          <div className="relative w-full" style={{ height: `${IMG_SCALE[m.slug] ?? 85}%` }}>
            <Image
              src={m.images[0]}
              alt={m.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
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
}
