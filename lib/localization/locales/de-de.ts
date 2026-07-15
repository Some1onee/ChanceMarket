import type { Dictionary } from "./en-gb";

/** de-DE — vollständige Übersetzung (als Dictionary typisiert: fehlende Schlüssel brechen den Build). */
export const deDE: Dictionary = {
  nav: {
    browse: "Gewinnspiele durchstöbern",
    howItWorks: "So funktioniert's",
    winners: "Gewinner",
    sell: "Mit uns verkaufen",
    signIn: "Anmelden",
    signUp: "Konto erstellen",
    account: "Konto",
    dashboard: "Dashboard",
    admin: "Admin",
    signOut: "Abmelden",
    favourites: "Favoriten",
    notifications: "Benachrichtigungen",
  },
  home: {
    heroTitle: "Gewinnen Sie Außergewöhnliches. Fair.",
    heroSubtitle:
      "Ein Marktplatz für verifizierte Gewinnspiele und kostenlose Verlosungen — jedes Ergebnis wird durch eine prüfbare, serverseitige Ziehung entschieden, die Sie selbst verifizieren können.",
    heroBadge: "Jede Ziehung ist serverseitig, gehasht und verifizierbar",
    verifiedSellers: "Nur verifizierte Verkäufer",
    playResponsibly: "18+ · verantwortungsvoll teilnehmen",
    searchPlaceholder: "Preise suchen — Fahrräder, Uhren, Konsolen…",
    browseAll: "Alle Gewinnspiele ansehen",
    featured: "Ausgewählte Gewinnspiele",
    liveNow: "Jetzt live",
    featuredDescription:
      "Manuell geprüfte Angebote von zugelassenen Verkäufern. Die Verfügbarkeit hängt von Ihrer Region ab.",
    explore: "Entdecken",
    endingSoon: "Enden bald",
    lastChance: "Letzte Chance",
    categories: "Beliebte Kategorien",
    freeRouteTitle: "Es gibt immer einen Weg zur Teilnahme",
    freeRouteBody:
      "Wo Gesetz und Teilnahmebedingungen es vorsehen, bietet jedes kostenpflichtige Gewinnspiel einen kostenlosen Teilnahmeweg mit gleichen Chancen. Ein Kauf ist niemals heimlich erforderlich.",
  },
  hiw: {
    eyebrow: "So funktioniert's",
    title: "Drei Schritte, keine Tricks",
    description:
      "Die Mechanik ist bewusst einfach — und die wichtigen Teile laufen auf unseren Servern, nicht in Ihrem Browser.",
    stepLabel: "Schritt",
    steps: [
      {
        title: "Preis auswählen",
        body: "Durchstöbern Sie Gewinnspiele verifizierter Verkäufer. Jedes Angebot zeigt die Faktoren Ihrer Gewinnchance: Gesamtzahl der Lose, Preis, Enddatum und offizielle Teilnahmebedingungen.",
      },
      {
        title: "Lose sichern",
        body: "Nehmen Sie mit einem kostenpflichtigen Los teil, über den kostenlosen Teilnahmeweg, wo verfügbar, oder durch Beantwortung einer Qualifikationsfrage — je nach Gewinnspiel und Region.",
      },
      {
        title: "Verifizierbare Ziehung",
        body: "Zum Abschluss wird die Liste der teilnahmeberechtigten Lose eingefroren und gehasht, dann wählt eine kryptografisch sichere Ziehung den Gewinner. Sie können das Ergebnis auf der öffentlichen Seite der Ziehung prüfen.",
      },
    ],
  },
  transparency: {
    eyebrow: "Transparenz",
    title: "Eine Ziehung zum Nachprüfen, nicht nur zum Vertrauen",
    description:
      "Jede abgeschlossene Ziehung veröffentlicht einen Verifizierungsnachweis. Keine Ziehung läuft jemals im Browser, und niemand — auch wir nicht — kann eine unbemerkt wiederholen.",
    items: [
      {
        title: "Eingefrorene, gehashte Losliste",
        body: "Vor der Auswahl werden die teilnahmeberechtigten Lose in einem Snapshot festgehalten und gehasht (SHA-256). Der Snapshot kann sich nach der Ziehung nie mehr ändern.",
      },
      {
        title: "Kryptografischer Zufall",
        body: "Gewinner werden serverseitig mit einer kryptografisch sicheren Zufallsquelle ausgewählt — niemals Math.random(), niemals Client-Code.",
      },
      {
        title: "Unveränderliches Prüfprotokoll",
        body: "Durchführung, Verifizierung und jede streng kontrollierte Wiederholungsziehung werden in einem nur anfügbaren Prüfprotokoll mit namentlich genannten Freigebenden festgehalten.",
      },
    ],
    exampleLabel: "Beispiel eines Verifizierungsnachweises",
    exampleNote:
      "Jedes abgeschlossene Gewinnspiel verlinkt auf eine öffentliche Seite wie diese, mit maskierten personenbezogenen Daten.",
    browseDraws: "Ziehungen ansehen",
  },
  freeRoute: {
    cta: "So funktioniert der kostenlose Weg",
    note: "Kostenlose Teilnahmen haben dieselben Chancen wie kostenpflichtige Teilnahmen im selben Gewinnspiel.",
  },
  trust: {
    eyebrow: "Vertrauen & Sicherheit",
    title: "Gebaut wie ein Marktplatz, reguliert, weil es darauf ankommt",
    items: [
      {
        title: "Verifizierte Verkäufer",
        body: "Identitäts- und Unternehmensprüfungen, bevor auch nur ein Angebot live geht, plus Eigentumsnachweis für den Preis.",
      },
      {
        title: "Territorial angepasst",
        body: "Gewinnspielformate werden nur dort angeboten, wo die Regeln des jeweiligen Gebiets sie erlauben. Keine globalen Standardeinstellungen.",
      },
      {
        title: "Teilnehmerschutz",
        body: "Ausgabenlimits, Pausenzeiten und Selbstausschluss sind fest in Ihre Kontoeinstellungen integriert.",
      },
      {
        title: "Menschliche Moderation",
        body: "Jedes Gewinnspiel durchläuft eine Prüfung; verbotene Kategorien werden blockiert und Einsprüche von Menschen bearbeitet.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Was Mitglieder sagen",
    title: "Demonstrations-Erfahrungsberichte",
    items: [
      {
        quote:
          "Ich habe den Hash der Ziehung mit dem veröffentlichten Snapshot verglichen. Er stimmte überein. Deshalb nehme ich hier weiter teil.",
        name: "A. Carter — Demo-Persona",
      },
      {
        quote:
          "Ich habe den kostenlosen Postweg bei einem Uhren-Gewinnspiel genutzt und gewonnen. Gleiche Chancen, kein Kauf — genau wie beschrieben.",
        name: "M. Osei — Demo-Persona",
      },
      {
        quote:
          "Als Verkäufer zeigt die Auszahlungsabrechnung jede Gebühr Zeile für Zeile. Keine Überraschungen bei der Abrechnung.",
        name: "J. Laurent — Demo-Persona",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Häufige Fragen",
    items: [
      {
        question: "Wie werden die Gewinner ermittelt?",
        answer:
          "Wenn ein Gewinnspiel endet, wird die Liste der teilnahmeberechtigten Lose eingefroren und gehasht, dann wird serverseitig mit einer kryptografisch sicheren Zufallsquelle ein Gewinner ausgewählt. Der Ziehungsnachweis — einschließlich des Snapshot-Hashs — wird auf einer öffentlichen Verifizierungsseite veröffentlicht.",
      },
      {
        question: "Muss ich für die Teilnahme bezahlen?",
        answer:
          "Nicht, wo ein kostenloser Teilnahmeweg gilt. Gewinnspiele, die einen anbieten, akzeptieren kostenlose Teilnahmen mit denselben Chancen wie kostenpflichtige. Manche Gewinnspiele sind vollständig kostenlose Verlosungen. Die Verfügbarkeit jedes Formats hängt von den Regeln Ihres Gebiets ab.",
      },
      {
        question: "Warum kann ich manche Gewinnspiele nicht sehen oder daran teilnehmen?",
        answer:
          "Gewinnspiele sind in jedem Land und jeder Region unterschiedlich reguliert. Ein Gewinnspiel wird nur dort als verfügbar angezeigt, wo seine Konfiguration für dieses Gebiet freigegeben wurde. Wenn Sie nicht teilnahmeberechtigt sind, sagen wir es Ihnen klar, statt Sie zahlen zu lassen und später zu disqualifizieren.",
      },
      {
        question: "Wie erhalten Gewinner ihren Preis?",
        answer:
          "Nach der Ziehung wird die Teilnahmeberechtigung des vorläufigen Gewinners geprüft, dann wählt er Lieferung oder Abholung gemäß der Übergaberegelung des Gewinnspiels. Hochwertige Gegenstände wie Fahrzeuge folgen einem dokumentierten Übertragungsprozess. Alles wird nachverfolgt, bis Sie den Erhalt bestätigen.",
      },
      {
        question: "Was passiert, wenn ein Gewinnspiel abgesagt wird?",
        answer:
          "Wird ein Gewinnspiel vor seiner Ziehung abgesagt, werden kostenpflichtige Teilnahmen vollständig auf das ursprüngliche Zahlungsmittel erstattet. Der Erstattungsstatus ist in Ihrem Konto sichtbar, und unser Support-Team behandelt Ausnahmen gemäß der Streitbeilegungsrichtlinie.",
      },
    ],
  },
  sellerCta: {
    eyebrow: "Für Verkäufer",
    title: "Machen Sie aus einem außergewöhnlichen Gegenstand ein Gewinnspiel für Tausende",
    body: "{brand} übernimmt Teilnahmen, Zahlungen, Compliance-Prüfungen und die Ziehung. Sie listen den Preis, wir betreiben die Maschinerie — und Sie erhalten eine transparente Abrechnung, Zeile für Zeile.",
    start: "Jetzt verkaufen",
    standards: "Verkäuferstandards lesen",
  },
  footer: {
    columns: {
      marketplace: "Marktplatz",
      trust: "Vertrauen",
      support: "Support",
      legal: "Rechtliches",
    },
    links: {
      browse: "Gewinnspiele durchstöbern",
      winners: "Gewinner",
      howItWorks: "So funktioniert's",
      freeEntryRoute: "Kostenlose Teilnahme",
      sell: "Mit uns verkaufen",
      trustSafety: "Vertrauen & Sicherheit",
      responsibleParticipation: "Verantwortungsvolle Teilnahme",
      sellerStandards: "Verkäuferstandards",
      prohibitedItems: "Verbotene Artikel",
      drawVerification: "Ziehungsverifizierung",
      helpCentre: "Hilfe-Center",
      contact: "Kontakt",
      complaints: "Beschwerden",
      disputeResolution: "Streitbeilegung",
      accessibility: "Barrierefreiheit",
      terms: "Nutzungsbedingungen",
      privacy: "Datenschutzerklärung",
      cookies: "Cookies",
      officialRules: "Offizielle Teilnahmebedingungen",
    },
    description:
      "Ein internationaler Marktplatz für Gewinnspiele, kostenlose Verlosungen und Preisausschreiben — mit verifizierten Verkäufern, transparenten serverseitigen Ziehungen und einem kostenlosen Teilnahmeweg, wo immer einer gilt.",
    legalLine:
      "Alle Rechtsdokumente auf dieser Website sind Vorlagen, die noch von qualifizierten lokalen Rechtsberatern geprüft werden müssen.",
    ageLine: "18+ oder das Mindestalter in Ihrem Gebiet. Bitte nehmen Sie verantwortungsvoll teil —",
    setLimits: "setzen Sie Ihre Limits",
  },
  auth: {
    signIn: {
      title: "Willkommen zurück",
      newHere: "Neu hier?",
      createAccount: "Konto erstellen",
      email: "E-Mail",
      password: "Passwort",
      forgotPassword: "Passwort vergessen?",
      submit: "Anmelden",
    },
    signUp: {
      title: "Konto erstellen",
      alreadyMember: "Bereits Mitglied?",
      signIn: "Anmelden",
      displayName: "Anzeigename",
      displayNamePlaceholder: "So erscheinen Sie öffentlich",
      email: "E-Mail",
      password: "Passwort",
      passwordHint: "Mindestens 10 Zeichen mit Buchstaben und einer Zahl.",
      acceptTermsPrefix: "Ich bestätige, dass ich das Mindestalter erfülle, und akzeptiere die",
      termsOfService: "Nutzungsbedingungen",
      marketingOptIn: "Per E-Mail über neue Gewinnspiele informieren (optional)",
      submit: "Konto erstellen",
      inboxTitle: "Prüfen Sie Ihren Posteingang",
      inboxBodyPrefix: "Wir haben einen Bestätigungslink gesendet an",
      inboxBodySuffix: ". Öffnen Sie ihn, um Ihr Konto zu aktivieren.",
      backToSignIn: "Zurück zur Anmeldung",
    },
    disclaimer: {
      agePrefix:
        "18+ oder das Mindestalter in Ihrem Gebiet. Indem Sie fortfahren, akzeptieren Sie unsere",
      terms: "Nutzungsbedingungen",
      and: "und unsere",
      privacy: "Datenschutzerklärung",
    },
    userMenu: {
      menuLabel: "Kontomenü",
      settings: "Kontoeinstellungen",
      entries: "Meine Teilnahmen",
      favourites: "Favoriten",
      notifications: "Benachrichtigungen",
      sellerDashboard: "Verkäufer-Dashboard",
      becomeSeller: "Verkäufer werden",
      admin: "Admin",
      signOut: "Abmelden",
    },
  },
  localeSwitcher: {
    label: "Sprache",
  },
  campaign: {
    entries: "Lose",
    of: "von",
    entryPrice: "Lospreis",
    freeEntry: "Kostenlose Teilnahme",
    endsIn: "Endet in",
    ended: "Beendet",
    drawPending: "Ziehung ausstehend",
    winnerAnnounced: "Gewinner bekannt gegeben",
    enterNow: "Jetzt teilnehmen",
    viewRules: "Offizielle Teilnahmebedingungen",
    verifiedSeller: "Verifizierter Verkäufer",
    prizeValue: "Preiswert",
    maxPerUser: "Max. pro Person",
    notEligibleTitle: "In Ihrer Region nicht verfügbar",
    notEligibleBody:
      "Dieses Gewinnspiel steht Teilnehmern an Ihrem aktuellen Standort nicht offen. Die Teilnahmeberechtigung richtet sich nach den offiziellen Teilnahmebedingungen und lokalem Recht.",
    ageRestricted: "Sie müssen mindestens {age} Jahre alt sein, um teilzunehmen",
    soldOut: "Ausverkauft",
    drawVerification: "Ziehungsverifizierung",
  },
  entry: {
    quantity: "Anzahl der Lose",
    total: "Gesamt",
    confirmEligibility:
      "Ich bestätige, dass ich die Alters- und Wohnsitzanforderungen der offiziellen Teilnahmebedingungen erfülle",
    acceptRules:
      "Ich habe die offiziellen Teilnahmebedingungen und die Erstattungsrichtlinie gelesen und akzeptiere sie",
    payAndEnter: "Bezahlen und teilnehmen",
    enterFree: "Kostenlose Teilnahme anfordern",
    skillQuestion: "Qualifikationsfrage",
    skillNotice: "Sie müssen richtig antworten, damit Ihre Teilnahme gültig ist.",
    confirmed: "Teilnahme bestätigt",
    receipt: "Beleg",
  },
  status: {
    draft: "Entwurf",
    submitted: "Eingereicht",
    under_review: "In Prüfung",
    changes_requested: "Änderungen angefordert",
    approved: "Genehmigt",
    scheduled: "Geplant",
    active: "Live",
    paused: "Pausiert",
    sold_out: "Ausverkauft",
    closing: "Wird geschlossen",
    drawing: "Ziehung läuft",
    winner_pending: "Gewinner ausstehend",
    winner_confirmed: "Gewinner bestätigt",
    fulfilment: "Preisübergabe",
    completed: "Abgeschlossen",
    cancelled: "Abgesagt",
    rejected: "Abgelehnt",
    disputed: "Im Streitfall",
  },
  common: {
    loading: "Wird geladen",
    error: "Etwas ist schiefgelaufen",
    retry: "Erneut versuchen",
    save: "Änderungen speichern",
    saved: "Gespeichert",
    cancel: "Abbrechen",
    confirm: "Bestätigen",
    continue: "Weiter",
    back: "Zurück",
    search: "Suchen",
    filters: "Filter",
    clearFilters: "Filter zurücksetzen",
    noResults: "Keine Treffer für Ihre Filter",
    seeMore: "Mehr anzeigen",
    optional: "optional",
    required: "Erforderlich",
    close: "Schließen",
    copied: "In die Zwischenablage kopiert",
  },
  legal: {
    templateNotice:
      "Dieses Dokument ist eine Vorlage, die noch von qualifizierten lokalen Rechtsberatern geprüft werden muss. Es stellt keine Rechtsberatung dar und muss vor dem Start in jedem Gebiet freigegeben werden.",
    demoNotice: "Demonstrationsinhalt — kein echter Erfahrungsbericht.",
    noPurchaseNecessary: "Kein Kauf erforderlich, wo ein kostenloser Teilnahmeweg gilt.",
  },
};
