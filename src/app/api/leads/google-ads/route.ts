import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendNotification } from "@/lib/notify";

// Webhook des « lead form » Google Ads.
// Google POST chaque lead en JSON temps réel sur cette URL. On valide la clé
// partagée (GOOGLE_ADS_LEAD_KEY, à recopier à l'identique côté Google Ads), on
// enregistre le lead dans newsletter_subscribers (source 'google-ads') et on
// notifie par email. Les leads apparaissent alors dans /admin comme les autres.
//
// Format du corps (extrait) :
//   { lead_id, campaign_id, google_key, is_test, gcl_id,
//     user_column_data: [ { column_id, string_value, column_name }, ... ] }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const email = (pick(cols, ["EMAIL"], ["mail", "courriel", "e-mail"]) || "").toLowerCase();
  const full = pick(cols, ["FULL_NAME"], ["full name", "nom complet", "nom"]);
  const first = pick(cols, ["FIRST_NAME"], ["first", "prénom"]);
  const last = pick(cols, ["LAST_NAME"], ["last", "nom de famille"]);
  const name = full || [first, last].filter(Boolean).join(" ").trim() || null;
  const phone = pick(cols, ["PHONE_NUMBER"], ["phone", "téléphone", "tel"]);
  const gclid = typeof body.gcl_id === "string" ? body.gcl_id.slice(0, 500) : null;
  const campaign = body.campaign_id != null ? String(body.campaign_id).slice(0, 200) : null;
  const isTest = body.is_test === true;

  // Google exige un 200 pour valider le webhook. Un lead de test (bouton « Envoyer
  // les données de test » côté Google) ou sans email exploitable est acquitté sans
  // être stocké, pour ne pas polluer la liste des vrais inscrits.
  if (isTest || !EMAIL_RE.test(email)) {
    return NextResponse.json({ received: true, stored: false, test: isTest });
  }

  // ON CONFLICT : si l'email existe déjà (ex. via le popup), on complète les
  // champs manquants sans écraser l'inscription d'origine. xmax = 0 => nouvelle ligne.
  const res = await pool.query(
    `INSERT INTO newsletter_subscribers (email, source, name, phone, gclid, campaign, consent)
     VALUES ($1, 'google-ads', $2, $3, $4, $5, true)
     ON CONFLICT (email) DO UPDATE SET
       name     = COALESCE(newsletter_subscribers.name, EXCLUDED.name),
       phone    = COALESCE(newsletter_subscribers.phone, EXCLUDED.phone),
       gclid    = COALESCE(newsletter_subscribers.gclid, EXCLUDED.gclid),
       campaign = COALESCE(newsletter_subscribers.campaign, EXCLUDED.campaign)
     RETURNING (xmax = 0) AS inserted`,
    [email, name, phone, gclid, campaign]
  );

  const inserted = res.rows[0]?.inserted === true;

  if (inserted && !isTest) {
    await sendNotification("Nouveau lead newsletter — Google Ads", [
      { label: "Email", value: email },
      { label: "Nom", value: name || "—" },
      { label: "Téléphone", value: phone || "—" },
      { label: "Source", value: "Google Ads (lead form)" },
    ]);
  }

  return NextResponse.json({ received: true, stored: true, test: isTest });
}
