import pool from "@/lib/db";
import { formatPriceFrom } from "@/lib/price";

// llms.txt généré dynamiquement depuis la base : il reste toujours à jour
// (renommage, ajout/suppression de machines ou d'articles, prix…).
// Format : https://llmstxt.org/

const SITE = "https://www.rmotion.fr";
export const revalidate = 3600; // regénéré au plus toutes les heures

export async function GET() {
  let machines: { slug: string; name: string; tagline: string | null; price_range: string | null; type: string }[] = [];
  let articles: { slug: string; title: string; excerpt: string | null }[] = [];
  try {
    const m = await pool.query(
      `SELECT m.slug, m.name, m.tagline, m.price_range, c.type
         FROM machines m JOIN categories c ON c.id = m.category_id
        WHERE m.published = true
        ORDER BY c.type, m.name`
    );
    machines = m.rows;
    const a = await pool.query(
      `SELECT slug, title, excerpt FROM articles WHERE published = true ORDER BY published_at DESC NULLS LAST`
    );
    articles = a.rows;
  } catch {
    // en cas d'indisponibilité de la base, on renvoie au moins l'en-tête.
  }

  const laser = machines.filter((m) => m.type === "laser");
  const cnc = machines.filter((m) => m.type === "cnc");
  const machineLine = (m: (typeof machines)[number]) => {
    const price = formatPriceFrom(m.price_range, "fr", "à partir de");
    const suffix = [m.tagline, price].filter(Boolean).join(" — ");
    return `- [${m.name}](${SITE}/products/${m.slug})${suffix ? ` — ${suffix}` : ""}`;
  };

  const lines: string[] = [
    "# Rmotion",
    "",
    "> Rmotion conçoit et distribue des machines de marquage/gravure laser fibre et des centres d'usinage CNC compacts, fiables et compétitifs, destinés aux PME et TPE. L'entreprise privilégie des équipements adaptés à l'échelle de l'atelier plutôt que des lignes de production, avec devis sur mesure et accompagnement technique. Site : " + SITE,
    "",
  ];

  if (laser.length) {
    lines.push("## Machines laser fibre", ...laser.map(machineLine), "");
  }
  if (cnc.length) {
    lines.push("## Machines CNC (fraisage / usinage)", ...cnc.map(machineLine), "");
  }
  if (articles.length) {
    lines.push(
      "## Guides et articles",
      ...articles.map((a) => `- [${a.title}](${SITE}/articles/${a.slug})${a.excerpt ? ` — ${a.excerpt}` : ""}`),
      ""
    );
  }

  lines.push(
    "## Informations pratiques",
    "- Garantie : 1 an sur toutes les machines",
    "- Délai de livraison indicatif : 45 à 60 jours",
    "- SAV et référents techniques joignables de 8h à 17h, du lundi au vendredi",
    "- Devis sur mesure : " + SITE + "/devis",
    "- Contact : " + SITE + "/contact — contact@rmotion.fr — +33 7 81 49 26 85",
    "- Zone desservie : France",
    "",
    "## Liens",
    "- Catalogue complet : " + SITE + "/products",
    "- Votre projet (solutions sur mesure) : " + SITE + "/projet",
    "- Notre philosophie : " + SITE + "/philosophie",
    ""
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
