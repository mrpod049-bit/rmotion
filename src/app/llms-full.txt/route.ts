import pool from "@/lib/db";
import { formatPriceFrom } from "@/lib/price";

// llms-full.txt : version étendue de llms.txt avec le contenu complet
// (specs machines + texte intégral des articles) pour maximiser l'extraction
// et la citation par les assistants IA. Généré dynamiquement depuis la base.

const SITE = "https://www.rmotion.fr";
export const revalidate = 3600;

// Transforme un fragment HTML en texte lisible (les articles sont stockés en HTML).
function htmlToText(html: string): string {
  return html
    .replace(/<\s*(h[1-6]|p|li|div|br)[^>]*>/gi, "\n")
    .replace(/<\/\s*(h[1-6]|p|li|div|ul|ol)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type SpecEntry = { label: string; value: string };

export async function GET() {
  const lines: string[] = [
    "# Rmotion — documentation complète",
    "",
    "> Machines de marquage/gravure laser fibre et centres d'usinage CNC compacts pour PME et TPE. Devis sur mesure, accompagnement technique, garantie 1 an. Site : " + SITE,
    "",
  ];

  try {
    const machines = await pool.query(
      `SELECT m.slug, m.name, m.tagline, m.description, m.specs, m.options, m.price_range, c.name AS category, c.type
         FROM machines m JOIN categories c ON c.id = m.category_id
        WHERE m.published = true
        ORDER BY c.type, m.name`
    );

    lines.push("## Machines", "");
    for (const m of machines.rows) {
      const price = formatPriceFrom(m.price_range, "fr", "À partir de");
      lines.push(`### ${m.name} (${m.category})`);
      lines.push(`URL : ${SITE}/products/${m.slug}`);
      if (m.tagline) lines.push(m.tagline);
      if (price) lines.push(`Prix : ${price}`);
      if (m.description) lines.push("", String(m.description).trim());
      const specs = m.specs;
      const entries: SpecEntry[] = Array.isArray(specs)
        ? (specs as SpecEntry[])
        : Object.entries((specs ?? {}) as Record<string, string>).map(([label, value]) => ({ label, value }));
      if (entries.length) {
        lines.push("", "Caractéristiques :");
        for (const s of entries) lines.push(`- ${s.label} : ${s.value}`);
      }
      if (Array.isArray(m.options) && m.options.length) {
        lines.push("", "Options :");
        for (const o of m.options as string[]) lines.push(`- ${o}`);
      }
      lines.push("");
    }

    const articles = await pool.query(
      `SELECT slug, title, excerpt, content FROM articles WHERE published = true ORDER BY published_at DESC NULLS LAST`
    );
    lines.push("## Guides et articles", "");
    for (const a of articles.rows) {
      lines.push(`### ${a.title}`);
      lines.push(`URL : ${SITE}/articles/${a.slug}`);
      if (a.excerpt) lines.push("", String(a.excerpt).trim());
      if (a.content) lines.push("", htmlToText(String(a.content)));
      lines.push("");
    }
  } catch {
    lines.push("_Contenu temporairement indisponible._");
  }

  lines.push(
    "## Contact",
    "- Devis sur mesure : " + SITE + "/devis",
    "- Contact : contact@rmotion.fr — +33 7 81 49 26 85",
    "- Zone desservie : France",
    ""
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
