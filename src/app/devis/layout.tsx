import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demande de devis",
  description:
    "Demandez un devis sur mesure pour votre machine laser fibre ou centre d'usinage CNC. Configuration et budget adaptés à votre atelier, réponse sous 24h.",
  alternates: { canonical: "/devis" },
};

export default function DevisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
