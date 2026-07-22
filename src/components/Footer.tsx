import Link from "next/link";
import ContactLinks from "@/components/ContactLinks";

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/rmotion.fr/",
    icon: (
      <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.56.217.96.477 1.382.896.42.42.68.82.896 1.38.166.423.362 1.058.415 2.228.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.415 2.227-.217.56-.477.96-.896 1.382-.42.42-.82.68-1.38.896-.423.166-1.058.362-2.228.415-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.415-.56-.217-.96-.477-1.382-.896-.42-.42-.68-.82-.896-1.38-.166-.423-.362-1.058-.415-2.228C2.212 15.584 2.2 15.204 2.2 12s.012-3.584.07-4.85c.053-1.17.249-1.805.415-2.227.217-.56.477-.96.896-1.382.42-.42.82-.68 1.38-.896.423-.166 1.058-.362 2.228-.415C8.416 2.212 8.796 2.2 12 2.2zm0 1.8c-3.146 0-3.522.012-4.76.069-.98.045-1.512.207-1.867.344-.47.182-.804.4-1.156.752-.352.352-.57.686-.752 1.156-.137.355-.3.887-.344 1.867-.057 1.238-.069 1.614-.069 4.76s.012 3.522.069 4.76c.045.98.207 1.512.344 1.867.182.47.4.804.752 1.156.352.352.686.57 1.156.752.355.137.887.3 1.867.344 1.238.057 1.614.069 4.76.069s3.522-.012 4.76-.069c.98-.045 1.512-.207 1.867-.344.47-.182.804-.4 1.156-.752.352-.352.57-.686.752-1.156.137-.355.3-.887.344-1.867.057-1.238.069-1.614.069-4.76s-.012-3.522-.069-4.76c-.045-.98-.207-1.512-.344-1.867-.182-.47-.4-.804-.752-1.156-.352-.352-.686-.57-1.156-.752-.355-.137-.887-.3-1.867-.344-1.238-.057-1.614-.069-4.76-.069zm0 3.064A4.936 4.936 0 1 1 7.064 12 4.936 4.936 0 0 1 12 7.064zm0 8.146A3.21 3.21 0 1 0 8.79 12 3.21 3.21 0 0 0 12 15.21zm6.28-8.34a1.152 1.152 0 1 1-2.304 0 1.152 1.152 0 0 1 2.304 0z" />
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/rmotion/",
    icon: (
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.64h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.42 4.78 5.57V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z" />
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0d2f4e] text-gray-300 mt-16 sm:mt-24">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10 text-sm">
        {/* Marque + réseaux */}
        <div className="col-span-2 md:col-span-1">
          <p className="font-semibold text-white mb-2">Rmotion</p>
          <p className="mb-4">Machines outils Laser &amp; CNC</p>
          <p className="mb-5 max-w-xs text-gray-400">
            Des machines laser fibre et centres d&apos;usinage CNC compacts, industriels et à coût maîtrisé pour les PME et TPE.
          </p>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-white/30 text-gray-200 hover:bg-white hover:text-[#0d2f4e] hover:border-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  {s.icon}
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <p className="font-semibold text-white mb-3">Navigation</p>
          <ul className="space-y-2">
            <li><Link href="/machines" className="hover:text-white">Catalogue</Link></li>
            <li><Link href="/articles" className="hover:text-white">Documentation</Link></li>
            <li><Link href="/devis" className="hover:text-white">Devis</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        {/* Découvrir */}
        <div>
          <p className="font-semibold text-white mb-3">Découvrir</p>
          <ul className="space-y-2">
            <li><Link href="/projet" className="hover:text-white">Votre projet</Link></li>
            <li><Link href="/philosophie" className="hover:text-white">Notre philosophie</Link></li>
            <li><Link href="/machines?type=gravure-laser" className="hover:text-white">Gravure laser</Link></li>
            <li><Link href="/machines?type=cnc" className="hover:text-white">Fraisage &amp; CNC</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="font-semibold text-white mb-3">Contact</p>
          <ContactLinks imgClassName="h-[13px] w-auto" light />
          <p className="mt-4">France</p>
        </div>
      </div>

      <div className="border-t border-white/10 text-center py-4 text-xs text-gray-400">
        © {new Date().getFullYear()} Rmotion — Tous droits réservés
        <span className="mx-2">·</span>
        <Link href="/cgu" className="hover:text-white">CGU</Link>
        <span className="mx-2">·</span>
        <Link href="/confidentialite" className="hover:text-white">Politique de confidentialité</Link>
        <span className="mx-2">·</span>
        <Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link>
      </div>
    </footer>
  );
}
