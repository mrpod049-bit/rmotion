import Link from "next/link";
import pool from "@/lib/db";

export const metadata = {
  title: "Articles",
  description:
    "Guides techniques Rmotion : laser CO2 vs fibre, CNC bois ou métal, ROI d'une machine — pour bien choisir votre équipement laser ou CNC.",
  alternates: { canonical: "/articles" },
};

async function getArticles() {
  const res = await pool.query(
    `SELECT id, title, slug, excerpt, category, published_at
     FROM articles
     WHERE published = true
     ORDER BY published_at DESC`
  );
  return res.rows;
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">Articles</h1>
      <p className="text-gray-500 mb-14">Guides techniques et conseils pour choisir votre machine.</p>

      <div className="divide-y divide-gray-200">
        {articles.map((a) => (
          <Link key={a.id} href={`/articles/${a.slug}`} className="group py-8 flex justify-between items-start gap-8 block hover:no-underline">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{a.category}</p>
              <h2 className="text-lg font-medium text-gray-900 group-hover:underline mb-2">{a.title}</h2>
              <p className="text-gray-500 text-sm">{a.excerpt}</p>
            </div>
            <span className="text-sm text-gray-400 whitespace-nowrap mt-1">
              {new Date(a.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
