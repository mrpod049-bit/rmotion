import type { Metadata } from "next";
import CategoryCatalog from "@/components/CategoryCatalog";
import { getMachines } from "@/lib/catalog";
import { getT } from "@/i18n/server";
import { localizeHref } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t.productsLaser.metaTitle,
    description: t.productsLaser.metaDesc,
    alternates: {
      canonical: localizeHref("/products/laser", locale),
      languages: { fr: "/products/laser", en: "/en/products/laser", "x-default": "/products/laser" },
    },
  };
}

export default async function LaserProductsPage() {
  const { locale, t } = await getT();
  const machines = await getMachines(locale === "en");
  const items = machines.filter((m) => m.type === "laser");
  return (
    <CategoryCatalog
      locale={locale}
      items={items}
      priceFromLabel={t.machine.priceFrom}
      content={t.productsLaser}
      help={{
        title: t.machines.helpTitle,
        text: t.machines.helpText,
        project: t.machines.helpProject,
        quote: t.machines.helpQuote,
      }}
    />
  );
}
