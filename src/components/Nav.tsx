"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/machines", label: "Produits" },
  { href: "/projet", label: "Votre projet" },
  { href: "/philosophie", label: "Notre philosophie" },
  { href: "/articles", label: "Documentation" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => path.startsWith(href);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto pl-4 pr-4 xl:pl-5 xl:pr-8 h-20 xl:h-24 flex items-stretch justify-between gap-2">
        <Link href="/" className="flex items-center shrink-0" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="Rmotion"
            height={80}
            width={291}
            className="h-12 sm:h-16 2xl:h-20 w-auto object-contain"
            priority
            quality={100}
          />
        </Link>

        {/* Navigation desktop — étalée sur tout l'espace entre le logo et le bord */}
        <nav className="hidden xl:flex flex-1 items-stretch justify-between">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[1.4rem] px-3 flex items-center transition-colors ${
                active(l.href)
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-500 hover:bg-gray-900 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/devis"
            className="flex items-center px-3 bg-gray-900 text-white text-[1.4rem] hover:bg-gray-700 transition-colors"
          >
            Demander un devis
          </Link>
        </nav>

        {/* Bouton hamburger mobile */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="xl:hidden flex items-center px-2 text-gray-900"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Menu déroulant mobile */}
      {open && (
        <nav className="xl:hidden border-t border-gray-200 bg-white">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block px-6 py-4 text-sm border-b border-gray-100 ${
                active(l.href) ? "bg-gray-900 text-white font-medium" : "text-gray-700"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/devis"
            onClick={() => setOpen(false)}
            className="block px-6 py-4 text-sm text-center bg-gray-900 text-white font-medium"
          >
            Demander un devis
          </Link>
        </nav>
      )}
    </header>
  );
}
