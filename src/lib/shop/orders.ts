import "server-only";
import type { PoolClient } from "pg";
import pool from "@/lib/db";
import { baseUrl, eur, getSettings, nextNumber, withTx, round2, ORDER_STATUS } from "./core";
import { cartLines, computeTotals, VAT_MENTIONS, type CartLine } from "./pricing";
import { reserve, release, commitReserved, takeDirect, addStock, StockError, type StockLine } from "./stock";
import { getStripe, stripeConfigured } from "./stripe";
import { ADMIN_EMAIL, layout, sendMail } from "./mail";
import type { ShopUser } from "./auth";

// Cycle de vie d'une commande :
//   pending_payment ──(paiement Stripe reçu)──▶ confirmed ─▶ preparing ─▶ shipped ─▶ delivered
//        │ (expiration / échec / annulation)                     (net30 : directement confirmed)
//        ▼
//    cancelled
// Le stock est RÉSERVÉ en pending_payment et SORTI à la confirmation.

export class OrderError extends Error {}

export type Address = {
  company: string; contact: string | null; line1: string; line2: string | null;
  postal_code: string; city: string; country: string; phone: string | null;
};

export async function orderEvent(c: PoolClient | typeof pool, orderId: number, kind: string, detail: string | null, actor = "system") {
  await c.query(
    "INSERT INTO shop_order_events (order_id, kind, detail, actor) VALUES ($1,$2,$3,$4)",
    [orderId, kind, detail, actor]
  );
}

async function orderStockLines(c: PoolClient, orderId: number): Promise<StockLine[]> {
  const r = await c.query(
    "SELECT variant_id, qty - qty_returned AS qty, sku FROM shop_order_lines WHERE order_id=$1 AND variant_id IS NOT NULL",
    [orderId]
  );
  return r.rows.filter((x) => x.qty > 0).map((x) => ({ variant_id: x.variant_id, qty: Number(x.qty), sku: x.sku }));
}

/** Encours à 30 jours non réglé d'un client (TTC). */
export async function outstanding(customerId: number, c?: PoolClient): Promise<number> {
  const r = await (c ?? pool).query(
    `SELECT COALESCE(SUM(total_ttc),0)::float AS s FROM shop_orders
     WHERE customer_id=$1 AND payment_method='net30' AND payment_status<>'paid' AND status<>'cancelled'`,
    [customerId]
  );
  return Number(r.rows[0].s);
}

/** Annule les commandes dont la réservation a expiré sans paiement. */
export async function releaseExpiredReservations(): Promise<number> {
  const r = await pool.query(
    `SELECT id FROM shop_orders WHERE status='pending_payment' AND payment_status IN ('unpaid','failed')
     AND reserved_until IS NOT NULL AND reserved_until < NOW()`
  );
  for (const row of r.rows) {
    await cancelPending(row.id, "Réservation expirée sans paiement", "system").catch(() => {});
  }
  return r.rows.length;
}

async function getAddress(c: PoolClient, customerId: number, id: number, kind: string): Promise<Address> {
  const r = await c.query(
    `SELECT company, contact, line1, line2, postal_code, city, country, phone
     FROM shop_addresses WHERE id=$1 AND customer_id=$2 AND kind=$3`,
    [id, customerId, kind]
  );
  if (!r.rows[0]) throw new OrderError("Adresse introuvable.");
  return r.rows[0];
}

export type CheckoutInput = {
  shipping_address_id: number; billing_address_id: number;
  payment_method: "stripe" | "net30"; customer_po?: string; customer_note?: string;
};

