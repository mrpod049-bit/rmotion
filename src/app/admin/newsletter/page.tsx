import pool from "@/lib/db";
import { getBrevoListEmails, brevoConfigured } from "@/lib/brevo";
import SyncButton from "./SyncButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Newsletter", robots: { index: false, follow: false } };

function fmt(d: Date) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// Libellé lisible pour l'origine d'un inscrit.
function sourceLabel(source: string | null): { label: string; paid: boolean } {
  switch (source) {
    case "popup-meta":
      return { label: "Popup Meta", paid: true };
    case "popup":
      return { label: "Popup site", paid: false };
    default:
      return { label: source || "—", paid: false };
  }
}

type Row = {
  id: number;
  email: string;
  source: string | null;
  product_slug: string | null;
  created_at: Date;
};

export default async function NewsletterAdminPage() {
  const { rows } = await pool.query<Row>(
    `SELECT id, email, source, product_slug, created_at
     FROM newsletter_subscribers ORDER BY created_at DESC`
  );

  // Ensemble des emails déjà présents dans la liste Brevo (pour l'état de synchro).
  let inBrevo = new Set<string>();
  let brevoError = false;
  if (brevoConfigured) {
    try {
      inBrevo = await getBrevoListEmails();
    } catch {
      brevoError = true;
    }
  }

  const withStatus = rows.map((r) => ({
    ...r,
    synced: inBrevo.has(String(r.email).toLowerCase()),
  }));
  const syncedCount = withStatus.filter((r) => r.synced).length;
  const missingCount = withStatus.length - syncedCount;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-semibold">Newsletter</h1>
        {brevoConfigured && <SyncButton />}
      </div>

      {!brevoConfigured ? (
        <p className="text-amber-700 text-sm mb-6">
          Brevo n&apos;est pas configuré (BREVO_API_KEY / BREVO_LIST_ID manquants) — impossible d&apos;afficher l&apos;état de synchronisation.
        </p>
      ) : brevoError ? (
        <p className="text-amber-700 text-sm mb-6">
          Impossible de contacter Brevo pour le moment — l&apos;état de synchronisation ci-dessous peut être incomplet.
        </p>
      ) : (
        <p className="text-gray-500 text-sm mb-6">
          {withStatus.length} inscrit(s) · <span className="text-emerald-700 font-medium">{syncedCount} synchronisé(s)</span>
          {missingCount > 0 && <> · <span className="text-amber-700 font-medium">{missingCount} manquant(s)</span></>}
        </p>
      )}

      {withStatus.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune inscription pour le moment.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                {["Date", "Email", "Source", "Page", "Statut Brevo"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withStatus.map((r) => {
                const s = sourceLabel(r.source);
                return (
                  <tr key={r.id} className="align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{fmt(r.created_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <a className="text-blue-600 hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={s.paid ? "font-medium text-emerald-700" : "text-gray-700"}>{s.label}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.product_slug || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.synced ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                          ✓ Synchronisé
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                          Non synchronisé
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
