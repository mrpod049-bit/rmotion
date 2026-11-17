import "server-only";
import type { PoolClient } from "pg";
import pool from "@/lib/db";

// Stock : niveau courant (shop_stock) + journal immuable (shop_stock_movements).
//
// Règles :
//  - disponible = on_hand - reserved ; jamais négatif (contraintes CHECK en base).
//  - une commande en attente de paiement RÉSERVE (reserved += q) ;
//  - le paiement confirmé SORT le stock (on_hand -= q, reserved -= q) ;
//  - l'expiration/annulation LIBÈRE (reserved -= q).
//  - Les UPDATE sont conditionnels (« WHERE on_hand - reserved >= q ») : deux
//    clients ne peuvent pas obtenir la même dernière boîte, même en simultané.
//  - Les lignes sont toujours traitées par variant_id croissant (pas d'interblocage).

export class StockError extends Error {
  sku: string;
  available: number;
  constructor(sku: string, available: number) {
    super(`Stock insuffisant pour ${sku} (disponible : ${available}).`);
    this.sku = sku;
    this.available = available;
  }
}

export type StockLine = { variant_id: number; qty: number; sku?: string };

const sorted = (lines: StockLine[]) => [...lines].sort((a, b) => a.variant_id - b.variant_id);

async function ensureRow(c: PoolClient, variantId: number) {
  await c.query("INSERT INTO shop_stock (variant_id) VALUES ($1) ON CONFLICT DO NOTHING", [variantId]);
}

async function available(c: PoolClient, variantId: number): Promise<number> {
  const r = await c.query("SELECT on_hand - reserved AS a FROM shop_stock WHERE variant_id=$1", [variantId]);
  return Number(r.rows[0]?.a ?? 0);
}

/** Réserve toutes les lignes ou aucune (lève StockError). */
export async function reserve(c: PoolClient, lines: StockLine[]) {
  for (const l of sorted(lines)) {
    await ensureRow(c, l.variant_id);
    const r = await c.query(
      `UPDATE shop_stock SET reserved = reserved + $2, updated_at = NOW()
       WHERE variant_id = $1 AND on_hand - reserved >= $2`,
      [l.variant_id, l.qty]
    );
    if (r.rowCount === 0) throw new StockError(l.sku ?? `#${l.variant_id}`, await available(c, l.variant_id));
  }
}

/** Libère une réservation (expiration, annulation avant paiement). */
export async function release(c: PoolClient, lines: StockLine[]) {
  for (const l of sorted(lines)) {
    await c.query(
      `UPDATE shop_stock SET reserved = GREATEST(reserved - $2, 0), updated_at = NOW() WHERE variant_id = $1`,
      [l.variant_id, l.qty]
    );
  }
}

/** Transforme une réservation en sortie de stock définitive (paiement reçu). */
export async function commitReserved(c: PoolClient, lines: StockLine[], orderId: number, actor = "system") {
  for (const l of sorted(lines)) {
    const r = await c.query(
      `UPDATE shop_stock SET on_hand = on_hand - $2, reserved = reserved - $2, updated_at = NOW()
       WHERE variant_id = $1 AND reserved >= $2 AND on_hand >= $2`,
      [l.variant_id, l.qty]
    );
    if (r.rowCount === 0) throw new StockError(l.sku ?? `#${l.variant_id}`, await available(c, l.variant_id));
    await logMovement(c, l.variant_id, -l.qty, "sale", "order", orderId, null, actor);
  }
}

/** Sortie directe sans réservation préalable (commande à 30 jours). */
export async function takeDirect(c: PoolClient, lines: StockLine[], orderId: number, actor = "system") {
  for (const l of sorted(lines)) {
    await ensureRow(c, l.variant_id);
    const r = await c.query(
      `UPDATE shop_stock SET on_hand = on_hand - $2, updated_at = NOW()
       WHERE variant_id = $1 AND on_hand - reserved >= $2`,
      [l.variant_id, l.qty]
    );
    if (r.rowCount === 0) throw new StockError(l.sku ?? `#${l.variant_id}`, await available(c, l.variant_id));
    await logMovement(c, l.variant_id, -l.qty, "sale", "order", orderId, null, actor);
  }
}

/** Entrée de stock (réception fournisseur, retour client, annulation après sortie). */
export async function addStock(
  c: PoolClient, variantId: number, qty: number,
  kind: "receipt" | "return" | "cancel" | "adjust",
  refType: string | null, refId: number | null, note: string | null, actor: string
) {
  if (qty <= 0) return;
  await ensureRow(c, variantId);
  await c.query("UPDATE shop_stock SET on_hand = on_hand + $2, updated_at = NOW() WHERE variant_id=$1", [variantId, qty]);
  await logMovement(c, variantId, qty, kind, refType, refId, note, actor);
}

/** Ajustement manuel (+/-) ou inventaire (fixe la quantité physique). */
export async function adjustStock(
  variantId: number, mode: "delta" | "set", value: number, note: string, actor: string
) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await ensureRow(c, variantId);
    const cur = await c.query("SELECT on_hand, reserved FROM shop_stock WHERE variant_id=$1 FOR UPDATE", [variantId]);
    const onHand = Number(cur.rows[0].on_hand);
    const reserved = Number(cur.rows[0].reserved);
    const target = mode === "set" ? value : onHand + value;
    if (!Number.isInteger(target) || target < 0) throw new Error("Le stock ne peut pas devenir négatif.");
    if (target < reserved) throw new Error(`Impossible : ${reserved} unité(s) sont réservées par des commandes en cours.`);
    const delta = target - onHand;
    if (delta !== 0) {
      await c.query("UPDATE shop_stock SET on_hand=$2, updated_at=NOW() WHERE variant_id=$1", [variantId, target]);
      await logMovement(c, variantId, delta, mode === "set" ? "inventory" : "adjust", null, null, note || null, actor);
    }
    await c.query("COMMIT");
    return delta;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

export async function logMovement(
  c: PoolClient, variantId: number, delta: number, kind: string,
  refType: string | null, refId: number | null, note: string | null, actor: string
) {
  await c.query(
    `INSERT INTO shop_stock_movements (variant_id, qty_delta, kind, ref_type, ref_id, note, actor)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [variantId, delta, kind, refType, refId, note, actor]
  );
}

/** Disponible par déclinaison (lecture simple). */
export async function availabilityFor(variantIds: number[]): Promise<Map<number, number>> {
  if (variantIds.length === 0) return new Map();
  const r = await pool.query(
    "SELECT variant_id, on_hand - reserved AS a FROM shop_stock WHERE variant_id = ANY($1::int[])",
    [variantIds]
  );
  const m = new Map<number, number>(variantIds.map((id) => [id, 0]));
  for (const row of r.rows) m.set(row.variant_id, Number(row.a));
  return m;
}

/** Contrôle de cohérence : le journal doit expliquer exactement on_hand. */
export async function stockDrift(): Promise<{ variant_id: number; sku: string; on_hand: number; journal: number }[]> {
  const r = await pool.query(
    `SELECT s.variant_id, v.sku, s.on_hand, COALESCE(SUM(m.qty_delta),0)::int AS journal
     FROM shop_stock s JOIN shop_variants v ON v.id = s.variant_id
     LEFT JOIN shop_stock_movements m ON m.variant_id = s.variant_id
     GROUP BY s.variant_id, v.sku, s.on_hand
     HAVING s.on_hand <> COALESCE(SUM(m.qty_delta),0)`
  );
  return r.rows;
}
