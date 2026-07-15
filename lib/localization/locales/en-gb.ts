/**
 * en-GB — the source-of-truth dictionary. Every other locale must provide the
 * same shape (or a DeepPartial override merged on top, as en-US does).
 */

export const enGB = {
  nav: {
    browse: "Browse competitions",
    howItWorks: "How it works",
    winners: "Winners",
    sell: "Sell with us",
    signIn: "Sign in",
    signUp: "Create account",
    account: "Account",
    dashboard: "Dashboard",
    admin: "Admin",
    signOut: "Sign out",
    favourites: "Favourites",
    notifications: "Notifications",
  },
  home: {
    heroTitle: "Win remarkable things. Fairly.",
    heroSubtitle:
      "A marketplace of verified prize competitions and free draws — every result decided by an auditable server-side draw you can verify yourself.",
    heroBadge: "Every draw is server-side, hashed and verifiable",
    verifiedSellers: "Verified sellers only",
    playResponsibly: "18+ · play responsibly",
    searchPlaceholder: "Search prizes — bikes, watches, consoles…",
    browseAll: "Browse all competitions",
    featured: "Featured competitions",
    liveNow: "Live now",
    featuredDescription:
      "Hand-checked listings from approved sellers. Availability depends on your region.",
    explore: "Explore",
    endingSoon: "Ending soon",
    lastChance: "Last chance",
    categories: "Popular categories",
    freeRouteTitle: "There is always a route in",
    freeRouteBody:
      "Where the law and campaign rules provide one, every paid competition offers a free entry route with equal chances. No purchase is ever secretly required.",
  },
  hiw: {
    eyebrow: "How it works",
    title: "Three steps, no tricks",
    description:
      "The mechanics are simple by design — and the important parts happen on our servers, not in your browser.",
    stepLabel: "step",
    steps: [
      {
        title: "Pick a prize",
        body: "Browse campaigns from verified sellers. Every listing shows its odds inputs: total entries, price, closing date and official rules.",
      },
      {
        title: "Get your entries",
        body: "Enter with a paid ticket, the free entry route where one applies, or by answering a qualifying skill question — depending on the campaign and your region.",
      },
      {
        title: "Verifiable draw",
        body: "At close, the eligible entry list is frozen and hashed, then a cryptographically secure draw selects the winner. You can audit the result on the draw's public page.",
      },
    ],
  },
  transparency: {
    eyebrow: "Transparency",
    title: "A draw you can check, not just trust",
    description:
      "Every completed draw publishes a verification record. No draw ever runs in a browser, and no one — including us — can silently re-run one.",
    items: [
      {
        title: "Frozen, hashed entry list",
        body: "Before selection, the eligible entries are snapshotted and hashed (SHA-256). The snapshot can never change after the draw.",
      },
      {
        title: "Cryptographic randomness",
        body: "Winners are selected server-side with a cryptographically secure random source — never Math.random(), never client code.",
      },
      {
        title: "Immutable audit trail",
        body: "Draw execution, verification and any strictly-controlled re-draw are recorded in an append-only audit log with named approvers.",
      },
    ],
    exampleLabel: "Example verification record",
    exampleNote:
      "Every completed campaign links to a public page like this one, with personal data masked.",
    browseDraws: "Browse draw records",
  },
  freeRoute: {
    cta: "How the free route works",
    note: "Free-route entries carry the same chances as paid entries in the same campaign.",
  },
  trust: {
    eyebrow: "Trust & safety",
    title: "Built like a marketplace, regulated like it matters",
    items: [
      {
        title: "Verified sellers",
        body: "Identity and business checks before a single listing goes live, plus proof of prize ownership.",
      },
      {
        title: "Territory aware",
        body: "Campaign formats are only offered where the rules of that territory allow them. No global defaults.",
      },
      {
        title: "Player protections",
        body: "Spending limits, pause periods and self-exclusion are built into your account settings.",
      },
      {
        title: "Human moderation",
        body: "Every campaign passes review; prohibited categories are blocked and appeals are handled by people.",
      },
    ],
  },
  testimonials: {
    eyebrow: "What members say",
    title: "Demonstration testimonials",
    items: [
      {
        quote:
          "I checked the draw hash against the published snapshot. It matched. That's why I keep entering here.",
        name: "A. Carter — demo persona",
      },
      {
        quote:
          "Used the free postal route for a watch competition and won. Same odds, no purchase — exactly as described.",
        name: "M. Osei — demo persona",
      },
      {
        quote:
          "As a seller, the payout statement shows every fee line by line. No surprises at settlement.",
        name: "J. Laurent — demo persona",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Common questions",
    items: [
      {
        question: "How are winners chosen?",
        answer:
          "When a campaign closes, the list of eligible entries is frozen and hashed, then a winner is selected server-side using a cryptographically secure random source. The draw record — including the snapshot hash — is published on a public verification page.",
      },
      {
        question: "Do I have to pay to enter?",
        answer:
          "Not where a free entry route applies. Campaigns that offer one accept free entries with the same chances as paid entries. Some campaigns are entirely free draws. Availability of each format depends on your territory's rules.",
      },
      {
        question: "Why can't I see or enter some campaigns?",
        answer:
          "Prize competitions are regulated differently in every country and region. A campaign is only shown as available where its configuration has been approved for that territory. If you're not eligible, we tell you clearly instead of letting you pay and disqualifying you later.",
      },
      {
        question: "How do winners receive their prize?",
        answer:
          "After the draw, the provisional winner is verified for eligibility, then chooses delivery or collection as set out in the campaign's handover policy. High-value items such as vehicles follow a documented transfer workflow. Everything is tracked until you confirm receipt.",
      },
      {
        question: "What happens if a campaign is cancelled?",
        answer:
          "If a campaign is cancelled before its draw, paid entries are refunded in full to the original payment method. Refund status is visible in your account, and our support team handles exceptions under the dispute resolution policy.",
      },
    ],
  },
  sellerCta: {
    eyebrow: "For sellers",
    title: "Turn one remarkable item into a campaign thousands can join",
    body: "{brand} handles entries, payments, compliance checks and the draw. You list the prize, we run the machinery — and you receive a transparent, line-by-line settlement.",
    start: "Start selling",
    standards: "Read the seller standards",
  },
  footer: {
    columns: {
      marketplace: "Marketplace",
      trust: "Trust",
      support: "Support",
      legal: "Legal",
    },
    links: {
      browse: "Browse competitions",
      winners: "Winners",
      howItWorks: "How it works",
      freeEntryRoute: "Free entry route",
      sell: "Sell with us",
      trustSafety: "Trust & safety",
      responsibleParticipation: "Responsible participation",
      sellerStandards: "Seller standards",
      prohibitedItems: "Prohibited items",
      drawVerification: "Draw verification",
      helpCentre: "Help centre",
      contact: "Contact",
      complaints: "Complaints",
      disputeResolution: "Dispute resolution",
      accessibility: "Accessibility",
      terms: "Terms of service",
      privacy: "Privacy policy",
      cookies: "Cookies",
      officialRules: "Official rules",
    },
    description:
      "An international marketplace for prize competitions, free draws and sweepstakes — with verified sellers, transparent server-side draws and a free entry route wherever one applies.",
    legalLine:
      "All legal documents on this site are templates pending review by qualified local counsel.",
    ageLine: "18+ or the minimum age in your territory. Please participate responsibly —",
    setLimits: "set your limits",
  },
  auth: {
    signIn: {
      title: "Welcome back",
      newHere: "New here?",
      createAccount: "Create an account",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot password?",
      submit: "Sign in",
    },
    signUp: {
      title: "Create your account",
      alreadyMember: "Already a member?",
      signIn: "Sign in",
      displayName: "Display name",
      displayNamePlaceholder: "How you'll appear publicly",
      email: "Email",
      password: "Password",
      passwordHint: "At least 10 characters with letters and a number.",
      acceptTermsPrefix: "I confirm I meet the minimum age requirement and accept the",
      termsOfService: "terms of service",
      marketingOptIn: "Email me about new competitions (optional)",
      submit: "Create account",
      inboxTitle: "Check your inbox",
      inboxBodyPrefix: "We sent a confirmation link to",
      inboxBodySuffix: ". Open it to activate your account.",
      backToSignIn: "Back to sign in",
    },
    disclaimer: {
      agePrefix: "18+ or the minimum age in your territory. By continuing you agree to our",
      terms: "terms",
      and: "and",
      privacy: "privacy policy",
    },
    userMenu: {
      menuLabel: "Account menu",
      settings: "Account settings",
      entries: "My entries",
      favourites: "Favourites",
      notifications: "Notifications",
      sellerDashboard: "Seller dashboard",
      becomeSeller: "Become a seller",
      admin: "Admin",
      signOut: "Sign out",
    },
  },
  localeSwitcher: {
    label: "Language",
  },
  campaign: {
    entries: "entries",
    of: "of",
    entryPrice: "Entry price",
    freeEntry: "Free entry route",
    endsIn: "Ends in",
    ended: "Ended",
    drawPending: "Draw pending",
    winnerAnnounced: "Winner announced",
    enterNow: "Enter now",
    viewRules: "Official rules",
    verifiedSeller: "Verified seller",
    prizeValue: "Prize value",
    maxPerUser: "Max per person",
    notEligibleTitle: "Not available in your region",
    notEligibleBody:
      "This competition is not open to entrants in your current location. Eligibility is set by the campaign's official rules and local law.",
    ageRestricted: "You must be {age}+ to enter",
    soldOut: "Sold out",
    drawVerification: "Draw verification",
  },
  entry: {
    quantity: "Number of entries",
    total: "Total",
    confirmEligibility: "I confirm I meet the age and residency requirements in the official rules",
    acceptRules: "I have read and accept the official rules and the refund policy",
    payAndEnter: "Pay and enter",
    enterFree: "Request free entry",
    skillQuestion: "Qualifying question",
    skillNotice: "You must answer correctly for your entry to qualify.",
    confirmed: "Entry confirmed",
    receipt: "Receipt",
  },
  status: {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under review",
    changes_requested: "Changes requested",
    approved: "Approved",
    scheduled: "Scheduled",
    active: "Live",
    paused: "Paused",
    sold_out: "Sold out",
    closing: "Closing",
    drawing: "Drawing",
    winner_pending: "Winner pending",
    winner_confirmed: "Winner confirmed",
    fulfilment: "Prize handover",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
    disputed: "Disputed",
  },
  common: {
    loading: "Loading",
    error: "Something went wrong",
    retry: "Try again",
    save: "Save changes",
    saved: "Saved",
    cancel: "Cancel",
    confirm: "Confirm",
    continue: "Continue",
    back: "Back",
    search: "Search",
    filters: "Filters",
    clearFilters: "Clear filters",
    noResults: "Nothing matches your filters",
    seeMore: "See more",
    optional: "optional",
    required: "Required",
    close: "Close",
    copied: "Copied to clipboard",
  },
  legal: {
    templateNotice:
      "This document is a template pending review by qualified local counsel. It does not constitute legal advice and must be approved before launch in any territory.",
    demoNotice: "Demonstration content — not a real testimonial.",
    noPurchaseNecessary: "No purchase necessary where a free entry route applies.",
  },
};

export type Dictionary = typeof enGB;

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
