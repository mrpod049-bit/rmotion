"use client";
import { usePathname } from "next/navigation";

export default function BackgroundPattern() {
  const path = usePathname();
  // Pas de motif sur la page d'accueil
  if (path === "/") return null;
  return (
    <>
      <div aria-hidden className="site-pattern" />
      {/* Bande centrale blanche = zone des corps de texte, sans motif */}
      <div aria-hidden className="content-mask" />
    </>
  );
}
