import "server-only";
import type { PoolClient } from "pg";
import pool from "@/lib/db";

// Socle commun de la boutique : interrupteur, transactions, numérotation,
// réglages, formatage.

/** Interrupteur général : tant qu'il est éteint, la boutique publique répond 404.
 *  L'admin boutique (protégé par mot de passe) reste accessible pour préparer
 *  le catalogue et le stock avant l'ouverture. */
export function shopEnabled(): boolean {
  return process.env.SHOP_ENABLED === "true";
}

export function baseUrl(): string {
  return (process.env.SHOP_BASE_URL || "https://www.rmotion.fr").replace(/\/$/, "");
}

/** Exécute fn dans une transaction (BEGIN/COMMIT, ROLLBACK sur erreur). */
export async function withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

/** Numéro continu par type et par année : CMD-2026-00001, BCF-2026-0001… */
export async function nextNumber(c: PoolClient, name: string, pad = 5): Promise<string> {
  const year = new Date().getFullYear();
  const r = await c.query(
    `INSERT INTO shop_counters (name, year, value) VALUES ($1, $2, 1)
     ON CONFLICT (name, year) DO UPDATE SET value = shop_counters.value + 1
     RETURNING value`,
    [name, year]
  );
  return `${name}-${year}-${String(r.rows[0].value).padStart(pad, "0")}`;
}

export type CompanyInfo = {
  name: string; address: string; postal_code: string; city: string; country: string;
  siret: string; vat_number: string; email: string; phone: string; iban: string; bic: string;
};

export type ShopSettings = {
  min_order_ht: number;
  free_shipping_ht: number;
  reservation_minutes: number;
  net30_days: number;
  company: CompanyInfo;
};

export async function getSettings(): Promise<ShopSettings> {
  const r = await pool.query("SELECT key, value FROM shop_settings");
  const m = Object.fromEntries(r.rows.map((x) => [x.key, x.value]));
  return {
    min_order_ht: Number(m.min_order_ht ?? 0),
    free_shipping_ht: Number(m.free_shipping_ht ?? 0),
    reservation_minutes: Math.max(30, Number(m.reservation_minutes ?? 45)),
    net30_days: Number(m.net30_days ?? 30),
    company: m.company ?? {},
  };
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const eur = (n: number | string | null | undefined) => EUR.format(Number(n ?? 0));

export const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";
export const fmtDateTime = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";

export const ORDER_STATUS: Record<string, string> = {
  pending_payment: "En attente de paiement",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};
export const PAYMENT_STATUS: Record<string, string> = {
  unpaid: "Non payée",
  processing: "Paiement en cours",
  paid: "Payée",
  failed: "Paiement échoué",
  refunded: "Remboursée",
};

export const EU_COUNTRIES = [
  "AT","BE","BG","CY","CZ","DE","DK","EE","ES","FI","FR","GR","HR","HU","IE","IT",
  "LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK",
];
export const COUNTRY_NAMES: Record<string, string> = {
  FR: "France", BE: "Belgique", LU: "Luxembourg", DE: "Allemagne", ES: "Espagne", IT: "Italie",
  NL: "Pays-Bas", PT: "Portugal", AT: "Autriche", IE: "Irlande", CH: "Suisse", GB: "Royaume-Uni",
  PL: "Pologne", CZ: "Tchéquie", DK: "Danemark", SE: "Suède", FI: "Finlande", GR: "Grèce",
  MC: "Monaco",
};
