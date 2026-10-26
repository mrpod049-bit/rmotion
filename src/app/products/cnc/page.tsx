import type { Metadata } from "next";
import CategoryCatalog from "@/components/CategoryCatalog";
import { getMachines } from "@/lib/catalog";
import { getT } from "@/i18n/server";
import { localizeHref } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t.productsCnc.metaTitle,
    description: t.productsCnc.metaDesc,
    alternates: {
      canonical: localizeHref("/products/cnc", locale),
      languages: { fr: "/products/cnc", en: "/en/products/cnc", "x-default": "/products/cnc" },
    },
  };
}

export default async function CncProductsPage() {
  const { locale, t } = await getT();
  const machines = await getMachines(locale === "en");
  const items = machines.filter((m) => m.type === "cnc");
  return (
    <CategoryCatalog
      locale={locale}
      items={items}
      priceFromLabel={t.machine.priceFrom}
      content={t.productsCnc}
      help={{
        title: t.machines.helpTitle,
        text: t.machines.helpText,
        project: t.machines.helpProject,
        quote: t.machines.helpQuote,
      }}
    />
  );
}
