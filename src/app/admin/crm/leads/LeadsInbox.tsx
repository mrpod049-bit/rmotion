"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { InboxLead, ContactChannel } from "@/lib/crm";
import {
  convertLeadToOpportunity,
  ignoreLead,
  setPhoneContacted,
  markNotInterested,
  markInterested,
} from "../actions";

function fmtDate(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function LeadsInbox({
  rows, sectors, total, page, limit, counts, filters,
}: {
  rows: InboxLead[];
  sectors: string[];
  total: number;
  page: number;
  limit: number;
  counts: { toQualify: number; toContact: number; notInterested: number };
  filters: { sector: string; channel: ContactChannel; q: string; notInterested: boolean };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q);
  const notInterested = filters.notInterested;

  function go(next: Partial<{ sector: string; channel: string; q: string; page: number }>) {
    const p = new URLSearchParams();
    const merged = { ...filters, page: 1, ...next };
    if (notInterested) p.set("view", "not_interested");
    if (merged.sector) p.set("sector", merged.sector);
    if (merged.channel && merged.channel !== "all") p.set("channel", merged.channel);
    if (merged.q) p.set("q", merged.q);
    if (merged.page && merged.page > 1) p.set("page", String(merged.page));
    router.push(`/admin/crm/leads${p.toString() ? "?" + p : ""}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const cell = "px-3 py-2";

  const tab = "px-3 py-1.5 rounded-md text-sm font-medium border";
  const tabOn = "bg-blue-600 text-white border-blue-600";
  const tabOff = "bg-white text-gray-600 border-gray-300 hover:border-blue-400";

  return (
    <div className="max-w-full mx-auto px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
        <Link href="/admin/crm" className="hover:underline">← Pipeline</Link>
        <span><strong className="text-gray-900">{total}</strong> dans cette liste</span>
      </div>

      {/* Onglets : à qualifier / non intéressés */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/admin/crm/leads" className={`${tab} ${notInterested ? tabOff : tabOn}`}>
          À qualifier <span className="opacity-70">({counts.toQualify})</span>
        </Link>
        <Link href="/admin/crm/leads?view=not_interested" className={`${tab} ${notInterested ? tabOn : tabOff}`}>
          Non intéressés <span className="opacity-70">({counts.notInterested})</span>
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-5">
        {notInterested ? "Prospects non intéressés" : "Leads — prospects à qualifier"}
      </h1>

      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">Secteur</label>
          <select value={filters.sector} onChange={(e) => go({ sector: e.target.value })}
            className="text-sm rounded border border-gray-300 px-2 py-1.5">
            <option value="">Tous</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">Canal de contact</label>
          <select value={filters.channel} onChange={(e) => go({ channel: e.target.value })}
            className="text-sm rounded border border-gray-300 px-2 py-1.5">
            <option value="all">Tous</option>
            <option value="none">Jamais contactés</option>
            <option value="email">Par email</option>
            <option value="phone">Par téléphone</option>
            <option value="both">Les deux (email + tél)</option>
          </select>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); go({ q }); }}
          className="flex items-end gap-2"
        >
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Recherche</label>
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="nom, ville, activité…"
              className="text-sm rounded border border-gray-300 px-2 py-1.5 w-56" />
          </div>
          <button type="submit"
            className="text-sm rounded bg-gray-800 text-white px-3 py-1.5 hover:bg-gray-700">
            Filtrer
          </button>
          {(filters.sector || filters.channel !== "all" || filters.q) && (
            <button type="button"
              onClick={() => { setQ(""); router.push(`/admin/crm/leads${notInterested ? "?view=not_interested" : ""}`); }}
              className="text-sm text-gray-500 px-2 py-1.5 hover:underline">
              Réinitialiser
            </button>
          )}
        </form>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              {["Contacté", "Nom", "Secteur", "Ville", "Activité", "Score", "Email", "Téléphone", ""].map((h, i) => (
                <th key={i} className={`${cell} font-medium whitespace-nowrap`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((l) => (
              <LeadRow key={l.id} lead={l} onDone={() => startTransition(() => router.refresh())} />
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400 text-sm">
                {notInterested ? "Aucun prospect non intéressé." : "Aucun lead pour ce filtre."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => go({ page: page - 1 })}
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
            ← Précédent
          </button>
          <span className="text-gray-500">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => go({ page: page + 1 })}
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
            Suivant →
          </button>
        </div>
      )}
    </div>
  );

  function LeadRow({ lead, onDone }: { lead: InboxLead; onDone: () => void }) {
    const [busy, start] = useTransition();
    return (
      <tr className="align-top">
        <td className={cell}>
          <div className="flex flex-col gap-1 items-start">
            {lead.contacted_email && (
              <span className="text-xs rounded-full bg-green-50 text-green-700 px-2 py-0.5 whitespace-nowrap"
                title={lead.contacted_email_at ? `le ${fmtDate(lead.contacted_email_at)}` : undefined}>
                ✉ email
              </span>
            )}
            {lead.contacted_phone && (
              <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 whitespace-nowrap"
                title={lead.contacted_phone_at ? `le ${fmtDate(lead.contacted_phone_at)}` : undefined}>
                📞 tél
              </span>
            )}
            {!lead.contacted_email && !lead.contacted_phone && (
              <span className="text-xs rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 whitespace-nowrap">
                à contacter
              </span>
            )}
          </div>
        </td>
        <td className={`${cell} font-medium`}>
          {lead.name}
          {lead.website && (
            <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
              target="_blank" rel="noopener noreferrer"
              className="ml-1 text-blue-500 text-xs hover:underline">↗</a>
          )}
        </td>
        <td className={`${cell} text-gray-500 whitespace-nowrap`}>{lead.sector || "—"}</td>
        <td className={`${cell} whitespace-nowrap`}>
          {lead.city || "—"}{lead.department ? <span className="text-gray-400"> ({lead.department})</span> : null}
        </td>
        <td className={`${cell} text-gray-600 max-w-[200px]`}>{lead.activity || "—"}</td>
        <td className={cell}>{lead.score ?? "—"}</td>
        <td className={`${cell} whitespace-nowrap`}>
          {lead.email
            ? <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
            : <span className="text-gray-300">—</span>}
        </td>
        <td className={`${cell} whitespace-nowrap`}>
          {lead.phone
            ? <a href={`tel:${lead.phone}`} className="text-gray-700 hover:underline">{lead.phone}</a>
            : <span className="text-gray-300">—</span>}
        </td>
        <td className={`${cell} whitespace-nowrap text-right`}>
          {notInterested ? (
            <>
              <button
                disabled={busy}
                onClick={() => start(async () => { await markInterested(lead.id); onDone(); })}
                className="text-xs rounded bg-blue-600 text-white px-2 py-1 hover:bg-blue-700 disabled:opacity-50"
                title="Remettre dans les prospects à qualifier">
                ↩ Réintégrer
              </button>
              <button
                disabled={busy}
                onClick={() => start(async () => { await ignoreLead(lead.id); onDone(); })}
                className="ml-1 text-xs text-gray-400 px-1 hover:text-red-500"
                title="Mettre de côté (archiver)">
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() => start(async () => { await setPhoneContacted(lead.id, !lead.contacted_phone); onDone(); })}
                className={`text-xs rounded px-2 py-1 border disabled:opacity-50 ${
                  lead.contacted_phone
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "text-gray-500 border-gray-300 hover:bg-gray-50"
                }`}
                title={lead.contacted_phone ? "Annuler le contact téléphone" : "Déclarer contacté par téléphone"}>
                📞 {lead.contacted_phone ? "✓" : "tél"}
              </button>
              <button
                disabled={busy}
                onClick={() => start(() => convertLeadToOpportunity(lead.id))}
                className="ml-1 text-xs rounded bg-blue-600 text-white px-2 py-1 hover:bg-blue-700 disabled:opacity-50">
                → Opportunité
              </button>
              <button
                disabled={busy}
                onClick={() => start(async () => { await markNotInterested(lead.id); onDone(); })}
                className="ml-1 text-xs rounded border border-gray-300 text-gray-600 px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                title="Marquer non intéressé (le déplace dans la liste dédiée)">
                🚫 Non intéressé
              </button>
              <button
                disabled={busy}
                onClick={() => start(async () => { await ignoreLead(lead.id); onDone(); })}
                className="ml-1 text-xs text-gray-400 px-1 hover:text-red-500"
                title="Mettre de côté (archiver)">
                ✕
              </button>
            </>
          )}
        </td>
      </tr>
    );
  }
}
