import Link from "next/link";
import Hero from "@/components/Hero";

export default async function HomePage() {

  return (
    <>
      {/* Hero */}
      <Hero />

      {/* Gammes */}
      <section className="flex flex-col w-full">
        {[
          { label: "Gravure laser", href: "/machines?type=gravure-laser", desc: "Marquage précis sur métal, bois et plastiques", image: "/gammes/engraving.png" },
          { label: "Découpe laser", href: "/machines?type=decoupe-laser", desc: "Découpe nette sur acrylique, bois, tissu et plus", image: null },
          { label: "Fraisage & CNC", href: "/machines?type=cnc", desc: "Usinage bois, alu et composites pour l'atelier", image: null },
          { label: "Votre projet", href: "/projet", desc: "Un besoin spécifique ? Construisons la solution ensemble", image: null },
        ].map((gamme, i) => (
          <Link
            key={gamme.label}
            href={gamme.href}
            className={`group relative flex items-center h-56 px-12 bg-gray-100 border-b last:border-b-0 border-gray-200 overflow-hidden transition-colors ${gamme.image ? "" : "hover:bg-gray-900"}`}
          >
            {gamme.image ? (
              <>
                {/* Image révélée en fondu au survol, pleine largeur (bords coïncidant avec le bandeau) */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gamme.image}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover"
                    style={{ transform: "translate(100px, 10px) scale(1.2)" }}
                  />
                </div>
                {/* Voile bleuté qui apparaît lui aussi en fondu par-dessus l'image */}
                <div className="absolute inset-0 bg-[#0b2239]/55 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </>
            ) : (
              <>
                {/* Placeholder — à remplacer par une vraie image */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-300 text-xs uppercase tracking-widest group-hover:opacity-0 transition-opacity">
                  Image gamme {i + 1}
                </div>
              </>
            )}
            <div className="relative z-10 max-w-xl">
              <p className="text-xs uppercase tracking-widest text-gray-400 group-hover:text-gray-300 mb-2 transition-colors">
                Gamme
              </p>
              <h2 className="text-3xl font-semibold text-gray-900 group-hover:text-white mb-2 transition-colors">
                {gamme.label}
              </h2>
              <p className="text-sm text-gray-500 group-hover:text-gray-300 mb-4 transition-colors">
                {gamme.desc}
              </p>
              <span className="text-sm text-gray-900 group-hover:text-white underline transition-colors">
                Voir les produits →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Promesse */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-3 gap-10 text-sm">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Sélection rigoureuse</p>
            <p className="text-gray-500">Nous testons chaque machine avant de la proposer. Que du matériel fiable, avec support pièces disponible.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Devis sur mesure</p>
            <p className="text-gray-500">Pas de prix catalogue fixe. Chaque atelier a ses besoins — on adapte la configuration et le budget.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Accompagnement technique</p>
            <p className="text-gray-500">Installation, prise en main, formation : on ne livre pas une machine, on met en place un outil de production.</p>
          </div>
        </div>
      </section>

      {/* CTA articles */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-semibold">Comprendre les technologies</h2>
          <Link href="/articles" className="text-sm text-gray-500 hover:text-gray-900">Tous les articles →</Link>
        </div>
        <p className="text-gray-500 max-w-xl">
          Laser CO2, fibre, CNC bois ou métal — nos guides techniques pour choisir le bon outil sans vous noyer dans les specs.
        </p>
      </section>
    </>
  );
}
