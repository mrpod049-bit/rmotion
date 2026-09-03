"use client";
import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

// Capture l'origine du visiteur (gclid / utm) au premier chargement.
// Monté une fois dans le layout ; ne rend rien.
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
