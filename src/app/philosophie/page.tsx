import type { Metadata } from "next";
import { getLocale, getT } from "@/i18n/server";
import { localizeHref } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t.philosophie.metaTitle,
    description: t.philosophie.metaDesc,
    alternates: {
      canonical: localizeHref("/philosophie", locale),
      languages: { fr: "/philosophie", en: "/en/philosophie", "x-default": "/philosophie" },
    },
  };
}

export default async function PhilosophiePage() {
  const { t: dict } = await getT();
  const t = dict.philosophie;

  return (
    <>
      {/* Intro */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-4">{t.eyebrow}</p>
          <h1 className="text-4xl font-semibold leading-tight">{t.h1}</h1>
        </div>
      </section>

      {/* Texte */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
          {t.paragraphs.map((p, i) => (
            <div key={i}>
              <p>{p}</p>
              {i === 2 && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/philosophie-projet.jpg"
                  alt={t.eyebrow}
                  className="w-full rounded-lg mt-8"
                />
              )}
            </div>
          ))}
        </div>

        {/* Accompagnement */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t.supportHeading}</h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            {t.support.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/philosophie-accompagnement.jpg"
            alt={t.supportHeading}
            className="w-full rounded-lg mt-8"
          />
        </div>

        {/* SAV et garantie */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t.warrantyHeading}</h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            {t.warranty.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/philosophie-maintenance.jpg"
            alt={t.warrantyHeading}
            className="w-full rounded-lg mt-8"
          />
        </div>
      </section>
    </>
  );
}
