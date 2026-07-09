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
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>
    </>
  );
}
