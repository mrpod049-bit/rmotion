"use client";
import { useEffect } from "react";
import { initGtag } from "@/lib/gtag";

// Charge Google Ads (gtag.js) en Consent Mode v2 pour TOUS les visiteurs, une
// seule fois. Le consentement publicitaire est « refusé » par défaut ; il passe
// à « accordé » via updateGtagConsent() au clic Accepter (voir MetaPixel).
// Monté avant MetaPixel dans le layout pour que le consentement par défaut soit
// posé avant toute mise à jour. Ne rend rien.
export default function GoogleTag() {
  useEffect(() => {
    initGtag();
  }, []);
  return null;
}
