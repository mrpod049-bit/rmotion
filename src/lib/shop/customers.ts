import "server-only";
import pool from "@/lib/db";
import { baseUrl, withTx, EU_COUNTRIES } from "./core";
import { checkVies, cleanSiret, frVatFromSiren, lookupSiret, siretValid } from "./company";
import { ADMIN_EMAIL, layout, sendMail } from "./mail";

// Inscription et gestion des comptes clients professionnels.

export class SignupError extends Error {}

export type SignupInput = {
  country: string; siret?: string; company_name?: string; vat_number?: string;
  name: string; email: string; phone?: string;
  line1?: string; line2?: string; postal_code?: string; city?: string;
};

/** Crée un compte en attente de validation. Renvoie le libellé de la société. */
export async function signup(input: SignupInput): Promise<string> {
  const email = (input.email || "").trim().toLowerCase();
  const name = (input.name || "").trim();
  const country = (input.country || "FR").toUpperCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new SignupError("Adresse email invalide.");
  if (!name) throw new SignupError("Indiquez votre nom.");

  let company = (input.company_name || "").trim();
  let siret: string | null = null;
  let vat = (input.vat_number || "").toUpperCase().replace(/[^A-Z0-9]/g, "") || null;
  let vatValid: boolean | null = null;
  let naf: string | null = null;
  let addr = {
    line1: (input.line1 || "").trim(), line2: (input.line2 || "").trim() || null,
    postal_code: (input.postal_code || "").trim(), city: (input.city || "").trim(),
  };

  if (country === "FR") {
    siret = cleanSiret(input.siret || "");
    if (!siretValid(siret)) throw new SignupError("SIRET invalide (14 chiffres).");
    const found = await lookupSiret(siret);
    if (found) {
      if (!found.active) throw new SignupError("Cet établissement est fermé selon l'annuaire SIRENE.");
      company = company || found.name;
      naf = found.naf;
      if (!addr.line1) addr = { line1: found.address, line2: null, postal_code: found.postal_code, city: found.city };
    }
    vat = vat || frVatFromSiren(siret.slice(0, 9));
  } else if (EU_COUNTRIES.includes(country)) {
    if (!vat) throw new SignupError("Le numéro de TVA intracommunautaire est obligatoire pour un client de l'UE.");
    const v = await checkVies(vat);
    vatValid = v ? v.valid : null;
    if (v && !v.valid) throw new SignupError("Numéro de TVA non reconnu par VIES. Vérifiez la saisie.");
    if (!company && v?.name) company = v.name;
  }
  if (!company) throw new SignupError("Indiquez la raison sociale.");
  if (!addr.line1 || !addr.postal_code || !addr.city) throw new SignupError("Adresse de facturation incomplète.");

  const exists = await pool.query("SELECT 1 FROM shop_users WHERE LOWER(email)=$1", [email]);
  if (exists.rowCount) throw new SignupError("Un compte existe déjà avec cet email : utilisez « Se connecter ».");
  if (siret) {
    const s = await pool.query("SELECT 1 FROM shop_customers WHERE siret=$1", [siret]);
    if (s.rowCount) throw new SignupError("Cette société a déjà un compte. Demandez à son administrateur de vous ajouter, ou contactez-nous.");
  }

  await withTx(async (c) => {
    const cust = await c.query(
      `INSERT INTO shop_customers (company_name, siret, vat_number, vat_valid, vat_checked_at, country, naf_code)
       VALUES ($1,$2,$3,$4, CASE WHEN $4::boolean IS NOT NULL THEN NOW() END, $5,$6) RETURNING id`,
      [company, siret, vat, country === "FR" ? true : vatValid, country, naf]
    );
    const cid = cust.rows[0].id;
    await c.query(
      "INSERT INTO shop_users (customer_id, email, name, phone, role) VALUES ($1,$2,$3,$4,'owner')",
      [cid, email, name, (input.phone || "").trim() || null]
    );
    for (const kind of ["billing", "shipping"]) {
      await c.query(
        `INSERT INTO shop_addresses (customer_id, kind, company, contact, line1, line2, postal_code, city, country, phone, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)`,
        [cid, kind, company, name, addr.line1, addr.line2, addr.postal_code, addr.city, country, (input.phone || "").trim() || null]
      );
    }
  });

  await sendMail(email, "Votre demande de compte Rmotion",
    layout("Demande de compte reçue", [
      `Bonjour ${name},`,
      `Nous avons bien reçu la demande d'ouverture de compte pour ${company}. Nous la vérifions et revenons vers vous rapidement (généralement sous 24 h ouvrées).`,
      "Vous pourrez ensuite vous connecter et commander directement en ligne.",
    ]));
  await sendMail(ADMIN_EMAIL, `👤 Nouvelle demande de compte boutique — ${company}`,
    layout("Compte à valider", [`${company} (${siret ?? vat ?? country})`, `${name} — ${email}`],
      { button: { label: "Valider dans l'admin", url: `${baseUrl()}/admin/boutique/clients` } }));
  return company;
}

/** Validation par Rmotion : ouvre le compte, rattache une fiche société au CRM. */
export async function approveCustomer(customerId: number) {
  const r = await pool.query(
    `UPDATE shop_customers SET status='approved', approved_at=COALESCE(approved_at, NOW())
     WHERE id=$1 RETURNING company_name, partner_id`, [customerId]
  );
  const c = r.rows[0];
  if (!c) return;
  const owner = (await pool.query(
    "SELECT email, name, phone FROM shop_users WHERE customer_id=$1 ORDER BY (role='owner') DESC, id LIMIT 1", [customerId]
  )).rows[0];
  if (!c.partner_id) {
    // Fiche société dans le CRM (best-effort : n'empêche jamais la validation).
    try {
      const city = (await pool.query("SELECT city FROM shop_addresses WHERE customer_id=$1 AND kind='billing' LIMIT 1", [customerId])).rows[0]?.city;
      const p = await pool.query(
        `INSERT INTO crm_partners (name, is_company, email, phone, city, notes)
         VALUES ($1, true, $2, $3, $4, 'Compte boutique outils de coupe') RETURNING id`,
        [c.company_name, owner?.email ?? null, owner?.phone ?? null, city ?? null]
      );
      await pool.query("UPDATE shop_customers SET partner_id=$2 WHERE id=$1", [customerId, p.rows[0].id]);
    } catch (e) {
      console.error("[shop] création fiche CRM échouée :", e);
    }
  }
  if (owner) {
    await sendMail(owner.email, "Votre compte Rmotion est ouvert",
      layout("Compte validé", [
        `Bonjour${owner.name ? " " + owner.name : ""},`,
        `Le compte de ${c.company_name} est maintenant actif. Vous pouvez vous connecter avec votre adresse email et passer commande.`,
      ], { button: { label: "Accéder à la boutique", url: `${baseUrl()}/compte/connexion` } }));
  }
}

export async function setCustomerStatus(customerId: number, status: "rejected" | "suspended" | "pending") {
  await pool.query("UPDATE shop_customers SET status=$2 WHERE id=$1", [customerId, status]);
}

export async function recheckVat(customerId: number) {
  const c = (await pool.query("SELECT vat_number FROM shop_customers WHERE id=$1", [customerId])).rows[0];
  if (!c?.vat_number) return null;
  const v = await checkVies(c.vat_number);
  if (v) await pool.query("UPDATE shop_customers SET vat_valid=$2, vat_checked_at=NOW() WHERE id=$1", [customerId, v.valid]);
  return v;
}
