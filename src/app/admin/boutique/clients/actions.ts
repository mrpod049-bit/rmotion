"use server";
import pool from "@/lib/db";
import { approveCustomer, recheckVat, setCustomerStatus } from "@/lib/shop/customers";
import { attempt, str, int, num } from "../_server";

const path = (id: number) => `/admin/boutique/clients/${id}`;

export async function approve(fd: FormData) {
  const id = int(fd, "id");
  await attempt(str(fd, "back") || path(id), async () => { await approveCustomer(id); return "Compte validé — le client a été prévenu par email."; });
}

export async function changeStatus(fd: FormData) {
  const id = int(fd, "id");
  const s = str(fd, "status") as "rejected" | "suspended" | "pending";
  await attempt(path(id), async () => {
    if (!["rejected", "suspended", "pending"].includes(s)) throw new Error("Statut invalide.");
    await setCustomerStatus(id, s);
    return "Statut mis à jour.";
  });
}

export async function saveTerms(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => {
    const discount = num(fd, "discount_pct");
    const limit = num(fd, "credit_limit");
    const terms = str(fd, "payment_terms") === "net30" ? "net30" : "prepaid";
    if (!(discount >= 0 && discount <= 100)) throw new Error("Remise entre 0 et 100 %.");
    await pool.query(
      `UPDATE shop_customers SET company_name=$2, vat_number=$3, discount_pct=$4, payment_terms=$5, credit_limit=$6, notes=$7 WHERE id=$1`,
      [id, str(fd, "company_name"), str(fd, "vat_number").toUpperCase().replace(/\s/g, "") || null, discount, terms,
       Number.isNaN(limit) ? null : limit, str(fd, "notes") || null]
    );
    return "Conditions enregistrées.";
  });
}

export async function vatCheck(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => {
    const v = await recheckVat(id);
    if (!v) throw new Error("Service VIES indisponible, réessayez plus tard.");
    return v.valid ? `TVA valide${v.name ? " — " + v.name : ""}.` : "TVA NON valide selon VIES.";
  });
}

export async function addUser(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => {
    const email = str(fd, "email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email invalide.");
    try {
      await pool.query("INSERT INTO shop_users (customer_id, email, name, role) VALUES ($1,$2,$3,'buyer')", [id, email, str(fd, "name") || null]);
    } catch {
      throw new Error("Cet email est déjà utilisé par un compte.");
    }
    return "Utilisateur ajouté : il peut se connecter avec son email.";
  });
}

export async function toggleUser(fd: FormData) {
  const id = int(fd, "id");
  await attempt(path(id), async () => {
    await pool.query("UPDATE shop_users SET active = NOT active WHERE id=$1 AND customer_id=$2", [int(fd, "user_id"), id]);
    await pool.query("DELETE FROM shop_sessions WHERE user_id=$1", [int(fd, "user_id")]);
    return "Accès utilisateur modifié.";
  });
}
