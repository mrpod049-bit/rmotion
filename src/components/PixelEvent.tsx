"use client";
import { useEffect } from "react";
import { pixelTrack } from "@/lib/pixel";

// Déclenche un événement pixel au montage (ex. ViewContent sur une fiche produit).
// No-op si le pixel n'est pas chargé (consentement absent/refusé).
export default function PixelEvent({
  event,
  params,
}: {
  event: string;
  params?: Record<string, unknown>;
}) {
  useEffect(() => {
    pixelTrack(event, params);
    // Monté une seule fois par page : on ne re-déclenche pas sur re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
