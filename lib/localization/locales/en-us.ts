import type { DeepPartial, Dictionary } from "./en-gb";

/** en-US overrides only what differs from en-GB (spelling, market terminology). */
export const enUS: DeepPartial<Dictionary> = {
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
  footer: {
    links: {
      helpCentre: "Help center",
    },
  },
  auth: {
    userMenu: {
      favourites: "Favorites",
    },
  },
};
