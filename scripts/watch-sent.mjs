// Watcher temps réel du statut « contacté par email ».
//
// Surveille sent.csv (journal d'envoi du bot). Dès qu'une ligne y est ajoutée
// (le bot écrit une ligne par email envoyé), on marque le lead correspondant
// contacted_email = true dans le CRM, en quelques secondes.
//
// - Ne touche QUE contacted_email / contacted_email_at (jamais le tél manuel).
// - Idempotent : ne re-flippe que les leads encore non contactés.
// - Robuste : détection par taille+mtime du fichier (pas de fs.watch capricieux),
//   pool pg persistant, tourne en boucle jusqu'à arrêt.
//
// Usage :
//   node --no-warnings --env-file=.env.local scripts/watch-sent.mjs          (boucle)
//   node --no-warnings --env-file=.env.local scripts/watch-sent.mjs --once   (1 passe)

import { readFileSync, statSync } from "node:fs";
import { Pool } from "pg";

const BOT_DIR =
  "C:/Users/mrpod/Desktop/prospection-bot/prospection-laser-cnc/campagne";
const SENT_CSV = process.env.SENT_CSV || `${BOT_DIR}/sent.csv`;
const POLL_MS = Number(process.env.WATCH_POLL_MS || 3000);
const ONCE = process.argv.includes("--once");

function parseCSV(text) {
  const rows = [];
  let field = "", row = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        if (field !== "" || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
      } else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function readSent() {
  const rows = parseCSV(readFileSync(SENT_CSV, "utf8"));
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim());
  const ei = Object.fromEntries(header.map((c, i) => [c, i]));
  return rows.slice(1).map((r) => ({
    email: (r[ei.email] ?? "").trim().toLowerCase(),
    date: (r[ei.date] ?? "").trim(),
  })).filter((x) => x.email.includes("@"));
}

// Marque contacted_email pour tous les emails présents dans sent.csv qui ne le
// sont pas encore. Retourne le nombre de leads nouvellement marqués.
async function syncSent(pool) {
  const sent = readSent();
  if (!sent.length) return 0;
  // email -> date d'envoi (première rencontrée)
  const byEmail = new Map();
  for (const s of sent) if (!byEmail.has(s.email)) byEmail.set(s.email, s.date || "");

  const values = [];
  const params = [];
  let k = 0;
  for (const [email, dt] of byEmail) {
    values.push(`($${k + 1}, $${k + 2})`);
    params.push(email, dt);
    k += 2;
  }

  const { rows } = await pool.query(
    `UPDATE crm_leads l
       SET contacted_email = true,
           contacted_email_at = COALESCE(l.contacted_email_at, NULLIF(v.dt, '')::timestamp, NOW())
     FROM (VALUES ${values.join(",")}) AS v(email, dt)
     WHERE lower(l.email) = v.email AND l.contacted_email = false
     RETURNING l.id`,
    params
  );
  return rows.length;
}

function fileSig() {
  try {
    const s = statSync(SENT_CSV);
    return `${s.size}:${s.mtimeMs}`;
  } catch {
    return null; // fichier pas encore là
  }
}

const stamp = () => new Date().toISOString().slice(0, 19).replace("T", " ");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  if (ONCE) {
    const n = await syncSent(pool).catch((e) => { console.error(e.message); return -1; });
    console.log(`${stamp()}  passe unique : ${n} lead(s) marqué(s) contacté par email`);
    await pool.end();
    return;
  }

  console.log(`${stamp()}  watcher démarré — surveille ${SENT_CSV} (toutes les ${POLL_MS}ms)`);
  let lastSig = null;
  // Passe initiale (rattrape ce qui aurait changé pendant l'arrêt).
  try {
    const n = await syncSent(pool);
    lastSig = fileSig();
    if (n > 0) console.log(`${stamp()}  passe initiale : ${n} lead(s) marqué(s)`);
  } catch (e) { console.error(`${stamp()}  init: ${e.message}`); }

  // Boucle de surveillance.
  for (;;) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const sig = fileSig();
    if (sig === null || sig === lastSig) continue;
    lastSig = sig;
    try {
      const n = await syncSent(pool);
      if (n > 0) console.log(`${stamp()}  sent.csv modifié → ${n} nouveau(x) contact(s) email`);
    } catch (e) {
      console.error(`${stamp()}  erreur sync: ${e.message}`);
    }
  }
}

main();
