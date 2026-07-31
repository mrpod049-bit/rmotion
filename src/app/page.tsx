import Link from "next/link";
import Hero from "@/components/Hero";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { localizeHref } from "@/i18n/config";

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDictionary(locale).home;
  const L = (href: string) => localizeHref(href, locale);

  return (
    <>
      {/* Hero */}
      <Hero />

      {/* Gammes */}
      <section className="flex flex-col w-full">
        {[
          { label: t.ranges.engraving.label, href: L("/machines?type=gravure-laser"), desc: t.ranges.engraving.desc, image: "/gammes/gravure-laser.jpg", transform: undefined },
          { label: t.ranges.milling.label, href: L("/machines?type=cnc"), desc: t.ranges.milling.desc, image: "/gammes/milling.jpg", transform: undefined },
          { label: t.ranges.project.label, href: L("/projet"), desc: t.ranges.project.desc, image: "/gammes/design.jpg", transform: undefined },
        ].map((gamme, i) => (
          <Link
            key={gamme.label}
            href={gamme.href}
            className="group relative flex items-center h-56 px-6 sm:px-12 bg-[#0f3151] border-b last:border-b-0 border-white/10 overflow-hidden"
          >
            {gamme.image ? (
              <>
                {/* Image : toujours visible sur mobile, révélée au survol sur desktop */}
                <div className="absolute inset-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gamme.image}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover gamme-img"
                    style={gamme.transform ? ({ "--gamme-transform": gamme.transform } as React.CSSProperties) : undefined}
                  />
                </div>
                {/* Dégradé neutre pour la lisibilité du texte (pas de teinte bleue sur l'image) */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-700" />
              </>
            ) : (
              <>
                {/* Placeholder — à remplacer par une vraie image */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-300 text-xs uppercase tracking-widest group-hover:opacity-0 transition-opacity">
                  Image gamme {i + 1}
                </div>
              </>
            )}
            <div className="relative z-10 max-w-xl">
              <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">
                {t.rangeEyebrow}
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-2">
                {gamme.label}
              </h2>
              <p className="text-sm text-gray-200 mb-4">
                {gamme.desc}
              </p>
              <span className="text-sm text-white underline">
                {t.seeProducts}
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* CTA articles */}
      <Link href={L("/articles")} className="block bg-[#184f79] text-white hover:bg-[#134063] transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-20 text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">{t.articlesTitle}</h2>
          <p className="text-gray-200 text-lg sm:text-xl max-w-2xl">
            {t.articlesText}
          </p>
        </div>
      </Link>

      {/* Promesse */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 text-sm">
          <div>
            <p className="font-semibold text-gray-900 mb-2">{t.promise1Title}</p>
            <p className="text-gray-500">{t.promise1Text}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">{t.promise2Title}</p>
            <p className="text-gray-500">{t.promise2Text}</p>
          </div>
        </div>
      </section>
    </>
  );
}
