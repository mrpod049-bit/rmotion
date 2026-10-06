import pool from "@/lib/db";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

async function getData() {
  const devis = await pool.query(
    `SELECT id, nom, societe, email, telephone, machine_name, message, created_at,
            gclid, utm_source, utm_medium, utm_campaign, utm_term
     FROM devis_requests ORDER BY created_at DESC`
  );
  const contacts = await pool.query(
    `SELECT id, nom, email, sujet, message, created_at
     FROM contacts ORDER BY created_at DESC`
  );
  const newsletter = await pool.query(
    `SELECT id, email, source, product_slug, created_at
     FROM newsletter_subscribers ORDER BY created_at DESC`
  );
  const contactLeads = await pool.query(
    `SELECT id, email, name, phone, message, source, campaign, created_at
     FROM contact_leads ORDER BY created_at DESC`
  );
  const ftRequests = await pool.query(
    `SELECT id, email, nom, machine_name, machine_slug, created_at,
            gclid, utm_source, utm_medium, utm_campaign, utm_term
     FROM ft_requests ORDER BY created_at DESC`
  );
  return {
    devis: devis.rows,
    contacts: contacts.rows,
    newsletter: newsletter.rows,
    contactLeads: contactLeads.rows,
    ftRequests: ftRequests.rows,
  };
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

// Libellé lisible pour l'origine d'un inscrit newsletter (popup site issu de Meta).
function newsletterSource(source: string | null): { label: string; paid: boolean } {
  switch (source) {
    case "popup-meta":
      return { label: "Popup Meta", paid: true };
    case "popup":
      return { label: "Popup site", paid: false };
    default:
      return { label: source || "—", paid: false };
  }
}

// Badge d'origine (clic payant en vert, sinon neutre).
function SourceBadge({ label, detail, paid }: { label: string; detail?: string; paid: boolean }) {
  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
        paid ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
      {detail ? ` · ${detail}` : ""}
    </span>
  );
}

type FieldDef = { label: string; value: React.ReactNode };

// Une demande = une carte : tous les champs visibles d'un coup (grille responsive),
// message affiché en entier en dessous. Aucun scroll horizontal.
function RequestCard({
  date,
  badge,
  fields,
  message,
  del,
}: {
  date: Date;
  badge?: React.ReactNode;
  fields: FieldDef[];
  message?: React.ReactNode;
  del: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">{fmt(date)}</span>
          {badge}
        </div>
        <div className="shrink-0">{del}</div>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
        {fields.map((f, i) => (
          <div key={i} className="min-w-0">
            <dt className="text-xs uppercase tracking-wide text-gray-400">{f.label}</dt>
            <dd className="text-sm text-gray-900 break-words">{f.value || "—"}</dd>
          </div>
        ))}
      </dl>
      {message != null && String(message).trim() !== "" && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Message</div>
          <div className="text-sm text-gray-800 whitespace-pre-line break-words">{message}</div>
        </div>
      )}
    </div>
  );
}

export default async function AdminPage() {
  const { devis, contacts, newsletter, contactLeads, ftRequests } = await getData();

  const email = (v: string) => (
    <a className="text-blue-600 hover:underline break-all" href={`mailto:${v}`}>{v}</a>
  );
  const tel = (v: string) => (
    <a className="text-blue-600 hover:underline" href={`tel:${v}`}>{v}</a>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-8">Demandes reçues</h1>

      {/* Devis */}
      <section className="mb-14">
        <h2 className="text-lg font-medium mb-4">
          Demandes de devis <span className="text-gray-400 font-normal">({devis.length})</span>
        </h2>
        {devis.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune demande pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {devis.map((r, i) => {
              const s = sourceInfo(r);
              return (
                <RequestCard
                  key={i}
                  date={r.created_at}
                  badge={<SourceBadge label={s.label} detail={s.detail} paid={s.paid} />}
                  del={<DeleteButton table="devis_requests" id={r.id} label={r.email} />}
                  fields={[
                    { label: "Nom", value: r.nom },
                    { label: "Société", value: r.societe },
                    { label: "Email", value: r.email ? email(r.email) : null },
                    { label: "Téléphone", value: r.telephone ? tel(r.telephone) : null },
                    { label: "Machine", value: r.machine_name },
                  ]}
                  message={r.message}
                />
              );
            })}
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
          <div className="space-y-3">
            {contacts.map((r, i) => (
              <RequestCard
                key={i}
                date={r.created_at}
                del={<DeleteButton table="contacts" id={r.id} label={r.email} />}
                fields={[
                  { label: "Nom", value: r.nom },
                  { label: "Email", value: r.email ? email(r.email) : null },
                  { label: "Sujet", value: r.sujet },
                ]}
                message={r.message}
              />
            ))}
          </div>
        )}
      </section>

      {/* Demandes de contact — Google Ads (lead form « rappel ») */}
      <section className="mb-14">
        <h2 className="text-lg font-medium mb-4">
          Demandes de contact — Google Ads <span className="text-gray-400 font-normal">({contactLeads.length})</span>
        </h2>
        {contactLeads.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune demande pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {contactLeads.map((r, i) => (
              <RequestCard
                key={i}
                date={r.created_at}
                badge={r.campaign ? <SourceBadge label={r.campaign} paid /> : undefined}
                del={<DeleteButton table="contact_leads" id={r.id} label={r.email || r.name} />}
                fields={[
                  { label: "Nom", value: r.name },
                  { label: "Email", value: r.email ? email(r.email) : null },
                  { label: "Téléphone", value: r.phone ? tel(r.phone) : null },
                ]}
                message={r.message}
              />
            ))}
          </div>
        )}
      </section>

      {/* Demandes de fiche technique (bouton par produit) */}
      <section className="mb-14">
        <h2 className="text-lg font-medium mb-4">
          Demandes de fiche technique <span className="text-gray-400 font-normal">({ftRequests.length})</span>
        </h2>
        {ftRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune demande pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {ftRequests.map((r, i) => {
              const s = sourceInfo(r);
              return (
                <RequestCard
                  key={i}
                  date={r.created_at}
                  badge={<SourceBadge label={s.label} detail={s.detail} paid={s.paid} />}
                  del={<DeleteButton table="ft_requests" id={r.id} label={r.email} />}
                  fields={[
                    { label: "Machine", value: r.machine_name || r.machine_slug },
                    { label: "Email", value: r.email ? email(r.email) : null },
                    { label: "Nom", value: r.nom },
                  ]}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Inscrits newsletter (popup du site, trafic Meta) */}
      <section>
        <h2 className="text-lg font-medium mb-4">
          Inscrits newsletter <span className="text-gray-400 font-normal">({newsletter.length})</span>
        </h2>
        {newsletter.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune inscription pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {newsletter.map((r, i) => {
              const s = newsletterSource(r.source);
              return (
                <RequestCard
                  key={i}
                  date={r.created_at}
                  badge={<SourceBadge label={s.label} paid={s.paid} />}
                  del={<DeleteButton table="newsletter_subscribers" id={r.id} label={r.email} />}
                  fields={[
                    { label: "Email", value: r.email ? email(r.email) : null },
                    { label: "Page", value: r.product_slug },
                  ]}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
