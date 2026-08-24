"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { localeFromPathname, localizeHref } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const locale = localeFromPathname(path);
  const t = getDictionary(locale).nav;
  const L = (href: string) => localizeHref(href, locale);

  const links = [
    { href: L("/products"), label: t.products },
    { href: L("/projet"), label: t.project },
    { href: L("/philosophie"), label: t.philosophy },
    { href: L("/articles"), label: t.docs },
  ];
  const active = (href: string) => path.startsWith(href);

  // Sélecteur de langue : liens vers la même page dans chaque locale.
  const frHref = locale === "en" ? path.replace(/^\/en/, "") || "/" : path;
  const enHref = locale === "en" ? path : path === "/" ? "/en" : `/en${path}`;

  // Bascule FR | EN réutilisée en desktop et mobile.
  const LangSwitch = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center text-[1.1rem] font-medium ${className}`}>
      <Link
        href={frHref}
        aria-current={locale === "fr" ? "true" : undefined}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "fr" ? "text-gray-900" : "text-gray-400 hover:text-gray-900"
        }`}
      >
        FR
      </Link>
      <span className="text-gray-300" aria-hidden="true">|</span>
      <Link
        href={enHref}
        aria-current={locale === "en" ? "true" : undefined}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "en" ? "text-gray-900" : "text-gray-400 hover:text-gray-900"
        }`}
      >
        EN
      </Link>
    </div>
  );

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto pl-4 pr-4 xl:pl-0 xl:pr-8 h-20 xl:h-24 flex items-stretch justify-between gap-2 xl:gap-0">
        <Link href={L("/")} className="flex items-center shrink-0 xl:-ml-[10px] xl:-translate-x-10" onClick={() => setOpen(false)}>
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
        <nav className="hidden xl:flex flex-1 items-stretch xl:ml-10">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 text-[1.4rem] px-3 flex items-center justify-center text-center whitespace-nowrap transition-colors ${
                active(l.href)
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-500 hover:bg-gray-900 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={L("/devis")}
            className="flex items-center px-6 bg-gray-900 text-white text-[1.4rem] whitespace-nowrap hover:bg-gray-700 transition-colors"
          >
            {t.quote}
          </Link>
          <div className="flex items-center px-5 border-l border-gray-200">
            <LangSwitch />
          </div>
        </nav>

        {/* Bascule de langue + hamburger mobile */}
        <div className="xl:hidden flex items-center gap-1">
          <LangSwitch />
          <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? t.closeMenu : t.openMenu}
          aria-expanded={open}
          className="flex items-center px-2 text-gray-900"
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
            href={L("/devis")}
            onClick={() => setOpen(false)}
            className="block px-6 py-4 text-sm text-center bg-gray-900 text-white font-medium"
          >
            {t.quote}
          </Link>
        </nav>
      )}
    </header>
  );
}
