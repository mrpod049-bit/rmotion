export const metadata = {
  title: "Notre philosophie",
  description:
    "Compétitivité pour les petites entreprises : des machines laser et CNC compactes, industrielles et à coût maîtrisé.",
};

const paragraphs = [
  "Nous sommes pleinement conscients des difficultés pour les petites entreprises d’investir dans des machines laser ou CNC.",
  "Même en forte croissance, les fonds sont souvent compliqués à mobiliser, la trésorerie manque, et les banques sont réticentes à financer le développement.",
  "Nous nous efforçons de proposer des solutions adaptées pour des capacitaires moyens, avec de vraies capacités industrielles, et un coût maîtrisé.",
  "Nous croyons de plus à la philosophie Desktop. Une machine n’a pas besoin d’être énorme et chère pour répondre à un besoin.",
  "Compactes, fonctionnelles, modulaires. Un entretien simplifié pour une disponibilité maximale.",
];

export default function PhilosophiePage() {
  return (
    <>
      {/* Intro */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-4">Notre philosophie</p>
          <h1 className="text-4xl font-semibold leading-tight">
            Notre mot d’ordre : compétitivité pour les petites entreprises
          </h1>
        </div>
      </section>

      {/* Texte */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
          {paragraphs.map((p, i) => (
            <div key={i}>
              <p>{p}</p>
              {i === 2 && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/philosophie-projet.jpg"
                  alt="Conception et planification d'un projet sur mesure"
                  className="w-full rounded-lg mt-8"
                />
              )}
            </div>
          ))}
        </div>

        {/* Accompagnement */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Accompagnement</h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              Vous créez une activité ? Vous souhaitez développer une nouvelle branche ? Proposer un nouveau produit ? Vous n’avez pas les compétences en interne pour mettre en œuvre une machine outil ?
            </p>
            <p>
              Nous accordons une grande importance au suivi. Selon votre niveau de compétences, notre offre s’étend de l’achat simple à l’accompagnement clé en main jusqu’à la mise en production.
            </p>
            <p>
              Nous sommes en mesure de vous accompagner du devis à la mise en production, ceci grâce à des modules de formation adaptés à tous niveaux. Une ligne technique est également mise à votre disposition en cas de questions spécifiques.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/philosophie-accompagnement.jpg"
            alt="Accompagnement et conseil technique"
            className="w-full rounded-lg mt-8"
          />
        </div>

        {/* SAV et garantie */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">SAV et garantie</h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              Parce que la fiabilité ne s’arrête pas au produit, nous stockons toutes les pièces détachées critiques en France, pour une disponibilité sous 48 heures.
            </p>
            <p>
              En cas de défaillance, notre conseiller technique est joignable en semaine de 8h à 18h. Des solutions de télédépannage et de diagnostic sont également proposées.
            </p>
            <p>
              Toutes nos machines sont garanties un an, toutes pièces incluses.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/philosophie-maintenance.jpg"
            alt="Maintenance et réparation d'une carte électronique"
            className="w-full rounded-lg mt-8"
          />
        </div>
      </section>
    </>
  );
}
