import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type SupportedLanguage = 'da' | 'en' | 'fr' | 'de' | 'es' | 'zh' | 'ko' | 'nl' | 'pt';
export type LanguageSource = 'manual' | 'ip' | 'browser' | 'storage';

const LANGUAGE_STORAGE_KEY = 'computrade.language';
const LANGUAGE_SOURCE_STORAGE_KEY = 'computrade.language.source';
const LANGUAGE_DETECTION_ENDPOINT = '/api/i18n/language-detection';

export const supportedLanguages: Array<{ code: SupportedLanguage; name: string; nativeName: string }> = [
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
];

const enMessages = {
  common: {
    language: 'Language',
    chooseLanguageTitle: 'Choose your language',
    chooseLanguageSubtitle: 'Select the language that should be used across the website.',
    officialLanguage: 'Danish is the official website language.',
    translateTo: 'Translate to…',
    loading: 'Loading…',
    backToWebsite: 'Back to website',
    requestQuote: 'Request a quote',
    talkToTeam: 'Talk to our team',
    exploreSolutions: 'Explore solutions',
    learnMore: 'Learn more',
    readMore: 'Read more',
    contactUs: 'Contact us',
    close: 'Close',
    sendRequest: 'Send request',
    sendingRequest: 'Sending request…',
    required: 'Required',
    notProvided: 'Not provided',
    privacy: 'Privacy',
    terms: 'Terms',
    allRightsReserved: 'All rights reserved',
  },
  nav: {
    about: 'About',
    solutions: 'Solutions',
    marketplace: 'Marketplace',
    industries: 'Industries',
    insights: 'Insights',
  },
  hero: {
    eyebrow: 'Technology, with perspective',
    title: 'Infrastructure for the work ahead.',
    description: 'CompuTrade helps ambitious organisations make technology dependable — from core infrastructure and cloud to the devices that keep people moving.',
    featureOne: 'Danish-led delivery',
    featureTwo: 'Enterprise-ready',
    featureThree: 'Human support',
    whatsapp: 'Chat on WhatsApp',
  },
    about: {
      eyebrow: 'A partner, not a portal',
      title: 'Technology should make good work feel easier.',
      description: 'We bring together specialist knowledge, reliable sourcing and a practical understanding of your organisation. The result is a technology partner who can see the whole picture — and still care about the detail.',
      highlight: 'Clarity before complexity.',
      highlightText: 'We recommend what fits your context, not what fills a catalogue.',
      readStory: 'Read our story',
      homeLabel: 'Our story is temporarily unavailable.',
      homeDescription: 'Please try again in a moment.',
      loadingStory: 'Loading our story…',
    },
    solutions: {
      eyebrow: 'What we solve',
      title: 'The right layer of expertise, at the right moment.',
      discussSetup: 'Discuss your setup',
      infrastructureTitle: 'Infrastructure & networking',
      infrastructureText: 'Resilient foundations for the places your people and systems depend on.',
      cloudTitle: 'Cloud & workplace',
      cloudText: 'Flexible cloud environments and modern workplaces, built around the way teams operate.',
      securityTitle: 'Cybersecurity',
      securityText: 'Practical protection, clear governance and a security posture that keeps pace.',
      dataTitle: 'Data centre & storage',
      dataText: 'Scalable compute and storage designed for continuity, performance and control.',
      managedTitle: 'Managed services',
      managedText: 'A calm, accountable partner for monitoring, support and the next right decision.',
      hardwareTitle: 'Hardware supply',
      hardwareText: 'Business-ready devices and components, sourced through a trusted global network.',
    },
    marketplace: {
      eyebrow: 'A separate buying experience',
      title: 'Source the right technology, without the noise.',
      description: 'Browse a focused selection from our marketplace, then request a considered quote from the CompuTrade team.',
      openMarketplace: 'Enter the marketplace',
      loadingProducts: 'Loading marketplace products…',
      unavailableTitle: 'The catalogue is temporarily unavailable.',
      unavailableDescription: 'Visit the marketplace to try again in a moment.',
      emptyTitle: 'The catalogue is being curated.',
      emptyDescription: 'Check back soon for the latest available technology.',
      searchPlaceholder: 'Search products, brands or categories',
      homepageTitle: 'CompuTrade marketplace',
      homepageDescription: 'A focused B2B catalogue for organisations that need dependable hardware, infrastructure and security technology — with a real conversation behind every quote.',
      curatedTitle: 'Curated catalogue',
      curatedDescription: 'A focused selection of dependable hardware, infrastructure and security technology for modern organisations.',
      allProducts: 'All products',
      requestQuote: 'Request quote',
      loading: 'Loading…',
      noProducts: 'No products match this filter yet.',
    },
    industries: {
      eyebrow: 'Context matters',
      title: 'Built for the real world.',
      description: 'Every industry has a different definition of critical. We start there — with the operational pressures, regulation and ambitions specific to your organisation.',
      findStartingPoint: 'Find your starting point',
      publicSector: 'Public sector',
      publicSectorText: 'Technology that earns trust, from procurement to daily service delivery.',
      education: 'Education',
      educationText: 'Secure, accessible digital foundations for learning communities.',
      manufacturing: 'Manufacturing',
      manufacturingText: 'Connect operations, data and people without slowing the line down.',
      finance: 'Financial services',
      financeText: 'Infrastructure where resilience, compliance and confidence meet.',
    },
    proof: {
      eyebrow: 'Proof in practice',
      title: 'Reliable is a result.',
      previousCase: 'Previous case study',
      nextCase: 'Next case study',
      publicSectorTag: 'Public sector · Infrastructure',
      publicSectorTitle: 'A stable foundation for 18,000 daily users.',
      publicSectorText: 'We helped a Danish public organisation consolidate its network and endpoint environment — reducing complexity without disrupting the services people rely on.',
      publicSectorResult: '31% fewer critical incidents',
      publicSectorQuote: 'CompuTrade took the time to understand the environment before proposing a direction. That made the implementation feel controlled from day one.',
      publicSectorPerson: 'Maja Sørensen',
      publicSectorRole: 'IT Operations Lead',
      manufacturingTag: 'Manufacturing · Workplace',
      manufacturingTitle: 'One workplace, across three production sites.',
      manufacturingText: 'A phased device and identity programme gave teams a consistent, secure experience — from the design office to the factory floor.',
      manufacturingResult: '3 sites, one operating model',
      manufacturingQuote: 'They made a complex change feel remarkably human. We always knew what was happening and why.',
      manufacturingPerson: 'Lars Nygaard',
      manufacturingRole: 'Digital Workplace Manager',
    },
    insights: {
      eyebrow: 'Notes from the field',
      title: 'Useful thinking, no theatre.',
      allInsights: 'All insights',
      operationsTag: 'OPERATIONS',
      operationsTitle: 'The quiet advantage of a well-designed IT estate',
      operationsText: 'Why resilient infrastructure is less about the biggest specification — and more about the right decisions, made consistently.',
      operationsRead: '6 min read',
      securityTag: 'SECURITY',
      securityTitle: 'Three questions to ask before your next cloud move',
      securityText: 'A practical conversation starter for procurement, IT and leadership teams navigating the next phase of cloud.',
      securityRead: '4 min read',
      perspectiveTag: 'PERSPECTIVE',
      perspectiveTitle: 'What “managed” should mean in 2025',
      perspectiveText: 'Support is not a ticket queue. It is a shared understanding of what good looks like when systems matter.',
      perspectiveRead: '5 min read',
      readPerspective: 'Read perspective',
    },
    contact: {
      eyebrow: 'Start a conversation',
      title: 'Ready for a more considered technology partner?',
      description: 'Bring us a challenge, a rough idea or a procurement brief. We’ll help you find the clearest next step.',
      companyTitle: 'CompuTrade Denmark ApS',
      companyDescription: 'For sales, sourcing or a second opinion on your next technology decision.',
      basedIn: 'Based in',
      responseTime: 'Response time',
      timezone: 'Denmark · EU delivery',
      responseValue: 'Within one business day',
    },
    footer: {
      explore: 'Explore',
      forYou: 'For you',
      contact: 'Contact',
      aboutUs: 'About us',
      solutions: 'Solutions',
      marketplace: 'Marketplace',
      industries: 'Industries',
      caseStudies: 'Case studies',
      insights: 'Insights',
      talkToTeam: 'Talk to our team',
      description: 'Enterprise technology, sourced with perspective and delivered with care.',
      companyLine: 'Denmark · EU delivery',
    },
    quote: {
      eyebrow: 'A clear next step',
      title: 'Let’s talk technology.',
      description: 'Tell us what you are planning. We’ll connect you with the right specialist — no sales script, just a useful conversation.',
      descriptionWithProduct: 'Tell us what you need for {product}. We’ll come back with availability, options and a considered recommendation.',
      successTitle: 'We have your request.',
      successDescription: 'A CompuTrade specialist will get back to you within one business day.',
      name: 'Name',
      workEmail: 'Work email',
      company: 'Company',
      phone: 'Phone',
      productService: 'Product/service',
      quantity: 'Quantity',
      messageLabel: 'What can we help with?',
      messagePlaceholder: 'A few words about your project, timeline or product needs…',
      consent: 'By sending this form, you agree that we may contact you about your request.',
      closeButton: 'Back to website',
      error: 'We could not submit your request right now.',
      placeholderName: 'Your name',
      placeholderEmail: 'name@company.dk',
      placeholderCompany: 'Company name',
      placeholderPhone: '+45 1234 5678',
      submit: 'Send request',
      sending: 'Sending request…',
      closeForm: 'Close quote form',
      productPlaceholder: 'General inquiry',
      serviceLabel: 'A clear next step',
    },
    admin: {
      loading: 'Checking admin access…',
      backToWebsite: 'Back to website',
      signInTitle: 'Sign in to continue.',
      signInDescription: 'Enter the administrator password to manage website settings.',
      password: 'Password',
      signIn: 'Sign in',
      signingIn: 'Signing in…',
      logout: 'Log out',
      manageTitle: 'Keep your contact channels current.',
      manageDescription: 'Configure the WhatsApp number shown in the floating contact button across the public website and marketplace.',
    },
  };

