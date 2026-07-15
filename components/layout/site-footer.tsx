import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { brand } from "@/lib/config/brand";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse competitions", href: "/campaigns" },
      { label: "Winners", href: "/winners" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Free entry route", href: "/free-entry-route" },
      { label: "Sell with us", href: "/sell" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Trust & safety", href: "/trust-safety" },
      { label: "Responsible participation", href: "/responsible-participation" },
      { label: "Seller standards", href: "/seller-standards" },
      { label: "Prohibited items", href: "/prohibited-items" },
      { label: "Draw verification", href: "/draws" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Complaints", href: "/complaints" },
      { label: "Dispute resolution", href: "/dispute-resolution" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
      { label: "Official rules", href: "/official-rules" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-subtle">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-3">
            <Wordmark />
            <p className="max-w-xs text-sm text-muted-foreground">{brand.description}</p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="space-y-3">
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {col.title}
              </h2>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. All legal documents on this site are
            templates pending review by qualified local counsel.
          </p>
          <p>
            18+ or the minimum age in your territory. Please participate responsibly —{" "}
            <Link href="/responsible-participation" className="underline underline-offset-2 hover:text-foreground">
              set your limits
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
