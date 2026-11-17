import Link from "next/link";
import pool from "@/lib/db";
import { eur } from "@/lib/shop/core";
import { releaseExpiredReservations } from "@/lib/shop/orders";
import { lowStock } from "@/lib/shop/purchasing";
import { Card, Title } from "./_ui";

function Tile({ n, l, href, warn }: { n: string | number; l: string; href: string; warn?: boolean }) {
  return (
    <Link href={href} className={`rounded-lg border p-4 hover:bg-gray-50 ${warn ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}>
      <div className="text-2xl font-semibold">{n}</div><div className="text-sm text-gray-500">{l}</div>
    </Link>
  );
}

export default async function ShopDashboard() {
  await releaseExpiredReservations();
  const [k, low] = await Promise.all([
    pool.query(`SELECT
      (SELECT COUNT(*)::int FROM shop_orders WHERE status='confirmed') AS to_prepare,
      (SELECT COUNT(*)::int FROM shop_orders WHERE status='preparing') AS preparing,
      (SELECT COUNT(*)::int FROM shop_orders WHERE status='pending_payment') AS pending_pay,
      (SELECT COUNT(*)::int FROM shop_customers WHERE status='pending') AS to_approve,
      (SELECT COUNT(*)::int FROM shop_returns WHERE status='open') AS open_returns,
      (SELECT COUNT(*)::int FROM shop_purchase_orders WHERE status IN ('sent','partial')) AS incoming_po,
      (SELECT COALESCE(SUM(total_ttc),0)::float FROM shop_orders WHERE payment_method='net30' AND payment_status<>'paid' AND status<>'cancelled') AS receivable,
      (SELECT COALESCE(SUM(total_ttc),0)::float FROM shop_orders WHERE payment_method='net30' AND payment_status<>'paid' AND status<>'cancelled' AND due_date < CURRENT_DATE) AS overdue,
      (SELECT COALESCE(SUM(total_ht),0)::float FROM shop_orders WHERE status NOT IN ('cancelled','pending_payment') AND created_at >= date_trunc('month', NOW())) AS month_ht,
      (SELECT COALESCE(SUM(l.qty*(l.unit_price_ht-l.unit_cost)),0)::float FROM shop_order_lines l JOIN shop_orders o ON o.id=l.order_id
         WHERE o.status NOT IN ('cancelled','pending_payment') AND l.unit_cost IS NOT NULL AND o.created_at >= date_trunc('month', NOW())) AS month_margin,
      (SELECT COUNT(*)::int FROM shop_products WHERE published) AS published,
      (SELECT COUNT(*)::int FROM shop_variants WHERE active) AS variants`),
    lowStock(),
  ]);
  const d = k.rows[0];
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Title>Boutique outils de coupe</Title>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Tile n={d.to_prepare} l="Commandes à préparer" href="/admin/boutique/commandes?status=confirmed" warn={d.to_prepare > 0} />
        <Tile n={d.preparing} l="En préparation" href="/admin/boutique/commandes?status=preparing" />
        <Tile n={d.to_approve} l="Comptes à valider" href="/admin/boutique/clients?status=pending" warn={d.to_approve > 0} />
        <Tile n={d.open_returns} l="Retours ouverts" href="/admin/boutique/retours" warn={d.open_returns > 0} />
        <Tile n={eur(d.month_ht)} l="CA HT du mois" href="/admin/boutique/commandes?status=all" />
        <Tile n={eur(d.month_margin)} l="Marge brute du mois" href="/admin/boutique/commandes?status=all" />
        <Tile n={eur(d.receivable)} l={`Encours 30 j (dont ${eur(d.overdue)} échu)`} href="/admin/boutique/commandes" warn={d.overdue > 0} />
        <Tile n={d.pending_pay} l="Paiements en attente" href="/admin/boutique/commandes?status=pending_payment" />
        <Tile n={low.length} l="Références sous le seuil" href="/admin/boutique/achats" warn={low.length > 0} />
        <Tile n={d.incoming_po} l="Achats en cours de livraison" href="/admin/boutique/achats" />
        <Tile n={d.published} l="Produits publiés" href="/admin/boutique/produits" />
        <Tile n={d.variants} l="Références actives" href="/admin/boutique/stock" />
      </div>
      <Card title="Démarrage">
        <ol className="list-decimal pl-5 text-sm space-y-1 text-gray-700">
          <li><Link className="underline" href="/admin/boutique/reglages">Réglages</Link> : société, minimum de commande, grille de port.</li>
          <li><Link className="underline" href="/admin/boutique/produits/categories">Catégories</Link> puis <Link className="underline" href="/admin/boutique/produits">produits et références</Link> (prix, poids, seuils).</li>
          <li><Link className="underline" href="/admin/boutique/fournisseurs">Fournisseurs</Link> puis <Link className="underline" href="/admin/boutique/achats">bon de commande</Link> → à l&apos;arrivée, « réception » = entrée en stock.</li>
          <li>Publier les produits, puis activer la boutique (variable SHOP_ENABLED=true + Stripe).</li>
        </ol>
      </Card>
    </div>
  );
}
