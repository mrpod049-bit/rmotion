import type { Metadata } from "next";
import { getLocale, getT } from "@/i18n/server";
import { localizeHref } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t.devis.metaTitle,
    description: t.devis.metaDesc,
    alternates: {
      canonical: localizeHref("/devis", locale),
      languages: { fr: "/devis", en: "/en/devis", "x-default": "/devis" },
    },
  };
}

export default function DevisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
