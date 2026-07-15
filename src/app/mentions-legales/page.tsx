import Link from "next/link";

export const metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site rmotion.fr : éditeur, directeur de la publication, hébergeur et propriété intellectuelle.",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">Mentions légales</h1>
      <p className="text-gray-400 text-sm mb-10">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>

      <div className="prose prose-gray max-w-none prose-headings:font-semibold">
        <p>
          Conformément à l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie
          numérique (LCEN), les informations suivantes sont portées à la connaissance des utilisateurs du site
          <strong> rmotion.fr</strong>.
        </p>

        <h2>Éditeur du site</h2>
        <p>
          Le site rmotion.fr est édité par Rmotion.
          <br />
          Raison sociale et forme juridique : [à compléter].
          <br />
          Capital social : [à compléter].
          <br />
          Siège social : [adresse à compléter].
          <br />
          Numéro SIREN / SIRET : [à compléter].
          <br />
          Immatriculation au RCS : [à compléter].
          <br />
          Numéro de TVA intracommunautaire : [à compléter].
          <br />
          Téléphone : +33 7 81 49 26 85.
          <br />
          Email : contact@rmotion.fr.
        </p>

        <h2>Directeur de la publication</h2>
        <p>[Nom du directeur de la publication à compléter].</p>

        <h2>Hébergeur</h2>
        <p>
          Le site est hébergé par Vercel Inc.
          <br />
          340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
          <br />
          Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>.
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus présents sur le site (textes, images, photographies, logos, marques, mise en page)
          est protégé par le droit de la propriété intellectuelle et demeure la propriété exclusive de Rmotion ou de ses
          partenaires. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable, est
          interdite.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Les modalités de collecte et de traitement des données personnelles sont détaillées dans notre{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>. Les conditions d&apos;utilisation du site
          figurent dans nos <Link href="/cgu">conditions générales d&apos;utilisation</Link>.
        </p>

        <h2>Contact</h2>
        <p>
          Pour toute question relative au site, vous pouvez nous contacter via la page{" "}
          <Link href="/contact">Contact</Link> ou par email à contact@rmotion.fr.
        </p>
      </div>
    </div>
  );
}
