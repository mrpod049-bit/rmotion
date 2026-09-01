import Link from "next/link";
import { getStages, getActiveLeads, computeStats, getInboxCounts } from "@/lib/crm";
import PipelineBoard from "./PipelineBoard";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM — Pipeline", robots: { index: false, follow: false } };

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default async function CrmPage() {
  const [stages, leads, inbox] = await Promise.all([
    getStages(),
    getActiveLeads(),
    getInboxCounts(),
  ]);
  const stats = computeStats(leads);

  return (
    <div className="max-w-full mx-auto px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:underline">← Demandes reçues</Link>
        <Link href="/admin/crm/leads" className="hover:underline">
          Leads <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 text-xs">{inbox.toContact} à contacter</span>
        </Link>
        <Link href="/admin/crm/machines" className="hover:underline">Coûts machines →</Link>
        <Link href="/admin/crm/logs" className="hover:underline">Journal →</Link>
        <span><strong className="text-gray-900">{stats.count}</strong> opportunités</span>
        <span>CA prév. : <strong className="text-gray-900">{eur.format(stats.revenue)}</strong>
          <span className="text-gray-400"> ({eur.format(stats.revenueWeighted)} pondéré)</span></span>
        <span>Marge prév. : <strong className="text-green-700">{eur.format(stats.margin)}</strong>
          <span className="text-gray-400"> ({eur.format(stats.marginWeighted)} pondéré)</span></span>
      </div>

      <PipelineBoard stages={stages} leads={leads} />
    </div>
  );
}
