import type { Dictionary } from "./en-gb";

/** fr-FR — traduction complète (typée Dictionary : toute clé manquante casse la compilation). */
export const frFR: Dictionary = {
  nav: {
    browse: "Parcourir les concours",
    howItWorks: "Comment ça marche",
    winners: "Gagnants",
    sell: "Vendre avec nous",
    signIn: "Se connecter",
    signUp: "Créer un compte",
    account: "Compte",
    dashboard: "Tableau de bord",
    admin: "Admin",
    signOut: "Se déconnecter",
    favourites: "Favoris",
    notifications: "Notifications",
  },
  home: {
    heroTitle: "Gagnez des objets remarquables. Équitablement.",
    heroSubtitle:
      "Une place de marché de concours vérifiés et de tirages gratuits — chaque résultat est décidé par un tirage côté serveur, auditable et vérifiable par vous-même.",
    heroBadge: "Chaque tirage est effectué côté serveur, haché et vérifiable",
    verifiedSellers: "Vendeurs vérifiés uniquement",
    playResponsibly: "18+ · jouez de manière responsable",
    searchPlaceholder: "Rechercher des lots — vélos, montres, consoles…",
    browseAll: "Voir tous les concours",
    featured: "Concours à la une",
    liveNow: "En ce moment",
    featuredDescription:
      "Des annonces contrôlées manuellement, publiées par des vendeurs approuvés. La disponibilité dépend de votre région.",
    explore: "Explorer",
    endingSoon: "Bientôt terminés",
    lastChance: "Dernière chance",
    categories: "Catégories populaires",
    freeRouteTitle: "Il existe toujours un moyen de participer",
    freeRouteBody:
      "Lorsque la loi et le règlement du concours le prévoient, chaque concours payant offre une voie de participation gratuite avec des chances égales. Aucun achat n'est jamais secrètement exigé.",
  },
  hiw: {
    eyebrow: "Comment ça marche",
    title: "Trois étapes, sans pièges",
    description:
      "Le fonctionnement est simple par conception — et l'essentiel se déroule sur nos serveurs, pas dans votre navigateur.",
    stepLabel: "étape",
    steps: [
      {
        title: "Choisissez un lot",
        body: "Parcourez les concours de vendeurs vérifiés. Chaque annonce affiche les données qui déterminent vos chances : nombre total de participations, prix, date de clôture et règlement officiel.",
      },
      {
        title: "Obtenez vos participations",
        body: "Participez avec un ticket payant, via la voie gratuite lorsqu'elle s'applique, ou en répondant à une question de qualification — selon le concours et votre région.",
      },
      {
        title: "Tirage vérifiable",
        body: "À la clôture, la liste des participations éligibles est figée et hachée, puis un tirage cryptographiquement sûr désigne le gagnant. Vous pouvez auditer le résultat sur la page publique du tirage.",
      },
    ],
  },
  transparency: {
    eyebrow: "Transparence",
    title: "Un tirage que vous pouvez vérifier, pas seulement croire",
    description:
      "Chaque tirage terminé publie un enregistrement de vérification. Aucun tirage ne s'exécute dans un navigateur, et personne — pas même nous — ne peut en relancer un discrètement.",
    items: [
      {
        title: "Liste de participations figée et hachée",
        body: "Avant la sélection, les participations éligibles sont figées dans un instantané haché (SHA-256). L'instantané ne peut plus jamais changer après le tirage.",
      },
      {
        title: "Aléa cryptographique",
        body: "Les gagnants sont sélectionnés côté serveur avec une source aléatoire cryptographiquement sûre — jamais Math.random(), jamais de code client.",
      },
      {
        title: "Journal d'audit immuable",
        body: "L'exécution du tirage, sa vérification et tout nouveau tirage strictement encadré sont consignés dans un journal en écriture seule, avec des approbateurs nommés.",
      },
    ],
    exampleLabel: "Exemple d'enregistrement de vérification",
    exampleNote:
      "Chaque concours terminé renvoie vers une page publique comme celle-ci, avec les données personnelles masquées.",
    browseDraws: "Consulter les tirages",
  },
  freeRoute: {
    cta: "Comment fonctionne la voie gratuite",
    note: "Les participations gratuites offrent les mêmes chances que les participations payantes du même concours.",
  },
  trust: {
    eyebrow: "Confiance et sécurité",
    title: "Conçu comme une place de marché, encadré comme il se doit",
    items: [
      {
        title: "Vendeurs vérifiés",
        body: "Vérification d'identité et d'activité avant la mise en ligne de la moindre annonce, plus une preuve de propriété du lot.",
      },
      {
        title: "Adapté à chaque territoire",
        body: "Les formats de concours ne sont proposés que là où les règles du territoire les autorisent. Pas de valeurs par défaut mondiales.",
      },
      {
        title: "Protection des joueurs",
        body: "Limites de dépenses, périodes de pause et auto-exclusion sont intégrées aux paramètres de votre compte.",
      },
      {
        title: "Modération humaine",
        body: "Chaque concours passe une revue ; les catégories interdites sont bloquées et les recours sont traités par des personnes.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Ce que disent les membres",
    title: "Témoignages de démonstration",
    items: [
      {
        quote:
          "J'ai comparé le hash du tirage avec l'instantané publié. Ça correspondait. C'est pour ça que je continue à participer ici.",
        name: "A. Carter — persona de démo",
      },
      {
        quote:
          "J'ai utilisé la voie postale gratuite pour un concours de montre et j'ai gagné. Mêmes chances, aucun achat — exactement comme annoncé.",
        name: "M. Osei — persona de démo",
      },
      {
        quote:
          "En tant que vendeur, le relevé de paiement détaille chaque frais ligne par ligne. Aucune surprise au règlement.",
        name: "J. Laurent — persona de démo",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions fréquentes",
    items: [
      {
        question: "Comment les gagnants sont-ils choisis ?",
        answer:
          "À la clôture d'un concours, la liste des participations éligibles est figée et hachée, puis un gagnant est sélectionné côté serveur à l'aide d'une source aléatoire cryptographiquement sûre. L'enregistrement du tirage — y compris le hash de l'instantané — est publié sur une page de vérification publique.",
      },
      {
        question: "Dois-je payer pour participer ?",
        answer:
          "Pas lorsqu'une voie de participation gratuite s'applique. Les concours qui en proposent une acceptent les participations gratuites avec les mêmes chances que les participations payantes. Certains concours sont des tirages entièrement gratuits. La disponibilité de chaque format dépend des règles de votre territoire.",
      },
      {
        question: "Pourquoi certains concours me sont-ils inaccessibles ?",
        answer:
          "Les concours sont réglementés différemment dans chaque pays et région. Un concours n'est affiché comme disponible que là où sa configuration a été approuvée pour ce territoire. Si vous n'êtes pas éligible, nous vous le disons clairement au lieu de vous laisser payer pour vous disqualifier ensuite.",
      },
      {
        question: "Comment les gagnants reçoivent-ils leur lot ?",
        answer:
          "Après le tirage, l'éligibilité du gagnant provisoire est vérifiée, puis il choisit la livraison ou le retrait selon la politique de remise du concours. Les biens de grande valeur, comme les véhicules, suivent un processus de transfert documenté. Tout est suivi jusqu'à ce que vous confirmiez la réception.",
      },
      {
        question: "Que se passe-t-il si un concours est annulé ?",
        answer:
          "Si un concours est annulé avant son tirage, les participations payantes sont intégralement remboursées sur le moyen de paiement d'origine. Le statut du remboursement est visible dans votre compte, et notre équipe d'assistance gère les exceptions selon la politique de résolution des litiges.",
      },
    ],
  },
  sellerCta: {
    eyebrow: "Pour les vendeurs",
    title: "Transformez un objet remarquable en un concours ouvert à des milliers de personnes",
    body: "{brand} gère les participations, les paiements, les contrôles de conformité et le tirage. Vous mettez le lot en vente, nous faisons tourner la machine — et vous recevez un règlement transparent, détaillé ligne par ligne.",
    start: "Commencer à vendre",
    standards: "Lire les standards vendeurs",
  },
  footer: {
    columns: {
      marketplace: "Place de marché",
      trust: "Confiance",
      support: "Assistance",
      legal: "Mentions légales",
    },
    links: {
      browse: "Parcourir les concours",
      winners: "Gagnants",
      howItWorks: "Comment ça marche",
      freeEntryRoute: "Participation gratuite",
      sell: "Vendre avec nous",
      trustSafety: "Confiance et sécurité",
      responsibleParticipation: "Participation responsable",
      sellerStandards: "Standards vendeurs",
      prohibitedItems: "Objets interdits",
      drawVerification: "Vérification des tirages",
      helpCentre: "Centre d'aide",
      contact: "Contact",
      complaints: "Réclamations",
      disputeResolution: "Résolution des litiges",
      accessibility: "Accessibilité",
      terms: "Conditions d'utilisation",
      privacy: "Politique de confidentialité",
      cookies: "Cookies",
      officialRules: "Règlement officiel",
    },
    description:
      "Une place de marché internationale de concours, tirages gratuits et loteries promotionnelles — avec des vendeurs vérifiés, des tirages transparents côté serveur et une voie de participation gratuite partout où elle s'applique.",
    legalLine:
      "Tous les documents juridiques de ce site sont des modèles en attente de relecture par un conseil juridique local qualifié.",
    ageLine: "18+ ou l'âge minimum de votre territoire. Participez de manière responsable —",
    setLimits: "définissez vos limites",
  },
  auth: {
    signIn: {
      title: "Bon retour parmi nous",
      newHere: "Nouveau ici ?",
      createAccount: "Créer un compte",
      email: "E-mail",
      password: "Mot de passe",
      forgotPassword: "Mot de passe oublié ?",
      submit: "Se connecter",
    },
    signUp: {
      title: "Créez votre compte",
      alreadyMember: "Déjà membre ?",
      signIn: "Se connecter",
      displayName: "Nom affiché",
      displayNamePlaceholder: "Tel que vous apparaîtrez publiquement",
      email: "E-mail",
      password: "Mot de passe",
      passwordHint: "Au moins 10 caractères, avec des lettres et un chiffre.",
      acceptTermsPrefix: "Je confirme avoir l'âge minimum requis et j'accepte les",
      termsOfService: "conditions d'utilisation",
      marketingOptIn: "M'informer des nouveaux concours par e-mail (facultatif)",
      submit: "Créer un compte",
      inboxTitle: "Vérifiez votre boîte de réception",
      inboxBodyPrefix: "Nous avons envoyé un lien de confirmation à",
      inboxBodySuffix: ". Ouvrez-le pour activer votre compte.",
      backToSignIn: "Retour à la connexion",
    },
    disclaimer: {
      agePrefix:
        "18+ ou l'âge minimum de votre territoire. En continuant, vous acceptez nos",
      terms: "conditions d'utilisation",
      and: "et notre",
      privacy: "politique de confidentialité",
    },
    userMenu: {
      menuLabel: "Menu du compte",
      settings: "Paramètres du compte",
      entries: "Mes participations",
      favourites: "Favoris",
      notifications: "Notifications",
      sellerDashboard: "Tableau de bord vendeur",
      becomeSeller: "Devenir vendeur",
      admin: "Admin",
      signOut: "Se déconnecter",
    },
  },
  localeSwitcher: {
    label: "Langue",
  },
  campaign: {
    entries: "participations",
    of: "sur",
    entryPrice: "Prix de la participation",
    freeEntry: "Participation gratuite",
    endsIn: "Se termine dans",
    ended: "Terminé",
    drawPending: "Tirage en attente",
    winnerAnnounced: "Gagnant annoncé",
    enterNow: "Participer",
    viewRules: "Règlement officiel",
    verifiedSeller: "Vendeur vérifié",
    prizeValue: "Valeur du lot",
    maxPerUser: "Max. par personne",
    notEligibleTitle: "Indisponible dans votre région",
    notEligibleBody:
      "Ce concours n'est pas ouvert aux participants de votre localisation actuelle. L'éligibilité est définie par le règlement officiel du concours et la loi locale.",
    ageRestricted: "Vous devez avoir {age} ans ou plus pour participer",
    soldOut: "Épuisé",
    drawVerification: "Vérification du tirage",
  },
  entry: {
    quantity: "Nombre de participations",
    total: "Total",
    confirmEligibility:
      "Je confirme remplir les conditions d'âge et de résidence du règlement officiel",
    acceptRules: "J'ai lu et j'accepte le règlement officiel et la politique de remboursement",
    payAndEnter: "Payer et participer",
    enterFree: "Demander une participation gratuite",
    skillQuestion: "Question de qualification",
    skillNotice: "Vous devez répondre correctement pour que votre participation soit valable.",
    confirmed: "Participation confirmée",
    receipt: "Reçu",
  },
  status: {
    draft: "Brouillon",
    submitted: "Soumis",
    under_review: "En cours d'examen",
    changes_requested: "Modifications demandées",
    approved: "Approuvé",
    scheduled: "Programmé",
    active: "En cours",
    paused: "En pause",
    sold_out: "Épuisé",
    closing: "Clôture",
    drawing: "Tirage en cours",
    winner_pending: "Gagnant en attente",
    winner_confirmed: "Gagnant confirmé",
    fulfilment: "Remise du lot",
    completed: "Terminé",
    cancelled: "Annulé",
    rejected: "Refusé",
    disputed: "En litige",
  },
  common: {
    loading: "Chargement",
    error: "Une erreur est survenue",
    retry: "Réessayer",
    save: "Enregistrer",
    saved: "Enregistré",
    cancel: "Annuler",
    confirm: "Confirmer",
    continue: "Continuer",
    back: "Retour",
    search: "Rechercher",
    filters: "Filtres",
    clearFilters: "Effacer les filtres",
    noResults: "Aucun résultat ne correspond à vos filtres",
    seeMore: "Voir plus",
    optional: "facultatif",
    required: "Obligatoire",
    close: "Fermer",
    copied: "Copié dans le presse-papiers",
  },
  legal: {
    templateNotice:
      "Ce document est un modèle en attente de relecture par un conseil juridique local qualifié. Il ne constitue pas un avis juridique et doit être approuvé avant tout lancement sur un territoire.",
    demoNotice: "Contenu de démonstration — pas un témoignage réel.",
    noPurchaseNecessary:
      "Aucun achat nécessaire lorsqu'une voie de participation gratuite s'applique.",
  },
};