/** Crée la commande depuis le panier. Renvoie l'URL de paiement Stripe le cas échéant. */
export async function createOrder(user: ShopUser, input: CheckoutInput): Promise<{ number: string; checkoutUrl: string | null }> {
  if (user.status !== "approved") throw new OrderError("Votre compte doit être validé avant de commander.");
  await releaseExpiredReservations();
  const settings = await getSettings();

  const created = await withTx(async (c) => {
    // Verrou par client : deux commandes simultanées du même compte ne peuvent
    // pas dépasser l'encours ni consommer deux fois le même panier.
    await c.query("SELECT id FROM shop_customers WHERE id=$1 FOR UPDATE", [user.customer_id]);

    const lines = await cartLines(user.id, user.discount_pct, c);
    if (lines.length === 0) throw new OrderError("Votre panier est vide.");
    const bad = lines.find((l) => !l.sellable);
    if (bad) throw new OrderError(`La référence ${bad.sku} n'est plus disponible à la vente.`);

    const ship = await getAddress(c, user.customer_id, input.shipping_address_id, "shipping");
    const bill = await getAddress(c, user.customer_id, input.billing_address_id, "billing");
    const totals = await computeTotals(lines, ship.country, user, settings, c);
    if (totals.shipping_ht === null) {
      throw new OrderError("Livraison non calculable automatiquement pour cette destination ou ce poids : contactez-nous pour un devis.");
    }
    if (totals.subtotal_ht < settings.min_order_ht) {
      throw new OrderError(`Minimum de commande : ${eur(settings.min_order_ht)} HT.`);
    }

    let dueDate: string | null = null;
    if (input.payment_method === "net30") {
      if (user.payment_terms !== "net30") throw new OrderError("Le paiement à 30 jours n'est pas ouvert sur votre compte.");
      if (user.credit_limit != null) {
        const out = await outstanding(user.customer_id, c);
        if (out + totals.total_ttc > user.credit_limit) {
          throw new OrderError(`Plafond d'encours dépassé (encours actuel ${eur(out)} / plafond ${eur(user.credit_limit)}). Réglez par carte ou virement SEPA.`);
        }
      }
      const d = new Date();
      d.setDate(d.getDate() + settings.net30_days);
      dueDate = d.toISOString().slice(0, 10);
    } else if (!stripeConfigured()) {
      throw new OrderError("Le paiement en ligne n'est pas encore disponible.");
    }

    const number = await nextNumber(c, "CMD");
    const snapshot = { company_name: user.company_name, siret: user.siret, vat_number: user.vat_number, email: user.email, user_name: user.name };
    const isNet30 = input.payment_method === "net30";
    const o = await c.query(
      `INSERT INTO shop_orders (number, customer_id, user_id, status, payment_method, due_date, customer_po,
         customer_snapshot, billing_address, shipping_address, subtotal_ht, shipping_ht, total_ht,
         vat_regime, vat_rate, vat_amount, total_ttc, total_weight_g, reserved_until, customer_note, confirmed_at)
       VALUES ($1,$2,$3,$4::varchar,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
               CASE WHEN $19::int > 0 THEN NOW() + make_interval(mins => $19::int) END, $20,
               CASE WHEN $4::varchar = 'confirmed' THEN NOW() END)
       RETURNING id`,
      [
        number, user.customer_id, user.id, isNet30 ? "confirmed" : "pending_payment", input.payment_method,
        dueDate, input.customer_po?.trim().slice(0, 80) || null, snapshot, bill, ship,
        totals.subtotal_ht, totals.shipping_ht, totals.total_ht, totals.vat_regime, totals.vat_rate,
        totals.vat_amount, totals.total_ttc, totals.weight_g, isNet30 ? 0 : settings.reservation_minutes,
        input.customer_note?.trim().slice(0, 1000) || null,
      ]
    );
    const orderId: number = o.rows[0].id;
    for (const l of lines) {
      await c.query(
        `INSERT INTO shop_order_lines (order_id, variant_id, sku, label, pack_qty, qty, list_price_ht, discount_pct,
           unit_price_ht, line_total_ht, unit_cost, weight_g)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [orderId, l.variant_id, l.sku, l.label, l.pack_qty, l.qty, l.list_price_ht, l.discount_pct,
         l.unit_price_ht, l.line_total_ht, l.unit_cost, l.weight_g]
      );
    }
    const stockLines = lines.map((l) => ({ variant_id: l.variant_id, qty: l.qty, sku: l.sku }));
    try {
      if (isNet30) await takeDirect(c, stockLines, orderId, user.email);
      else await reserve(c, stockLines);
    } catch (e) {
      if (e instanceof StockError) throw new OrderError(e.message + " Ajustez la quantité dans votre panier.");
      throw e;
    }
    await c.query("DELETE FROM shop_cart_items WHERE user_id=$1", [user.id]);
    await orderEvent(c, orderId, "created",
      isNet30 ? `Commande à ${settings.net30_days} jours (échéance ${dueDate})` : "En attente du paiement en ligne", user.email);
    return { orderId, number, totals, lines, isNet30 };
  });

  if (created.isNet30) {
    await notifyConfirmed(created.orderId);
    return { number: created.number, checkoutUrl: null };
  }
  try {
    const url = await createCheckoutSession(created.orderId);
    return { number: created.number, checkoutUrl: url };
  } catch (e) {
    await cancelPending(created.orderId, "Échec de création du paiement en ligne", "system", true);
    throw new OrderError("Le paiement en ligne est momentanément indisponible. Votre panier a été conservé. " + ((e as Error).message || ""));
  }
}

/** (Re)crée une session Stripe Checkout pour une commande en attente de paiement. */
export async function createCheckoutSession(orderId: number): Promise<string> {
  const settings = await getSettings();
  const r = await pool.query(
    `SELECT o.*, (o.reserved_until > NOW()) AS still_reserved FROM shop_orders o WHERE id=$1`, [orderId]
  );
  const o = r.rows[0];
  if (!o || o.status !== "pending_payment") throw new OrderError("Cette commande n'est plus en attente de paiement.");
  if (o.payment_status === "processing") throw new OrderError("Un paiement est déjà en cours de traitement pour cette commande.");
  const stripe = getStripe();
  if (o.stripe_session_id) {
    await stripe.checkout.sessions.expire(o.stripe_session_id).catch(() => {});
  }
  // La session expire avec la réservation (Stripe impose 30 min minimum).
  const minutes = Math.max(30, settings.reservation_minutes);
  await pool.query(
    "UPDATE shop_orders SET reserved_until = NOW() + ($2 || ' minutes')::interval WHERE id=$1",
    [orderId, String(minutes + 2)]
  );
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Moyens proposés (carte, prélèvement SEPA…) : activés dans le tableau de bord
    // Stripe (Paramètres → Moyens de paiement), plus dans le code.
    customer_email: o.customer_snapshot.email,
    client_reference_id: String(o.id),
    metadata: { order_id: String(o.id), order_number: o.number },
    payment_intent_data: { metadata: { order_id: String(o.id), order_number: o.number }, description: `Commande ${o.number}` },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(Number(o.total_ttc) * 100),
        product_data: {
          name: `Commande ${o.number} — ${o.customer_snapshot.company_name}`,
          description: `Total HT ${eur(o.total_ht)} · ${VAT_MENTIONS[o.vat_regime as keyof typeof VAT_MENTIONS]}`,
        },
      },
    }],
    expires_at: Math.floor(Date.now() / 1000) + minutes * 60,
    success_url: `${baseUrl()}/commande/${o.number}?paiement=ok`,
    cancel_url: `${baseUrl()}/commande/${o.number}?paiement=annule`,
    locale: "fr",
  });
  await pool.query("UPDATE shop_orders SET stripe_session_id=$2 WHERE id=$1", [orderId, session.id]);
  return session.url!;
}

/** Annule une commande non payée et libère la réservation. */
export async function cancelPending(orderId: number, reason: string, actor: string, restoreCart = false) {
  let sessionToExpire: string | null = null;
  await withTx(async (c) => {
    const r = await c.query("SELECT * FROM shop_orders WHERE id=$1 FOR UPDATE", [orderId]);
    const o = r.rows[0];
    if (!o || o.status !== "pending_payment") return;
    const lines = await orderStockLines(c, orderId);
    await release(c, lines);
    await c.query(
      "UPDATE shop_orders SET status='cancelled', cancelled_at=NOW(), reserved_until=NULL WHERE id=$1", [orderId]
    );
    if (restoreCart && o.user_id) {
      for (const l of lines) {
        await c.query(
          `INSERT INTO shop_cart_items (user_id, variant_id, qty) VALUES ($1,$2,$3)
           ON CONFLICT (user_id, variant_id) DO UPDATE SET qty = shop_cart_items.qty + EXCLUDED.qty`,
          [o.user_id, l.variant_id, l.qty]
        );
      }
    }
    await orderEvent(c, orderId, "cancelled", reason, actor);
    sessionToExpire = o.stripe_session_id;
  });
  // Ferme la page de paiement Stripe encore ouverte (sinon un paiement tardif
  // reste possible ; il serait alors traité par markPaid comme « après annulation »).
  if (sessionToExpire && stripeConfigured()) {
    await getStripe().checkout.sessions.expire(sessionToExpire).catch(() => {});
  }
}

/** Paiement Stripe en cours (prélèvement SEPA : plusieurs jours). La réservation est conservée. */
export async function markPaymentProcessing(orderId: number, paymentIntent: string | null) {
  await withTx(async (c) => {
    const r = await c.query("SELECT status, payment_status FROM shop_orders WHERE id=$1 FOR UPDATE", [orderId]);
    const o = r.rows[0];
    if (!o || o.status !== "pending_payment" || o.payment_status === "paid") return;
    await c.query(
      "UPDATE shop_orders SET payment_status='processing', reserved_until=NULL, stripe_payment_intent=COALESCE($2, stripe_payment_intent) WHERE id=$1",
      [orderId, paymentIntent]
    );
    await orderEvent(c, orderId, "payment_processing", "Prélèvement SEPA initié — stock réservé jusqu'au résultat", "stripe");
  });
}

/** Paiement reçu : sortie de stock + confirmation. Idempotent. */
export async function markPaid(orderId: number, paymentIntent: string | null, actor = "stripe") {
  let confirmed = false;
  let conflict = false;
  await withTx(async (c) => {
    const r = await c.query("SELECT * FROM shop_orders WHERE id=$1 FOR UPDATE", [orderId]);
    const o = r.rows[0];
    if (!o || o.payment_status === "paid") return;
    const lines = await orderStockLines(c, orderId);
    if (o.status === "pending_payment") {
      await commitReserved(c, lines, orderId, actor);
      await c.query(
        `UPDATE shop_orders SET status='confirmed', payment_status='paid', paid_at=NOW(), confirmed_at=NOW(),
           reserved_until=NULL, stripe_payment_intent=COALESCE($2, stripe_payment_intent) WHERE id=$1`,
        [orderId, paymentIntent]
      );
      await orderEvent(c, orderId, "paid", "Paiement en ligne reçu", actor);
      confirmed = true;
    } else if (o.status === "cancelled") {
      // Paiement arrivé après expiration de la réservation : on tente de reprendre le stock.
      try {
        await c.query("SAVEPOINT retake");
        await takeDirect(c, lines, orderId, actor);
        await c.query(
          `UPDATE shop_orders SET status='confirmed', payment_status='paid', paid_at=NOW(), confirmed_at=NOW(),
             cancelled_at=NULL, stripe_payment_intent=COALESCE($2, stripe_payment_intent) WHERE id=$1`,
          [orderId, paymentIntent]
        );
        await orderEvent(c, orderId, "paid", "Paiement reçu après expiration — commande réactivée", actor);
        confirmed = true;
      } catch (e) {
        if (!(e instanceof StockError)) throw e;
        await c.query("ROLLBACK TO SAVEPOINT retake");
        await c.query(
          "UPDATE shop_orders SET payment_status='paid', paid_at=NOW(), stripe_payment_intent=COALESCE($2, stripe_payment_intent) WHERE id=$1",
          [orderId, paymentIntent]
        );
        await orderEvent(c, orderId, "stock_conflict",
          `Paiement reçu sur commande annulée mais stock insuffisant (${e.message}) — à rembourser ou réapprovisionner`, actor);
        conflict = true;
      }
    } else {
      // net30 réglé, ou toute commande déjà confirmée : simple encaissement.
      await c.query("UPDATE shop_orders SET payment_status='paid', paid_at=NOW() WHERE id=$1", [orderId]);
      await orderEvent(c, orderId, "paid", "Règlement enregistré", actor);
    }
  });
  if (confirmed) await notifyConfirmed(orderId);
  if (conflict) {
    await sendMail(ADMIN_EMAIL, "⚠️ Paiement reçu sur une commande sans stock",
      layout("Action requise", [`Un paiement a été reçu pour la commande #${orderId} après expiration de sa réservation, et le stock n'est plus suffisant. Remboursez le client ou réapprovisionnez puis confirmez manuellement.`]));
  }
}

export async function markPaymentFailed(orderId: number, reason: string) {
  await pool.query("UPDATE shop_orders SET payment_status='failed' WHERE id=$1 AND status='pending_payment'", [orderId]);
  await cancelPending(orderId, `Paiement échoué : ${reason}`, "stripe");
}

// ─── Transitions back-office ─────────────────────────────────────────────
export async function setStatus(orderId: number, to: "preparing" | "delivered", actor: string) {
  const from = to === "preparing" ? ["confirmed"] : ["shipped"];
  const r = await pool.query(
    `UPDATE shop_orders SET status=$2 ${to === "delivered" ? ", delivered_at=NOW()" : ""}
     WHERE id=$1 AND status = ANY($3::text[]) RETURNING id`,
    [orderId, to, from]
  );
  if (!r.rowCount) throw new OrderError("Transition impossible depuis l'état actuel.");
  await orderEvent(pool, orderId, to, ORDER_STATUS[to], actor);
}

export async function shipOrder(orderId: number, carrier: string, tracking: string, actor: string) {
  const r = await pool.query(
    `UPDATE shop_orders SET status='shipped', shipped_at=NOW(), carrier=$2, tracking_number=$3
     WHERE id=$1 AND status IN ('confirmed','preparing') RETURNING number, customer_snapshot, shipping_address`,
    [orderId, carrier.trim() || null, tracking.trim() || null]
  );
  const o = r.rows[0];
  if (!o) throw new OrderError("Seule une commande confirmée ou en préparation peut être expédiée.");
  await orderEvent(pool, orderId, "shipped", `${carrier || "Transporteur"} ${tracking || ""}`.trim(), actor);
  await sendMail(o.customer_snapshot.email, `Votre commande ${o.number} a été expédiée`,
    layout(`Commande ${o.number} expédiée`, [
      "Bonjour,",
      `Votre commande ${o.number} vient d'être remise au transporteur${carrier ? ` (${carrier})` : ""}.`,
      tracking ? `Numéro de suivi : ${tracking}` : "Vous recevrez le suivi du transporteur prochainement.",
      `Livraison : ${o.shipping_address.company}, ${o.shipping_address.postal_code} ${o.shipping_address.city}.`,
    ], { button: { label: "Voir ma commande", url: `${baseUrl()}/compte/commandes/${o.number}` } }));
}

/** Annulation par l'admin. Remet en stock ce qui était sorti ; rembourse si demandé. */
export async function cancelOrder(orderId: number, reason: string, refund: boolean, actor: string) {
  const r0 = await pool.query("SELECT status FROM shop_orders WHERE id=$1", [orderId]);
  const st = r0.rows[0]?.status;
  if (st === "pending_payment") return cancelPending(orderId, reason || "Annulée par Rmotion", actor);
  let refundPi: string | null = null;
  await withTx(async (c) => {
    const r = await c.query("SELECT * FROM shop_orders WHERE id=$1 FOR UPDATE", [orderId]);
    const o = r.rows[0];
    if (!o || !["confirmed", "preparing"].includes(o.status)) {
      throw new OrderError("Une commande expédiée ne s'annule pas : créez un retour.");
    }
    for (const l of await orderStockLines(c, orderId)) {
      await addStock(c, l.variant_id, l.qty, "cancel", "order", orderId, `Annulation ${o.number}`, actor);
    }
    await c.query("UPDATE shop_orders SET status='cancelled', cancelled_at=NOW() WHERE id=$1", [orderId]);
    await orderEvent(c, orderId, "cancelled", reason || "Annulée par Rmotion", actor);
    if (refund && o.payment_status === "paid" && o.stripe_payment_intent) refundPi = o.stripe_payment_intent;
  });
  if (refundPi) {
    try {
      await getStripe().refunds.create({ payment_intent: refundPi });
      await pool.query("UPDATE shop_orders SET payment_status='refunded' WHERE id=$1", [orderId]);
      await orderEvent(pool, orderId, "refunded", "Remboursement Stripe émis", actor);
    } catch (e) {
      await orderEvent(pool, orderId, "refund_failed", `Remboursement Stripe échoué : ${(e as Error).message}`, actor);
    }
  }
}

// ─── Retours ─────────────────────────────────────────────────────────────
export async function createReturn(
  orderId: number, items: { order_line_id: number; qty: number }[], reason: string, restock: boolean, actor: string
): Promise<string> {
  const wanted = items.filter((i) => i.qty > 0);
  if (wanted.length === 0) throw new OrderError("Indiquez au moins une quantité à retourner.");
  return withTx(async (c) => {
    const o = (await c.query("SELECT status FROM shop_orders WHERE id=$1 FOR UPDATE", [orderId])).rows[0];
    if (!o || !["shipped", "delivered"].includes(o.status)) throw new OrderError("Retour possible uniquement sur une commande expédiée ou livrée.");
    // quantités déjà engagées dans des retours ouverts ou reçus
    const engaged = await c.query(
      `SELECT rl.order_line_id, SUM(rl.qty)::int q FROM shop_return_lines rl JOIN shop_returns r ON r.id=rl.return_id
       WHERE r.order_id=$1 AND r.status<>'cancelled' GROUP BY rl.order_line_id`, [orderId]
    );
    const eng = new Map(engaged.rows.map((x) => [x.order_line_id, x.q]));
    const lines = await c.query("SELECT id, qty, sku FROM shop_order_lines WHERE order_id=$1", [orderId]);
    const byId = new Map(lines.rows.map((l) => [l.id, l]));
    for (const i of wanted) {
      const l = byId.get(i.order_line_id);
      if (!l) throw new OrderError("Ligne inconnue.");
      if (i.qty + (eng.get(i.order_line_id) ?? 0) > l.qty) throw new OrderError(`Quantité retournée trop élevée pour ${l.sku}.`);
    }
    const number = await nextNumber(c, "RET", 4);
    const ret = await c.query(
      "INSERT INTO shop_returns (number, order_id, reason, restock) VALUES ($1,$2,$3,$4) RETURNING id",
      [number, orderId, reason || null, restock]
    );
    for (const i of wanted) {
      await c.query("INSERT INTO shop_return_lines (return_id, order_line_id, qty) VALUES ($1,$2,$3)", [ret.rows[0].id, i.order_line_id, i.qty]);
    }
    await orderEvent(c, orderId, "return_opened", `Retour ${number} ouvert${reason ? " : " + reason : ""}`, actor);
    return number;
  });
}

export async function receiveReturn(returnId: number, actor: string) {
  await withTx(async (c) => {
    const r = (await c.query("SELECT * FROM shop_returns WHERE id=$1 FOR UPDATE", [returnId])).rows[0];
    if (!r || r.status !== "open") throw new OrderError("Ce retour n'est pas ouvert.");
    const lines = await c.query(
      `SELECT rl.qty, ol.id AS line_id, ol.variant_id FROM shop_return_lines rl
       JOIN shop_order_lines ol ON ol.id = rl.order_line_id WHERE rl.return_id=$1`, [returnId]
    );
    for (const l of lines.rows) {
      await c.query("UPDATE shop_order_lines SET qty_returned = qty_returned + $2 WHERE id=$1", [l.line_id, l.qty]);
      if (r.restock && l.variant_id) await addStock(c, l.variant_id, l.qty, "return", "return", returnId, `Retour ${r.number}`, actor);
    }
    await c.query("UPDATE shop_returns SET status='received', received_at=NOW() WHERE id=$1", [returnId]);
    await orderEvent(c, r.order_id, "return_received",
      `Retour ${r.number} reçu${r.restock ? " et remis en stock" : " (non remis en stock)"} — avoir à émettre`, actor);
  });
}

// ─── Notifications ───────────────────────────────────────────────────────
function linesTable(lines: { sku: string; label: string; qty: number; unit_price_ht: number | string; line_total_ht: number | string }[]) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const rows = lines.map((l) =>
    `<tr><td style="padding:4px 8px">${esc(l.sku)}</td><td style="padding:4px 8px">${esc(l.label)}</td>
     <td style="padding:4px 8px;text-align:right">${l.qty}</td><td style="padding:4px 8px;text-align:right">${eur(l.unit_price_ht)}</td>
     <td style="padding:4px 8px;text-align:right">${eur(l.line_total_ht)}</td></tr>`).join("");
  return `<table style="border-collapse:collapse;font-size:14px;margin:8px 0 16px"><tr style="color:#6b7280">
    <td style="padding:4px 8px">Réf.</td><td style="padding:4px 8px">Désignation</td><td style="padding:4px 8px">Qté</td>
    <td style="padding:4px 8px">PU HT</td><td style="padding:4px 8px">Total HT</td></tr>${rows}</table>`;
}

async function notifyConfirmed(orderId: number) {
  const o = (await pool.query("SELECT * FROM shop_orders WHERE id=$1", [orderId])).rows[0];
  const lines = (await pool.query("SELECT * FROM shop_order_lines WHERE order_id=$1 ORDER BY id", [orderId])).rows;
  const table = linesTable(lines);
  const totals = [
    `Total HT : ${eur(o.total_ht)} (dont port ${eur(o.shipping_ht)})`,
    `${VAT_MENTIONS[o.vat_regime as keyof typeof VAT_MENTIONS]} : ${eur(o.vat_amount)}`,
    `Total TTC : ${eur(o.total_ttc)}`,
  ];
  const pay = o.payment_method === "net30"
    ? `Règlement par virement à réception de facture, échéance le ${new Date(o.due_date).toLocaleDateString("fr-FR")}.`
    : "Paiement reçu, merci.";
  await sendMail(o.customer_snapshot.email, `Confirmation de votre commande ${o.number}`,
    layout(`Commande ${o.number} confirmée`, [
      "Bonjour,", "Nous avons bien reçu votre commande. Elle est en cours de préparation.",
      ...(o.customer_po ? [`Votre référence : ${o.customer_po}`] : []),
    ], { rawHtml: table + totals.map((t) => `<p style="margin:0 0 4px">${t}</p>`).join("") + `<p>${pay}</p>`,
         button: { label: "Suivre ma commande", url: `${baseUrl()}/compte/commandes/${o.number}` } }));
  await sendMail(ADMIN_EMAIL, `🛒 Nouvelle commande ${o.number} — ${o.customer_snapshot.company_name} — ${eur(o.total_ht)} HT`,
    layout(`Nouvelle commande ${o.number}`, [
      `Client : ${o.customer_snapshot.company_name}`,
      `Paiement : ${o.payment_method === "net30" ? "30 jours" : "en ligne (payé)"}`,
    ], { rawHtml: table, button: { label: "Ouvrir dans l'admin", url: `${baseUrl()}/admin/boutique/commandes/${o.id}` } }));
}

export function marginOf(lines: CartLine[]): number {
  return round2(lines.reduce((s, l) => s + (l.unit_cost == null ? 0 : (l.unit_price_ht - l.unit_cost) * l.qty), 0));
}
