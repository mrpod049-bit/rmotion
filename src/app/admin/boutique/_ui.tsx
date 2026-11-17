import Link from "next/link";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/shop/core";

// Petits composants de présentation partagés par l'admin boutique.

export type SP = Promise<Record<string, string | string[] | undefined>>;
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const err = one(sp.err);
  const ok = one(sp.ok);
  if (!err && !ok) return null;
  return (
    <div className={`mb-6 rounded border px-4 py-3 text-sm ${err ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
      {err || ok}
    </div>
  );
}

export function Title({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 className="text-2xl font-semibold">{children}</h1>
      {action}
    </div>
  );
}

export const btn = "inline-flex items-center rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700 disabled:opacity-50";
export const btnLight = "inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50";
export const btnDanger = "inline-flex items-center rounded border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50";
export const input = "w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none";
export const label = "block text-xs font-medium text-gray-500 mb-1";
export const th = "px-3 py-2 font-medium whitespace-nowrap text-left";
export const td = "px-3 py-2 align-top";

export function LinkBtn({ href, children, light }: { href: string; children: React.ReactNode; light?: boolean }) {
  return <Link href={href} className={light ? btnLight : btn}>{children}</Link>;
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
  unpaid: "bg-amber-100 text-amber-800",
  processing: "bg-sky-100 text-sky-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-gray-200 text-gray-600",
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-800",
  partial: "bg-amber-100 text-amber-800",
  received: "bg-green-100 text-green-800",
  open: "bg-amber-100 text-amber-800",
};
const LABELS: Record<string, string> = {
  ...ORDER_STATUS, ...PAYMENT_STATUS,
  pending: "À valider", approved: "Validé", rejected: "Refusé", suspended: "Suspendu",
  draft: "Brouillon", sent: "Envoyé", partial: "Reçu en partie", received: "Reçu", open: "Ouvert",
};

export function Badge({ s }: { s: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}`}>
      {LABELS[s] ?? s}
    </span>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
      {title && <h2 className="mb-3 text-sm font-semibold text-gray-700">{title}</h2>}
      {children}
    </section>
  );
}
