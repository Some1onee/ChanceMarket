import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";
import { UserMenu } from "@/features/auth/components/user-menu";
import { getSessionUser } from "@/lib/auth/session";

const navLinks = [
  { href: "/campaigns", key: "browse" as const },
  { href: "/how-it-works", key: "howItWorks" as const },
  { href: "/winners", key: "winners" as const },
  { href: "/sell", key: "sell" as const },
];

export async function SiteHeader() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
              <Menu aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetTitle>
              <Wordmark asLink={false} />
            </SheetTitle>
            <nav className="mt-4 flex flex-col gap-1" aria-label="Main">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {t.nav[link.key]}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Wordmark />

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t.nav[link.key]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/campaigns" aria-label={t.common.search}>
              <Search aria-hidden />
            </Link>
          </Button>
          <ThemeToggle />
          {user ? (
            <UserMenu
              email={user.email ?? ""}
              displayName={user.displayName}
              avatarUrl={user.avatarUrl}
              isAdmin={user.roles.includes("admin") || user.roles.includes("super_admin")}
              isSeller={user.roles.includes("seller")}
            />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/sign-in">{t.nav.signIn}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">{t.nav.signUp}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
