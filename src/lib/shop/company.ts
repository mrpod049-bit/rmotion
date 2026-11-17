import "server-only";
import { EU_COUNTRIES } from "./core";

// Identification des entreprises clientes : SIRENE (France) et TVA (VIES).

export type CompanyLookup = {
  siret: string; siren: string; name: string; naf: string | null;
  address: string; postal_code: string; city: string; active: boolean;
};

export const cleanSiret = (s: string) => (s || "").replace(/\D/g, "");

/** Contrôle de Luhn (SIREN/SIRET). */
export function luhnOk(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

export function siretValid(siret: string): boolean {
  if (!/^\d{14}$/.test(siret)) return false;
  // Exception connue : établissements de La Poste (SIREN 356000000).
  if (siret.startsWith("356000000")) return true;
  return luhnOk(siret);
}

/** N° de TVA intracommunautaire français déduit du SIREN. */
export function frVatFromSiren(siren: string): string {
  const key = (12 + 3 * (Number(siren) % 97)) % 97;
  return `FR${String(key).padStart(2, "0")}${siren}`;
}

/** Recherche dans l'annuaire des entreprises (API publique gratuite, sans clé). */
export async function lookupSiret(siretRaw: string): Promise<CompanyLookup | null> {
  const siret = cleanSiret(siretRaw);
  if (!siretValid(siret)) return null;
  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&page=1&per_page=1`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.results?.[0];
    if (!r) return null;
    const etab =
      (r.matching_etablissements || []).find((e: { siret: string }) => e.siret === siret) || r.siege || {};
    return {
      siret,
      siren: siret.slice(0, 9),
      name: r.nom_raison_sociale || r.nom_complet || "",
      naf: etab.activite_principale || r.activite_principale || null,
      address: [etab.numero_voie, etab.indice_repetition, etab.type_voie, etab.libelle_voie]
        .filter(Boolean).join(" ") || etab.adresse || "",
      postal_code: etab.code_postal || "",
      city: etab.libelle_commune || "",
      active: (etab.etat_administratif || r.etat_administratif) !== "F",
    };
  } catch {
    return null;
  }
}

/** Vérifie un n° de TVA auprès de VIES (Commission européenne).
 *  Renvoie null si le service est indisponible (à revérifier plus tard). */
export async function checkVies(vatRaw: string): Promise<{ valid: boolean; name?: string } | null> {
  const vat = (vatRaw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const cc = vat.slice(0, 2);
  const num = vat.slice(2);
  const country = cc === "EL" ? "GR" : cc;
  if (!EU_COUNTRIES.includes(country) || !num) return { valid: false };
  try {
    const res = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${cc}/vat/${num}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (typeof d.isValid !== "boolean") return null;
    return { valid: d.isValid, name: d.name && d.name !== "---" ? d.name : undefined };
  } catch {
    return null;
  }
}
