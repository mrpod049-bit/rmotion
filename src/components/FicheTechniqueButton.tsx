"use client";
import { useEffect, useState } from "react";
import { getAttribution } from "@/lib/attribution";
import { gtagConversion } from "@/lib/gtag";
import { pixelTrack } from "@/lib/pixel";

type Locale = "fr" | "en";

const TXT = {
  fr: {
    cta: "Fiche technique",
    title: "Recevoir la fiche technique",
    text: "Indiquez votre email, nous vous envoyons la fiche technique de cette machine.",
    email: "Email professionnel",
    nom: "Nom (facultatif)",
    submit: "Recevoir la fiche",
    sending: "Envoi…",
    successTitle: "Demande envoyée",
    successText: "Nous vous envoyons la fiche technique très vite.",
    close: "Fermer",
    emailInvalid: "Merci d'indiquer un email valide.",
    error: "Une erreur est survenue. Réessayez.",
  },
  en: {
    cta: "Datasheet",
    title: "Get the datasheet",
    text: "Leave your email and we'll send you this machine's datasheet.",
    email: "Work email",
    nom: "Name (optional)",
    submit: "Send me the datasheet",
    sending: "Sending…",
    successTitle: "Request sent",
    successText: "We'll send you the datasheet shortly.",
    close: "Close",
    emailInvalid: "Please enter a valid email.",
    error: "Something went wrong. Please try again.",
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FicheTechniqueButton({
  machineId, machineName, machineSlug, locale,
}: {
  machineId: number | string;
  machineName: string;
  machineSlug: string;
  locale: Locale;
}) {
  const t = TXT[locale] ?? TXT.fr;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Ferme la modale sur Échap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const value = email.trim();
    if (!EMAIL_RE.test(value)) { setError(t.emailInvalid); return; }
    setSending(true);
    const res = await fetch("/api/fiche-technique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: value, nom: nom.trim() || null,
        machine_id: machineId, machine_name: machineName, machine_slug: machineSlug,
        attribution: getAttribution(),
      }),
    }).catch(() => null);
    setSending(false);
    if (res && res.ok) {
      setDone(true);
      gtagConversion("fiche_technique", { value: 5.0, currency: "EUR" });
      pixelTrack("Lead", { source: "fiche_technique", content_name: machineName });
    } else {
      setError(t.error);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-gray-300 text-gray-900 px-6 py-3 rounded hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 18 15 15" />
        </svg>
        {t.cta}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t.title}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>

            {done ? (
              <div className="text-center py-6">
                <p className="text-xl font-semibold mb-2">{t.successTitle}</p>
                <p className="text-gray-500">{t.successText}</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-1">{t.title}</h2>
                <p className="text-gray-500 text-sm mb-5">{machineName} — {t.text}</p>
                <form onSubmit={submit} className="space-y-4">
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.email} aria-label={t.email} required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <input
                    type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                    placeholder={t.nom} aria-label={t.nom}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button
                    type="submit" disabled={sending}
                    className="w-full bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {sending ? t.sending : t.submit}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
