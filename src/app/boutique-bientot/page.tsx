import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { localizeHref } from "@/i18n/config";

// Page affichée au public sur /outils, /panier, /compte… tant que la boutique
// n'est pas ouverte (réécriture faite par le middleware). Aucune requête en base.
export const metadata: Metadata = {
  title: "Boutique outils de coupe — bientôt disponible",
  robots: { index: false, follow: true },
};

const TXT = {
  fr: {
    eyebrow: "Boutique en construction",
    title: "Nos outils de coupe arrivent bientôt",
    body: "Plaquettes carbure, fraises, forets, porte-outils : nous préparons une boutique réservée aux professionnels, avec stock en temps réel, prix HT et livraison rapide.",
    cta: "Être prévenu de l'ouverture",
    back: "Découvrir nos machines",
    items: ["Compte professionnel et conditions personnalisées", "Stock affiché en temps réel", "Paiement en ligne ou à 30 jours"],
  },
  en: {
    eyebrow: "Shop under construction",
    title: "Our cutting tools are coming soon",
    body: "Carbide inserts, end mills, drills and tool holders: we are building a shop for professionals, with real-time stock, net prices and fast delivery.",
    cta: "Get notified at launch",
    back: "Discover our machines",
    items: ["Business account with tailored terms", "Real-time stock", "Online payment or 30-day terms"],
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
      <ul className="mx-auto mb-12 grid max-w-2xl gap-3 sm:grid-cols-3 text-sm text-gray-700">
        {t.items.map((i) => (
          <li key={i} className="rounded-lg border border-gray-200 bg-white px-4 py-3">{i}</li>
        ))}
      </ul>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={L("/contact")} className="rounded bg-gray-900 px-6 py-3 text-white hover:bg-gray-700">{t.cta}</Link>
        <Link href={L("/products")} className="rounded border border-gray-300 px-6 py-3 hover:bg-gray-50">{t.back}</Link>
      </div>
    </div>
  );
}
