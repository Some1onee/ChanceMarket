import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { brand } from "@/lib/config/brand";
import { getDictionary, type Dictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";

type FooterLinkKey = keyof Dictionary["footer"]["links"];

const columns: {
  titleKey: keyof Dictionary["footer"]["columns"];
  links: { labelKey: FooterLinkKey; href: string }[];
}[] = [
  {
    titleKey: "marketplace",
    links: [
      { labelKey: "browse", href: "/campaigns" },
      { labelKey: "winners", href: "/winners" },
      { labelKey: "howItWorks", href: "/how-it-works" },
      { labelKey: "freeEntryRoute", href: "/free-entry-route" },
      { labelKey: "sell", href: "/sell" },
    ],
  },
  {
    titleKey: "trust",
    links: [
      { labelKey: "trustSafety", href: "/trust-safety" },
      { labelKey: "responsibleParticipation", href: "/responsible-participation" },
      { labelKey: "sellerStandards", href: "/seller-standards" },
      { labelKey: "prohibitedItems", href: "/prohibited-items" },
      { labelKey: "drawVerification", href: "/draws" },
    ],
  },
  {
    titleKey: "support",
    links: [
      { labelKey: "helpCentre", href: "/help" },
      { labelKey: "contact", href: "/contact" },
      { labelKey: "complaints", href: "/complaints" },
      { labelKey: "disputeResolution", href: "/dispute-resolution" },
      { labelKey: "accessibility", href: "/accessibility" },
    ],
  },
  {
    titleKey: "legal",
    links: [
      { labelKey: "terms", href: "/terms" },
      { labelKey: "privacy", href: "/privacy" },
      { labelKey: "cookies", href: "/cookies" },
      { labelKey: "officialRules", href: "/official-rules" },
    ],
  },
];

export async function SiteFooter() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <footer className="border-t border-border bg-subtle">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-3">
            <Wordmark />
            <p className="max-w-xs text-sm text-muted-foreground">{t.footer.description}</p>
          </div>
          {columns.map((col) => (
            <nav
              key={col.titleKey}
              aria-label={t.footer.columns[col.titleKey]}
              className="space-y-3"
            >
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t.footer.columns[col.titleKey]}
              </h2>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t.footer.links[link.labelKey]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. {t.footer.legalLine}
          </p>
          <p>
            {t.footer.ageLine}{" "}
            <Link
              href="/responsible-participation"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t.footer.setLimits}
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
