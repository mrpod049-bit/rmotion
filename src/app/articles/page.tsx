import Link from "next/link";
import type { Metadata } from "next";
import pool from "@/lib/db";
import { getLocale, getT } from "@/i18n/server";
import { localizeHref, dateLocale } from "@/i18n/config";
import { translateCategory } from "./categories";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t.articles.metaTitle,
    description: t.articles.metaDesc,
    alternates: {
      canonical: localizeHref("/articles", locale),
      languages: { fr: "/articles", en: "/en/articles", "x-default": "/articles" },
    },
  };
}

async function getArticles(en: boolean) {
  const res = await pool.query(
    `SELECT id, slug, category, published_at,
            COALESCE(${en ? "title_en" : "NULL"}, title) AS title,
            COALESCE(${en ? "excerpt_en" : "NULL"}, excerpt) AS excerpt
     FROM articles
     WHERE published = true
     ORDER BY published_at DESC`
  );
  return res.rows;
}

export default async function ArticlesPage() {
  const { locale, t } = await getT();
  const articles = await getArticles(locale === "en");
  const L = (href: string) => localizeHref(href, locale);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">{t.articles.title}</h1>
      <p className="text-gray-500 mb-14">{t.articles.subtitle}</p>

      <div className="divide-y divide-gray-200">
        {articles.map((a) => (
          <Link key={a.id} href={L(`/articles/${a.slug}`)} className="group py-8 flex justify-between items-start gap-8 block hover:no-underline">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{translateCategory(a.category, locale)}</p>
              <h2 className="text-lg font-medium text-gray-900 group-hover:underline mb-2">{a.title}</h2>
              <p className="text-gray-500 text-sm">{a.excerpt}</p>
            </div>
            <span className="text-sm text-gray-400 whitespace-nowrap mt-1">
              {new Date(a.published_at).toLocaleDateString(dateLocale(locale), { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
