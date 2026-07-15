import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Wordmark />
      <div className="space-y-2">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="font-display text-3xl font-bold">This page doesn&apos;t exist</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The competition may have ended, or the link may be wrong. Browse what&apos;s live instead.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/campaigns">Browse competitions</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
