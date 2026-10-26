"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { localeFromPathname, localizeHref } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type NavProduct = { slug: string; name: string; type: string };

export default function Nav({ products = [] }: { products?: NavProduct[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const locale = localeFromPathname(path);
  const d = getDictionary(locale);
  const t = d.nav;
  const L = (href: string) => localizeHref(href, locale);
  const close = () => setOpen(false);

  const productsHref = L("/products");
  const otherLinks = [
    { href: L("/projet"), label: t.project },
    { href: L("/philosophie"), label: t.philosophy },
    { href: L("/articles"), label: t.docs },
  ];
  const active = (href: string) => path.startsWith(href);

  const laserProducts = products.filter((p) => p.type === "laser");
  const cncProducts = products.filter((p) => p.type === "cnc");

  const tabClass = (isActive: boolean) =>
    `flex-1 text-[1.4rem] px-3 flex items-center justify-center text-center whitespace-nowrap transition-colors ${
      isActive ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:bg-gray-900 hover:text-white"
    }`;

  // Colonne du menu déroulant : lien vers la page catégorie + chaque produit.
  const DropdownColumn = ({ label, href, items }: { label: string; href: string; items: NavProduct[] }) => (
    <div>
      <Link href={href} className="block text-[0.95rem] font-semibold text-gray-900 hover:underline mb-2">
        {label}
      </Link>
      <ul className="space-y-1.5">
        {items.map((p) => (
          <li key={p.slug}>
            <Link
              href={L(`/products/${p.slug}`)}
              className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {p.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

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
      <div className="max-w-screen-2xl mx-auto pl-4 pr-4 xl:pr-8 h-20 xl:h-24 flex items-stretch justify-between gap-2 xl:gap-0">
        <Link href={L("/")} className="flex items-center shrink-0" onClick={close}>
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
          {/* Produits : onglet cliquable (→ /products) + menu déroulant au survol */}
          <div className="flex-1 relative group flex">
            <Link href={productsHref} className={tabClass(active(productsHref))} aria-haspopup="true">
              {t.products}
            </Link>
            <div
              className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-150 absolute left-0 top-full z-50 w-[34rem] max-w-[90vw] bg-white border border-gray-200 shadow-xl rounded-b-lg p-6 grid grid-cols-2 gap-x-8 gap-y-2 text-left"
              role="menu"
            >
              <Link
                href={productsHref}
                className="col-span-2 pb-2 mb-1 border-b border-gray-100 text-sm font-medium text-gray-900 hover:underline"
              >
                {t.allMachines}
              </Link>
              <DropdownColumn label={d.machines.laserGroup} href={L("/products/laser")} items={laserProducts} />
              <DropdownColumn label={d.machines.cncGroup} href={L("/products/cnc")} items={cncProducts} />
            </div>
          </div>

          {otherLinks.map((l) => (
            <Link key={l.href} href={l.href} className={tabClass(active(l.href))}>
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
          <Link
            href={productsHref}
            onClick={close}
            className={`block px-6 py-4 text-sm border-b border-gray-100 ${
              active(productsHref) ? "bg-gray-900 text-white font-medium" : "text-gray-700"
            }`}
          >
            {t.products}
          </Link>
          {/* Sous-menu produits : pages catégorie + chaque produit */}
          <div className="bg-gray-50 border-b border-gray-100">
            <Link href={L("/products/laser")} onClick={close} className="block pl-10 pr-6 py-3 text-sm font-medium text-gray-800">
              {d.machines.laserGroup}
            </Link>
            {laserProducts.map((p) => (
              <Link key={p.slug} href={L(`/products/${p.slug}`)} onClick={close} className="block pl-14 pr-6 py-2.5 text-sm text-gray-500">
                {p.name}
              </Link>
            ))}
            <Link href={L("/products/cnc")} onClick={close} className="block pl-10 pr-6 py-3 text-sm font-medium text-gray-800">
              {d.machines.cncGroup}
            </Link>
            {cncProducts.map((p) => (
              <Link key={p.slug} href={L(`/products/${p.slug}`)} onClick={close} className="block pl-14 pr-6 py-2.5 text-sm text-gray-500">
                {p.name}
              </Link>
            ))}
          </div>
          {otherLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              className={`block px-6 py-4 text-sm border-b border-gray-100 ${
                active(l.href) ? "bg-gray-900 text-white font-medium" : "text-gray-700"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={L("/devis")}
            onClick={close}
            className="block px-6 py-4 text-sm text-center bg-gray-900 text-white font-medium"
          >
            {t.quote}
          </Link>
        </nav>
      )}
    </header>
  );
}
