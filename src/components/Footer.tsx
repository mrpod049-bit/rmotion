import Link from "next/link";
import ContactLinks from "@/components/ContactLinks";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16 sm:mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-gray-500">
        <div>
          <p className="font-semibold text-gray-900 mb-2">Rmotion</p>
          <p>Machines laser et CNC pour PME et TPE.</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 mb-2">Navigation</p>
          <ul className="space-y-1">
            <li><Link href="/machines" className="hover:text-gray-900">Catalogue</Link></li>
            <li><Link href="/articles" className="hover:text-gray-900">Documentation</Link></li>
            <li><Link href="/devis" className="hover:text-gray-900">Devis</Link></li>
            <li><Link href="/contact" className="hover:text-gray-900">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-900 mb-2">Contact</p>
          <ContactLinks imgClassName="h-2.5 w-auto" />
        </div>
      </div>
      <div className="border-t border-gray-200 text-center py-4 text-xs text-gray-400">
        © {new Date().getFullYear()} Rmotion — Tous droits réservés
      </div>
    </footer>
  );
}
