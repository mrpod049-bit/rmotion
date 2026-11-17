import "server-only";
import { Resend } from "resend";

// Emails transactionnels de la boutique (lien de connexion, confirmation de
// commande, expédition…). Passe par Resend comme le reste du site.
// Sans RESEND_API_KEY (dev/test), l'email est écrit dans la console serveur
// au lieu d'être envoyé — pratique pour récupérer un lien de connexion en local.

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.SHOP_MAIL_FROM || process.env.RESEND_FROM || "Rmotion <notifications@rmotion.fr>";
export const ADMIN_EMAIL = process.env.SHOP_ADMIN_EMAIL || process.env.CONTACT_EMAIL || "contact@rmotion.fr";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Gabarit HTML sobre. `paragraphs` sont échappés ; `rawHtml` est inséré tel quel
 *  (réservé au contenu généré par le code, jamais à une saisie utilisateur). */
export function layout(title: string, paragraphs: string[], opts: { button?: { label: string; url: string }; rawHtml?: string } = {}) {
  const ps = paragraphs.map((p) => `<p style="margin:0 0 12px;line-height:1.5">${esc(p)}</p>`).join("");
  const btn = opts.button
    ? `<p style="margin:20px 0"><a href="${esc(opts.button.url)}" style="background:#111827;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${esc(opts.button.label)}</a></p>`
    : "";
  return `<div style="font-family:system-ui,sans-serif;color:#111827;max-width:600px">
    <h2 style="margin:0 0 16px">${esc(title)}</h2>${ps}${opts.rawHtml ?? ""}${btn}
    <p style="margin-top:28px;color:#6b7280;font-size:12px">Rmotion — boutique outils de coupe</p></div>`;
}

export async function sendMail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (!apiKey) {
    const text = html
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, "$2 [$1]")
      .replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
    console.log(`[shop-mail] (non envoyé, pas de RESEND_API_KEY) → ${to} : ${subject}\n${text}`);
    return false;
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({ from, to, subject, html, replyTo });
    if (error) {
      console.error("[shop-mail] refusé par Resend :", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[shop-mail] échec :", e);
    return false;
  }
}
