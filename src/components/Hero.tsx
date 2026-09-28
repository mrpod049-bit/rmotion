"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeFromPathname, localizeHref } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const IMG_H = 300; // hauteur des photos (px) — LE réglage de taille
const GAP = 100; // écart entre deux photos (px)
const SEC_PER_IMG = 5; // vitesse du défilement (secondes par photo)

// Repli utilisé uniquement si aucune fiche produit publiée n'a d'image (évite un Hero vide).
const FALLBACK = ["/gammes/ol-1.jpg", "/gammes/cnc-1.jpg"];

// Les photos proviennent des fiches produit publiées (prop `images`), pas de visuels de démo :
// le carrousel reflète toujours le catalogue réel et se met à jour quand une fiche change.
// Chaque image garde son format naturel (hauteur fixe, largeur auto) : aucun recadrage.
export default function Hero({ images }: { images: string[] }) {
  const locale = localeFromPathname(usePathname());
  const t = getDictionary(locale).hero;
  const L = (href: string) => localizeHref(href, locale);

  const base = images.length ? images : FALLBACK;
  // Piste dupliquée exactement : le défilement de 0 à -50 % boucle sans couture.
  const track = [...base, ...base];

  return (
    <section className="relative bg-white text-white overflow-hidden">
      {/* Fond blanc + photos (format naturel) qui défilent en continu de droite à gauche */}
      <div className="absolute inset-0 flex items-center bg-white overflow-hidden">
        <div
          className="flex hero-marquee w-max"
          style={{ animationDuration: `${base.length * SEC_PER_IMG}s` }}
        >
          {track.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              aria-hidden
              className="shrink-0 w-auto rounded-lg"
              style={{ height: IMG_H, marginRight: GAP }}
            />
          ))}
        </div>
      </div>

      {/* Filtre bleuté par-dessus les photos */}
      <div className="absolute inset-0 bg-[#0b2239]/55" />

      {/* Contenu */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 lg:py-28">
        <p className="text-sm uppercase tracking-widest text-gray-300 mb-4">{t.eyebrow}</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6 max-w-2xl">
          {t.title}
        </h1>
        <p className="text-gray-200 text-lg mb-10 max-w-xl">
          {t.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href={L("/products")} className="bg-white text-gray-900 px-6 py-3 rounded font-medium text-center hover:bg-gray-100 transition-colors">
            {t.ctaCatalog}
          </Link>
          <Link href={L("/devis")} className="border border-gray-300 text-white px-6 py-3 rounded text-center hover:border-white hover:bg-white/10 transition-colors">
            {t.ctaQuote}
          </Link>
        </div>
      </div>
    </section>
  );
}
