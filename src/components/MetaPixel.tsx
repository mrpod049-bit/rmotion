"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { localeFromPathname, localizeHref } from "@/i18n/config";
import { CONSENT_KEY, denyPixel, loadPixel, pixelTrack } from "@/lib/pixel";

type Consent = "granted" | "denied";

const TXT = {
  fr: {
    text: "Nous utilisons des cookies publicitaires (Meta) pour mesurer et améliorer nos campagnes. Vous pouvez accepter ou refuser.",
    accept: "Accepter",
    refuse: "Refuser",
    more: "En savoir plus",
  },
  en: {
    text: "We use advertising cookies (Meta) to measure and improve our campaigns. You can accept or decline.",
    accept: "Accept",
    refuse: "Decline",
    more: "Learn more",
  },
} as const;

export default function MetaPixel() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [mounted, setMounted] = useState(false);

  // Lecture du choix stocké après montage : le setState en effet est volontaire ici
  // (valeur client-only, évite tout écart d'hydratation SSR et le flash du bandeau).
  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored === "granted" || stored === "denied") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConsent(stored);
    }
    setMounted(true);
  }, []);

  // Charge le pixel dès que le consentement est accordé (ou abandonne la file si refusé).
  useEffect(() => {
    if (consent === "granted") loadPixel();
    else if (consent === "denied") denyPixel();
  }, [consent]);

  // PageView au montage et à chaque navigation interne (si consenti).
  useEffect(() => {
    if (consent === "granted") pixelTrack("PageView");
  }, [consent, pathname]);

  const choose = (value: Consent) => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  };

  if (!mounted || consent !== null) return null;

  const t = TXT[locale];
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-xs leading-snug text-gray-600 sm:text-sm">
          {t.text}{" "}
          <Link
            href={localizeHref("/confidentialite", locale)}
            className="underline underline-offset-2 hover:text-gray-900"
          >
            {t.more}
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 sm:py-2"
          >
            {t.refuse}
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded bg-[#0f3151] px-4 py-1.5 text-sm text-white hover:bg-[#184f79] sm:py-2"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
