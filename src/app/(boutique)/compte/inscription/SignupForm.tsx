"use client";
import { useState } from "react";
import TurnstileField from "../TurnstileField";

const COUNTRIES: [string, string][] = [
  ["FR", "France"], ["BE", "Belgique"], ["LU", "Luxembourg"], ["DE", "Allemagne"], ["ES", "Espagne"], ["IT", "Italie"],
  ["NL", "Pays-Bas"], ["PT", "Portugal"], ["AT", "Autriche"], ["IE", "Irlande"], ["CH", "Suisse"], ["MC", "Monaco"],
];
const inp = "w-full rounded border border-gray-300 px-3 py-2 text-sm";
const lbl = "block text-xs font-medium text-gray-500 mb-1";

export default function SignupForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [country, setCountry] = useState("FR");
  const [siret, setSiret] = useState("");
  const [f, setF] = useState({ company_name: "", line1: "", postal_code: "", city: "" });
  const [info, setInfo] = useState<{ ok?: string; err?: string }>({});
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    setInfo({}); setLoading(true);
    try {
      const r = await fetch(`/api/shop/siret?siret=${encodeURIComponent(siret)}`);
      const j = await r.json();
      if (!r.ok) setInfo({ err: j.error });
      else {
        setF({ company_name: j.name, line1: j.address, postal_code: j.postal_code, city: j.city });
        setInfo({ ok: j.active ? `Trouvé : ${j.name}` : "Attention : établissement fermé selon l'annuaire." });
      }
    } catch { setInfo({ err: "Annuaire indisponible, complétez à la main." }); }
    setLoading(false);
  };

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Pays de l&apos;entreprise</label>
          <select name="country" value={country} onChange={(e) => setCountry(e.target.value)} className={inp}>
            {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select></div>
        {country === "FR" ? (
          <div><label className={lbl}>SIRET *</label>
            <div className="flex gap-1">
              <input name="siret" value={siret} onChange={(e) => setSiret(e.target.value)} className={inp} placeholder="14 chiffres" required inputMode="numeric" />
              <button type="button" onClick={lookup} disabled={loading} className="rounded border border-gray-300 px-2 text-xs whitespace-nowrap">{loading ? "…" : "Vérifier"}</button>
            </div></div>
        ) : (
          <div><label className={lbl}>N° TVA intracommunautaire {country === "CH" || country === "MC" ? "" : "*"}</label>
            <input name="vat_number" className={inp} placeholder={`${country}…`} required={!["CH", "MC"].includes(country)} /></div>
        )}
      </div>
      {info.ok && <p className="text-sm text-green-700">{info.ok}</p>}
      {info.err && <p className="text-sm text-amber-700">{info.err}</p>}
      <div><label className={lbl}>Raison sociale {country === "FR" ? "(remplie depuis le SIRET)" : "*"}</label>
        <input name="company_name" value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} className={inp} /></div>
      <div><label className={lbl}>Adresse de facturation *</label>
        <input name="line1" value={f.line1} onChange={(e) => setF({ ...f, line1: e.target.value })} className={inp} required /></div>
      <input name="line2" placeholder="Complément d'adresse" className={inp} />
      <div className="grid grid-cols-3 gap-3">
        <input name="postal_code" value={f.postal_code} onChange={(e) => setF({ ...f, postal_code: e.target.value })} placeholder="Code postal *" className={inp} required />
        <input name="city" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Ville *" className={`${inp} col-span-2`} required />
      </div>
      <hr />
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Votre nom *</label><input name="name" className={inp} required autoComplete="name" /></div>
        <div><label className={lbl}>Téléphone</label><input name="phone" className={inp} autoComplete="tel" /></div>
      </div>
      <div><label className={lbl}>Email professionnel * (identifiant de connexion)</label><input name="email" type="email" className={inp} required autoComplete="email" /></div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="cgv" required className="mt-1" />
        <span>J&apos;accepte les <a href="/cgv" target="_blank" className="underline">conditions générales de vente</a> (vente réservée aux professionnels).</span>
      </label>
      <TurnstileField />
      <button className="w-full rounded bg-gray-900 py-2.5 text-white hover:bg-gray-700">Demander l&apos;ouverture du compte</button>
    </form>
  );
}
