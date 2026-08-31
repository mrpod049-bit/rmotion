import { getInboxLeads, getSectors, getInboxCounts, type ContactChannel } from "@/lib/crm";
import LeadsInbox from "./LeadsInbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM — Leads", robots: { index: false, follow: false } };

const LIMIT = 50;
const CHANNELS: ContactChannel[] = ["all", "none", "email", "phone", "both"];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const sector = sp.sector || "";
  const channel: ContactChannel = CHANNELS.includes(sp.channel as ContactChannel)
    ? (sp.channel as ContactChannel)
    : "all";
  const q = sp.q || "";
  const notInterested = sp.view === "not_interested";
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, total }, sectors, counts] = await Promise.all([
    getInboxLeads({ sector, channel, q, notInterested, limit: LIMIT, offset: (page - 1) * LIMIT }),
    getSectors(),
    getInboxCounts(),
  ]);

  return (
    <LeadsInbox
      rows={rows}
      sectors={sectors}
      total={total}
      page={page}
      limit={LIMIT}
      counts={counts}
      filters={{ sector, channel, q, notInterested }}
    />
  );
}
