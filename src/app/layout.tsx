import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const SITE_URL = "https://www.rmotion.fr";
const DESCRIPTION =
  "Rmotion conçoit et distribue des machines laser fibre et centres d'usinage CNC compacts et compétitifs pour les PME et TPE. Devis sur mesure et accompagnement technique.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rmotion — Machines laser et CNC pour PME/TPE",
    template: "%s — Rmotion",
  },
  description: DESCRIPTION,
  keywords: [
    "machine laser fibre",
    "gravure laser",
    "découpe laser",
    "centre d'usinage CNC",
    "fraiseuse compacte",
    "machine CNC PME",
    "marquage laser",
    "machine industrielle TPE",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Rmotion",
    title: "Rmotion — Machines laser et CNC pour PME/TPE",
    description: DESCRIPTION,
    images: [{ url: "/logo.png", width: 485, height: 330, alt: "Rmotion" }],
  },
  twitter: {
    card: "summary",
    title: "Rmotion — Machines laser et CNC pour PME/TPE",
    description: DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Rmotion",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo.png`,
  email: "contact@rmotion.fr",
  telephone: "+33781492685",
  description: DESCRIPTION,
  areaServed: "FR",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+33781492685",
    email: "contact@rmotion.fr",
    contactType: "sales",
    availableLanguage: ["French"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
