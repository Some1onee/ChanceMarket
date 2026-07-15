"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Global error boundary. Shows no internal details — errors are logged
 * server-side with a correlation id.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("client_error_boundary", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The error has been recorded{error.digest ? ` (ref ${error.digest})` : ""}. Please try
          again — if it keeps happening, contact support with the reference.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
