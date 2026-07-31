import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getT } from "@/i18n/server";
import { localizeHref } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t.projet.metaTitle,
    description: t.projet.metaDesc,
    alternates: {
      canonical: localizeHref("/projet", locale),
      languages: { fr: "/projet", en: "/en/projet", "x-default": "/projet" },
    },
  };
}

export default async function ProjetPage() {
  const { locale, t: dict } = await getT();
  const t = dict.projet;

  return (
    <>
      {/* Intro */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-4">{t.eyebrow}</p>
          <h1 className="text-4xl font-semibold leading-tight mb-8">{t.h1}</h1>
          <div className="space-y-5 text-gray-200 text-lg leading-relaxed">
            {t.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Étapes */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold mb-12">{t.stepsHeading}</h2>
        <ol className="space-y-10">
          {t.steps.map((step, i) => (
            <li key={i} className="flex gap-6">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">
                {i + 1}
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="bg-[#0d2f4e] text-white">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">{t.ctaTitle}</h2>
          <p className="text-gray-200 mb-8">{t.ctaText}</p>
          <Link
            href={localizeHref("/devis", locale)}
            className="inline-block bg-white text-gray-900 px-6 py-3 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            {t.ctaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
