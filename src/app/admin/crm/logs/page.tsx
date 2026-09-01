import Link from "next/link";
import { getActivityLog, getLogActionTypes } from "@/lib/crm";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM — Journal", robots: { index: false, follow: false } };

const LIMIT = 100;

// Libellé + couleur lisibles pour chaque code d'action.
const ACTIONS: Record<string, { label: string; cls: string }> = {
  create: { label: "Opportunité créée", cls: "bg-blue-50 text-blue-700" },
  convert: { label: "Converti en opportunité", cls: "bg-blue-50 text-blue-700" },
  revert: { label: "Renvoyé aux leads", cls: "bg-gray-100 text-gray-600" },
  stage: { label: "Changement d'étape", cls: "bg-indigo-50 text-indigo-700" },
  won: { label: "Gagnée", cls: "bg-green-50 text-green-700" },
  lost: { label: "Perdue", cls: "bg-red-50 text-red-600" },
  not_interested: { label: "Non intéressé", cls: "bg-amber-50 text-amber-700" },
  interested: { label: "Réintégré", cls: "bg-gray-100 text-gray-600" },
  phone_on: { label: "Contact téléphone", cls: "bg-blue-50 text-blue-700" },
  phone_off: { label: "Contact tél. annulé", cls: "bg-gray-100 text-gray-500" },
  ignore: { label: "Mis de côté", cls: "bg-gray-100 text-gray-500" },
  reopen: { label: "Rouvert", cls: "bg-green-50 text-green-700" },
  delete: { label: "Supprimé", cls: "bg-red-100 text-red-700" },
};

function fmt(d: Date) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const action = sp.action || "";
  const q = sp.q || "";
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, total }, actionTypes] = await Promise.all([
    getActivityLog({ action, q, limit: LIMIT, offset: (page - 1) * LIMIT }),
    getLogActionTypes(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const qs = (next: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const m = { action, q, page: 1, ...next };
    if (m.action) p.set("action", String(m.action));
    if (m.q) p.set("q", String(m.q));
    if (m.page && Number(m.page) > 1) p.set("page", String(m.page));
    const s = p.toString();
    return `/admin/crm/logs${s ? "?" + s : ""}`;
  };

  const cell = "px-3 py-2 align-top";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
        <Link href="/admin/crm" className="hover:underline">← Pipeline</Link>
        <Link href="/admin/crm/leads" className="hover:underline">Leads</Link>
        <span><strong className="text-gray-900">{total}</strong> action{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}</span>
      </div>
      <h1 className="text-2xl font-semibold mb-5">Journal d&apos;activité</h1>

      {/* Filtres */}
      <form className="flex flex-wrap items-end gap-3 mb-4" action="/admin/crm/logs">
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">Type d&apos;action</label>
          <select name="action" defaultValue={action}
            className="text-sm rounded border border-gray-300 px-2 py-1.5">
            <option value="">Toutes</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>{ACTIONS[a]?.label ?? a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">Recherche (nom / détail)</label>
          <input name="q" defaultValue={q} placeholder="ex. MECAPROTEC…"
            className="text-sm rounded border border-gray-300 px-2 py-1.5 w-56" />
        </div>
        <button type="submit"
          className="text-sm rounded bg-gray-800 text-white px-3 py-1.5 hover:bg-gray-700">
          Filtrer
        </button>
        {(action || q) && (
          <Link href="/admin/crm/logs" className="text-sm text-gray-500 px-2 py-1.5 hover:underline">
            Réinitialiser
          </Link>
        )}
      </form>

      {/* Tableau */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              {["Date", "Action", "Prospect / opportunité", "Détail", "Par"].map((h) => (
                <th key={h} className={`${cell} font-medium whitespace-nowrap`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const a = ACTIONS[r.action] ?? { label: r.action, cls: "bg-gray-100 text-gray-600" };
              return (
                <tr key={r.id}>
                  <td className={`${cell} whitespace-nowrap text-gray-500`}>{fmt(r.created_at)}</td>
                  <td className={cell}>
                    <span className={`text-xs rounded-full px-2 py-0.5 whitespace-nowrap ${a.cls}`}>{a.label}</span>
                  </td>
                  <td className={`${cell} font-medium`}>
                    {r.entity_id && r.action !== "delete" ? (
                      <Link href={`/admin/crm/${r.entity_id}`} className="text-blue-600 hover:underline">
                        {r.entity_label || `#${r.entity_id}`}
                      </Link>
                    ) : (
                      <span>{r.entity_label || (r.entity_id ? `#${r.entity_id}` : "—")}</span>
                    )}
                  </td>
                  <td className={`${cell} text-gray-600`}>{r.detail || "—"}</td>
                  <td className={`${cell} text-gray-500 whitespace-nowrap`}>{r.actor || "—"}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400 text-sm">
                Aucune action enregistrée pour ce filtre.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          {page > 1
            ? <Link href={qs({ page: page - 1 })} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">← Précédent</Link>
            : <span className="px-3 py-1 rounded border border-gray-200 text-gray-300">← Précédent</span>}
          <span className="text-gray-500">Page {page} / {totalPages}</span>
          {page < totalPages
            ? <Link href={qs({ page: page + 1 })} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">Suivant →</Link>
            : <span className="px-3 py-1 rounded border border-gray-200 text-gray-300">Suivant →</span>}
        </div>
      )}
    </div>
  );
}
