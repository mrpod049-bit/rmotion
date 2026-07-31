import type { Locale } from "./config";

// Dictionnaire des textes d'interface (module pur : importable côté client et serveur).
const fr = {
  nav: {
    products: "Produits",
    project: "Votre projet",
    philosophy: "Notre philosophie",
    docs: "Documentation",
    quote: "Demander un devis",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    switchTo: "English",
  },
  hero: {
    eyebrow: "Machines laser & CNC",
    title: "Machines compétitives, pensées pour votre entreprise",
    subtitle:
      "Nous distribuons des machines outils laser & CNC, conçues par et pour des petites entreprises.",
    ctaCatalog: "Voir le catalogue",
    ctaQuote: "Demander un devis",
  },
  home: {
    rangeEyebrow: "Gamme",
    seeProducts: "Voir les produits →",
    ranges: {
      engraving: { label: "Gravure laser", desc: "Marquage précis sur métal, bois et plastiques" },
      milling: { label: "Fraisage & CNC", desc: "Usinage bois, alu et composites pour l'atelier" },
      project: { label: "Votre projet", desc: "Un besoin spécifique ? Construisons la solution ensemble" },
    },
    articlesTitle: "Comprendre les technologies",
    articlesText: "Types de lasers, quelle solution d'usinage choisir, consultez nos guides techniques",
    promise1Title: "Devis sur mesure",
    promise1Text:
      "Nous nous adaptons à vos contraintes techniques et budgétaires pour vous proposer la meilleure solution possible.",
    promise2Title: "Accompagnement technique",
    promise2Text: "Nous assurons la mise en place, l'accompagnement et la formation au besoin.",
  },
  footer: {
    tagline: "Machines outils Laser & CNC",
    desc: "Des machines laser fibre et centres d'usinage CNC compacts, industriels et à coût maîtrisé pour les PME et TPE.",
    navHeading: "Navigation",
    catalogue: "Catalogue",
    docs: "Documentation",
    quote: "Devis",
    contact: "Contact",
    discoverHeading: "Découvrir",
    yourProject: "Votre projet",
    philosophy: "Notre philosophie",
    engraving: "Gravure laser",
    milling: "Fraisage & CNC",
    contactHeading: "Contact",
    country: "France",
    rights: "Tous droits réservés",
    cgu: "CGU",
    privacy: "Politique de confidentialité",
    legal: "Mentions légales",
  },
  machines: {
    metaTitle: "Catalogue",
    metaDesc:
      "Machines laser fibre et centres d'usinage CNC compacts pour PME et TPE : gravure, découpe, fraisage. Solutions compétitives, devis sur mesure.",
    title: "Catalogue",
    subtitle:
      "Notre sélection de machines laser & CNC, sélectionnées par nos soins pour répondre à l'intégralité de vos besoins.",
    laserGroup: "Machines laser",
    cncGroup: "Machines CNC",
  },
  machine: {
    back: "← Retour au catalogue",
    description: "Description",
    quoteCta: "Demander un devis pour cette machine",
    warranty: "Garantie 1 an",
    stockLabel: "Stock :",
    stockValue: "Hors stock pour le moment",
    stockTail: "délai de livraison 45 / 60 jours",
    support: "SAV et référents techniques joignables de 8h à 17h du lundi au vendredi",
    options: "Options",
    specs: "Caractéristiques",
    notFound: "Produit introuvable",
    breadcrumbHome: "Accueil",
    breadcrumbCatalog: "Catalogue",
  },
  articles: {
    metaTitle: "Articles",
    metaDesc:
      "Guides techniques Rmotion : laser CO2 vs fibre, CNC bois ou métal, ROI d'une machine — pour bien choisir votre équipement laser ou CNC.",
    title: "Articles",
    subtitle: "Guides techniques et conseils pour choisir votre machine.",
    back: "← Retour aux articles",
    comingSoon: "Contenu à venir.",
    notFound: "Article introuvable",
    breadcrumbHome: "Accueil",
    breadcrumbArticles: "Articles",
  },
  contact: {
    metaTitle: "Contact",
    metaDesc:
      "Contactez Rmotion pour vos machines laser fibre et centres d'usinage CNC : questions techniques, disponibilités, accompagnement. Réponse rapide.",
    title: "Contact",
    subtitle: "Une question sur une machine, un projet ou une commande ? Écrivez-nous.",
    name: "Nom *",
    email: "Email *",
    subject: "Sujet",
    message: "Message *",
    send: "Envoyer",
    sending: "Envoi…",
    successTitle: "Message envoyé",
    successText: "Nous vous répondrons dans les meilleurs délais.",
    error: "Une erreur est survenue, veuillez réessayer.",
    directHeading: "Nous joindre directement",
  },
  devis: {
    metaTitle: "Demande de devis",
    metaDesc:
      "Demandez un devis sur mesure pour votre machine laser fibre ou centre d'usinage CNC. Configuration et budget adaptés à votre atelier, réponse sous 24h.",
    title: "Demande de devis",
    subtitle:
      "Remplissez ce formulaire et nous vous recontactons sous 24h avec une proposition adaptée à votre budget.",
    name: "Nom *",
    company: "Société",
    email: "Email *",
    phone: "Téléphone",
    machine: "Machine concernée",
    machinePlaceholder: "ex. LaserPro 6040 ou laissez vide",
    message: "Message *",
    messagePlaceholder: "Décrivez votre besoin, matériaux à travailler, volumes envisagés…",
    send: "Envoyer la demande",
    sending: "Envoi…",
    successTitle: "Demande envoyée",
    successText: "Nous vous recontacterons dans les 24h.",
    backHome: "← Retour à l'accueil",
    error: "Une erreur est survenue, veuillez réessayer.",
  },
  philosophie: {
    metaTitle: "Notre philosophie",
    metaDesc:
      "Compétitivité pour les petites entreprises : des machines laser et CNC compactes, industrielles et à coût maîtrisé.",
    eyebrow: "Notre philosophie",
    h1: "Notre mot d'ordre : compétitivité pour les petites entreprises",
    paragraphs: [
      "Nous sommes pleinement conscients des difficultés pour les petites entreprises d'investir dans des machines laser ou CNC.",
      "Même en forte croissance, les fonds sont souvent compliqués à mobiliser, la trésorerie manque, et les banques sont réticentes à financer le développement.",
      "Nous nous efforçons de proposer des solutions adaptées pour des capacitaires moyens, avec de vraies capacités industrielles, et un coût maîtrisé.",
      "Nous croyons de plus à la philosophie Desktop. Une machine n'a pas besoin d'être énorme et chère pour répondre à un besoin.",
      "Compactes, fonctionnelles, modulaires. Un entretien simplifié pour une disponibilité maximale.",
    ],
    supportHeading: "Accompagnement",
    support: [
      "Vous créez une activité ? Vous souhaitez développer une nouvelle branche ? Proposer un nouveau produit ? Vous n'avez pas les compétences en interne pour mettre en œuvre une machine outil ?",
      "Nous accordons une grande importance au suivi. Selon votre niveau de compétences, notre offre s'étend de l'achat simple à l'accompagnement clé en main jusqu'à la mise en production.",
      "Nous sommes en mesure de vous accompagner du devis à la mise en production, ceci grâce à des modules de formation adaptés à tous niveaux. Une ligne technique est également mise à votre disposition en cas de questions spécifiques.",
    ],
    warrantyHeading: "SAV et garantie",
    warranty: [
      "Parce que la fiabilité ne s'arrête pas au produit, nous stockons toutes les pièces détachées critiques en France, pour une disponibilité sous 48 heures.",
      "En cas de défaillance, notre conseiller technique est joignable en semaine de 8h à 18h. Des solutions de télédépannage et de diagnostic sont également proposées.",
      "Toutes nos machines sont garanties un an, toutes pièces incluses.",
    ],
  },
  projet: {
    metaTitle: "Votre projet",
    metaDesc:
      "De l'idée de départ à la mise en production : Rmotion vous accompagne pour vos machines sur mesure et applications spécifiques.",
    eyebrow: "Votre projet",
    h1: "Vous avez un projet ? Un besoin particulier ? Vous êtes spécialisés dans une activité ?",
    intro: [
      "Chez Rmotion, nous sommes en mesure de vous accompagner de l'idée de départ jusqu'à la mise en production.",
      "Nous sommes capables de modifier nos machines catalogue, mais également de vous accompagner dans une réalisation sur mesure.",
      "Nous pouvons également vous mettre en relation avec des fabricants spécialisés, pour des applications spécifiques.",
    ],
    stepsHeading: "Notre démarche, étape par étape",
    steps: [
      { title: "Définition du besoin", text: "À partir d'une simple idée, nous vous aidons à préciser les caractéristiques désirées." },
      { title: "Rédaction du CDC", text: "Nous nous chargeons de la réalisation du cahier des charges techniques." },
      { title: "Validation et concertation", text: "Nous discutons ensemble de la meilleure solution. Modification ? Réalisation sur dessin ? Sourcing ? Nous vous présentons nos options ainsi que les devis associés." },
      { title: "Réalisation", text: "Nous réalisons de manière autonome votre machine, dans le respect de votre budget et de vos contraintes." },
      { title: "Livraison, mise en production & suivi", text: "Nous vous livrons la machine complétée, ainsi que les cahiers de maintenance associés. Nous vous accompagnons dans le déploiement de la solution et l'intégration à votre production existante. Nous assurons également une garantie de 2 ans sur les machines sur mesure & spécifiques." },
    ],
    ctaTitle: "Un projet en tête ?",
    ctaText: "Parlons-en. Décrivez-nous votre besoin et nous reviendrons vers vous avec une proposition adaptée.",
    ctaButton: "Démarrer mon projet",
  },
} as const;

