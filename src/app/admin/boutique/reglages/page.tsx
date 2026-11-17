import pool from "@/lib/db";
import { getSettings } from "@/lib/shop/core";
import { Card, Flash, Title, btn, btnDanger, input, label, th, td, type SP } from "../_ui";
import { attempt, num, int, str } from "../_server";

async function saveGeneral(fd: FormData) {
  "use server";
  await attempt("/admin/boutique/reglages", async () => {
    const vals: [string, unknown][] = [
      ["min_order_ht", Math.max(0, num(fd, "min_order_ht") || 0)],
      ["free_shipping_ht", Math.max(0, num(fd, "free_shipping_ht") || 0)],
      ["reservation_minutes", Math.min(1440, Math.max(30, int(fd, "reservation_minutes") || 45))],
      ["net30_days", Math.max(0, int(fd, "net30_days") || 30)],
      ["company", Object.fromEntries(
        ["name", "address", "postal_code", "city", "country", "siret", "vat_number", "email", "phone", "iban", "bic"].map((k) => [k, str(fd, `c_${k}`)])
      )],
    ];
    for (const [k, v] of vals) {
      await pool.query(
        `INSERT INTO shop_settings (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`, [k, JSON.stringify(v)]);
    }
    return "Réglages enregistrés.";
  });
}

async function addRate(fd: FormData) {
  "use server";
  await attempt("/admin/boutique/reglages", async () => {
    const zone = str(fd, "zone");
    const w = Math.round(num(fd, "max_kg") * 1000);
    const p = num(fd, "price_ht");
    if (!["FR", "EU", "WORLD"].includes(zone) || !(w > 0) || !(p >= 0)) throw new Error("Tranche invalide.");
    await pool.query(
      `INSERT INTO shop_shipping_rates (zone, max_weight_g, price_ht) VALUES ($1,$2,$3)
       ON CONFLICT (zone, max_weight_g) DO UPDATE SET price_ht=EXCLUDED.price_ht`, [zone, w, p]);
    return "Tranche enregistrée.";
  });
}

async function deleteRate(fd: FormData) {
  "use server";
  await attempt("/admin/boutique/reglages", async () => {
    await pool.query("DELETE FROM shop_shipping_rates WHERE id=$1", [int(fd, "id")]);
    return "Tranche supprimée.";
  });
}

function CF({ c, k, l, w = "" }: { c: Record<string, string>; k: string; l: string; w?: string }) {
  return <div className={w}><label className={label}>{l}</label><input name={`c_${k}`} defaultValue={c[k] ?? ""} className={input} /></div>;
}

export default async function SettingsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const s = await getSettings();
  const rates = (await pool.query("SELECT * FROM shop_shipping_rates ORDER BY zone, max_weight_g")).rows;
  const c = s.company as Record<string, string>;
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Title>Réglages boutique</Title>
      <Flash sp={sp} />
      <form action={saveGeneral} className="space-y-6 mb-8">
        <Card title="Règles de vente">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className={label}>Minimum de commande HT (€)</label><input name="min_order_ht" type="number" step="1" defaultValue={s.min_order_ht} className={input} /></div>
            <div><label className={label}>Port offert dès (HT, France) — 0 = jamais</label><input name="free_shipping_ht" type="number" step="1" defaultValue={s.free_shipping_ht} className={input} /></div>
            <div><label className={label}>Réservation de stock pendant le paiement (min)</label><input name="reservation_minutes" type="number" min="30" defaultValue={s.reservation_minutes} className={input} /></div>
            <div><label className={label}>Délai paiement à terme (jours)</label><input name="net30_days" type="number" defaultValue={s.net30_days} className={input} /></div>
          </div>
        </Card>
        <Card title="Société (en-tête des documents)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CF c={c} k="name" l="Raison sociale" /><CF c={c} k="address" l="Adresse" w="md:col-span-2" /><CF c={c} k="postal_code" l="Code postal" />
            <CF c={c} k="city" l="Ville" /><CF c={c} k="country" l="Pays" /><CF c={c} k="siret" l="SIRET" /><CF c={c} k="vat_number" l="N° TVA" />
            <CF c={c} k="email" l="Email" /><CF c={c} k="phone" l="Téléphone" /><CF c={c} k="iban" l="IBAN (virements)" /><CF c={c} k="bic" l="BIC" />
          </div>
        </Card>
        <button className={btn}>Enregistrer</button>
      </form>

      <Card title="Frais de port HT (grille au poids)">
        <p className="text-xs text-gray-500 mb-3">Pour un colis, la tranche retenue est la plus petite dont le poids max couvre le poids total. Sans tranche adaptée (ex. zone WORLD vide), la commande en ligne est bloquée avec un message « sur devis ».</p>
        <table className="w-full text-sm mb-4">
          <thead className="text-gray-500"><tr>{["Zone", "Jusqu'à", "Prix HT", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rates.map((r) => (
              <tr key={r.id}><td className={td}>{r.zone}</td><td className={td}>{r.max_weight_g / 1000} kg</td><td className={td}>{Number(r.price_ht).toFixed(2)} €</td>
                <td className={td}><form action={deleteRate}><input type="hidden" name="id" value={r.id} /><button className={btnDanger}>Suppr.</button></form></td></tr>
            ))}
          </tbody>
        </table>
        <form action={addRate} className="flex flex-wrap items-end gap-2">
          <div><label className={label}>Zone</label><select name="zone" className={input}><option>FR</option><option>EU</option><option>WORLD</option></select></div>
          <div><label className={label}>Poids max (kg)</label><input name="max_kg" type="number" step="0.1" className={`${input} w-24`} required /></div>
          <div><label className={label}>Prix HT (€)</label><input name="price_ht" type="number" step="0.01" className={`${input} w-24`} required /></div>
          <button className={btn}>Ajouter / modifier</button>
        </form>
      </Card>
    </div>
  );
}
