// Ajout automatique d'un inscrit newsletter dans la liste de contacts Brevo.
// Ne fait rien tant que BREVO_API_KEY / BREVO_LIST_ID ne sont pas configurés
// (l'inscription continue de fonctionner et reste enregistrée en base Neon).
// L'erreur éventuelle est loguée mais ne casse jamais la soumission.

const apiKey = process.env.BREVO_API_KEY;
const listId = Number(process.env.BREVO_LIST_ID);

export async function addNewsletterContact(email: string): Promise<void> {
  if (!apiKey || !listId) return; // pas configuré -> silencieux

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      // updateEnabled: si le contact existe déjà, Brevo le met à jour et
      // l'ajoute à la liste au lieu de renvoyer une erreur "déjà existant".
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Sync Brevo échoué:", res.status, detail);
    }
  } catch (e) {
    console.error("Sync Brevo erreur:", e);
  }
}
