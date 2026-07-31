import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import pool from "@/lib/db";
import { getLocale, getT } from "@/i18n/server";
import { localizeHref, dateLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { translateCategory } from "../categories";

const getArticle = cache(async (slug: string, en: boolean) => {
  const res = await pool.query(
    `SELECT id, slug, category, cover_image, published_at,
            COALESCE(${en ? "title_en" : "NULL"}, title) AS title,
            COALESCE(${en ? "excerpt_en" : "NULL"}, excerpt) AS excerpt,
            COALESCE(${en ? "content_en" : "NULL"}, content) AS content
     FROM articles WHERE slug = $1 AND published = true`,
    [slug]
  );
  return res.rows[0] || null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const article = await getArticle(slug, locale === "en");
  if (!article) return { title: getDictionary(locale).articles.notFound };
  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: {
      canonical: localizeHref(`/articles/${slug}`, locale),
      languages: { fr: `/articles/${slug}`, en: `/en/articles/${slug}`, "x-default": `/articles/${slug}` },
    },
    openGraph: {
      type: "article",
      title: `${article.title} — Rmotion`,
      description: article.excerpt || undefined,
      url: `https://www.rmotion.fr${localizeHref(`/articles/${slug}`, locale)}`,
      ...(article.cover_image ? { images: [{ url: article.cover_image }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, t: dict } = await getT();
  const t = dict.articles;
  const L = (href: string) => localizeHref(href, locale);
  const article = await getArticle(slug, locale === "en");
  if (!article) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `https://www.rmotion.fr${L("/")}` },
      { "@type": "ListItem", position: 2, name: t.breadcrumbArticles, item: `https://www.rmotion.fr${L("/articles")}` },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://www.rmotion.fr${L(`/articles/${slug}`)}` },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || undefined,
    ...(article.cover_image ? { image: `https://www.rmotion.fr${article.cover_image}` } : {}),
    ...(article.published_at ? { datePublished: new Date(article.published_at).toISOString() } : {}),
    author: { "@type": "Organization", name: "Rmotion" },
    publisher: {
      "@type": "Organization",
      name: "Rmotion",
      logo: { "@type": "ImageObject", url: "https://www.rmotion.fr/logo.png" },
    },
    mainEntityOfPage: `https://www.rmotion.fr${L(`/articles/${slug}`)}`,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Link href={L("/articles")} className="text-sm text-gray-400 hover:text-gray-900 mb-8 block">{t.back}</Link>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">{translateCategory(article.category, locale)}</p>
      <h1 className="text-3xl font-semibold mb-4">{article.title}</h1>
      {article.published_at && (
        <p className="text-gray-400 text-sm mb-10">
          {new Date(article.published_at).toLocaleDateString(dateLocale(locale), { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      {article.content ? (
        <div
          className="prose prose-gray max-w-none prose-headings:font-semibold prose-img:rounded-lg prose-img:w-full"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      ) : (
        <p className="text-gray-400 italic">{t.comingSoon}</p>
      )}
    </div>
  );
}
