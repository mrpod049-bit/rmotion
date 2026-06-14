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
      <div className="max-w-screen-2xl mx-auto px-10 h-24 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="Rmotion" height={64} width={200} className="object-contain" priority quality={100} />
        </Link>
        <nav className="flex items-center gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm px-4 py-2 rounded transition-colors ${
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
            className="ml-4 bg-gray-900 text-white text-sm px-5 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Demander un devis
          </Link>
        </nav>
      </div>
    </header>
  );
}