const messages = { en: enMessages,
  fr: {
    common: {
      language: 'Langue',
      translateTo: 'Traduire en…',
      loading: 'Chargement…',
      backToWebsite: 'Retour au site',
      requestQuote: 'Demander un devis',
      talkToTeam: 'Parler à notre équipe',
      exploreSolutions: 'Explorer les solutions',
      learnMore: 'En savoir plus',
      readMore: 'Lire la suite',
      contactUs: 'Nous contacter',
      close: 'Fermer',
      sendRequest: 'Envoyer la demande',
      sendingRequest: 'Envoi en cours…',
      required: 'Requis',
      notProvided: 'Non fourni',
      privacy: 'Confidentialité',
      terms: 'Conditions',
      allRightsReserved: 'Tous droits réservés',
    },
    nav: {
      about: 'À propos',
      solutions: 'Solutions',
      marketplace: 'Marché',
      industries: 'Secteurs',
      insights: 'Perspectives',
    },
    hero: {
      eyebrow: 'Une technologie avec perspective',
      title: 'L’infrastructure pour le travail à venir.',
      description: 'CompuTrade aide les organisations ambitieuses à rendre la technologie fiable, de l’infrastructure de base au cloud et aux appareils qui permettent aux équipes de travailler.',
      featureOne: 'Livraison dirigée par le Danemark',
      featureTwo: 'Prêt pour l’entreprise',
      featureThree: 'Support humain',
      whatsapp: 'Discuter sur WhatsApp',
    },
    about: {
      eyebrow: 'Un partenaire, pas un portail',
      title: 'La technologie devrait rendre le travail sérieux plus simple.',
      description: 'Nous réunissons des expertises spécialisées, un sourcing fiable et une compréhension concrète de votre organisation. Le résultat est un partenaire technologique qui voit l’ensemble du tableau tout en restant attentif aux détails.',
      highlight: 'La clarté avant la complexité.',
      highlightText: 'Nous recommandons ce qui convient à votre contexte, pas ce qui remplit un catalogue.',
      readStory: 'Lire notre histoire',
      homeLabel: 'Notre histoire est temporairement indisponible.',
      homeDescription: 'Veuillez réessayer dans un instant.',
      loadingStory: 'Chargement de notre histoire…',
    },
    solutions: {
      eyebrow: 'Ce que nous résolvons',
      title: 'Le bon niveau d’expertise, au bon moment.',
      discussSetup: 'Discuter de votre environnement',
      infrastructureTitle: 'Infrastructure & réseaux',
      infrastructureText: 'Des fondations résilientes pour les espaces sur lesquels vos équipes et vos systèmes dépendent.',
      cloudTitle: 'Cloud & environnement de travail',
      cloudText: 'Des environnements cloud flexibles et des espaces de travail modernes, conçus autour de la façon dont les équipes travaillent.',
      securityTitle: 'Cybersécurité',
      securityText: 'Une protection pragmatique, une gouvernance claire et une posture de sécurité à la hauteur du défi.',
      dataTitle: 'Centre de données & stockage',
      dataText: 'Des ressources de calcul et de stockage évolutives, conçues pour la continuité, la performance et le contrôle.',
      managedTitle: 'Services gérés',
      managedText: 'Un partenaire calme et responsable pour le monitoring, le support et les bonnes décisions à venir.',
      hardwareTitle: 'Approvisionnement matériel',
      hardwareText: 'Des appareils et composants prêts pour l’entreprise, fournis via un réseau mondial de confiance.',
    },
    marketplace: {
      eyebrow: 'Une expérience d’achat distincte',
      title: 'Sélectionner la bonne technologie, sans le bruit.',
      description: 'Parcourez une sélection ciblée de notre marketplace, puis demandez un devis réfléchi à l’équipe CompuTrade.',
      openMarketplace: 'Ouvrir la marketplace',
      loadingProducts: 'Chargement des produits…',
      unavailableTitle: 'Le catalogue est temporairement indisponible.',
      unavailableDescription: 'Retentez votre visite dans un instant.',
      emptyTitle: 'Le catalogue est en cours de préparation.',
      emptyDescription: 'Revenez bientôt pour découvrir les dernières technologies disponibles.',
      searchPlaceholder: 'Rechercher des produits, marques ou catégories',
      homepageTitle: 'CompuTrade marketplace',
      homepageDescription: 'Un catalogue B2B ciblé pour les organisations qui ont besoin d’une technologie fiable, avec une vraie conversation derrière chaque devis.',
      curatedTitle: 'Catalogue sélectionné',
      curatedDescription: 'Une sélection ciblée de matériel, d’infrastructure et de technologie de sécurité fiables pour les organisations modernes.',
      allProducts: 'Tous les produits',
      requestQuote: 'Demander un devis',
      loading: 'Chargement…',
      noProducts: 'Aucun produit ne correspond encore à ce filtre.',
    },
    industries: {
      eyebrow: 'Le contexte compte',
      title: 'Conçu pour le monde réel.',
      description: 'Chaque secteur a une définition différente de la criticité. Nous commençons par là, avec les pressions opérationnelles, la réglementation et les ambitions propres à votre organisation.',
      findStartingPoint: 'Trouver votre point de départ',
      publicSector: 'Secteur public',
      publicSectorText: 'Une technologie qui inspire la confiance, du processus d’achat à la livraison quotidienne.',
      education: 'Éducation',
      educationText: 'Des fondations numériques sûres et accessibles pour les communautés d’apprentissage.',
      manufacturing: 'Industrie',
      manufacturingText: 'Relier opérations, données et personnes sans ralentir la ligne.',
      finance: 'Services financiers',
      financeText: 'Une infrastructure où résilience, conformité et confiance se rencontrent.',
    },
    proof: {
      eyebrow: 'Des preuves concrètes',
      title: 'La fiabilité est un résultat.',
      previousCase: 'Étude précédente',
      nextCase: 'Étude suivante',
      publicSectorTag: 'Secteur public · Infrastructure',
      publicSectorTitle: 'Une base stable pour 18 000 utilisateurs quotidiens.',
      publicSectorText: 'Nous avons aidé une organisation publique danoise à consolider son réseau et son environnement de terminaux, réduisant la complexité sans perturber les services dont les personnes dépendent.',
      publicSectorResult: '31 % d’incidents critiques en moins',
      publicSectorQuote: 'CompuTrade a pris le temps de comprendre l’environnement avant de proposer une direction. Cela a donné un sentiment de contrôle dès le premier jour.',
      publicSectorPerson: 'Maja Sørensen',
      publicSectorRole: 'Responsable des opérations IT',
      manufacturingTag: 'Industrie · Poste de travail',
      manufacturingTitle: 'Un environnement de travail pour trois sites de production.',
      manufacturingText: 'Un programme progressif d’appareils et d’identité a permis aux équipes de bénéficier d’une expérience cohérente et sécurisée, du bureau de design à l’atelier.',
      manufacturingResult: '3 sites, un seul modèle opérationnel',
      manufacturingQuote: 'Ils ont rendu un changement complexe remarquablement humain. Nous savions toujours ce qui se passait et pourquoi.',
      manufacturingPerson: 'Lars Nygaard',
      manufacturingRole: 'Responsable du Digital Workplace',
    },
    insights: {
      eyebrow: 'Notes de terrain',
      title: 'Une pensée utile, sans théâtre.',
      allInsights: 'Toutes les perspectives',
      operationsTag: 'OPÉRATIONS',
      operationsTitle: 'L’avantage discret d’un estate IT bien conçu',
      operationsText: 'Pourquoi une infrastructure résiliente dépend moins de la spécification la plus importante que des bonnes décisions prises de façon cohérente.',
      operationsRead: '6 min de lecture',
      securityTag: 'SÉCURITÉ',
      securityTitle: 'Trois questions à poser avant votre prochain mouvement cloud',
      securityText: 'Un bon point de départ pour les équipes d’achats, IT et direction qui abordent la prochaine phase du cloud.',
      securityRead: '4 min de lecture',
      perspectiveTag: 'PERSPECTIVE',
      perspectiveTitle: 'Ce que « géré » devrait signifier en 2025',
      perspectiveText: 'Le support ne se résume pas à une file de tickets. C’est une compréhension partagée de ce que signifie bien faire quand les systèmes comptent.',
      perspectiveRead: '5 min de lecture',
      readPerspective: 'Lire la perspective',
    },
    contact: {
      eyebrow: 'Démarrer une conversation',
      title: 'Prêt à travailler avec un partenaire technologique plus réfléchi ?',
      description: 'Apportez-nous un défi, une idée approximative ou un brief d’achat. Nous vous aiderons à trouver la meilleure prochaine étape.',
      companyTitle: 'CompuTrade Denmark ApS',
      companyDescription: 'Pour les ventes, l’approvisionnement ou un deuxième avis sur votre prochaine décision technologique.',
      basedIn: 'Basé à',
      responseTime: 'Temps de réponse',
      timezone: 'Danemark · livraison UE',
      responseValue: 'Dans un délai d’une journée ouvrable',
    },
    footer: {
      explore: 'Explorer',
      forYou: 'Pour vous',
      contact: 'Contact',
      aboutUs: 'À propos',
      solutions: 'Solutions',
      marketplace: 'Marketplace',
      industries: 'Secteurs',
      caseStudies: 'Études de cas',
      insights: 'Perspectives',
      talkToTeam: 'Parler à notre équipe',
      description: 'Technologie d’entreprise, sélectionnée avec perspective et livrée avec soin.',
      companyLine: 'Danemark · livraison UE',
    },
    quote: {
      eyebrow: 'Une étape claire',
      title: 'Parlons technologie.',
      description: 'Dites-nous ce que vous avez en tête. Nous vous mettrons en contact avec le bon spécialiste — sans script de vente, juste une conversation utile.',
      descriptionWithProduct: 'Dites-nous ce dont vous avez besoin pour {product}. Nous reviendrons avec des options, des disponibilités et une recommandation réfléchie.',
      successTitle: 'Nous avons bien reçu votre demande.',
      successDescription: 'Un spécialiste CompuTrade vous reviendra dans un délai d’une journée ouvrable.',
      name: 'Nom',
      workEmail: 'Email professionnel',
      company: 'Entreprise',
      phone: 'Téléphone',
      productService: 'Produit/service',
      quantity: 'Quantité',
      messageLabel: 'Que pouvons-nous aider à faire ?',
      messagePlaceholder: 'Quelques mots sur votre projet, votre délai ou vos besoins…',
      consent: 'En envoyant ce formulaire, vous acceptez que nous vous contactions à propos de votre demande.',
      closeButton: 'Retour au site',
      error: 'Nous n’avons pas pu soumettre votre demande pour le moment.',
      placeholderName: 'Votre nom',
      placeholderEmail: 'nom@entreprise.dk',
      placeholderCompany: 'Nom de l’entreprise',
      placeholderPhone: '+45 1234 5678',
      submit: 'Envoyer la demande',
      sending: 'Envoi en cours…',
      closeForm: 'Fermer le formulaire',
      productPlaceholder: 'Demande générale',
      serviceLabel: 'Une étape claire',
    },
    admin: {
      loading: 'Vérification de l’accès administrateur…',
      backToWebsite: 'Retour au site',
      signInTitle: 'Connectez-vous pour continuer.',
      signInDescription: 'Entrez le mot de passe administrateur pour gérer les paramètres du site.',
      password: 'Mot de passe',
      signIn: 'Connexion',
      signingIn: 'Connexion…',
      logout: 'Déconnexion',
      manageTitle: 'Gardez vos canaux de contact à jour.',
      manageDescription: 'Configurez le numéro WhatsApp affiché dans le bouton de contact flottant sur le site public et la marketplace.',
    },
  },
  de: {
    common: {
      language: 'Sprache',
      translateTo: 'Übersetzen in…',
      loading: 'Wird geladen…',
      backToWebsite: 'Zurück zur Website',
      requestQuote: 'Angebot anfragen',
      talkToTeam: 'Mit unserem Team sprechen',
      exploreSolutions: 'Lösungen entdecken',
      learnMore: 'Mehr erfahren',
      readMore: 'Weiterlesen',
      contactUs: 'Kontakt aufnehmen',
      close: 'Schließen',
      sendRequest: 'Anfrage senden',
      sendingRequest: 'Anfrage wird gesendet…',
      required: 'Erforderlich',
      notProvided: 'Nicht angegeben',
      privacy: 'Datenschutz',
      terms: 'AGB',
      allRightsReserved: 'Alle Rechte vorbehalten',
    },
    nav: {
      about: 'Über uns',
      solutions: 'Lösungen',
      marketplace: 'Marktplatz',
      industries: 'Branchen',
      insights: 'Einblicke',
    },
    hero: {
      eyebrow: 'Technologie mit Perspektive',
      title: 'Infrastruktur für die Arbeit von morgen.',
      description: 'CompuTrade hilft ambitionierten Organisationen, Technologie zuverlässig zu machen — von der Kerninfrastruktur und Cloud bis hin zu den Geräten, die Menschen bei der Arbeit unterstützen.',
      featureOne: 'Dänisch geführte Lieferung',
      featureTwo: 'Unternehmensbereit',
      featureThree: 'Menschlicher Support',
      whatsapp: 'Auf WhatsApp chatten',
    },
    about: {
      eyebrow: 'Ein Partner, kein Portal',
      title: 'Technologie sollte gute Arbeit einfacher machen.',
      description: 'Wir bringen Spezialwissen, zuverlässige Beschaffung und ein pragmatisches Verständnis Ihrer Organisation zusammen. Das Ergebnis ist ein technischer Partner, der das Gesamtbild sieht und dennoch die Details nicht vergisst.',
      highlight: 'Klarheit vor Komplexität.',
      highlightText: 'Wir empfehlen, was zu Ihrem Kontext passt, nicht was einen Katalog füllt.',
      readStory: 'Unsere Geschichte lesen',
      homeLabel: 'Unsere Geschichte ist vorübergehend nicht verfügbar.',
      homeDescription: 'Bitte versuchen Sie es gleich noch einmal.',
      loadingStory: 'Unsere Geschichte wird geladen…',
    },
    solutions: {
      eyebrow: 'Was wir lösen',
      title: 'Die richtige Expertise zum richtigen Zeitpunkt.',
      discussSetup: 'Ihr Setup besprechen',
      infrastructureTitle: 'Infrastruktur & Netzwerke',
      infrastructureText: 'Widerstandsfähige Grundlagen für die Orte, von denen Ihre Menschen und Systeme abhängen.',
      cloudTitle: 'Cloud & Arbeitsplatz',
      cloudText: 'Flexible Cloud-Umgebungen und moderne Arbeitsplätze, die rund um die Art der Zusammenarbeit aufgebaut sind.',
      securityTitle: 'Cybersicherheit',
      securityText: 'Pragmatischer Schutz, klare Governance und eine Sicherheitslage, die mit dem Tempo mitzieht.',
      dataTitle: 'Rechenzentrum & Storage',
      dataText: 'Skalierbare Rechen- und Speicherlösungen für Kontinuität, Performance und Kontrolle.',
      managedTitle: 'Managed Services',
      managedText: 'Ein ruhiger, verantwortlicher Partner für Monitoring, Support und die nächste richtige Entscheidung.',
      hardwareTitle: 'Hardware-Beschaffung',
      hardwareText: 'Unternehmensgerechte Geräte und Komponenten aus einem vertrauenswürdigen globalen Netzwerk.',
    },
    marketplace: {
      eyebrow: 'Eine separate Einkaufserfahrung',
      title: 'Die richtige Technologie ohne Lärm beschaffen.',
      description: 'Durchstöbern Sie eine fokussierte Auswahl aus unserem Marktplatz und beantragen Sie danach ein durchdachtes Angebot vom CompuTrade-Team.',
      openMarketplace: 'Zum Marktplatz',
      loadingProducts: 'Marktplatz-Produkte werden geladen…',
      unavailableTitle: 'Der Katalog ist vorübergehend nicht verfügbar.',
      unavailableDescription: 'Bitte versuchen Sie es später noch einmal.',
      emptyTitle: 'Der Katalog wird gerade zusammengestellt.',
      emptyDescription: 'Schauen Sie bald wieder vorbei für die neuesten verfügbaren Technologien.',
      searchPlaceholder: 'Produkte, Marken oder Kategorien suchen',
      homepageTitle: 'CompuTrade Marktplatz',
      homepageDescription: 'Ein fokussierter B2B-Katalog für Organisationen, die verlässliche Hardware, Infrastruktur und Sicherheitstechnologie brauchen.',
      curatedTitle: 'Kuratiert',
      curatedDescription: 'Eine fokussierte Auswahl an verlässlicher Hardware, Infrastruktur und Sicherheitstechnologie für moderne Organisationen.',
      allProducts: 'Alle Produkte',
      requestQuote: 'Angebot anfragen',
      loading: 'Wird geladen…',
      noProducts: 'Keine Produkte passen derzeit zu diesem Filter.',
    },
    industries: {
      eyebrow: 'Der Kontext zählt',
      title: 'Für die reale Welt gebaut.',
      description: 'Jede Branche hat ein anderes Verständnis von Kritikalität. Wir gehen genau dort an den Start — mit den betrieblichen Anforderungen, Vorgaben und Ambitionen Ihrer Organisation.',
      findStartingPoint: 'Ihren Startpunkt finden',
      publicSector: 'Öffentlicher Sektor',
      publicSectorText: 'Technologie, die Vertrauen schafft — von der Beschaffung bis zur täglichen Servicebereitstellung.',
      education: 'Bildung',
      educationText: 'Sichere, zugängliche digitale Grundlagen für Lerncommunities.',
      manufacturing: 'Produktion',
      manufacturingText: 'Verbindungen zwischen Betrieb, Daten und Menschen ohne die Linie zu verlangsamen.',
      finance: 'Finanzdienstleistungen',
      financeText: 'Infrastruktur, in der Widerstandsfähigkeit, Compliance und Vertrauen zusammenkommen.',
    },
    proof: {
      eyebrow: 'Belege in der Praxis',
      title: 'Zuverlässigkeit ist ein Ergebnis.',
      previousCase: 'Vorherige Fallstudie',
      nextCase: 'Nächste Fallstudie',
      publicSectorTag: 'Öffentlicher Sektor · Infrastruktur',
      publicSectorTitle: 'Eine stabile Basis für 18.000 tägliche Nutzer.',
      publicSectorText: 'Wir halfen einer dänischen öffentlichen Organisation dabei, Netzwerk und Endgeräteumgebung zu konsolidieren — ohne die von Menschen abhängigen Services zu stören.',
      publicSectorResult: '31 % weniger kritische Vorfälle',
      publicSectorQuote: 'CompuTrade hat sich Zeit genommen, die Umgebung zu verstehen, bevor wir eine Richtung vorgeschlagen haben. Das hat die Umsetzung von Anfang an kontrolliert wirken lassen.',
      publicSectorPerson: 'Maja Sørensen',
      publicSectorRole: 'Leitung IT-Betrieb',
      manufacturingTag: 'Produktion · Arbeitsplatz',
      manufacturingTitle: 'Ein Arbeitsplatz, über drei Produktionsstandorte hinweg.',
      manufacturingText: 'Ein schrittweises Gerät- und Identitätsprogramm gab Teams eine konsistente, sichere Erfahrung — vom Designbüro bis zur Fabrikhalle.',
      manufacturingResult: '3 Standorte, ein Betriebsmodell',
      manufacturingQuote: 'Sie haben eine komplexe Veränderung erstaunlich menschlich gemacht. Wir wussten immer, was passierte und warum.',
      manufacturingPerson: 'Lars Nygaard',
      manufacturingRole: 'Leitung Digital Workplace',
    },
    insights: {
      eyebrow: 'Notizen aus dem Feld',
      title: 'Nützliches Denken, ohne Theater.',
      allInsights: 'Alle Einblicke',
      operationsTag: 'BETRIEB',
      operationsTitle: 'Der stille Vorteil eines gut geplanten IT-Estates',
      operationsText: 'Warum belastbare Infrastruktur weniger von der größten Spezifikation als von den richtigen Entscheidungen abhängt.',
      operationsRead: '6-Minuten-Lesung',
      securityTag: 'SICHERHEIT',
      securityTitle: 'Drei Fragen vor dem nächsten Cloud-Schritt',
      securityText: 'Ein praktischer Gesprächsstart für Beschaffung, IT und Führungskräfte bei der nächsten Cloud-Phase.',
      securityRead: '4-Minuten-Lesung',
      perspectiveTag: 'PERSPEKTIVE',
      perspectiveTitle: 'Was “gemanaged” im Jahr 2025 bedeuten sollte',
      perspectiveText: 'Support ist keine Ticket-Warteschlange. Es ist ein gemeinsames Verständnis davon, was gutes Arbeiten ausmacht, wenn Systeme wichtig werden.',
      perspectiveRead: '5-Minuten-Lesung',
      readPerspective: 'Perspektive lesen',
    },
    contact: {
      eyebrow: 'Ein Gespräch starten',
      title: 'Bereit für einen überlegteren Technologiepartner?',
      description: 'Bringen Sie uns eine Herausforderung, eine grobe Idee oder einen Beschaffungsbrief mit. Wir helfen Ihnen, den klarsten nächsten Schritt zu finden.',
      companyTitle: 'CompuTrade Denmark ApS',
      companyDescription: 'Für Vertrieb, Beschaffung oder eine zweite Einschätzung bei Ihrer nächsten Technologieentscheidung.',
      basedIn: 'Basierend in',
      responseTime: 'Antwortzeit',
      timezone: 'Dänemark · EU-Lieferung',
      responseValue: 'Innerhalb eines Werktags',
    },
    footer: {
      explore: 'Erkunden',
      forYou: 'Für Sie',
      contact: 'Kontakt',
      aboutUs: 'Über uns',
      solutions: 'Lösungen',
      marketplace: 'Marktplatz',
      industries: 'Branchen',
      caseStudies: 'Fallstudien',
      insights: 'Einblicke',
      talkToTeam: 'Mit unserem Team sprechen',
      description: 'Unternehmenskultur mit Perspektive und sorgfältig geliefert.',
      companyLine: 'Dänemark · EU-Lieferung',
    },
    quote: {
      eyebrow: 'Ein klarer nächster Schritt',
      title: 'Lassen Sie uns über Technologie sprechen.',
      description: 'Erzählen Sie uns, was Sie planen. Wir verbinden Sie mit dem passenden Spezialisten — kein Verkaufsscript, sondern ein nützlicher Austausch.',
      descriptionWithProduct: 'Erzählen Sie uns, was Sie für {product} benötigen. Wir kommen mit Verfügbarkeit, Optionen und einer durchdachten Empfehlung zurück.',
      successTitle: 'Wir haben Ihre Anfrage erhalten.',
      successDescription: 'Ein CompuTrade-Spezialist meldet sich innerhalb eines Werktages bei Ihnen.',
      name: 'Name',
      workEmail: 'Arbeits-E-Mail',
      company: 'Unternehmen',
      phone: 'Telefon',
      productService: 'Produkt/Dienstleistung',
      quantity: 'Menge',
      messageLabel: 'Wobei können wir helfen?',
      messagePlaceholder: 'Ein paar Worte zu Ihrem Projekt, Zeitplan oder Produktbedarf…',
      consent: 'Mit dem Senden dieses Formulars stimmen Sie zu, dass wir Sie zu Ihrer Anfrage kontaktieren.',
      closeButton: 'Zurück zur Website',
      error: 'Wir konnten Ihre Anfrage im Moment nicht senden.',
      placeholderName: 'Ihr Name',
      placeholderEmail: 'name@unternehmen.dk',
      placeholderCompany: 'Unternehmensname',
      placeholderPhone: '+45 1234 5678',
      submit: 'Anfrage senden',
      sending: 'Anfrage wird gesendet…',
      closeForm: 'Anfrageformular schließen',
      productPlaceholder: 'Allgemeine Anfrage',
      serviceLabel: 'Ein klarer nächster Schritt',
    },
    admin: {
      loading: 'Admin-Zugang wird geprüft…',
      backToWebsite: 'Zurück zur Website',
      signInTitle: 'Melden Sie sich an, um fortzufahren.',
      signInDescription: 'Geben Sie das Administratorpasswort ein, um Website-Einstellungen zu verwalten.',
      password: 'Passwort',
      signIn: 'Anmelden',
      signingIn: 'Anmeldung…',
      logout: 'Abmelden',
      manageTitle: 'Halten Sie Ihre Kontaktkanäle aktuell.',
      manageDescription: 'Konfigurieren Sie die WhatsApp-Nummer, die im schwebenden Kontaktbutton auf der öffentlichen Website und im Marktplatz angezeigt wird.',
    },
  },
  es: {
    common: {
      language: 'Idioma',
      translateTo: 'Traducir a…',
      loading: 'Cargando…',
      backToWebsite: 'Volver al sitio',
      requestQuote: 'Solicitar presupuesto',
      talkToTeam: 'Hablar con nuestro equipo',
      exploreSolutions: 'Explorar soluciones',
      learnMore: 'Saber más',
      readMore: 'Leer más',
      contactUs: 'Contactar',
      close: 'Cerrar',
      sendRequest: 'Enviar solicitud',
      sendingRequest: 'Enviando solicitud…',
      required: 'Obligatorio',
      notProvided: 'No proporcionado',
      privacy: 'Privacidad',
      terms: 'Términos',
      allRightsReserved: 'Todos los derechos reservados',
    },
    nav: {
      about: 'Sobre nosotros',
      solutions: 'Soluciones',
      marketplace: 'Marketplace',
      industries: 'Sectores',
      insights: 'Insights',
    },
    hero: {
      eyebrow: 'Tecnología con perspectiva',
      title: 'Infraestructura para el trabajo que viene.',
      description: 'CompuTrade ayuda a organizaciones ambiciosas a hacer que la tecnología sea fiable, desde la infraestructura básica y la nube hasta los dispositivos que mantienen a las personas en movimiento.',
      featureOne: 'Entrega liderada por Dinamarca',
      featureTwo: 'Listo para empresas',
      featureThree: 'Soporte humano',
      whatsapp: 'Chatear por WhatsApp',
    },
    about: {
      eyebrow: 'Un socio, no un portal',
      title: 'La tecnología debería hacer que el buen trabajo sea más sencillo.',
      description: 'Unimos conocimiento especializado, abastecimiento fiable y una comprensión práctica de su organización. El resultado es un socio tecnológico que ve el conjunto completo y sigue cuidando cada detalle.',
      highlight: 'Claridad antes que complejidad.',
      highlightText: 'Recomendamos lo que encaja con su contexto, no lo que llena un catálogo.',
      readStory: 'Leer nuestra historia',
      homeLabel: 'Nuestra historia no está disponible temporalmente.',
      homeDescription: 'Inténtelo de nuevo en un momento.',
      loadingStory: 'Cargando nuestra historia…',
    },
    solutions: {
      eyebrow: 'Lo que resolvemos',
      title: 'El nivel adecuado de experiencia, en el momento adecuado.',
      discussSetup: 'Hablar de su entorno',
      infrastructureTitle: 'Infraestructura y redes',
      infrastructureText: 'Fundamentos resilientes para los lugares de los que dependen sus personas y sistemas.',
      cloudTitle: 'Cloud y puesto de trabajo',
      cloudText: 'Entornos cloud flexibles y lugares de trabajo modernos, diseñados en torno a la forma de operar de los equipos.',
      securityTitle: 'Ciberseguridad',
      securityText: 'Protección práctica, gobernanza clara y una postura de seguridad que acompaña el ritmo.',
      dataTitle: 'Centro de datos y almacenamiento',
      dataText: 'Computación y almacenamiento escalables diseñados para la continuidad, el rendimiento y el control.',
      managedTitle: 'Servicios gestionados',
      managedText: 'Un socio tranquilo y responsable para monitorización, soporte y la siguiente decisión correcta.',
      hardwareTitle: 'Suministro de hardware',
      hardwareText: 'Dispositivos y componentes listos para empresas, obtenidos a través de una red global fiable.',
    },
    marketplace: {
      eyebrow: 'Una experiencia de compra separada',
      title: 'Encontrar la tecnología adecuada, sin ruido.',
      description: 'Explore una selección enfocada de nuestro marketplace y después solicite un presupuesto bien considerado al equipo de CompuTrade.',
      openMarketplace: 'Abrir el marketplace',
      loadingProducts: 'Cargando productos del marketplace…',
      unavailableTitle: 'El catálogo está temporalmente no disponible.',
      unavailableDescription: 'Vuelva a intentarlo en un momento.',
      emptyTitle: 'El catálogo se está preparando.',
      emptyDescription: 'Vuelva pronto para ver la tecnología disponible más reciente.',
      searchPlaceholder: 'Buscar productos, marcas o categorías',
      homepageTitle: 'CompuTrade marketplace',
      homepageDescription: 'Un catálogo B2B enfocado para organizaciones que necesitan hardware, infraestructura y tecnología de seguridad fiables, con una conversación real detrás de cada presupuesto.',
      curatedTitle: 'Catálogo curado',
      curatedDescription: 'Una selección enfocada de hardware, infraestructura y tecnología de seguridad fiable para organizaciones modernas.',
      allProducts: 'Todos los productos',
      requestQuote: 'Solicitar presupuesto',
      loading: 'Cargando…',
      noProducts: 'Todavía no hay productos que coincidan con este filtro.',
    },
    industries: {
      eyebrow: 'El contexto importa',
      title: 'Diseñado para el mundo real.',
      description: 'Cada sector tiene una definición diferente de lo crítico. Empezamos ahí, con las presiones operativas, la regulación y las ambiciones específicas de su organización.',
      findStartingPoint: 'Encontrar su punto de partida',
      publicSector: 'Sector público',
      publicSectorText: 'Tecnología que inspira confianza, desde la contratación hasta la prestación diaria del servicio.',
      education: 'Educación',
      educationText: 'Fundamentos digitales seguros y accesibles para comunidades educativas.',
      manufacturing: 'Manufactura',
      manufacturingText: 'Conectar operaciones, datos y personas sin frenar la línea.',
      finance: 'Servicios financieros',
      financeText: 'Infraestructura donde la resiliencia, el cumplimiento y la confianza se unen.',
    },
    proof: {
      eyebrow: 'Pruebas en la práctica',
      title: 'La fiabilidad es un resultado.',
      previousCase: 'Caso anterior',
      nextCase: 'Siguiente caso',
      publicSectorTag: 'Sector público · Infraestructura',
      publicSectorTitle: 'Una base estable para 18.000 usuarios diarios.',
      publicSectorText: 'Ayudamos a una organización pública danesa a consolidar su red y entorno de terminales, reduciendo la complejidad sin interrumpir los servicios de los que depende la gente.',
      publicSectorResult: '31 % menos de incidentes críticos',
      publicSectorQuote: 'CompuTrade se tomó el tiempo de entender el entorno antes de proponer una dirección. Eso hizo que la implantación se sintiera controlada desde el primer día.',
      publicSectorPerson: 'Maja Sørensen',
      publicSectorRole: 'Responsable de operaciones de TI',
      manufacturingTag: 'Manufactura · Puesto de trabajo',
      manufacturingTitle: 'Un espacio de trabajo, en tres plantas de producción.',
      manufacturingText: 'Un programa gradual de dispositivos e identidad dio a los equipos una experiencia coherente y segura, desde la oficina de diseño hasta la planta.',
      manufacturingResult: '3 plantas, un único modelo operativo',
      manufacturingQuote: 'Hicieron que un cambio complejo se sintiera extraordinariamente humano. Siempre supimos qué estaba pasando y por qué.',
      manufacturingPerson: 'Lars Nygaard',
      manufacturingRole: 'Responsable de Digital Workplace',
    },
    insights: {
      eyebrow: 'Notas del campo',
      title: 'Pensamiento útil, sin teatro.',
      allInsights: 'Todos los insights',
      operationsTag: 'OPERACIONES',
      operationsTitle: 'La ventaja discreta de un estate IT bien diseñado',
      operationsText: 'Por qué una infraestructura resiliente depende menos de la especificación más grande y más de las decisiones correctas tomadas de forma constante.',
      operationsRead: 'Lectura de 6 minutos',
      securityTag: 'SEGURIDAD',
      securityTitle: 'Tres preguntas antes de tu próximo movimiento en la nube',
      securityText: 'Un punto de partida práctico para los equipos de compras, TI y liderazgo que afrontan la siguiente fase de la nube.',
      securityRead: 'Lectura de 4 minutos',
      perspectiveTag: 'PERSPECTIVA',
      perspectiveTitle: 'Lo que “gestionado” debería significar en 2025',
      perspectiveText: 'El soporte no es una cola de tickets. Es una comprensión compartida de lo que significa hacer bien las cosas cuando los sistemas importan.',
      perspectiveRead: 'Lectura de 5 minutos',
      readPerspective: 'Leer la perspectiva',
    },
    contact: {
      eyebrow: 'Iniciar una conversación',
      title: '¿Listo para un socio tecnológico más considerado?',
      description: 'Traiga un reto, una idea aproximada o un brief de contratación. Le ayudaremos a encontrar el siguiente paso más claro.',
      companyTitle: 'CompuTrade Denmark ApS',
      companyDescription: 'Para ventas, abastecimiento o una segunda opinión sobre su próxima decisión tecnológica.',
      basedIn: 'Base en',
      responseTime: 'Tiempo de respuesta',
      timezone: 'Dinamarca · entrega en la UE',
      responseValue: 'Dentro de un día laborable',
    },
    footer: {
      explore: 'Explorar',
      forYou: 'Para usted',
      contact: 'Contacto',
      aboutUs: 'Sobre nosotros',
      solutions: 'Soluciones',
      marketplace: 'Marketplace',
      industries: 'Sectores',
      caseStudies: 'Casos de éxito',
      insights: 'Insights',
      talkToTeam: 'Hablar con nuestro equipo',
      description: 'Tecnología empresarial, seleccionada con perspectiva y entregada con cuidado.',
      companyLine: 'Dinamarca · entrega en la UE',
    },
    quote: {
      eyebrow: 'Un siguiente paso claro',
      title: 'Hablemos de tecnología.',
      description: 'Cuéntenos qué tiene en mente. Le conectaremos con el especialista adecuado, sin guion de ventas, solo una conversación útil.',
      descriptionWithProduct: 'Cuéntenos qué necesita para {product}. Le responderemos con disponibilidad, opciones y una recomendación considerada.',
      successTitle: 'Tenemos su solicitud.',
      successDescription: 'Un especialista de CompuTrade se pondrá en contacto con usted en un día laborable.',
      name: 'Nombre',
      workEmail: 'Correo de trabajo',
      company: 'Empresa',
      phone: 'Teléfono',
      productService: 'Producto/servicio',
      quantity: 'Cantidad',
      messageLabel: '¿En qué podemos ayudar?',
      messagePlaceholder: 'Unas palabras sobre su proyecto, cronograma o necesidades de producto…',
      consent: 'Al enviar este formulario, acepta que podamos contactarle sobre su solicitud.',
      closeButton: 'Volver al sitio',
      error: 'No hemos podido enviar su solicitud en este momento.',
      placeholderName: 'Su nombre',
      placeholderEmail: 'nombre@empresa.dk',
      placeholderCompany: 'Nombre de la empresa',
      placeholderPhone: '+45 1234 5678',
      submit: 'Enviar solicitud',
      sending: 'Enviando solicitud…',
      closeForm: 'Cerrar formulario de presupuesto',
      productPlaceholder: 'Consulta general',
      serviceLabel: 'Un siguiente paso claro',
    },
    admin: {
      loading: 'Comprobando acceso de administrador…',
      backToWebsite: 'Volver al sitio',
      signInTitle: 'Inicie sesión para continuar.',
      signInDescription: 'Introduzca la contraseña de administrador para gestionar la configuración del sitio.',
      password: 'Contraseña',
      signIn: 'Iniciar sesión',
      signingIn: 'Iniciando sesión…',
      logout: 'Cerrar sesión',
      manageTitle: 'Mantenga sus canales de contacto al día.',
      manageDescription: 'Configure el número de WhatsApp mostrado en el botón flotante de contacto en la web pública y el marketplace.',
    },
  },
  zh: {
    common: {
      language: '语言',
      translateTo: '翻译为…',
      loading: '加载中…',
      backToWebsite: '返回网站',
      requestQuote: '请求报价',
      talkToTeam: '联系团队',
      exploreSolutions: '探索解决方案',
      learnMore: '了解更多',
      readMore: '阅读更多',
      contactUs: '联系我们',
      close: '关闭',
      sendRequest: '发送请求',
      sendingRequest: '正在发送…',
      required: '必填',
      notProvided: '未提供',
      privacy: '隐私',
      terms: '条款',
      allRightsReserved: '版权所有',
    },
    nav: {
      about: '关于',
      solutions: '解决方案',
      marketplace: '市场',
      industries: '行业',
      insights: '见解',
    },
    hero: {
      eyebrow: '兼具远见的技术',
      title: '面向未来工作的基础设施。',
      description: 'CompuTrade 帮助有远见的组织让技术可靠——从核心基础设施与云到支持团队运作的设备。',
      featureOne: '丹麦主导的交付',
      featureTwo: '企业级准备',
      featureThree: '人工支持',
      whatsapp: '在 WhatsApp 上聊天',
    },
    footer: {
      explore: '探索',
      forYou: '为您',
      contact: '联系',
      aboutUs: '关于我们',
      solutions: '解决方案',
      marketplace: '市场',
      industries: '行业',
      caseStudies: '案例研究',
      insights: '见解',
      talkToTeam: '联系团队',
      description: '企业技术，具有远见并用心交付。',
      companyLine: '丹麦 · 欧盟交付',
    },
    contact: {
      eyebrow: '开始对话',
      title: '准备好与更周到的技术合作伙伴合作了吗？',
      description: '告诉我们您的挑战、初步想法或采购简报，我们将帮助您找到最清晰的下一步。',
      companyTitle: 'CompuTrade Denmark ApS',
      companyDescription: '用于销售、采购或下一步技术决策的第二意见。',
      basedIn: '总部位于',
      responseTime: '响应时间',
      timezone: '丹麦 · 欧盟交付',
      responseValue: '一个工作日内',
    },
    quote: {
      eyebrow: '明确的下一步',
      title: '让我们谈谈技术。',
      description: '告诉我们您的计划。我们会连接合适的专家——无需推销，只有有用的对话。',
      successTitle: '我们已收到您的请求。',
      successDescription: 'CompuTrade 专家将在一个工作日内与您联系。',
      submit: '发送请求',
      sending: '发送中…',
    },
    admin: {
      loading: '正在检查管理员访问…',
      backToWebsite: '返回网站',
      signInTitle: '请登录以继续。',
      signInDescription: '输入管理员密码以管理网站设置。',
      password: '密码',
      signIn: '登录',
      signingIn: '登录中…',
      logout: '登出',
    },
  },
  ko: {
    common: {
      language: '언어',
      translateTo: '번역 대상…',
      loading: '로딩 중…',
      backToWebsite: '웹사이트로 돌아가기',
      requestQuote: '견적 요청',
      talkToTeam: '팀에 문의',
      exploreSolutions: '솔루션 살펴보기',
      learnMore: '자세히 보기',
      readMore: '더 읽기',
      contactUs: '문의하기',
      close: '닫기',
      sendRequest: '요청 전송',
      sendingRequest: '전송 중…',
      required: '필수',
      notProvided: '제공되지 않음',
      privacy: '개인정보',
      terms: '약관',
      allRightsReserved: '판권 소유',
    },
    nav: {
      about: '회사 소개',
      solutions: '솔루션',
      marketplace: '마켓플레이스',
      industries: '산업',
      insights: '인사이트',
    },
    hero: {
      eyebrow: '통찰을 가진 기술',
      title: '앞으로의 일을 위한 인프라.',
      description: 'CompuTrade는 핵심 인프라와 클라우드부터 사람들의 활동을 지원하는 장치까지 기술을 신뢰할 수 있게 만듭니다.',
      featureOne: '덴마크 주도 제공',
      featureTwo: '기업용 준비',
      featureThree: '사람 중심 지원',
      whatsapp: 'WhatsApp에서 채팅',
    },
    footer: {
      explore: '탐색',
      forYou: '당신을 위해',
      contact: '연락처',
      aboutUs: '회사 소개',
      solutions: '솔루션',
      marketplace: '마켓플레이스',
      industries: '산업',
      caseStudies: '사례 연구',
      insights: '인사이트',
      talkToTeam: '팀에 문의',
      description: '관점을 가진 엔터프라이즈 기술, 세심하게 전달됩니다.',
      companyLine: '덴마크 · EU 제공',
    },
    contact: {
      eyebrow: '대화를 시작하세요',
      title: '더 사려 깊은 기술 파트너와 작업할 준비가 되셨나요?',
      description: '도전 과제, 대략적인 아이디어 또는 조달 브리프를 알려주시면 다음 명확한 단계를 찾아 드립니다.',
      companyTitle: 'CompuTrade Denmark ApS',
      companyDescription: '영업, 조달 또는 다음 기술 결정에 대한 두 번째 의견.',
      basedIn: '위치',
      responseTime: '응답 시간',
      timezone: '덴마크 · EU 제공',
      responseValue: '영업일 내',
    },
    quote: {
      eyebrow: '명확한 다음 단계',
      title: '기술에 대해 이야기합시다.',
      description: '계획 중인 내용을 알려주세요. 적절한 전문가와 연결해드립니다 — 판매 스크립트가 아닌 유용한 대화입니다.',
      successTitle: '요청을 접수했습니다.',
      successDescription: 'CompuTrade 전문가가 영업일 내에 연락드립니다.',
      submit: '요청 전송',
      sending: '전송 중…',
    },
    admin: {
      loading: '관리자 접근 확인 중…',
      backToWebsite: '웹사이트로 돌아가기',
      signInTitle: '계속하려면 로그인하세요.',
      signInDescription: '웹사이트 설정을 관리하려면 관리자 비밀번호를 입력하세요.',
      password: '비밀번호',
      signIn: '로그인',
      signingIn: '로그인 중…',
      logout: '로그아웃',
    },
  },
  nl: {
    common: {
      language: 'Taal',
      translateTo: 'Vertalen naar…',
      loading: 'Laden…',
      backToWebsite: 'Terug naar website',
      requestQuote: 'Offerte aanvragen',
      talkToTeam: 'Praat met ons team',
      exploreSolutions: 'Ontdek oplossingen',
      learnMore: 'Meer weten',
      readMore: 'Lees meer',
      contactUs: 'Contact',
      close: 'Sluiten',
      sendRequest: 'Verzoek verzenden',
      sendingRequest: 'Verzenden…',
      required: 'Verplicht',
      notProvided: 'Niet opgegeven',
      privacy: 'Privacy',
      terms: 'Voorwaarden',
      allRightsReserved: 'Alle rechten voorbehouden',
    },
    nav: {
      about: 'Over',
      solutions: 'Oplossingen',
      marketplace: 'Marktplaats',
      industries: 'Sectoren',
      insights: 'Inzichten',
    },
    hero: {
      eyebrow: 'Technologie met perspectief',
      title: 'Infrastructuur voor het werk dat komt.',
      description: 'CompuTrade helpt ambitieuze organisaties technologie betrouwbaar te maken — van kerninfrastructuur en cloud tot de apparaten die mensen inzetten.',
      featureOne: 'Door Denemarken geleverde levering',
      featureTwo: 'Klaar voor enterprises',
      featureThree: 'Menselijke ondersteuning',
      whatsapp: 'Chat via WhatsApp',
    },
    footer: {
      explore: 'Verkennen',
      forYou: 'Voor jou',
      contact: 'Contact',
      aboutUs: 'Over ons',
      solutions: 'Oplossingen',
      marketplace: 'Marktplaats',
      industries: 'Sectoren',
      caseStudies: 'Case studies',
      insights: 'Inzichten',
      talkToTeam: 'Praat met ons team',
      description: 'Enterprise-technologie, zorgvuldig geselecteerd en geleverd.',
      companyLine: 'Denemarken · EU-levering',
    },
    contact: {
      eyebrow: 'Begin een gesprek',
      title: 'Klaar voor een meer doordachte technologiepartner?',
      description: 'Breng ons een uitdaging, een ruwe idee of een aanbestedingsbrief. We helpen u de volgende duidelijke stap te vinden.',
      companyTitle: 'CompuTrade Denmark ApS',
      companyDescription: 'Voor sales, inkoop of een second opinion over uw volgende technologische beslissing.',
      basedIn: 'Gevestigd in',
      responseTime: 'Reactietijd',
      timezone: 'Denemarken · EU-levering',
      responseValue: 'Binnen één werkdag',
    },
    quote: {
      eyebrow: 'Een duidelijke volgende stap',
      title: 'Laten we het over technologie hebben.',
      description: 'Vertel ons wat u plant. We verbinden u met de juiste specialist — geen verkoopspeech, gewoon een nuttig gesprek.',
      successTitle: 'We hebben uw aanvraag ontvangen.',
      successDescription: 'Een CompuTrade-specialist neemt binnen één werkdag contact op.',
      submit: 'Verzoek verzenden',
      sending: 'Verzenden…',
    },
    admin: {
      loading: 'Controleren van admin-toegang…',
      backToWebsite: 'Terug naar website',
      signInTitle: 'Meld u aan om door te gaan.',
      signInDescription: 'Voer het beheerderswachtwoord in om site-instellingen te beheren.',
      password: 'Wachtwoord',
      signIn: 'Aanmelden',
      signingIn: 'Aanmelden…',
      logout: 'Afmelden',
    },
  },
  da: {
    common: {
      language: 'Sprog',
      chooseLanguageTitle: 'Vælg dit sprog',
      chooseLanguageSubtitle: 'Vælg det sprog, der skal bruges på hele webstedet.',
      officialLanguage: 'Dansk er det officielle webstedssprog.',
      translateTo: 'Oversæt til…',
      loading: 'Indlæser…',
      backToWebsite: 'Tilbage til webstedet',
      requestQuote: 'Anmod om tilbud',
      talkToTeam: 'Tal med vores team',
      exploreSolutions: 'Udforsk løsninger',
      learnMore: 'Læs mere',
      readMore: 'Læs mere',
      contactUs: 'Kontakt os',
      close: 'Luk',
      sendRequest: 'Send anmodning',
      sendingRequest: 'Sender…',
      required: 'Påkrævet',
      notProvided: 'Ikke angivet',
      privacy: 'Privatliv',
      terms: 'Vilkår',
      allRightsReserved: 'Alle rettigheder forbeholdes',
    },
    nav: {
      about: 'Om',
      solutions: 'Løsninger',
      marketplace: 'Markedsplads',
      industries: 'Brancher',
      insights: 'Indsigter',
    },
    hero: {
      eyebrow: 'Teknologi med perspektiv',
      title: 'Infrastruktur for arbejdet fremover.',
      description: 'CompuTrade hjælper ambitiøse organisationer med at gøre teknologi pålidelig — fra kerneinfrastruktur og cloud til de enheder, der holder folk i gang.',
      featureOne: 'Dansk-ledet levering',
      featureTwo: 'Klar til virksomhed',
      featureThree: 'Menneskelig support',
      whatsapp: 'Chat på WhatsApp',
    },
    footer: {
      explore: 'Udforsk',
      forYou: 'Til dig',
      contact: 'Kontakt',
      aboutUs: 'Om os',
      solutions: 'Løsninger',
      marketplace: 'Markedsplads',
      industries: 'Brancher',
      caseStudies: 'Case-studier',
      insights: 'Indsigter',
      talkToTeam: 'Tal med vores team',
      description: 'Enterprise-teknologi, udvalgt med perspektiv og leveret med omhu.',
      companyLine: 'Danmark · EU-levering',
    },
    contact: {
      eyebrow: 'Start en samtale',
      title: 'Klar til en mere overvejet teknologipartner?',
      description: 'Kom med en udfordring, en grov idé eller en indkøbsbrief. Vi hjælper dig med at finde det klareste næste skridt.',
      companyTitle: 'CompuTrade Denmark ApS',
      companyDescription: 'Til salg, sourcing eller en second opinion om din næste teknologiske beslutning.',
      basedIn: 'Baseret i',
      responseTime: 'Responstid',
      timezone: 'Danmark · EU-levering',
      responseValue: 'Inden for en arbejdsdag',
    },
    quote: {
      eyebrow: 'Et klart næste skridt',
      title: 'Lad os tale teknologi.',
      description: 'Fortæl os, hvad du planlægger. Vi forbinder dig med den rette specialist — ingen salgssnak, bare en nyttig samtale.',
      successTitle: 'Vi har modtaget din anmodning.',
      successDescription: 'En CompuTrade-specialist kontakter dig inden for en arbejdsdag.',
      submit: 'Send forespørgsel',
      sending: 'Sender…',
    },
    admin: {
      loading: 'Kontrollerer admin-adgang…',
      backToWebsite: 'Tilbage til webstedet',
      signInTitle: 'Log ind for at fortsætte.',
      signInDescription: 'Indtast administratoradgangskoden for at administrere webstedsindstillinger.',
      password: 'Adgangskode',
      signIn: 'Log ind',
      signingIn: 'Logger ind…',
      logout: 'Log ud',
    },
  },
  pt: {
    common: {
      language: 'Idioma',
      translateTo: 'Traduzir para…',
      loading: 'Carregando…',
      backToWebsite: 'Voltar ao site',
      requestQuote: 'Solicitar orçamento',
      talkToTeam: 'Fale com a nossa equipe',
      exploreSolutions: 'Explorar soluções',
      learnMore: 'Saber mais',
      readMore: 'Ler mais',
      contactUs: 'Contacte-nos',
      close: 'Fechar',
      sendRequest: 'Enviar pedido',
      sendingRequest: 'Enviando…',
      required: 'Obrigatório',
      notProvided: 'Não fornecido',
      privacy: 'Privacidade',
      terms: 'Termos',
      allRightsReserved: 'Todos os direitos reservados',
    },
    nav: {
      about: 'Sobre',
      solutions: 'Soluções',
      marketplace: 'Marketplace',
      industries: 'Indústrias',
      insights: 'Insights',
    },
    hero: {
      eyebrow: 'Tecnologia com perspetiva',
      title: 'Infraestrutura para o trabalho que vem.',
      description: 'A CompuTrade ajuda organizações ambiciosas a tornar a tecnologia fiável — desde a infraestrutura central e cloud até aos dispositivos que mantêm as pessoas em movimento.',
      featureOne: 'Entrega liderada pela Dinamarca',
      featureTwo: 'Pronto para empresas',
      featureThree: 'Suporte humano',
      whatsapp: 'Conversar no WhatsApp',
    },
    footer: {
      explore: 'Explorar',
      forYou: 'Para si',
      contact: 'Contacto',
      aboutUs: 'Sobre nós',
      solutions: 'Soluções',
      marketplace: 'Marketplace',
      industries: 'Indústrias',
      caseStudies: 'Estudos de caso',
      insights: 'Insights',
      talkToTeam: 'Fale com a nossa equipa',
      description: 'Tecnologia empresarial, selecionada com perspetiva e entregue com cuidado.',
      companyLine: 'Dinamarca · entrega UE',
    },
    contact: {
      eyebrow: 'Iniciar uma conversa',
      title: 'Pronto para um parceiro tecnológico mais ponderado?',
      description: 'Traga-nos um desafio, uma ideia aproximada ou um brief de aquisição. Ajudaremos a encontrar o próximo passo mais claro.',
      companyTitle: 'CompuTrade Denmark ApS',
      companyDescription: 'Para vendas, sourcing ou uma segunda opinião sobre a sua próxima decisão tecnológica.',
      basedIn: 'Baseado em',
      responseTime: 'Tempo de resposta',
      timezone: 'Dinamarca · entrega UE',
      responseValue: 'Dentro de um dia útil',
    },
    quote: {
      eyebrow: 'Um próximo passo claro',
      title: 'Vamos falar de tecnologia.',
      description: 'Diga-nos o que está a planear. Ligaremos ao especialista certo — sem script de vendas, apenas uma conversa útil.',
      successTitle: 'Recebemos o seu pedido.',
      successDescription: 'Um especialista CompuTrade entrará em contacto dentro de um dia útil.',
      submit: 'Enviar pedido',
      sending: 'A enviar…',
    },
    admin: {
      loading: 'A verificar o acesso de administrador…',
      backToWebsite: 'Voltar ao site',
      signInTitle: 'Inicie sessão para continuar.',
      signInDescription: 'Introduza a palavra‑passe do administrador para gerir as definições do site.',
      password: 'Palavra‑passe',
      signIn: 'Iniciar sessão',
      signingIn: 'Iniciando sessão…',
      logout: 'Terminar sessão',
    },
  },
} as const;

