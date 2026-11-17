import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { localizeHref } from "@/i18n/config";

// Page affichée au public sur /outils, /panier, /compte… tant que la boutique
// n'est pas ouverte (réécriture faite par le middleware). Aucune requête en base.
export const metadata: Metadata = {
  title: "Boutique accessoires et outils — bientôt disponible",
  robots: { index: false, follow: true },
};

const TXT = {
  fr: {
    eyebrow: "Boutique en construction",
    title: "Nos accessoires et outils arrivent bientôt",
    body: "Large choix d'outils de coupe, plaquettes, fraises, mais également nos accessoires pour vos installations de laser et d'usinage.",
    cta: "Être prévenu de l'ouverture",
    back: "Découvrir nos machines",
  },
  en: {
    eyebrow: "Shop under construction",
    title: "Our accessories and tools are coming soon",
    body: "A wide range of cutting tools, inserts and end mills, as well as accessories for your laser and machining installations.",
    cta: "Get notified at launch",
    back: "Discover our machines",
  },
} as const;

export default async function ShopComingSoon() {
  const locale = await getLocale();
  const t = TXT[locale];
  const L = (h: string) => localizeHref(h, locale);
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-gray-500 mb-4">{t.eyebrow}</p>
      <h1 className="text-3xl sm:text-4xl font-semibold mb-6">{t.title}</h1>
      <p className="text-gray-600 text-lg mb-10">{t.body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={L("/contact")} className="rounded bg-gray-900 px-6 py-3 text-white hover:bg-gray-700">{t.cta}</Link>
        <Link href={L("/products")} className="rounded border border-gray-300 px-6 py-3 hover:bg-gray-50">{t.back}</Link>
      </div>
    </div>
  );
}
