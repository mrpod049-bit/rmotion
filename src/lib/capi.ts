// API de conversions Meta (Conversions API / CAPI) — remontée SERVEUR des
// événements vers Meta, en complément du Pixel navigateur (pixel.ts).
//
// Pourquoi : le Pixel seul perd 20-40 % des conversions (bloqueurs, iOS, cookies
// coupés). Le même événement renvoyé côté serveur, avec un event_id partagé, est
// dédupliqué par Meta et rattrape ce que le navigateur laisse filer. Surtout, il
// nourrit l'algo d'optimisation avec des signaux de meilleure qualité de matching.
//
// Best-effort : ne jette JAMAIS dans le flux d'une requête (log seulement).
// No-op silencieux tant que META_CAPI_TOKEN n'est pas configuré — même logique
// que gtag.ts (no-op tant qu'un libellé de conversion est vide).
//
// Variables d'environnement :
//   META_CAPI_TOKEN      (secret) — token d'accès généré dans Events Manager >
//                        Paramètres > API de conversions > Générer un token.
//   META_PIXEL_ID        (optionnel) — sinon on reprend l'ID du Pixel navigateur.
//   META_GRAPH_VERSION   (optionnel) — version de la Graph API, défaut v21.0.
//   META_TEST_EVENT_CODE (optionnel) — pour tester dans Events Manager > Test.

import crypto from "node:crypto";
import { META_PIXEL_ID } from "./pixel";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const PIXEL_ID = process.env.META_PIXEL_ID || META_PIXEL_ID;

function sha256(v: string): string {
  return crypto.createHash("sha256").update(v).digest("hex");
}

// Email : minuscules + trim, puis SHA-256 (règle de normalisation Meta).
function hashEmail(email?: string | null): string | undefined {
  const e = (email || "").trim().toLowerCase();
  return e ? sha256(e) : undefined;
}

// Téléphone : chiffres uniquement, avec indicatif pays sans « + » (règle Meta).
// Un numéro FR à 10 chiffres commençant par 0 est converti en 33XXXXXXXXX.
function hashPhone(phone?: string | null): string | undefined {
  let d = (phone || "").replace(/\D/g, "");
  if (!d) return undefined;
  if (d.length === 10 && d.startsWith("0")) d = "33" + d.slice(1);
  return sha256(d);
}

export type CapiUserData = {
  email?: string | null;
  phone?: string | null;
  fbc?: string | null; // cookie _fbc (ou reconstruit depuis fbclid côté client)
  fbp?: string | null; // cookie _fbp
  ip?: string | null; // client_ip_address (X-Forwarded-For)
  userAgent?: string | null; // client_user_agent
};

export type CapiEvent = {
  eventName: string; // "Lead", "Purchase", "ViewContent"...
  eventId?: string; // identique au Pixel -> déduplication
  eventSourceUrl?: string;
  actionSource?: "website" | "system_generated" | "phone_call" | "email" | "other";
  userData: CapiUserData;
  customData?: Record<string, unknown>;
  eventTime?: number; // secondes epoch ; défaut = maintenant
};

// Envoie un événement à l'API de conversions Meta.
export async function sendCapiEvent(ev: CapiEvent): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return; // pas encore configuré -> no-op

  const user: Record<string, unknown> = {};
  const em = hashEmail(ev.userData.email);
  const ph = hashPhone(ev.userData.phone);
  if (em) user.em = [em];
  if (ph) user.ph = [ph];
  if (ev.userData.fbc) user.fbc = ev.userData.fbc;
  if (ev.userData.fbp) user.fbp = ev.userData.fbp;
  if (ev.userData.ip) user.client_ip_address = ev.userData.ip;
  if (ev.userData.userAgent) user.client_user_agent = ev.userData.userAgent;

  const data: Record<string, unknown> = {
    event_name: ev.eventName,
    event_time: ev.eventTime ?? Math.floor(Date.now() / 1000),
    action_source: ev.actionSource ?? "website",
    user_data: user,
  };
  if (ev.eventId) data.event_id = ev.eventId;
  if (ev.eventSourceUrl) data.event_source_url = ev.eventSourceUrl;
  if (ev.customData) data.custom_data = ev.customData;

  const payload: Record<string, unknown> = { data: [data] };
  const testCode = process.env.META_TEST_EVENT_CODE;
  if (testCode) payload.test_event_code = testCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[meta capi] échec", res.status, txt.slice(0, 500));
    }
  } catch (e) {
    console.error("[meta capi] erreur réseau", e);
  }
}
