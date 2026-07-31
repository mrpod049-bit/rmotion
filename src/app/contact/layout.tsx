import type { Metadata } from "next";
import { getLocale, getT } from "@/i18n/server";
import { localizeHref } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t.contact.metaTitle,
    description: t.contact.metaDesc,
    alternates: {
      canonical: localizeHref("/contact", locale),
      languages: { fr: "/contact", en: "/en/contact", "x-default": "/contact" },
    },
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
