"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/boutique", label: "Tableau de bord", exact: true },
  { href: "/admin/boutique/commandes", label: "Commandes" },
  { href: "/admin/boutique/produits", label: "Catalogue" },
  { href: "/admin/boutique/stock", label: "Stock" },
  { href: "/admin/boutique/clients", label: "Clients" },
  { href: "/admin/boutique/achats", label: "Achats" },
  { href: "/admin/boutique/fournisseurs", label: "Fournisseurs" },
  { href: "/admin/boutique/retours", label: "Retours" },
  { href: "/admin/boutique/reglages", label: "Réglages" },
];

export default function BoutiqueNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-gray-200 bg-gray-50 print:hidden">
      <div className="px-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href}
              className={`whitespace-nowrap px-3 py-2 text-xs font-medium border-b-2 -mb-px ${active ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
