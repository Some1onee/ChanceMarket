import type { Locale } from "@/lib/config/brand";

/**
 * Centralized UI strings. en-GB is the source of truth; other locales
 * override only what differs. Marketing terminology adapts per market
 * (e.g. "prize draw" vs "sweepstakes").
 */

const enGB = {
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
    searchPlaceholder: "Search prizes — bikes, watches, consoles…",
    browseAll: "Browse all competitions",
    featured: "Featured competitions",
    endingSoon: "Ending soon",
    categories: "Popular categories",
    freeRouteTitle: "There is always a route in",
    freeRouteBody:
      "Where the law and campaign rules provide one, every paid competition offers a free entry route with equal chances. No purchase is ever secretly required.",
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

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

const enUS: DeepPartial<typeof enGB> = {
  nav: {
    favourites: "Favorites",
  },
  home: {
    heroSubtitle:
      "A marketplace of verified sweepstakes and prize competitions — every result decided by an auditable server-side drawing you can verify yourself.",
  },
  campaign: {
    drawVerification: "Drawing verification",
  },
};

export type Dictionary = typeof enGB;

function deepMerge<T extends Record<string, unknown>>(base: T, override: DeepPartial<T>): T {
  const out = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const value = override[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = deepMerge(
        base[key] as Record<string, unknown>,
        value as DeepPartial<Record<string, unknown>>,
      ) as T[keyof T];
    } else if (value !== undefined) {
      out[key] = value as T[keyof T];
    }
  }
  return out;
}

const dictionaries: Record<Locale, Dictionary> = {
  "en-GB": enGB,
  "en-US": deepMerge(enGB, enUS),
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries["en-GB"];
}