// Élargit les types littéraux (`"Produits"`) en `string` pour que le
// dictionnaire anglais n'ait pas à reproduire les valeurs françaises exactes.
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { readonly [K in keyof T]: Widen<T[K]> };
export type Dictionary = Widen<typeof fr>;

const en: Dictionary = {
  nav: {
    products: "Products",
    project: "Your project",
    philosophy: "Our philosophy",
    docs: "Documentation",
    quote: "Request a quote",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchTo: "Français",
  },
  hero: {
    eyebrow: "Laser & CNC machines",
    title: "Competitive machines, built for your business",
    subtitle:
      "We distribute laser & CNC machine tools, designed by and for small businesses.",
    ctaCatalog: "View the catalogue",
    ctaQuote: "Request a quote",
  },
  home: {
    rangeEyebrow: "Range",
    seeProducts: "View the products →",
    ranges: {
      engraving: { label: "Laser engraving", desc: "Precise marking on metal, wood and plastics" },
      milling: { label: "Milling & CNC", desc: "Machining wood, aluminium and composites for the workshop" },
      project: { label: "Your project", desc: "A specific need? Let's build the solution together" },
    },
    articlesTitle: "Understand the technologies",
    articlesText: "Laser types, which machining solution to choose — read our technical guides",
    promise1Title: "Tailored quotes",
    promise1Text:
      "We adapt to your technical and budget constraints to offer you the best possible solution.",
    promise2Title: "Technical support",
    promise2Text: "We handle installation, support and training as needed.",
  },
  footer: {
    tagline: "Laser & CNC machine tools",
    desc: "Compact, industrial and cost-controlled fiber laser machines and CNC machining centres for SMEs and small businesses.",
    navHeading: "Navigation",
    catalogue: "Catalogue",
    docs: "Documentation",
    quote: "Quote",
    contact: "Contact",
    discoverHeading: "Discover",
    yourProject: "Your project",
    philosophy: "Our philosophy",
    engraving: "Laser engraving",
    milling: "Milling & CNC",
    contactHeading: "Contact",
    country: "France",
    rights: "All rights reserved",
    cgu: "Terms of use",
    privacy: "Privacy policy",
    legal: "Legal notice",
  },
  machines: {
    metaTitle: "Catalogue",
    metaDesc:
      "Compact fiber laser machines and CNC machining centres for SMEs and small businesses: engraving, cutting, milling. Competitive solutions, tailored quotes.",
    title: "Catalogue",
    subtitle:
      "Our selection of laser & CNC machines, hand-picked to meet all your needs.",
    laserGroup: "Laser machines",
    cncGroup: "CNC machines",
  },
  machine: {
    back: "← Back to catalogue",
    description: "Description",
    quoteCta: "Request a quote for this machine",
    warranty: "1-year warranty",
    stockLabel: "Stock:",
    stockValue: "Currently out of stock",
    stockTail: "45–60 day lead time",
    support: "After-sales and technical support available 8am–5pm, Monday to Friday",
    options: "Options",
    specs: "Specifications",
    notFound: "Product not found",
    breadcrumbHome: "Home",
    breadcrumbCatalog: "Catalogue",
  },
  articles: {
    metaTitle: "Articles",
    metaDesc:
      "Rmotion technical guides: CO2 vs fiber laser, wood or metal CNC, machine ROI — to choose the right laser or CNC equipment.",
    title: "Articles",
    subtitle: "Technical guides and advice to choose your machine.",
    back: "← Back to articles",
    comingSoon: "Content coming soon.",
    notFound: "Article not found",
    breadcrumbHome: "Home",
    breadcrumbArticles: "Articles",
  },
  contact: {
    metaTitle: "Contact",
    metaDesc:
      "Contact Rmotion about your fiber laser machines and CNC machining centres: technical questions, availability, support. Quick reply.",
    title: "Contact",
    subtitle: "A question about a machine, a project or an order? Write to us.",
    name: "Name *",
    email: "Email *",
    subject: "Subject",
    message: "Message *",
    send: "Send",
    sending: "Sending…",
    successTitle: "Message sent",
    successText: "We'll get back to you as soon as possible.",
    error: "An error occurred, please try again.",
    directHeading: "Reach us directly",
  },
  devis: {
    metaTitle: "Quote request",
    metaDesc:
      "Request a tailored quote for your fiber laser machine or CNC machining centre. Configuration and budget suited to your workshop, reply within 24h.",
    title: "Quote request",
    subtitle:
      "Fill in this form and we'll get back to you within 24h with a proposal suited to your budget.",
    name: "Name *",
    company: "Company",
    email: "Email *",
    phone: "Phone",
    machine: "Machine of interest",
    machinePlaceholder: "e.g. LaserPro 6040 or leave blank",
    message: "Message *",
    messagePlaceholder: "Describe your need, materials to work, expected volumes…",
    send: "Send request",
    sending: "Sending…",
    successTitle: "Request sent",
    successText: "We'll get back to you within 24h.",
    backHome: "← Back to home",
    error: "An error occurred, please try again.",
  },
  philosophie: {
    metaTitle: "Our philosophy",
    metaDesc:
      "Competitiveness for small businesses: compact, industrial and cost-controlled laser and CNC machines.",
    eyebrow: "Our philosophy",
    h1: "Our watchword: competitiveness for small businesses",
    paragraphs: [
      "We are fully aware of how hard it is for small businesses to invest in laser or CNC machines.",
      "Even when growing fast, funds are often hard to raise, cash flow is tight, and banks are reluctant to finance development.",
      "We strive to offer solutions suited to mid-range capacity, with real industrial capability and a controlled cost.",
      "We also believe in the Desktop philosophy. A machine doesn't need to be huge and expensive to meet a need.",
      "Compact, functional, modular. Simplified maintenance for maximum uptime.",
    ],
    supportHeading: "Support",
    support: [
      "Starting a business? Looking to develop a new branch? Launch a new product? You don't have the in-house skills to operate a machine tool?",
      "We place great importance on follow-up. Depending on your skill level, our offer ranges from a simple purchase to turnkey support all the way to production.",
      "We can support you from quote to production, thanks to training modules suited to all levels. A technical hotline is also available for any specific questions.",
    ],
    warrantyHeading: "After-sales & warranty",
    warranty: [
      "Because reliability doesn't stop at the product, we stock all critical spare parts in France, for availability within 48 hours.",
      "In case of a failure, our technical advisor is reachable on weekdays from 8am to 6pm. Remote troubleshooting and diagnostic solutions are also available.",
      "All our machines are guaranteed for one year, all parts included.",
    ],
  },
  projet: {
    metaTitle: "Your project",
    metaDesc:
      "From the initial idea to production: Rmotion supports you for your custom machines and specific applications.",
    eyebrow: "Your project",
    h1: "Have a project? A particular need? Specialised in a specific activity?",
    intro: [
      "At Rmotion, we can support you from the initial idea all the way to production.",
      "We can modify our catalogue machines, but also support you on a fully custom build.",
      "We can also put you in touch with specialised manufacturers for specific applications.",
    ],
    stepsHeading: "Our approach, step by step",
    steps: [
      { title: "Defining the need", text: "From a simple idea, we help you specify the desired characteristics." },
      { title: "Writing the specifications", text: "We take care of drawing up the technical specifications." },
      { title: "Validation and consultation", text: "We discuss the best solution together. Modification? Build to drawing? Sourcing? We present our options along with the associated quotes." },
      { title: "Manufacturing", text: "We build your machine independently, respecting your budget and constraints." },
      { title: "Delivery, commissioning & follow-up", text: "We deliver the finished machine along with the associated maintenance manuals. We support you in deploying the solution and integrating it into your existing production. We also provide a 2-year warranty on custom & bespoke machines." },
    ],
    ctaTitle: "Have a project in mind?",
    ctaText: "Let's talk. Describe your need and we'll come back to you with a tailored proposal.",
    ctaButton: "Start my project",
  },
};

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
