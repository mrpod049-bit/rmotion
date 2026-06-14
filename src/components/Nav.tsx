"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/machines", label: "Machines" },
  { href: "/articles", label: "Articles" },
  { href: "/devis", label: "Devis" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="Rmotion" height={36} width={120} className="object-contain" priority />
        </Link>
        <nav className="flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                path.startsWith(l.href)
                  ? "text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/devis"
            className="ml-2 bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Demander un devis
          </Link>
        </nav>
      </div>
    </header>
  );
}
