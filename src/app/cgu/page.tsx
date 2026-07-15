import Link from "next/link";

export const metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "Conditions générales d'utilisation du site rmotion.fr : accès au site, propriété intellectuelle, responsabilité, données personnelles.",
  alternates: { canonical: "/cgu" },
};

export default function CguPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">Conditions générales d&apos;utilisation</h1>
      <p className="text-gray-400 text-sm mb-10">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>

      <div className="prose prose-gray max-w-none prose-headings:font-semibold">
        <h2>Article 1 — Objet</h2>
        <p>
          Les présentes conditions générales d&apos;utilisation (ci-après « CGU ») ont pour objet de définir les modalités
          et conditions d&apos;accès et d&apos;utilisation du site <strong>rmotion.fr</strong> (ci-après « le Site »). Toute
          navigation sur le Site suppose l&apos;acceptation sans réserve des présentes CGU.
        </p>

        <h2>Article 2 — Éditeur du site</h2>
        <p>
          Le Site est édité par Rmotion.
          <br />
          Raison sociale, forme juridique et capital social : [à compléter].
          <br />
          Siège social : [adresse à compléter].
          <br />
          Numéro SIREN / SIRET : [à compléter].
          <br />
          Contact : <a href="/contact">contact@rmotion.fr</a>.
        </p>

        <h2>Article 3 — Hébergement</h2>
        <p>
          Le Site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
          (<a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>).
        </p>

        <h2>Article 4 — Accès au site</h2>
        <p>
          Le Site est accessible gratuitement à tout utilisateur disposant d&apos;un accès à Internet. Tous les coûts
          afférents à l&apos;accès au Site (matériel, logiciels, connexion) sont à la charge de l&apos;utilisateur. Rmotion
          s&apos;efforce d&apos;assurer un accès continu au Site mais ne saurait être tenue responsable en cas
          d&apos;indisponibilité, notamment pour des raisons de maintenance ou de force majeure.
        </p>

        <h2>Article 5 — Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments composant le Site (textes, images, photographies, logos, marques, mise en page,
          structure) est la propriété exclusive de Rmotion ou de ses partenaires, et est protégé par le droit de la
          propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation, totale ou
          partielle, sans autorisation écrite préalable de Rmotion, est interdite.
        </p>

        <h2>Article 6 — Responsabilité</h2>
        <p>
          Les informations diffusées sur le Site sont fournies à titre indicatif. Rmotion s&apos;efforce d&apos;en
          assurer l&apos;exactitude mais ne saurait garantir qu&apos;elles soient exhaustives, exactes ou à jour. Les
          caractéristiques techniques des produits présentés sont susceptibles d&apos;évoluer et ne constituent pas un
          engagement contractuel. Rmotion ne saurait être tenue responsable des dommages directs ou indirects résultant
          de l&apos;utilisation du Site.
        </p>

        <h2>Article 7 — Données personnelles</h2>
        <p>
          Les données transmises via les formulaires de contact et de demande de devis (nom, société, email, téléphone,
          message) sont utilisées uniquement pour traiter votre demande et vous recontacter. Elles ne sont ni cédées ni
          vendues à des tiers. Conformément au Règlement général sur la protection des données (RGPD), vous disposez
          d&apos;un droit d&apos;accès, de rectification et de suppression de vos données, que vous pouvez exercer en nous
          écrivant via la page <Link href="/contact">Contact</Link>.
        </p>

        <h2>Article 8 — Cookies et mesure d&apos;audience</h2>
        <p>
          Le Site utilise un outil de mesure d&apos;audience afin d&apos;établir des statistiques de fréquentation
          anonymes. Aucune donnée n&apos;est utilisée à des fins publicitaires.
        </p>

        <h2>Article 9 — Liens hypertextes</h2>
        <p>
          Le Site peut contenir des liens vers des sites tiers. Rmotion n&apos;exerce aucun contrôle sur ces sites et
          décline toute responsabilité quant à leur contenu.
        </p>

        <h2>Article 10 — Droit applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou à leur
          exécution relève des tribunaux français compétents.
        </p>
      </div>
    </div>
  );
}
