import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

async function getData() {
  const devis = await pool.query(
    `SELECT nom, societe, email, telephone, machine_name, message, created_at,
            gclid, utm_source, utm_medium, utm_campaign, utm_term
     FROM devis_requests ORDER BY created_at DESC`
  );
  const contacts = await pool.query(
    `SELECT nom, email, sujet, message, created_at
     FROM contacts ORDER BY created_at DESC`
  );
  const newsletter = await pool.query(
    `SELECT email, source, product_slug, created_at
     FROM newsletter_subscribers ORDER BY created_at DESC`
  );
  return { devis: devis.rows, contacts: contacts.rows, newsletter: newsletter.rows };
}

function fmt(d: Date) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

type DevisRow = {
  gclid?: string | null; utm_source?: string | null; utm_medium?: string | null;
  utm_campaign?: string | null; utm_term?: string | null;
};

// Résume l'origine d'un lead : clic payant Google (gclid), campagne UTM, ou direct.
function sourceInfo(r: DevisRow): { label: string; detail: string; paid: boolean } {
  if (r.gclid) {
    const detail = [r.utm_campaign, r.utm_term].filter(Boolean).join(" · ");
    return { label: "Google Ads", detail: detail || "clic payant", paid: true };
  }
  if (r.utm_source) {
    const detail = [r.utm_medium, r.utm_campaign].filter(Boolean).join(" · ");
    return { label: r.utm_source, detail, paid: false };
  }
  return { label: "Direct / Organique", detail: "", paid: false };
}

export default async function AdminPage() {
  const { devis, contacts, newsletter } = await getData();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-8">Demandes reçues</h1>

      {/* Devis */}
      <section className="mb-14">
        <h2 className="text-lg font-medium mb-4">
          Demandes de devis <span className="text-gray-400 font-normal">({devis.length})</span>
        </h2>
        {devis.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune demande pour le moment.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  {["Date", "Nom", "Société", "Email", "Téléphone", "Machine", "Source", "Message"].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {devis.map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{fmt(r.created_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.nom}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.societe || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><a className="text-blue-600 hover:underline" href={`mailto:${r.email}`}>{r.email}</a></td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.telephone || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.machine_name || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {(() => {
                        const s = sourceInfo(r);
                        return (
                          <>
                            <span className={s.paid ? "font-medium text-emerald-700" : "text-gray-700"}>{s.label}</span>
                            {s.detail && <div className="text-gray-400 text-xs">{s.detail}</div>}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2 max-w-md whitespace-pre-line">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Contacts */}
      <section className="mb-14">
        <h2 className="text-lg font-medium mb-4">
          Messages de contact <span className="text-gray-400 font-normal">({contacts.length})</span>
        </h2>
        {contacts.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun message pour le moment.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  {["Date", "Nom", "Email", "Sujet", "Message"].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{fmt(r.created_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.nom}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><a className="text-blue-600 hover:underline" href={`mailto:${r.email}`}>{r.email}</a></td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.sujet || "—"}</td>
                    <td className="px-3 py-2 max-w-md whitespace-pre-line">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Inscrits newsletter */}
      <section>
        <h2 className="text-lg font-medium mb-4">
          Inscrits newsletter <span className="text-gray-400 font-normal">({newsletter.length})</span>
        </h2>
        {newsletter.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune inscription pour le moment.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  {["Date", "Email", "Source", "Page"].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {newsletter.map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{fmt(r.created_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><a className="text-blue-600 hover:underline" href={`mailto:${r.email}`}>{r.email}</a></td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.source || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.product_slug || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
