import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundPattern from "@/components/BackgroundPattern";
import { Analytics } from "@vercel/analytics/next";
import { getLocale } from "@/i18n/server";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const SITE_URL = "https://www.rmotion.fr";

const META = {
  fr: {
    default: "Rmotion — Machines laser et CNC pour PME/TPE",
    description:
      "Rmotion conçoit et distribue des machines laser fibre et centres d'usinage CNC compacts et compétitifs pour les PME et TPE. Devis sur mesure et accompagnement technique.",
  },
  en: {
    default: "Rmotion — Laser and CNC machines for SMEs",
    description:
      "Rmotion designs and distributes compact, competitive fiber laser machines and CNC machining centres for SMEs and small businesses. Tailored quotes and technical support.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = META[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: m.default, template: "%s — Rmotion" },
    description: m.description,
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
    alternates: {
      canonical: locale === "en" ? "/en" : "/",
      languages: { fr: "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_GB" : "fr_FR",
      url: locale === "en" ? `${SITE_URL}/en` : SITE_URL,
      siteName: "Rmotion",
      title: m.default,
      description: m.description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Rmotion — Machines laser fibre & CNC pour PME/TPE" }],
    },
    twitter: { card: "summary_large_image", title: m.default, description: m.description, images: ["/og.png"] },
    robots: { index: true, follow: true },
  };
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Rmotion",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo.png`,
  email: "contact@rmotion.fr",
  telephone: "+33781492685",
  description: META.fr.description,
  areaServed: "FR",
  sameAs: [
    "https://www.instagram.com/rmotion.fr/",
    "https://www.linkedin.com/company/rmotion/",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+33781492685",
    email: "contact@rmotion.fr",
    contactType: "sales",
    availableLanguage: ["French", "English"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${geist.variable} h-full bg-white`}>
      <body className="min-h-full flex flex-col text-gray-900 antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <BackgroundPattern />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
