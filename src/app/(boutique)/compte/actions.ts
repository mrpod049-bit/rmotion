"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { verifyTurnstile } from "@/lib/turnstile";
import { consumeLoginToken, getCurrentUser, logout, sendLoginLink } from "@/lib/shop/auth";
import { signup, SignupError } from "@/lib/shop/customers";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/compte");
const go = (path: string, q: Record<string, string>) => redirect(`${path}?${new URLSearchParams(q).toString()}`);

async function captchaOk(fd: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  return verifyTurnstile(fd.get("cf_token"), ip);
}

export async function requestLink(fd: FormData) {
  const next = safeNext(s(fd, "next"));
  if (!(await captchaOk(fd))) go("/compte/connexion", { err: "Vérification anti-robot échouée, réessayez.", next });
  await sendLoginLink(s(fd, "email"), next);
  go("/compte/connexion", { envoye: "1", next });
}

export async function verifyLink(fd: FormData) {
  const ok = await consumeLoginToken(s(fd, "token"));
  if (!ok) go("/compte/connexion", { err: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau." });
  redirect(safeNext(s(fd, "next")));
}

export async function doLogout() {
  await logout();
  redirect("/outils");
}

export async function doSignup(fd: FormData) {
  if (!(await captchaOk(fd))) go("/compte/inscription", { err: "Vérification anti-robot échouée, réessayez." });
  if (fd.get("cgv") == null) go("/compte/inscription", { err: "Vous devez accepter les conditions générales de vente." });
  try {
    await signup({
      country: s(fd, "country"), siret: s(fd, "siret"), company_name: s(fd, "company_name"), vat_number: s(fd, "vat_number"),
      name: s(fd, "name"), email: s(fd, "email"), phone: s(fd, "phone"),
      line1: s(fd, "line1"), line2: s(fd, "line2"), postal_code: s(fd, "postal_code"), city: s(fd, "city"),
    });
  } catch (e) {
    const msg = e instanceof SignupError ? e.message : "Une erreur est survenue. Réessayez ou contactez-nous.";
    if (!(e instanceof SignupError)) console.error("[shop] inscription :", e);
    go("/compte/inscription", { err: msg });
  }
  redirect("/compte/inscription?ok=1");
}

export async function saveAddress(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/compte/connexion?next=/compte");
  const kind = s(fd, "kind") === "billing" ? "billing" : "shipping";
  const country = (s(fd, "country") || "FR").toUpperCase().slice(0, 2);
  const vals = [s(fd, "company"), s(fd, "contact"), s(fd, "line1"), s(fd, "line2"), s(fd, "postal_code"), s(fd, "city")];
  const back = safeNext(s(fd, "back") || "/compte");
  if (!vals[0] || !vals[2] || !vals[4] || !vals[5]) go(back, { err: "Adresse incomplète (société, adresse, code postal, ville)." });
  // Hors UE : accepté ; la commande en ligne sera bloquée s'il n'existe pas de grille de port.
  const isDefault = fd.get("is_default") != null;
  if (isDefault) await pool.query("UPDATE shop_addresses SET is_default=false WHERE customer_id=$1 AND kind=$2", [user.customer_id, kind]);
  await pool.query(
    `INSERT INTO shop_addresses (customer_id, kind, company, contact, line1, line2, postal_code, city, country, phone, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [user.customer_id, kind, vals[0], vals[1] || null, vals[2], vals[3] || null, vals[4], vals[5], country, s(fd, "phone") || null, isDefault]
  );
  go(back, { ok: "Adresse ajoutée." });
}

export async function deleteAddress(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/compte/connexion?next=/compte");
  const r = await pool.query(
    `SELECT kind, (SELECT COUNT(*) FROM shop_addresses a2 WHERE a2.customer_id=a.customer_id AND a2.kind=a.kind)::int AS n
     FROM shop_addresses a WHERE id=$1 AND customer_id=$2`, [Number(fd.get("id")), user.customer_id]
  );
  if (r.rows[0]?.n <= 1) go("/compte", { err: "Conservez au moins une adresse de ce type." });
  await pool.query("DELETE FROM shop_addresses WHERE id=$1 AND customer_id=$2", [Number(fd.get("id")), user.customer_id]);
  go("/compte", { ok: "Adresse supprimée." });
}

export async function addColleague(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/compte/connexion?next=/compte");
  if (user.role !== "owner") go("/compte", { err: "Seul l'administrateur du compte peut ajouter des utilisateurs." });
  const email = s(fd, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) go("/compte", { err: "Email invalide." });
  try {
    await pool.query("INSERT INTO shop_users (customer_id, email, name, role) VALUES ($1,$2,$3,'buyer')", [user.customer_id, email, s(fd, "name") || null]);
  } catch {
    go("/compte", { err: "Cet email est déjà associé à un compte." });
  }
  go("/compte", { ok: `${email} peut maintenant se connecter avec son adresse email.` });
}
