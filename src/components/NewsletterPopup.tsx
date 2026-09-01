"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeFromPathname, localizeHref } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pixelTrack } from "@/lib/pixel";

// Clés localStorage : provenance Meta mémorisée + « déjà traité » (affiché une fois/visiteur).
const FROM_META = "rm_from_meta";
const FBCLID = "rm_fbclid";
const DONE = "rm_newsletter_done";
const DELAY_MS = 20000; // filet mobile (pas d'intention de sortie sur tactile)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Détecte un clic issu de Meta : fbclid (ajouté automatiquement par Meta) ou UTM Meta.
function detectMeta(search: string): { meta: boolean; fbclid: string | null } {
  const p = new URLSearchParams(search);
  const fbclid = p.get("fbclid");
  const src = (p.get("utm_source") || "").toLowerCase();
  return { meta: Boolean(fbclid) || /facebook|instagram|meta|fb|ig/.test(src), fbclid };
}

export default function NewsletterPopup() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const t = getDictionary(locale).newsletter;

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const armed = useRef(false);

  // Mémorise la provenance Meta (le fbclid n'est présent que sur l'URL d'atterrissage).
  useEffect(() => {
    try {
      const { meta, fbclid } = detectMeta(window.location.search);
      if (meta) {
        localStorage.setItem(FROM_META, "1");
        if (fbclid) localStorage.setItem(FBCLID, fbclid);
      }
    } catch {}
  }, [pathname]);

  // Arme les déclencheurs (intention de sortie + délai), une seule fois par visiteur.
  useEffect(() => {
    if (armed.current) return;
    let eligible = false;
    try {
      eligible = localStorage.getItem(FROM_META) === "1" && localStorage.getItem(DONE) !== "1";
    } catch {}
    if (!eligible) return;
    armed.current = true;

    const trigger = () => {
      setOpen(true);
      cleanup();
    };
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) trigger();
    };
    const timer = window.setTimeout(trigger, DELAY_MS);
    document.addEventListener("mouseout", onMouseOut);
    function cleanup() {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
    }
    return cleanup;
  }, [pathname]);

  const persistDone = () => {
    try {
      localStorage.setItem(DONE, "1");
    } catch {}
  };
  const dismiss = () => {
    setOpen(false);
    persistDone();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setError(t.emailInvalid);
    if (!consent) return setError(t.consentRequired);
    setSending(true);
    let fbclid: string | null = null;
    try {
      fbclid = localStorage.getItem(FBCLID);
    } catch {}
    const productSlug = /\/products\/([^/?#]+)/.exec(pathname)?.[1] || null;
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: value, consent, source: "popup-meta", productSlug, fbclid }),
    }).catch(() => null);
    setSending(false);
    if (res && res.ok) {
      setDone(true);
      persistDone();
      pixelTrack("Lead", { source: "newsletter" });
    } else {
      setError(t.error);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8">
        <button
          type="button"
          onClick={dismiss}
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
            <h2 className="text-xl font-semibold mb-2">{t.title}</h2>
            <p className="text-gray-500 text-sm mb-5">{t.text}</p>
            <form onSubmit={submit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                aria-label={t.emailPlaceholder}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <label className="flex items-start gap-2 text-xs text-gray-500">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span>{t.consent}</span>
              </label>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {sending ? t.sending : t.submit}
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                {t.privacyBefore}
                <Link href={localizeHref("/confidentialite", locale)} className="underline hover:text-gray-600">
                  {t.privacyLink}
                </Link>
                {t.privacyAfter}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
