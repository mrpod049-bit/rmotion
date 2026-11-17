import type { CompanyInfo } from "@/lib/shop/core";
import { COUNTRY_NAMES } from "@/lib/shop/core";
import PrintButton from "./PrintButton";

// Gabarit des documents imprimables (bon de préparation, bon de livraison,
// bon de commande fournisseur). « Imprimer → Enregistrer en PDF » dans le
// navigateur produit le PDF. L'habillage du site est masqué à l'impression.

export type Addr = { company?: string; name?: string; contact?: string | null; line1?: string; line2?: string | null; postal_code?: string; city?: string; country?: string; phone?: string | null; address?: string | null };

export function AddressBlock({ title, a }: { title: string; a: Addr }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{title}</div>
      <div className="font-semibold">{a.company || a.name}</div>
      {a.contact && <div>{a.contact}</div>}
      {a.address ? <div className="whitespace-pre-line">{a.address}</div> : <>
        <div>{a.line1}</div>
        {a.line2 && <div>{a.line2}</div>}
        <div>{a.postal_code} {a.city}</div>
      </>}
      {a.country && a.country !== "FR" && <div>{COUNTRY_NAMES[a.country] ?? a.country}</div>}
      {a.phone && <div>Tél. {a.phone}</div>}
    </div>
  );
}

export function PrintDoc({ company, title, number, date, children }: {
  company: CompanyInfo; title: string; number: string; date: string; children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[800px] bg-white px-8 py-8 text-[13px] text-gray-900 print:p-0">
      <style>{`
        @media print {
          body > *:not(main), main > nav, .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 14mm; }
          body { background: #fff !important; }
        }
      `}</style>
      <div className="mb-6 flex justify-end gap-2 print:hidden">
        <PrintButton />
      </div>
      <div className="flex justify-between gap-6 border-b border-gray-300 pb-4 mb-6">
        <div>
          <div className="text-xl font-bold">{company.name || "Rmotion"}</div>
          {company.address && <div>{company.address}</div>}
          {(company.postal_code || company.city) && <div>{company.postal_code} {company.city}</div>}
          {company.phone && <div>Tél. {company.phone}</div>}
          {company.email && <div>{company.email}</div>}
          {company.siret && <div className="text-xs text-gray-500">SIRET {company.siret}</div>}
          {company.vat_number && <div className="text-xs text-gray-500">TVA {company.vat_number}</div>}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold uppercase">{title}</div>
          <div className="font-mono">{number}</div>
          <div className="text-gray-500">{date}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
