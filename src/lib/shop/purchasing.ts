import "server-only";
import pool from "@/lib/db";
import { nextNumber, withTx } from "./core";
import { addStock } from "./stock";

// Achats fournisseurs : bon de commande (BCF) → envoi → réception (entrée en stock).
// C'est par la réception d'un BCF que le premier stock entrera dans le système.

export class PurchaseError extends Error {}

export type PoLineInput = { id?: number; variant_id: number; supplier_ref?: string; qty_ordered: number; unit_cost: number };

export async function createPurchaseOrder(supplierId: number): Promise<number> {
  return withTx(async (c) => {
    const number = await nextNumber(c, "BCF", 4);
    const r = await c.query(
      "INSERT INTO shop_purchase_orders (number, supplier_id) VALUES ($1,$2) RETURNING id", [number, supplierId]
    );
    return r.rows[0].id;
  });
}

/** Remplace les lignes d'un BCF en brouillon. */
export async function savePurchaseOrder(
  poId: number, data: { expected_at: string | null; notes: string | null; lines: PoLineInput[] }
) {
  await withTx(async (c) => {
    const po = (await c.query("SELECT status FROM shop_purchase_orders WHERE id=$1 FOR UPDATE", [poId])).rows[0];
    if (!po) throw new PurchaseError("Bon de commande introuvable.");
    await c.query("UPDATE shop_purchase_orders SET expected_at=$2, notes=$3 WHERE id=$1",
      [poId, data.expected_at || null, data.notes || null]);
    if (po.status !== "draft") return; // lignes figées une fois envoyé
    await c.query("DELETE FROM shop_purchase_order_lines WHERE po_id=$1", [poId]);
    for (const l of data.lines) {
      if (!l.variant_id || !(l.qty_ordered > 0)) continue;
      await c.query(
        `INSERT INTO shop_purchase_order_lines (po_id, variant_id, supplier_ref, qty_ordered, unit_cost)
         VALUES ($1,$2,$3,$4,$5)`,
        [poId, l.variant_id, l.supplier_ref?.trim() || null, Math.floor(l.qty_ordered), Math.max(0, Number(l.unit_cost) || 0)]
      );
    }
  });
}

export async function markPurchaseOrderSent(poId: number) {
  const n = await pool.query("SELECT COUNT(*)::int n FROM shop_purchase_order_lines WHERE po_id=$1", [poId]);
  if (n.rows[0].n === 0) throw new PurchaseError("Ajoutez au moins une ligne avant d'envoyer.");
  const r = await pool.query(
    "UPDATE shop_purchase_orders SET status='sent', sent_at=NOW() WHERE id=$1 AND status='draft'", [poId]
  );
  if (!r.rowCount) throw new PurchaseError("Seul un brouillon peut être marqué envoyé.");
}

export async function cancelPurchaseOrder(poId: number) {
  const r = await pool.query(
    `UPDATE shop_purchase_orders SET status='cancelled' WHERE id=$1 AND status IN ('draft','sent')
     AND NOT EXISTS (SELECT 1 FROM shop_purchase_order_lines WHERE po_id=$1 AND qty_received > 0)`, [poId]
  );
  if (!r.rowCount) throw new PurchaseError("Annulation impossible (déjà reçu en partie ou clôturé).");
}

/** Réception (totale ou partielle) : entrée en stock + mise à jour du coût d'achat. */
export async function receivePurchaseOrder(poId: number, received: { line_id: number; qty: number }[], actor: string) {
  await withTx(async (c) => {
    const po = (await c.query("SELECT * FROM shop_purchase_orders WHERE id=$1 FOR UPDATE", [poId])).rows[0];
    if (!po || !["sent", "partial"].includes(po.status)) throw new PurchaseError("Réception possible uniquement sur un BCF envoyé.");
    const lines = (await c.query("SELECT * FROM shop_purchase_order_lines WHERE po_id=$1", [poId])).rows;
    const byId = new Map(lines.map((l) => [l.id, l]));
    let any = false;
    for (const r of received) {
      const l = byId.get(r.line_id);
      const qty = Math.floor(r.qty);
      if (!l || !(qty > 0)) continue;
      // On accepte une sur-livraison (le fournisseur a envoyé plus) : elle entre en stock.
      await c.query("UPDATE shop_purchase_order_lines SET qty_received = qty_received + $2 WHERE id=$1", [l.id, qty]);
      await addStock(c, l.variant_id, qty, "receipt", "purchase_order", poId, `Réception ${po.number}`, actor);
      if (Number(l.unit_cost) > 0) {
        await c.query("UPDATE shop_variants SET cost_price=$2 WHERE id=$1", [l.variant_id, l.unit_cost]);
      }
      any = true;
    }
    if (!any) throw new PurchaseError("Aucune quantité reçue saisie.");
    const left = await c.query(
      "SELECT COUNT(*)::int n FROM shop_purchase_order_lines WHERE po_id=$1 AND qty_received < qty_ordered", [poId]
    );
    const full = left.rows[0].n === 0;
    await c.query(
      `UPDATE shop_purchase_orders SET status=$2::varchar, received_at = CASE WHEN $2::varchar='received' THEN NOW() ELSE received_at END WHERE id=$1`,
      [poId, full ? "received" : "partial"]
    );
  });
}

/** Suggestion de réapprovisionnement : déclinaisons sous leur seuil d'alerte. */
export async function lowStock() {
  const r = await pool.query(
    `SELECT v.id, v.sku, v.label, p.name AS product_name, v.reorder_threshold,
            COALESCE(s.on_hand,0) AS on_hand, COALESCE(s.reserved,0) AS reserved,
            COALESCE((SELECT SUM(l.qty_ordered - l.qty_received) FROM shop_purchase_order_lines l
                      JOIN shop_purchase_orders po ON po.id=l.po_id
                      WHERE l.variant_id=v.id AND po.status IN ('draft','sent','partial')),0)::int AS incoming
     FROM shop_variants v JOIN shop_products p ON p.id=v.product_id
     LEFT JOIN shop_stock s ON s.variant_id=v.id
     WHERE v.active AND v.reorder_threshold > 0
       AND COALESCE(s.on_hand,0) - COALESCE(s.reserved,0) <= v.reorder_threshold
     ORDER BY p.name, v.sku`
  );
  return r.rows;
}
