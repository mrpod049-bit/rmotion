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
          { label: "Gravure laser", href: "/machines?type=gravure-laser", desc: "Marquage précis sur métal, bois et plastiques", image: "/gammes/engraving.png", transform: "translate(100px, 10px) scale(1.2)" },
          { label: "Fraisage & CNC", href: "/machines?type=cnc", desc: "Usinage bois, alu et composites pour l'atelier", image: "/gammes/milling.jpg", transform: undefined },
          { label: "Votre projet", href: "/projet", desc: "Un besoin spécifique ? Construisons la solution ensemble", image: "/gammes/design.jpg", transform: undefined },
        ].map((gamme, i) => (
          <Link
            key={gamme.label}
            href={gamme.href}
            className="group relative flex items-center h-56 px-6 sm:px-12 bg-[#0f3151] border-b last:border-b-0 border-white/10 overflow-hidden"
          >
            {gamme.image ? (
              <>
                {/* Image : toujours visible sur mobile, révélée au survol sur desktop */}
                <div className="absolute inset-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gamme.image}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover gamme-img"
                    style={gamme.transform ? ({ "--gamme-transform": gamme.transform } as React.CSSProperties) : undefined}
                  />
                </div>
                {/* Voile bleuté (même opacité) : toujours visible sur mobile, au survol sur desktop */}
                <div className="absolute inset-0 bg-[#0f3151]/70 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-700" />
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
              <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">
                Gamme
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-2">
                {gamme.label}
              </h2>
              <p className="text-sm text-gray-200 mb-4">
                {gamme.desc}
              </p>
              <span className="text-sm text-white underline">
                Voir les produits →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* CTA articles */}
      <Link href="/articles" className="block bg-[#184f79] text-white hover:bg-[#134063] transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold mb-4">Comprendre les technologies</h2>
          <p className="text-gray-200 max-w-xl mx-auto">
            Types de lasers, quelle solution d&apos;usinage choisir, consultez nos guides techniques
          </p>
        </div>
      </Link>

      {/* Promesse */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 text-sm">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Devis sur mesure</p>
            <p className="text-gray-500">Nous nous adaptons à vos contraintes techniques et budgétaires pour vous proposer la meilleure solution possible.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Accompagnement technique</p>
            <p className="text-gray-500">Nous assurons la mise en place, l&apos;accompagnement et la formation au besoin.</p>
          </div>
        </div>
      </section>
    </>
  );
}
