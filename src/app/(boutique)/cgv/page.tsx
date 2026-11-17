import type { Metadata } from "next";
import { getSettings } from "@/lib/shop/core";

export const metadata: Metadata = { title: "Conditions générales de vente — boutique professionnelle" };

// ⚠️ PROJET de CGV B2B : trame reprenant les mentions obligatoires entre
// professionnels (art. L441-1 et suivants du Code de commerce). À faire relire
// et compléter (juridiction, garanties fabricant…) avant l'ouverture.
export default async function CgvPage() {
  const { company: c, net30_days } = await getSettings();
  const name = c.name || "Rmotion";
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 prose prose-sm">
      <h1>Conditions générales de vente — outils de coupe</h1>
      <p><em>Version applicable aux commandes passées sur la boutique en ligne.</em></p>
      <h2>1. Champ d&apos;application</h2>
      <p>Les présentes conditions régissent les ventes conclues entre {name}{c.siret && ` (SIRET ${c.siret})`} et ses clients <strong>professionnels</strong>. La boutique n&apos;est pas ouverte aux consommateurs. Toute commande implique l&apos;acceptation sans réserve des présentes conditions, qui prévalent sur les conditions d&apos;achat du client.</p>
      <h2>2. Compte client</h2>
      <p>L&apos;accès à la commande nécessite un compte professionnel validé par {name}, qui peut refuser ou suspendre un compte pour motif légitime.</p>
      <h2>3. Prix</h2>
      <p>Les prix sont exprimés en euros hors taxes, départ entrepôt. Les frais de port et la TVA applicable sont indiqués avant validation. Les ventes intracommunautaires à un assujetti identifié sont réalisées en exonération (autoliquidation, art. 283-2 du CGI) ; les exportations hors UE sont exonérées (art. 262 I du CGI).</p>
      <h2>4. Commande et disponibilité</h2>
      <p>La commande est ferme à la confirmation du paiement ou, pour les comptes bénéficiant d&apos;un paiement à terme, dès sa validation. Les stocks affichés sont mis à jour en temps réel ; en cas d&apos;indisponibilité exceptionnelle, le client est informé et remboursé des articles manquants.</p>
      <h2>5. Paiement</h2>
      <p>Paiement comptant en ligne (carte, prélèvement SEPA) ou, pour les comptes autorisés, par virement à {net30_days} jours date de facture. Conformément à l&apos;article L441-10 du Code de commerce, tout retard de paiement entraîne de plein droit des <strong>pénalités de retard égales à trois fois le taux d&apos;intérêt légal</strong> ainsi qu&apos;une <strong>indemnité forfaitaire pour frais de recouvrement de 40 €</strong>. Aucun escompte n&apos;est accordé pour paiement anticipé.</p>
      <h2>6. Livraison et transfert des risques</h2>
      <p>Les délais sont indicatifs. Les risques sont transférés au client à la remise au transporteur. Le client doit vérifier le colis à réception et formuler toute réserve auprès du transporteur, confirmée sous 3 jours (art. L133-3 du Code de commerce), et nous en informer sous 48 h.</p>
      <h2>7. Réserve de propriété</h2>
      <p>Les marchandises restent la propriété de {name} jusqu&apos;au paiement intégral du prix.</p>
      <h2>8. Retours</h2>
      <p>Les retours sont soumis à accord préalable, dans un délai de 15 jours après livraison, pour des produits neufs dans leur emballage d&apos;origine. Les produits non conformes ou défectueux sont remplacés ou remboursés. Un avoir est émis à réception et contrôle.</p>
      <h2>9. Garantie et responsabilité</h2>
      <p>Les outils sont couverts par la garantie légale des vices cachés. Le choix de l&apos;outil et des conditions de coupe relève de la responsabilité du client ; la responsabilité de {name} est limitée au prix des produits concernés.</p>
      <h2>10. Données personnelles</h2>
      <p>Les données collectées sont traitées pour la gestion des comptes et des commandes, conformément à notre politique de confidentialité.</p>
      <h2>11. Droit applicable</h2>
      <p>Droit français. Tout litige relève de la compétence exclusive du tribunal de commerce du siège de {name}.</p>
    </div>
  );
}
