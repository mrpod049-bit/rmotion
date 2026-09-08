"use server";
import pool from "@/lib/db";
import { getBrevoListEmails, addNewsletterContact } from "@/lib/brevo";
import { revalidatePath } from "next/cache";

export type SyncResult = {
  done: true;
  attempted: number;
  ok: number;
  failed: number;
} | null;

// Pousse vers Brevo tous les inscrits (consentis) qui n'y sont pas encore.
// Idempotent : on ne renvoie que les manquants, l'ajout lui-même est en
// "updateEnabled" côté Brevo. Utilisé par le bouton de l'admin newsletter.
export async function syncNewsletterToBrevo(
  _prev: SyncResult,
  _formData: FormData
): Promise<SyncResult> {
  const { rows } = await pool.query(
    `SELECT email FROM newsletter_subscribers WHERE consent = true`
  );
  const inBrevo = await getBrevoListEmails();

  const missing = [
    ...new Set(rows.map((r) => String(r.email).toLowerCase()).filter(Boolean)),
  ].filter((email) => !inBrevo.has(email));

  let ok = 0;
  for (const email of missing) {
    if (await addNewsletterContact(email)) ok++;
  }

  revalidatePath("/admin/newsletter");
  return { done: true, attempted: missing.length, ok, failed: missing.length - ok };
}
