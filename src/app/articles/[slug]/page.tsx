import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";

async function getArticle(slug: string) {
  const res = await pool.query(
    `SELECT * FROM articles WHERE slug = $1 AND published = true`,
    [slug]
  );
  return res.rows[0] || null;
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href="/articles" className="text-sm text-gray-400 hover:text-gray-900 mb-8 block">← Retour aux articles</Link>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">{article.category}</p>
      <h1 className="text-3xl font-semibold mb-4">{article.title}</h1>
      <p className="text-gray-400 text-sm mb-10">
        {new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      {article.content ? (
        <div className="prose prose-gray text-gray-700 leading-relaxed">{article.content}</div>
      ) : (
        <p className="text-gray-400 italic">Contenu à venir.</p>
      )}
    </div>
  );
}
