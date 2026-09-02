// Soumet des URLs à IndexNow (Bing, Yandex, Seznam… ; alimente aussi ChatGPT Search).
// La clé publique est hébergée sur https://www.rmotion.fr/<clé>.txt (prouve la propriété).
//
// Usage :
//   node scripts/indexnow.mjs https://www.rmotion.fr/articles/mon-article   (URLs explicites)
//   node scripts/indexnow.mjs --all                                          (toutes les pages publiées)
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const HOST = "www.rmotion.fr";
const SITE = "https://" + HOST;
const KEY = "3cbc782699eebf51b7d499f4aa8c7693";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

async function collectAll() {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const dbUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();
  const pool = new Pool({ connectionString: dbUrl });
  const urls = ["/", "/products", "/articles", "/projet", "/philosophie", "/devis", "/contact"].map((p) => SITE + p);
  try {
    const m = await pool.query("SELECT slug FROM machines WHERE published = true");
    for (const r of m.rows) urls.push(`${SITE}/products/${r.slug}`);
    const a = await pool.query("SELECT slug FROM articles WHERE published = true");
    for (const r of a.rows) urls.push(`${SITE}/articles/${r.slug}`);
  } finally {
    await pool.end();
  }
  return urls;
}

const args = process.argv.slice(2);
const urls = args.includes("--all") ? await collectAll() : args.filter((a) => a.startsWith("http"));
if (!urls.length) {
  console.error("Aucune URL. Usage: node scripts/indexnow.mjs <url...> | --all");
  process.exit(1);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
});
console.log(`IndexNow -> HTTP ${res.status} ${res.statusText} (200/202 = OK)`);
console.log(`${urls.length} URL(s) soumise(s) :`);
for (const u of urls) console.log("  " + u);
const text = await res.text().catch(() => "");
if (text) console.log("Réponse:", text.slice(0, 300));