function getNestedValue(source: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }

    return undefined;
  }, source);
}

function normalizeLanguage(value: string | null | undefined): SupportedLanguage {
  if (
    value === 'fr' ||
    value === 'de' ||
    value === 'es' ||
    value === 'en' ||
    value === 'zh' ||
    value === 'ko' ||
    value === 'nl' ||
    value === 'da' ||
    value === 'pt'
  ) {
    return value;
  }

  return 'da';
}

function getStoredLanguagePreference() {
  if (typeof window === 'undefined') {
    return null;
  }

  const language = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const source = window.localStorage.getItem(LANGUAGE_SOURCE_STORAGE_KEY) as LanguageSource | null;

  if (!language) {
    return null;
  }

  return { language: normalizeLanguage(language), source: source ?? 'storage' };
}

function persistLanguagePreference(language: SupportedLanguage, source: LanguageSource) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.localStorage.setItem(LANGUAGE_SOURCE_STORAGE_KEY, source);
}

function getBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') {
    return 'da';
  }

  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith('da')) return 'da';
  if (browserLanguage.startsWith('fr')) return 'fr';
  if (browserLanguage.startsWith('de')) return 'de';
  if (browserLanguage.startsWith('es')) return 'es';
  if (browserLanguage.startsWith('zh')) return 'zh';
  if (browserLanguage.startsWith('ko')) return 'ko';
  if (browserLanguage.startsWith('nl')) return 'nl';
  if (browserLanguage.startsWith('pt')) return 'pt';
  return 'da';
}

