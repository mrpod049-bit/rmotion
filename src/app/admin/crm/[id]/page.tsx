import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLead,
  getStages,
  getActivities,
  getNotes,
  getLeadLines,
  getMachineOptions,
} from "@/lib/crm";
import LeadDetail from "./LeadDetail";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM — Opportunité", robots: { index: false, follow: false } };

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId)) notFound();

  const lead = await getLead(leadId);
  if (!lead) notFound();

  const [stages, activities, notes, lines, machines] = await Promise.all([
    getStages(),
    getActivities(leadId),
    getNotes(leadId),
    getLeadLines(leadId),
    getMachineOptions(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/admin/crm" className="text-sm text-gray-500 hover:underline">
        ← Retour au pipeline
      </Link>
      <LeadDetail
        lead={lead}
        stages={stages}
        activities={activities}
        notes={notes}
        lines={lines}
        machines={machines}
      />
    </div>
  );
}
