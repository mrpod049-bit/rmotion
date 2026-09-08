// Intégration Brevo pour la newsletter : ajout d'un inscrit et lecture de la
// liste pour connaître l'état de synchronisation. Inerte tant que
// BREVO_API_KEY / BREVO_LIST_ID ne sont pas configurés — l'inscription reste
// toujours enregistrée en base Neon quoi qu'il arrive.

const API = "https://api.brevo.com/v3";
const apiKey = process.env.BREVO_API_KEY;
const listId = Number(process.env.BREVO_LIST_ID);

export const brevoConfigured = Boolean(apiKey && listId);

function headers() {
  return {
    "api-key": apiKey as string,
    "content-type": "application/json",
    accept: "application/json",
  };
}

// Ajoute (ou met à jour) un contact et l'attache à la liste newsletter.
// Renvoie true si Brevo a bien pris l'ajout en compte.
export async function addNewsletterContact(email: string): Promise<boolean> {
  if (!apiKey || !listId) return false; // pas configuré -> silencieux

  try {
    const res = await fetch(`${API}/contacts`, {
      method: "POST",
      headers: headers(),
      // updateEnabled: si le contact existe déjà, Brevo le met à jour et
      // l'ajoute à la liste au lieu de renvoyer une erreur "déjà existant".
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
    });
    if (!res.ok) {
      console.error("Sync Brevo échoué:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Sync Brevo erreur:", e);
    return false;
  }
}

// Renvoie l'ensemble des emails (en minuscules) présents dans la liste Brevo.
// Sert à afficher, côté admin, quels inscrits sont déjà synchronisés.
export async function getBrevoListEmails(): Promise<Set<string>> {
  const emails = new Set<string>();
  if (!apiKey || !listId) return emails;

  const limit = 500;
  for (let offset = 0; ; offset += limit) {
    const res = await fetch(
      `${API}/contacts/lists/${listId}/contacts?limit=${limit}&offset=${offset}`,
      { headers: headers() }
    );
    if (!res.ok) {
      console.error("Lecture liste Brevo échouée:", res.status, await res.text().catch(() => ""));
      break;
    }
    const data = (await res.json()) as { contacts?: { email?: string }[] };
    const contacts = data.contacts ?? [];
    for (const c of contacts) if (c.email) emails.add(c.email.toLowerCase());
    if (contacts.length < limit) break;
  }
  return emails;
}
