import "server-only";
import { headers } from "next/headers";
import type { Locale } from "./config";
import { getDictionary } from "./dictionaries";

// Locale de la requête courante (posée par le middleware via l'en-tête x-locale).
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  return h.get("x-locale") === "en" ? "en" : "fr";
}

// Raccourci : renvoie la locale ET son dictionnaire.
export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
