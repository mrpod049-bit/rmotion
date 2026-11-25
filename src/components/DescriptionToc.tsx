"use client";
import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/richtext";

/**
 * Sommaire latéral collant (sticky) de la description produit.
 * Liste les sous-titres (H2/H3), défilement fluide au clic, et surligne la
 * section actuellement visible (scroll-spy via IntersectionObserver).
 * Masqué sur mobile (la description s'affiche alors en pleine largeur).
 */
export default function DescriptionToc({ items, title }: { items: TocItem[]; title: string }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Zone d'activation : sous l'en-tête fixe, dans le tiers supérieur du viewport.
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  const onClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
    if (typeof history !== "undefined") history.replaceState(null, "", `#${id}`);
  };

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-28">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{title}</p>
        <ul className="text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => onClick(e, item.id)}
                className={`block border-l-2 py-1 leading-snug transition-colors ${
                  item.level === 3 ? "pl-6" : "pl-3"
                } ${
                  active === item.id
                    ? "border-gray-900 text-gray-900 font-medium"
                    : "border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
