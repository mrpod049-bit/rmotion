import "server-only";
import type { PoolClient } from "pg";
import pool from "@/lib/db";
import { EU_COUNTRIES, round2, type ShopSettings } from "./core";

// Calcul d'un panier : prix nets client, port, régime de TVA.

export type VatRegime = "fr" | "eu_reverse" | "export";

export const VAT_MENTIONS: Record<VatRegime, string> = {
  fr: "TVA 20 %",
  eu_reverse: "Autoliquidation — article 283-2 du CGI (TVA due par le preneur)",
  export: "Exonération de TVA — article 262 I du CGI (exportation)",
};

/** Régime TVA d'une vente de biens B2B selon le pays de livraison. */
export function vatRegime(
  shipCountry: string, customer: { vat_number: string | null; vat_valid: boolean | null }
): { regime: VatRegime; rate: number } {
  if (shipCountry === "FR" || shipCountry === "MC") return { regime: "fr", rate: 20 };
  if (EU_COUNTRIES.includes(shipCountry)) {
    return customer.vat_number && customer.vat_valid
      ? { regime: "eu_reverse", rate: 0 }
      : { regime: "fr", rate: 20 };
  }
  return { regime: "export", rate: 0 };
}

export const shippingZone = (country: string) =>
  country === "FR" || country === "MC" ? "FR" : EU_COUNTRIES.includes(country) ? "EU" : "WORLD";

/** Frais de port HT, ou null si non calculable (poids/zone hors grille → sur devis). */
export async function shippingCost(
  country: string, weightG: number, subtotalHt: number, settings: ShopSettings, c?: PoolClient
): Promise<number | null> {
  const zone = shippingZone(country);
  if (zone === "FR" && settings.free_shipping_ht > 0 && subtotalHt >= settings.free_shipping_ht) return 0;
  const r = await (c ?? pool).query(
    "SELECT price_ht FROM shop_shipping_rates WHERE zone=$1 AND max_weight_g >= $2 ORDER BY max_weight_g LIMIT 1",
    [zone, Math.max(1, weightG)]
  );
  return r.rows[0] ? Number(r.rows[0].price_ht) : null;
}

export type CartLine = {
  variant_id: number; product_id: number; product_name: string; product_slug: string;
  sku: string; label: string; pack_qty: number; qty: number;
  list_price_ht: number; discount_pct: number; unit_price_ht: number; line_total_ht: number;
  unit_cost: number | null; weight_g: number; available: number; sellable: boolean;
  image: string | null;
};

export const netPrice = (list: number, discountPct: number) => round2(list * (1 - discountPct / 100));

/** Lignes du panier d'un utilisateur, prix nets calculés. */
export async function cartLines(userId: number, discountPct: number, c?: PoolClient): Promise<CartLine[]> {
  const r = await (c ?? pool).query(
    `SELECT ci.variant_id, ci.qty, v.product_id, p.name AS product_name, p.slug AS product_slug,
            v.sku, COALESCE(v.label, p.name) AS label, v.pack_qty, v.price_ht, v.cost_price, v.weight_g,
            (v.active AND p.published) AS sellable, p.images[1] AS image,
            COALESCE(s.on_hand - s.reserved, 0) AS available
     FROM shop_cart_items ci
     JOIN shop_variants v ON v.id = ci.variant_id
     JOIN shop_products p ON p.id = v.product_id
     LEFT JOIN shop_stock s ON s.variant_id = v.id
     WHERE ci.user_id = $1 ORDER BY ci.added_at`,
    [userId]
  );
  return r.rows.map((x) => {
    const list = Number(x.price_ht);
    const unit = netPrice(list, discountPct);
    return {
      variant_id: x.variant_id, product_id: x.product_id, product_name: x.product_name,
      product_slug: x.product_slug, sku: x.sku, label: x.label, pack_qty: x.pack_qty, qty: x.qty,
      list_price_ht: list, discount_pct: discountPct, unit_price_ht: unit,
      line_total_ht: round2(unit * x.qty), unit_cost: x.cost_price == null ? null : Number(x.cost_price),
      weight_g: x.weight_g * x.qty, available: Number(x.available), sellable: x.sellable, image: x.image,
    };
  });
}

export type Totals = {
  subtotal_ht: number; shipping_ht: number | null; total_ht: number;
  vat_regime: VatRegime; vat_rate: number; vat_amount: number; total_ttc: number; weight_g: number;
};

export async function computeTotals(
  lines: CartLine[], shipCountry: string,
  customer: { vat_number: string | null; vat_valid: boolean | null },
  settings: ShopSettings, c?: PoolClient
): Promise<Totals> {
  const subtotal = round2(lines.reduce((s, l) => s + l.line_total_ht, 0));
  const weight = lines.reduce((s, l) => s + l.weight_g, 0);
  const shipping = await shippingCost(shipCountry, weight, subtotal, settings, c);
  const { regime, rate } = vatRegime(shipCountry, customer);
  const totalHt = round2(subtotal + (shipping ?? 0));
  const vat = round2((totalHt * rate) / 100);
  return {
    subtotal_ht: subtotal, shipping_ht: shipping, total_ht: totalHt,
    vat_regime: regime, vat_rate: rate, vat_amount: vat, total_ttc: round2(totalHt + vat), weight_g: weight,
  };
}
