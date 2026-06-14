"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/machines", label: "Produits" },
  { href: "/articles", label: "Articles" },
  { href: "/devis", label: "Devis" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 h-24">
      <div className="max-w-screen-2xl mx-auto px-10 h-full flex items-stretch justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Rmotion" height={80} width={291} className="object-contain" style={{ height: 80, width: "auto" }} priority quality={100} />
        </Link>
        <nav className="flex items-stretch gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm px-8 flex items-center transition-colors ${
                path.startsWith(l.href)
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-500 hover:bg-gray-900 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/devis"
            className="ml-2 flex items-center px-6 bg-gray-900 text-white text-sm hover:bg-gray-700 transition-colors"
          >
            Demander un devis
          </Link>
        </nav>
      </div>
    </header>
  );
}
