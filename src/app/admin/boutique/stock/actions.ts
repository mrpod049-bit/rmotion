"use server";
import pool from "@/lib/db";
import { adjustStock } from "@/lib/shop/stock";
import { attempt, getActor, refreshStock, str, int } from "../_server";

export async function adjust(fd: FormData) {
  const back = "/admin/boutique/stock" + (str(fd, "q") ? `?q=${encodeURIComponent(str(fd, "q"))}` : "");
  await attempt(back, async () => {
    const variantId = int(fd, "variant_id");
    const mode = str(fd, "mode") === "set" ? "set" : "delta";
    const value = int(fd, "value");
    const note = str(fd, "note");
    if (Number.isNaN(variantId) || Number.isNaN(value)) throw new Error("Quantité invalide.");
    if (mode === "delta" && value === 0) throw new Error("Indiquez une variation non nulle.");
    if (mode === "delta" && !note) throw new Error("Un motif est obligatoire pour un ajustement (casse, perte, erreur de saisie…).");
    const delta = await adjustStock(variantId, mode, value, note, await getActor());
    refreshStock();
    return delta === 0 ? "Aucun changement." : `Stock mis à jour (${delta > 0 ? "+" : ""}${delta}).`;
  });
}

export async function setLocation(fd: FormData) {
  await attempt("/admin/boutique/stock", async () => {
    const id = int(fd, "variant_id");
    await pool.query("INSERT INTO shop_stock (variant_id) VALUES ($1) ON CONFLICT DO NOTHING", [id]);
    await pool.query("UPDATE shop_stock SET location=$2 WHERE variant_id=$1", [id, str(fd, "location") || null]);
    return "Emplacement enregistré.";
  });
}
