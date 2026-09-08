"use server";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

// Tables dont une ligne peut être supprimée depuis /admin. Liste blanche stricte :
// le nom de table n'est jamais interpolé sans être validé ici (pas d'injection).
const DELETABLE = new Set([
  "devis_requests",
  "contacts",
  "contact_leads",
  "ft_requests",
  "newsletter_subscribers",
]);

export async function deleteRow(formData: FormData) {
  const table = String(formData.get("table") || "");
  const id = Number(formData.get("id"));
  if (!DELETABLE.has(table) || !Number.isInteger(id) || id <= 0) return;
  await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  revalidatePath("/admin");
}
