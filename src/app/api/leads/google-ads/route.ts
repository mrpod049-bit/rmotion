import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendNotification } from "@/lib/notify";

// Webhook des « lead form » Google Ads (formulaire de demande de contact / rappel).
// Google POST chaque lead en JSON temps réel sur cette URL. On valide la clé
// partagée (GOOGLE_ADS_LEAD_KEY, recopiée à l'identique côté Google Ads), on
// enregistre la demande dans contact_leads (distinct de la newsletter Meta) et on
// notifie par email. Les leads apparaissent dans /admin, section « Demandes de contact ».
//
// Format du corps (extrait) :
//   { lead_id, campaign_id, google_key, is_test, gcl_id,
//     user_column_data: [ { column_id, string_value, column_name }, ... ] }

type Column = { column_id?: string; column_name?: string; string_value?: string };

// Récupère la valeur d'une colonne par identifiant standard, avec repli sur le
// libellé (column_name) car les identifiants custom varient d'un formulaire à l'autre.
function pick(cols: Column[], ids: string[], nameHints: string[] = []): string | null {
  for (const c of cols) {
    if (c.column_id && ids.includes(c.column_id.toUpperCase()) && c.string_value) {
      return c.string_value.trim();
    }
  }
  for (const c of cols) {
    const name = (c.column_name || "").toLowerCase();
    if (nameHints.some((h) => name.includes(h)) && c.string_value) {
      return c.string_value.trim();
    }
  }
  return null;
}

// Regroupe les réponses aux questions libres (tout ce qui n'est pas email/nom/tél).
const KNOWN_IDS = new Set([
  "EMAIL", "FULL_NAME", "FIRST_NAME", "LAST_NAME", "PHONE_NUMBER",
]);
function extractMessage(cols: Column[]): string | null {
  const parts = cols
    .filter((c) => !KNOWN_IDS.has((c.column_id || "").toUpperCase()) && c.string_value)
    .map((c) => `${c.column_name || c.column_id}: ${c.string_value!.trim()}`);
  return parts.length ? parts.join("\n") : null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.GOOGLE_ADS_LEAD_KEY;
  if (!secret) {
    // Sécurité : sans clé configurée, on refuse tout (évite un webhook ouvert).
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  // Validation de la clé partagée fournie par Google (champ google_key).
  if (body.google_key !== secret) {
    return NextResponse.json({ error: "Clé invalide" }, { status: 401 });
  }

  const cols: Column[] = Array.isArray(body.user_column_data) ? body.user_column_data : [];

  const email = (pick(cols, ["EMAIL"], ["mail", "courriel", "e-mail"]) || "").toLowerCase() || null;
  const full = pick(cols, ["FULL_NAME"], ["full name", "nom complet", "nom"]);
  const first = pick(cols, ["FIRST_NAME"], ["first", "prénom"]);
  const last = pick(cols, ["LAST_NAME"], ["last", "nom de famille"]);
  const name = full || [first, last].filter(Boolean).join(" ").trim() || null;
  const phone = pick(cols, ["PHONE_NUMBER"], ["phone", "téléphone", "tel"]);
  const message = extractMessage(cols);
  const leadId = typeof body.lead_id === "string" ? body.lead_id.slice(0, 255) : null;
  const gclid = typeof body.gcl_id === "string" ? body.gcl_id.slice(0, 500) : null;
  const campaign = body.campaign_id != null ? String(body.campaign_id).slice(0, 200) : null;
  const isTest = body.is_test === true;

  // Google exige un 200 pour valider le webhook. Un lead de test (bouton « Envoyer
  // les données de test ») ou sans coordonnées exploitables est acquitté sans être
  // stocké, pour ne pas polluer la liste des vraies demandes.
  if (isTest || (!email && !phone)) {
    return NextResponse.json({ received: true, stored: false, test: isTest });
  }

  // ON CONFLICT sur lead_id : si Google rejoue le webhook, on n'insère pas de doublon.
  // (lead_id NULL — cas d'un appel manuel — n'entre jamais en conflit : chaque appel crée une ligne.)
  const res = await pool.query(
    `INSERT INTO contact_leads (lead_id, email, name, phone, message, source, gclid, campaign)
     VALUES ($1, $2, $3, $4, $5, 'google-ads', $6, $7)
     ON CONFLICT (lead_id) DO NOTHING
     RETURNING id`,
    [leadId, email, name, phone, message, gclid, campaign]
  );

  const inserted = (res.rowCount ?? 0) > 0;

  if (inserted) {
    await sendNotification("Nouvelle demande de contact — Google Ads", [
      { label: "Nom", value: name || "—" },
      { label: "Email", value: email || "—" },
      { label: "Téléphone", value: phone || "—" },
      { label: "Message", value: message || "—" },
      { label: "Source", value: "Google Ads (lead form)" },
    ]);
  }

  return NextResponse.json({ received: true, stored: inserted, test: false });
}
