import Link from "next/link";

export const metadata = {
  title: "Votre projet — Rmotion",
  description:
    "De l'idée de départ à la mise en production : Rmotion vous accompagne pour vos machines sur mesure et applications spécifiques.",
};

const steps = [
  {
    title: "Définition du besoin",
    text: "À partir d’une simple idée, nous vous aidons à préciser les caractéristiques désirées.",
  },
  {
    title: "Rédaction du CDC",
    text: "Nous nous chargeons de la réalisation du cahier des charges techniques.",
  },
  {
    title: "Validation et concertation",
    text: "Nous discutons ensemble de la meilleure solution. Modification ? Réalisation sur dessin ? Sourcing ? Nous vous présentons nos options ainsi que les devis associés.",
  },
  {
    title: "Réalisation",
    text: "Nous réalisons de manière autonome votre machine, dans le respect de votre budget et de vos contraintes.",
  },
  {
    title: "Livraison, mise en production & suivi",
    text: "Nous vous livrons la machine complétée, ainsi que les cahiers de maintenance associés. Nous vous accompagnons dans le déploiement de la solution et l’intégration à votre production existante. Nous assurons également une garantie de 2 ans sur les machines sur mesure & spécifiques.",
  },
];

export default function ProjetPage() {
  return (
    <>
      {/* Intro */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-4">Votre projet</p>
          <h1 className="text-4xl font-semibold leading-tight mb-8">
            Vous avez un projet ? Un besoin particulier ? Vous êtes spécialisés dans une activité ?
          </h1>
          <div className="space-y-5 text-gray-200 text-lg leading-relaxed">
            <p>
              Chez Rmotion, nous sommes en mesure de vous accompagner de l’idée de départ jusqu’à la mise en production.
            </p>
            <p>
              Nous sommes en mesure de modifier nos machines catalogue, mais également de vous accompagner dans une réalisation sur mesure.
            </p>
            <p>
              Nous pouvons également vous mettre en relation avec des fabricants spécialisés, pour des applications spécifiques.
            </p>
          </div>
        </div>
      </section>

      {/* Étapes */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold mb-12">Notre démarche, étape par étape</h2>
        <ol className="space-y-10">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-6">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">
                {i + 1}
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Un projet en tête ?</h2>
          <p className="text-gray-600 mb-8">
            Parlons-en. Décrivez-nous votre besoin et nous reviendrons vers vous avec une proposition adaptée.
          </p>
          <Link
            href="/devis"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded font-medium hover:bg-gray-700 transition-colors"
          >
            Démarrer mon projet
          </Link>
        </div>
      </section>
    </>
  );
}
