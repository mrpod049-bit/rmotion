import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Rmotion pour vos machines laser fibre et centres d'usinage CNC : questions techniques, disponibilités, accompagnement. Réponse rapide.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
