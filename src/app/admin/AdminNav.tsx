"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Onglets de navigation partagés par toutes les pages admin (/admin et /admin/crm/*).
const TABS = [
  { href: "/admin", label: "Demandes reçues", exact: true },
  { href: "/admin/crm", label: "Pipeline", exact: true },
  { href: "/admin/crm/leads", label: "Leads", exact: false },
  { href: "/admin/crm/machines", label: "Coûts machines", exact: false },
  { href: "/admin/crm/logs", label: "Journal", exact: false },
];

export default function AdminNav({ toContact = 0 }: { toContact?: number }) {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky top-20 xl:top-24 z-40 border-b border-gray-200 bg-white">
      <div className="px-6 flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {tab.href === "/admin/crm/leads" && toContact > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 text-xs">
                  {toContact}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
