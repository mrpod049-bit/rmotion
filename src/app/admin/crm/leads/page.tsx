import { getInboxLeads, getSectors, type ContactChannel } from "@/lib/crm";
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
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, total }, sectors] = await Promise.all([
    getInboxLeads({ sector, channel, q, limit: LIMIT, offset: (page - 1) * LIMIT }),
    getSectors(),
  ]);

  return (
    <LeadsInbox
      rows={rows}
      sectors={sectors}
      total={total}
      page={page}
      limit={LIMIT}
      filters={{ sector, channel, q }}
    />
  );
}
