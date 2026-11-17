import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Flash, Title, btn, input, label, th, td, one, type SP } from "../_ui";
import { attempt, str, int } from "../_server";

async function saveSupplier(fd: FormData) {
  "use server";
  await attempt("/admin/boutique/fournisseurs", async () => {
    const name = str(fd, "name");
    if (!name) throw new Error("Nom obligatoire.");
    const id = int(fd, "id");
    const vals = [name, str(fd, "contact") || null, str(fd, "email") || null, str(fd, "phone") || null,
      str(fd, "address") || null, (str(fd, "country") || "FR").toUpperCase().slice(0, 2), str(fd, "vat_number") || null,
      (str(fd, "currency") || "EUR").toUpperCase().slice(0, 3), str(fd, "payment_terms") || null, str(fd, "notes") || null,
      fd.get("active") != null];
    if (Number.isNaN(id)) {
      await pool.query(
        `INSERT INTO shop_suppliers (name, contact, email, phone, address, country, vat_number, currency, payment_terms, notes, active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, vals);
    } else {
      await pool.query(
        `UPDATE shop_suppliers SET name=$1, contact=$2, email=$3, phone=$4, address=$5, country=$6, vat_number=$7,
           currency=$8, payment_terms=$9, notes=$10, active=$11 WHERE id=$12`, [...vals, id]);
    }
    revalidatePath("/admin/boutique/fournisseurs");
    return "Fournisseur enregistré.";
  });
}

function SupplierFields({ s }: { s?: Record<string, string | boolean | null> }) {
  const v = (k: string) => (s?.[k] as string) ?? "";
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div><label className={label}>Nom *</label><input name="name" defaultValue={v("name")} className={input} required /></div>
      <div><label className={label}>Contact</label><input name="contact" defaultValue={v("contact")} className={input} /></div>
      <div><label className={label}>Email</label><input name="email" type="email" defaultValue={v("email")} className={input} /></div>
      <div><label className={label}>Téléphone</label><input name="phone" defaultValue={v("phone")} className={input} /></div>
      <div className="col-span-2"><label className={label}>Adresse</label><textarea name="address" rows={2} defaultValue={v("address")} className={input} /></div>
      <div><label className={label}>Pays (code)</label><input name="country" defaultValue={v("country") || "FR"} className={input} /></div>
      <div><label className={label}>N° TVA</label><input name="vat_number" defaultValue={v("vat_number")} className={input} /></div>
      <div><label className={label}>Devise</label><input name="currency" defaultValue={v("currency") || "EUR"} className={input} /></div>
      <div><label className={label}>Conditions de paiement</label><input name="payment_terms" defaultValue={v("payment_terms")} className={input} placeholder="30 j fin de mois" /></div>
      <div className="col-span-2"><label className={label}>Notes</label><input name="notes" defaultValue={v("notes")} className={input} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={s ? Boolean(s.active) : true} /> Actif</label>
    </div>
  );
}

export default async function SuppliersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const edit = Number(one(sp.edit)) || null;
  const rows = (await pool.query(
    `SELECT s.*, (SELECT COUNT(*)::int FROM shop_purchase_orders WHERE supplier_id=s.id) AS n_po
     FROM shop_suppliers s ORDER BY s.active DESC, s.name`)).rows;
  const current = rows.find((r) => r.id === edit);
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Title>Fournisseurs</Title>
      <Flash sp={sp} />
      <form action={saveSupplier} className="mb-8 rounded-lg border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold">{current ? `Modifier « ${current.name} »` : "Nouveau fournisseur"}</h2>
        {current && <input type="hidden" name="id" value={current.id} />}
        <SupplierFields key={current?.id ?? "new"} s={current} />
        <button className={btn}>{current ? "Enregistrer" : "+ Ajouter"}</button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500"><tr>{["Nom", "Contact", "Email", "Pays", "Conditions", "BCF", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((s) => (
              <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                <td className={`${td} font-medium`}>{s.name}</td>
                <td className={td}>{s.contact}</td>
                <td className={td}>{s.email}</td>
                <td className={td}>{s.country}</td>
                <td className={td}>{s.payment_terms}</td>
                <td className={td}>{s.n_po}</td>
                <td className={`${td} text-right`}><a className="text-blue-700 underline" href={`?edit=${s.id}`}>Modifier</a></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className={td} colSpan={7}>Aucun fournisseur.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
