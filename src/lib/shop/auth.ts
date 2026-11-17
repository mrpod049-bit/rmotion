import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { baseUrl } from "./core";
import { layout, sendMail } from "./mail";

// Comptes clients : connexion par lien magique (aucun mot de passe stocké).
//  - Le jeton envoyé par email n'est conservé qu'en hash SHA-256, usage unique, 20 min.
//  - Le lien ouvre une page avec un bouton « Se connecter » (POST) : les antivirus
//    de messagerie qui pré-ouvrent les liens ne consomment donc pas le jeton.
//  - Session = cookie httpOnly aléatoire (hash en base), 30 jours.

const COOKIE = "rm_shop_session";
const SESSION_DAYS = 30;
const TOKEN_MINUTES = 20;
const MAX_LINKS_PER_HOUR = 5;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const token = () => randomBytes(32).toString("base64url");

export type ShopUser = {
  id: number; email: string; name: string | null; role: "owner" | "buyer";
  customer_id: number; company_name: string; status: "pending" | "approved" | "rejected" | "suspended";
  discount_pct: number; payment_terms: "prepaid" | "net30"; credit_limit: number | null;
  country: string; vat_number: string | null; vat_valid: boolean | null; siret: string | null;
};

/** Envoie un lien de connexion. Ne révèle jamais si l'email existe. */
export async function sendLoginLink(emailRaw: string, next = "/compte"): Promise<void> {
  const email = (emailRaw || "").trim().toLowerCase();
  if (!email) return;
  const u = await pool.query(
    "SELECT id, name FROM shop_users WHERE LOWER(email)=$1 AND active", [email]
  );
  const user = u.rows[0];
  if (!user) return;
  const recent = await pool.query(
    "SELECT COUNT(*)::int n FROM shop_login_tokens WHERE user_id=$1 AND created_at > NOW() - INTERVAL '1 hour'",
    [user.id]
  );
  if (recent.rows[0].n >= MAX_LINKS_PER_HOUR) return;

  const t = token();
  await pool.query(
    `INSERT INTO shop_login_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)`,
    [sha256(t), user.id, String(TOKEN_MINUTES)]
  );
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
  const url = `${baseUrl()}/compte/verifier?token=${t}&next=${encodeURIComponent(safeNext)}`;
  await sendMail(
    email,
    "Votre lien de connexion Rmotion",
    layout("Connexion à votre espace Rmotion", [
      `Bonjour${user.name ? " " + user.name : ""},`,
      `Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien est valable ${TOKEN_MINUTES} minutes et ne fonctionne qu'une fois.`,
      "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.",
    ], { button: { label: "Me connecter", url } })
  );
}

/** Consomme un jeton et ouvre la session. Renvoie false si invalide/expiré. */
export async function consumeLoginToken(t: string): Promise<boolean> {
  if (!t) return false;
  const r = await pool.query(
    `UPDATE shop_login_tokens SET used_at = NOW()
     WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [sha256(t)]
  );
  const userId = r.rows[0]?.user_id;
  if (!userId) return false;
  await startSession(userId);
  return true;
}

export async function startSession(userId: number) {
  const sid = token();
  await pool.query(
    `INSERT INTO shop_sessions (id_hash, user_id, expires_at) VALUES ($1,$2, NOW() + ($3 || ' days')::interval)`,
    [sha256(sid), userId, String(SESSION_DAYS)]
  );
  await pool.query("UPDATE shop_users SET last_login_at=NOW() WHERE id=$1", [userId]);
  // Ménage opportuniste des sessions/jetons expirés.
  await pool.query("DELETE FROM shop_sessions WHERE expires_at < NOW()");
  await pool.query("DELETE FROM shop_login_tokens WHERE expires_at < NOW() - INTERVAL '1 day'");
  (await cookies()).set(COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function logout() {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (sid) await pool.query("DELETE FROM shop_sessions WHERE id_hash=$1", [sha256(sid)]);
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<ShopUser | null> {
  const sid = (await cookies()).get(COOKIE)?.value;
  if (!sid) return null;
  const r = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.customer_id, c.company_name, c.status,
            c.discount_pct, c.payment_terms, c.credit_limit, c.country, c.vat_number, c.vat_valid, c.siret
     FROM shop_sessions s
     JOIN shop_users u ON u.id = s.user_id AND u.active
     JOIN shop_customers c ON c.id = u.customer_id
     WHERE s.id_hash=$1 AND s.expires_at > NOW()`,
    [sha256(sid)]
  );
  const row = r.rows[0];
  if (!row) return null;
  return {
    ...row,
    discount_pct: Number(row.discount_pct),
    credit_limit: row.credit_limit == null ? null : Number(row.credit_limit),
  };
}

/** Pour les pages réservées : redirige vers la connexion si besoin. */
export async function requireUser(next: string): Promise<ShopUser> {
  const u = await getCurrentUser();
  if (!u) redirect(`/compte/connexion?next=${encodeURIComponent(next)}`);
  return u;
}
