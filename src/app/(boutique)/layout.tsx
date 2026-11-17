import Link from "next/link";
import { notFound } from "next/navigation";
import { canSeeShop, inPreview } from "@/lib/shop/access";
import { getCurrentUser } from "@/lib/shop/auth";
import pool from "@/lib/db";

// Toutes les pages publiques de la boutique (/outils, /panier, /commande, /compte)
// passent par ce layout. Tant que SHOP_ENABLED n'est pas « true », le middleware
// affiche « Boutique en construction » au public ; seul l'admin en mode aperçu
// (cookie posé par /admin/boutique/apercu) arrive ici. Double garde ci-dessous.
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  if (!(await canSeeShop())) notFound();
  const preview = await inPreview();
  const user = await getCurrentUser();
  let cartCount = 0;
  if (user) {
    const r = await pool.query("SELECT COALESCE(SUM(qty),0)::int n FROM shop_cart_items WHERE user_id=$1", [user.id]);
    cartCount = r.rows[0].n;
  }
  return (
    <div>
      {preview && (
        <div className="bg-amber-100 px-6 py-1.5 text-center text-xs text-amber-900">
          Mode aperçu : la boutique est fermée au public, vous seul la voyez. <a href="/admin/boutique" className="underline">Admin boutique</a> · <a href="/admin/boutique/apercu?off=1" className="underline">Quitter l&apos;aperçu</a>
        </div>
      )}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-2 flex flex-wrap items-center gap-4 text-sm">
          <Link href="/outils" className="font-semibold">Outils de coupe</Link>
          <form action="/outils" className="flex-1 min-w-[200px] max-w-md">
            <input name="q" placeholder="Rechercher une référence, une désignation ISO (CNMG 120408…)" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm" />
          </form>
          <div className="ml-auto flex items-center gap-4">
            {user ? (
              <Link href="/compte" className="hover:underline">{user.company_name}</Link>
            ) : (
              <Link href="/compte/connexion" className="hover:underline">Espace pro — connexion</Link>
            )}
            <Link href="/panier" className="rounded bg-gray-900 px-3 py-1.5 text-white">Panier{cartCount > 0 && ` (${cartCount})`}</Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
