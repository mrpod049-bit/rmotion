import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import pool from "@/lib/db";

const getArticle = cache(async (slug: string) => {
  const res = await pool.query(
    `SELECT * FROM articles WHERE slug = $1 AND published = true`,
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
  const article = await getArticle(slug);
  if (!article) return { title: "Article introuvable" };
  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: { canonical: `/articles/${slug}` },
    openGraph: {
      type: "article",
      title: `${article.title} — Rmotion`,
      description: article.excerpt || undefined,
      url: `https://www.rmotion.fr/articles/${slug}`,
      ...(article.cover_image ? { images: [{ url: article.cover_image }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.rmotion.fr" },
      { "@type": "ListItem", position: 2, name: "Articles", item: "https://www.rmotion.fr/articles" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://www.rmotion.fr/articles/${slug}` },
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
    mainEntityOfPage: `https://www.rmotion.fr/articles/${slug}`,
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
      <Link href="/articles" className="text-sm text-gray-400 hover:text-gray-900 mb-8 block">← Retour aux articles</Link>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">{article.category}</p>
      <h1 className="text-3xl font-semibold mb-4">{article.title}</h1>
      {article.published_at && (
        <p className="text-gray-400 text-sm mb-10">
          {new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      {article.content ? (
        <div
          className="prose prose-gray max-w-none prose-headings:font-semibold prose-img:rounded-lg prose-img:w-full"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      ) : (
        <p className="text-gray-400 italic">Contenu à venir.</p>
      )}
    </div>
  );
}
