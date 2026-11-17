import BoutiqueNav from "./BoutiqueNav";
import { shopEnabled } from "@/lib/shop/core";
import { stripeConfigured, stripeTestMode } from "@/lib/shop/stripe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Boutique — Admin", robots: { index: false, follow: false } };

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const on = shopEnabled();
  return (
    <>
      <BoutiqueNav />
      <div className={`px-6 py-1.5 text-xs print:hidden ${on ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
        {on ? "Boutique publique : EN LIGNE." : "Boutique publique : EN CONSTRUCTION (le public voit une page d'attente)."}
        {" · "}<a href="/admin/boutique/apercu" className="underline font-medium">Voir la boutique{on ? "" : " (aperçu)"} →</a>
        {" · "}Paiement en ligne : {stripeConfigured() ? (stripeTestMode() ? "Stripe mode TEST" : "Stripe LIVE") : "non configuré"}
      </div>
      {children}
    </>
  );
}
