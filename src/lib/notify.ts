import { Resend } from "resend";

// Envoi d'un email de notification à chaque soumission de formulaire.
// N'envoie rien tant que RESEND_API_KEY n'est pas configurée (le formulaire
// continue de fonctionner et d'enregistrer en base dans tous les cas).

const apiKey = process.env.RESEND_API_KEY;
const to = process.env.CONTACT_EMAIL || "contact@rmotion.fr";
const from = process.env.RESEND_FROM || "Rmotion <onboarding@resend.dev>";

export async function sendNotification(
  subject: string,
  fields: { label: string; value: string }[],
  replyTo?: string
) {
  if (!apiKey) return; // pas de clé -> pas d'email (silencieux)

  const rows = fields
    .map(
      (f) =>
        `<tr><td style="padding:6px 12px;color:#6b7280;">${f.label}</td><td style="padding:6px 12px;font-weight:600;white-space:pre-line;">${escapeHtml(
          f.value
        )}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#111827;">
      <h2 style="margin:0 0 12px;">${subject}</h2>
      <table style="border-collapse:collapse;">${rows}</table>
    </div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
  } catch (e) {
    // On ne casse jamais la soumission si l'email échoue.
    console.error("Notification email échouée:", e);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
