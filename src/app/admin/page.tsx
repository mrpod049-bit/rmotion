import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

async function getData() {
  const devis = await pool.query(
    `SELECT nom, societe, email, telephone, machine_name, message, created_at
     FROM devis_requests ORDER BY created_at DESC`
  );
  const contacts = await pool.query(
    `SELECT nom, email, sujet, message, created_at
     FROM contacts ORDER BY created_at DESC`
  );
  return { devis: devis.rows, contacts: contacts.rows };
}

function fmt(d: Date) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminPage() {
  const { devis, contacts } = await getData();

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
                  {["Date", "Nom", "Société", "Email", "Téléphone", "Machine", "Message"].map((h) => (
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
                    <td className="px-3 py-2 max-w-md whitespace-pre-line">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Contacts */}
      <section>
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
    </div>
  );
}
