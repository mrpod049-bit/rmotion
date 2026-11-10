// Vérification serveur du jeton Cloudflare Turnstile (anti-spam des formulaires).
//
// Dégradation gracieuse : si TURNSTILE_SECRET_KEY n'est pas défini (clés pas
// encore ajoutées), on NE bloque PAS les formulaires — ils continuent de
// fonctionner. La protection s'active dès que la clé secrète est présente.

const SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: unknown, ip?: string): Promise<boolean> {
  if (!SECRET) return true; // captcha non configuré -> on laisse passer
  if (typeof token !== "string" || !token) return false;

  try {
    const form = new URLSearchParams();
    form.append("secret", SECRET);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Erreur réseau de vérification : on refuse par prudence (fail-closed).
    return false;
  }
}
