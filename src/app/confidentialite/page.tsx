import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité du site rmotion.fr : données collectées, finalités, durée de conservation et vos droits (RGPD).",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">Politique de confidentialité</h1>
      <p className="text-gray-400 text-sm mb-10">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>

      <div className="prose prose-gray max-w-none prose-headings:font-semibold">
        <p>
          La présente politique décrit la manière dont Rmotion collecte, utilise et protège les données personnelles des
          utilisateurs du site <strong>rmotion.fr</strong>, conformément au Règlement général sur la protection des
          données (RGPD) et à la loi Informatique et Libertés.
        </p>

        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données est Rmotion.
          <br />
          Raison sociale et coordonnées : [à compléter].
          <br />
          Contact : via la page <Link href="/contact">Contact</Link> ou par email à contact@rmotion.fr.
        </p>

        <h2>2. Données collectées</h2>
        <p>Nous collectons les données que vous nous transmettez volontairement via nos formulaires :</p>
        <ul>
          <li><strong>Formulaire de contact</strong> : nom, adresse email, sujet, message.</li>
          <li><strong>Demande de devis</strong> : nom, société, adresse email, téléphone, machine concernée, message.</li>
        </ul>
        <p>
          Aucune donnée sensible n&apos;est demandée. Vous n&apos;êtes pas tenu de renseigner les champs facultatifs
          (société, téléphone).
        </p>

        <h2>3. Finalités et base légale</h2>
        <p>
          Vos données sont utilisées exclusivement pour <strong>traiter votre demande</strong> (réponse à un message,
          établissement d&apos;un devis) et vous <strong>recontacter</strong>. La base légale du traitement est votre
          consentement et/ou l&apos;intérêt légitime de Rmotion à répondre aux demandes commerciales.
        </p>

        <h2>4. Destinataires et sous-traitants</h2>
        <p>
          Vos données ne sont ni vendues, ni louées, ni cédées à des tiers à des fins commerciales. Elles sont traitées
          par Rmotion et par les prestataires techniques strictement nécessaires au fonctionnement du site :
        </p>
        <ul>
          <li><strong>Vercel Inc.</strong> — hébergement du site et mesure d&apos;audience (États-Unis).</li>
          <li><strong>Neon</strong> — hébergement de la base de données, en région Europe (Francfort).</li>
          <li><strong>Resend</strong> — envoi des emails de notification liés à vos demandes (États-Unis).</li>
        </ul>
        <p>
          Certains prestataires étant situés en dehors de l&apos;Union européenne, les transferts éventuels sont
          encadrés par des garanties appropriées (clauses contractuelles types de la Commission européenne).
        </p>

        <h2>5. Durée de conservation</h2>
        <p>
          Vos données sont conservées le temps nécessaire au traitement de votre demande, puis pendant une durée
          maximale de <strong>3 ans</strong> à compter de notre dernier contact, à des fins de suivi commercial. Passé ce
          délai, elles sont supprimées.
        </p>

        <h2>6. Cookies et mesure d&apos;audience</h2>
        <p>
          Le site utilise l&apos;outil de mesure d&apos;audience de Vercel, qui établit des statistiques de fréquentation
          <strong> anonymes</strong> (pages vues, provenance, type d&apos;appareil) sans déposer de cookie publicitaire ni
          permettre de vous identifier. Aucune donnée n&apos;est exploitée à des fins publicitaires.
        </p>

        <h2>7. Sécurité</h2>
        <p>
          Rmotion met en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données
          contre tout accès, altération ou divulgation non autorisés. Les échanges avec le site sont chiffrés (HTTPS).
        </p>

        <h2>8. Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
          limitation, d&apos;opposition et de portabilité de vos données. Vous pouvez exercer ces droits à tout moment en
          nous contactant via la page <Link href="/contact">Contact</Link> ou à l&apos;adresse contact@rmotion.fr.
        </p>
        <p>
          Vous disposez également du droit d&apos;introduire une réclamation auprès de la Commission Nationale de
          l&apos;Informatique et des Libertés (CNIL) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
        </p>

        <h2>9. Modifications</h2>
        <p>
          La présente politique peut être mise à jour à tout moment. La date de dernière mise à jour figure en haut de
          cette page.
        </p>
      </div>
    </div>
  );
}
