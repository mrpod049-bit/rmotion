import { getInboxCounts } from "@/lib/crm";
import AdminNav from "./AdminNav";

// Layout partagé pour tout l'espace admin : barre de navigation commune
// (/admin, Pipeline, Leads, Coûts machines, Journal) sur chaque page.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let toContact = 0;
  try {
    const inbox = await getInboxCounts();
    toContact = inbox?.toContact ?? 0;
  } catch {
    // La nav ne doit jamais casser l'admin si le CRM est indisponible.
  }
  return (
    <>
      <AdminNav toContact={toContact} />
      {children}
    </>
  );
}