interface I18nContextValue {
  language: SupportedLanguage;
  source: LanguageSource;
  t: (key: string, fallback?: string) => string;
  setLanguage: (language: SupportedLanguage, source?: LanguageSource) => void;
  ready: boolean;
  showLanguageSelection: boolean;
  dismissLanguageSelection: () => void;
  availableLanguages: Array<{ code: SupportedLanguage; name: string; nativeName: string }>;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function LanguageSelectionModal() {
  const { availableLanguages, setLanguage, dismissLanguageSelection, showLanguageSelection, t } = useTranslation();

  if (!showLanguageSelection) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07172a]/80 px-4 py-6">
      <div className="w-full max-w-2xl rounded-[24px] border border-white/20 bg-white p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#00a676]">ARENA TRADING KFT</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.04em] text-[#0b1f3a]">{t('common.chooseLanguageTitle') ?? 'Choose your language'}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{t('common.chooseLanguageSubtitle') ?? 'Select the language that should be used across the website.'}</p>
          <div className="mt-4 inline-flex rounded-full border border-[#dce6ec] bg-[#eefaf6] px-4 py-2 text-xs font-bold text-[#007a5c]">{t('common.officialLanguage') ?? 'Danish is the official website language.'}</div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {availableLanguages.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => {
                setLanguage(option.code, 'manual');
                dismissLanguageSelection();
              }}
              className="flex items-center justify-between rounded-2xl border border-[#cbd8df] px-4 py-4 text-left transition hover:border-[#00a676] hover:bg-[#eafff6]"
            >
              <span>
                <span className="block text-sm font-black text-[#0b1f3a]">{option.nativeName}</span>
                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">{option.name}</span>
              </span>
              <span className="text-xl">{option.code === 'da' ? '🇩🇰' : option.code === 'en' ? '🇬🇧' : option.code === 'de' ? '🇩🇪' : option.code === 'fr' ? '🇫🇷' : option.code === 'es' ? '🇪🇸' : option.code === 'zh' ? '🇨🇳' : option.code === 'ko' ? '🇰🇷' : option.code === 'nl' ? '🇳🇱' : '🇵🇹'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('da');
  const [source, setSourceState] = useState<LanguageSource>('browser');
  const [ready, setReady] = useState(false);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const manualSelectionRef = useRef(false);

  useEffect(() => {
    const storedPreference = getStoredLanguagePreference();
    if (storedPreference) {
      setLanguageState(storedPreference.language);
      setSourceState(storedPreference.source);
      setReady(true);
      return;
    }

    const browserLanguage = getBrowserLanguage();
    setLanguageState('da');
    setSourceState('browser');
    setShowLanguageSelection(true);

    const detectLanguage = async () => {
      if (manualSelectionRef.current) {
        setReady(true);
        return;
      }

      try {
        const response = await fetch(LANGUAGE_DETECTION_ENDPOINT, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Detection failed');
        }

        const data = await response.json() as { language?: string; source?: string };
        const detectedLanguage = normalizeLanguage(data.language ?? browserLanguage);
        if (manualSelectionRef.current) {
          return;
        }

        const detectedSource = data.source === 'ip' ? 'ip' : 'browser';
        const suggestedLanguage = detectedLanguage === 'en' ? 'da' : detectedLanguage;
        setLanguageState(suggestedLanguage);
        setSourceState(detectedSource);
        persistLanguagePreference(suggestedLanguage, detectedSource);
      } catch {
        setLanguageState('da');
        setSourceState('browser');
        persistLanguagePreference('da', 'browser');
      } finally {
        setReady(true);
      }
    };

    void detectLanguage();
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    persistLanguagePreference(language, source);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language, ready, source]);

  const setLanguage = useCallback((nextLanguage: SupportedLanguage, nextSource: LanguageSource = 'manual') => {
    manualSelectionRef.current = nextSource === 'manual';
    setLanguageState(nextLanguage);
    setSourceState(nextSource);
    persistLanguagePreference(nextLanguage, nextSource);
  }, []);

  const dismissLanguageSelection = useCallback(() => {
    setShowLanguageSelection(false);
  }, []);

  const rebrandCopy = useCallback((copy: string) => {
    const companyName = copy
      .replace(/CompuTrade Denmark ApS/gi, 'ARENA TRADING KFT')
      .replace(/CompuTrade Denmark/gi, 'ARENA TRADING KFT')
      .replace(/CompuTrade/gi, 'Arena Trading');
    const countryNames: Record<string, string> = {
      da: 'Ungarn', en: 'Hungary', fr: 'Hongrie', de: 'Ungarn', es: 'Hungría',
      zh: '匈牙利', ko: '헝가리', nl: 'Hongarije', pt: 'Hungria',
    };
    return companyName
      .replace(/Danish-led delivery/gi, 'Hungary-based delivery')
      .replace(/Danish-led/gi, 'Hungary-based')
      .replace(/Dansk-ledet levering/gi, 'Ungarn-baseret levering')
      .replace(/Dansk-ledet/gi, 'Ungarn-baseret')
      .replace(/Danish public organisation/gi, 'Hungarian public organisation')
      .replace(/Danmark|Dänemark|Danemark|Dinamarca|Denmark|Denemarken|丹麦|덴마크/gi, countryNames[language] ?? 'Hungary');
  }, [language]);

  const t = useCallback((key: string, fallback?: string) => {
    const currentMessages = messages[language] ?? messages.da;
    const value = getNestedValue(currentMessages as Record<string, unknown>, key);
    if (typeof value === 'string') {
      return rebrandCopy(value);
    }

    const danishValue = getNestedValue(messages.da as Record<string, unknown>, key);
    if (typeof danishValue === 'string') {
      return rebrandCopy(danishValue);
    }

    const englishValue = getNestedValue(messages.en as Record<string, unknown>, key);
    if (typeof englishValue === 'string') {
      return rebrandCopy(englishValue);
    }

    if (typeof fallback === 'string') {
      return rebrandCopy(fallback);
    }

    return key;
  }, [language, rebrandCopy]);

  const contextValue = useMemo<I18nContextValue>(() => ({
    language,
    source,
    t,
    setLanguage,
    ready,
    showLanguageSelection,
    dismissLanguageSelection,
    availableLanguages: supportedLanguages,
  }), [language, source, t, setLanguage, ready, showLanguageSelection, dismissLanguageSelection]);

  return <I18nContext.Provider value={contextValue}><LanguageSelectionModal />{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  return context;
}

export function formatMessage(key: string, fallback?: string) {
  return (messages.en as Record<string, unknown>);
}
