// Synchronise les prospects scrapés (CSV du bot) vers le CRM (Neon).
//
// - Source : synthese_prospects.csv (liste complète des prospects)
// - Statut « contacté » : croisé avec sent.csv (journal des emails envoyés)
// - Anti-doublon : clé naturelle nom + code postal (import_key)
// - Idempotent : réexécutable ; enrichit les leads existants SANS écraser
//   ce que tu as modifié (type, étape, nom, archivage préservés).
//
// Usage :
//   node --env-file=.env.local scripts/sync-prospects.mjs
// Chemins surchargeables via variables d'environnement PROSPECTS_CSV / SENT_CSV.

import { readFileSync } from "node:fs";
import { Pool } from "pg";

const BOT_DIR =
  "C:/Users/mrpod/Desktop/prospection-bot/prospection-laser-cnc/campagne";
const PROSPECTS_CSV = process.env.PROSPECTS_CSV || `${BOT_DIR}/synthese_prospects.csv`;
const SENT_CSV = process.env.SENT_CSV || `${BOT_DIR}/sent.csv`;

// --- Parseur CSV (gère guillemets, virgules internes, "" échappés) ---
function parseCSV(text) {
  const rows = [];
  let field = "", row = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
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

function toObjects(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((r) => {
    const o = {};
    header.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}

// Normalise un nom pour la clé et le rapprochement (majuscules, sans accents).
const norm = (x) =>
  (x || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, " ").trim();

function readCSV(path) {
  return toObjects(parseCSV(readFileSync(path, "utf8")));
}

async function main() {
  const prospects = readCSV(PROSPECTS_CSV);
  const sent = readCSV(SENT_CSV);

  // Index des emails déjà envoyés (sent.csv est un journal d'emails).
  // On se base UNIQUEMENT sur l'email : le rapprochement par nom sur-marque
  // les homonymes / établissements d'une même enseigne.
  const sentByEmail = new Map(); // email -> date
  for (const s of sent) {
    const email = (s.email || "").toLowerCase();
    if (email) sentByEmail.set(email, s.date || true);
  }

  // Construit les lignes à upserter (dédoublonnées sur import_key).
  const seen = new Set();
  const records = [];
  for (const p of prospects) {
    const nom = p.nom || "";
    if (!nom) continue;
    const cp = (p.code_postal || "").trim();
    const importKey = `synthese:${norm(nom)}:${cp}`;
    if (seen.has(importKey)) continue; // doublon interne au CSV
    seen.add(importKey);

    const email = (p.email || "").toLowerCase() || null;
    const sentDate = email ? sentByEmail.get(email) : undefined;
    const contacted = sentDate !== undefined;
    // date d'envoi si connue (true = envoyé sans date exploitable)
    const contactedDate = typeof sentDate === "string" ? sentDate : null;
    const score = Number.parseInt(p.score_vitalite, 10);

    records.push({
      import_key: importKey,
      name: nom,
      company_name: nom,
      email,
      phone: p.telephone || null,
      city: p.commune || null,
      department: p.departement || null,
      sector: p.secteur || null,
      activity: p.activite || null,
      website: p.site_web || null,
      score: Number.isFinite(score) ? score : null,
      contacted,
      contacted_at: contacted && contactedDate ? contactedDate : null,
    });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let inserted = 0, updated = 0;
  const CHUNK = 100;

  try {
    for (let i = 0; i < records.length; i += CHUNK) {
      const chunk = records.slice(i, i + CHUNK);
      const cols = [
        "import_key", "name", "type", "company_name", "email", "phone",
        "city", "department", "sector", "activity", "website", "score",
        "source", "contacted_email", "contacted_email_at",
      ];
      const values = [];
      const params = [];
      chunk.forEach((r, k) => {
        const b = k * cols.length;
        values.push(`(${cols.map((_, j) => `$${b + j + 1}`).join(",")})`);
        params.push(
          r.import_key, r.name, "lead", r.company_name, r.email, r.phone,
          r.city, r.department, r.sector, r.activity, r.website, r.score,
          "scraping", r.contacted, r.contacted_at // contacted_email / _at
        );
      });

      // Sur conflit : on n'enrichit QUE les coordonnées et le statut de contact.
      // type / stage_id / active / name / expected_revenue restent intacts
      // (une opportunité convertie ou un lead archivé ne sont pas ré-écrasés).
      const sql = `
        INSERT INTO crm_leads (${cols.join(",")})
        VALUES ${values.join(",")}
        ON CONFLICT (import_key) DO UPDATE SET
          email              = EXCLUDED.email,
          phone              = EXCLUDED.phone,
          city               = EXCLUDED.city,
          department         = EXCLUDED.department,
          sector             = EXCLUDED.sector,
          activity           = EXCLUDED.activity,
          website            = EXCLUDED.website,
          score              = EXCLUDED.score,
          contacted_email    = EXCLUDED.contacted_email,
          contacted_email_at = COALESCE(EXCLUDED.contacted_email_at, crm_leads.contacted_email_at)
        RETURNING (xmax = 0) AS inserted`;
        // NB : contacted_phone / contacted_phone_at ne sont jamais touchés
        // par la synchro — c'est une déclaration manuelle.
      const { rows } = await pool.query(sql, params);
      for (const row of rows) row.inserted ? inserted++ : updated++;
    }

    const contactedCount = records.filter((r) => r.contacted).length;
    console.log(
      `✓ Synchro prospects : ${records.length} lignes | ` +
      `${inserted} nouveaux, ${updated} mis à jour | ` +
      `${contactedCount} contactés, ${records.length - contactedCount} à contacter`
    );
  } catch (err) {
    console.error("✗ Échec de la synchro :", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
