import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/dates";
import { getLocale } from "@/lib/localization/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  return { title: `Draw ${publicId} — verification` };
}

export default async function DrawVerificationPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const locale = await getLocale();
  const supabase = await getSupabaseServerClient();

  const { data: draw } = await supabase
    .from("draws")
    .select(
      "*, campaigns(title, slug), draw_snapshots!d_snapshot_fk(entries_count, snapshot_hash, created_at)",
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (!draw) notFound();

  const row = draw as unknown as typeof draw & {
    campaigns: { title: string; slug: string } | null;
    draw_snapshots: { entries_count: number; snapshot_hash: string; created_at: string } | null;
  };
  const snapshot = row.draw_snapshots;

  // Winner position derived from the revealed seed (same formula as SQL).
  let winnerPosition: number | null = null;
  if (row.random_seed && snapshot) {
    const value = BigInt(`0x${row.random_seed.slice(0, 16)}`) & ((1n << 63n) - 1n);
    winnerPosition = Number(value % BigInt(snapshot.entries_count)) + 1;
  }

  const { data: rerolls } = await supabase
    .from("draws")
    .select("public_id, reroll_reason, created_at")
    .eq("reroll_of", row.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 space-y-2">
        <Badge variant="accent">
          <ShieldCheck aria-hidden /> Public draw record
        </Badge>
        <h1 className="font-display text-3xl font-bold">Draw {row.public_id}</h1>
        {row.campaigns ? (
          <p className="text-muted-foreground">
            Campaign:{" "}
            <Link
              href={`/campaigns/${row.campaigns.slug}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              {row.campaigns.title}
            </Link>
          </p>
        ) : null}
      </div>

      <dl className="space-y-4">
        <div>
          <dt className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Status
          </dt>
          <dd>
            <Badge
              variant={
                row.status === "winner_verified"
                  ? "success"
                  : row.status === "rerolled"
                    ? "warning"
                    : "info"
              }
              className="capitalize"
            >
              {row.status.replaceAll("_", " ")}
            </Badge>
          </dd>
        </div>

        {snapshot ? (
          <>
            <div>
              <dt className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Frozen snapshot (SHA-256 of the ordered eligible entry list)
              </dt>
              <dd className="verification-strip">{snapshot.snapshot_hash}</dd>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Eligible entries
                </dt>
                <dd className="font-mono text-lg font-semibold">
                  {snapshot.entries_count.toLocaleString(locale)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Snapshot created
                </dt>
                <dd className="text-sm">{formatDateTime(snapshot.created_at, locale)}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Selection method
                </dt>
                <dd className="text-sm">Cryptographic RNG (pgcrypto), server-side</dd>
              </div>
            </div>
          </>
        ) : null}

        {row.random_seed ? (
          <>
            <div>
              <dt className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Selection seed (revealed after the draw)
              </dt>
              <dd className="verification-strip">{row.random_seed}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Seed hash (SHA-256, recorded at selection time)
              </dt>
              <dd className="verification-strip">{row.random_seed_hash}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Winning position
              </dt>
              <dd className="font-mono text-lg font-semibold">
                #{winnerPosition?.toLocaleString(locale)} of{" "}
                {snapshot?.entries_count.toLocaleString(locale)}
              </dd>
            </div>
            {row.selected_at ? (
              <div>
                <dt className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Selected at
                </dt>
                <dd className="text-sm">{formatDateTime(row.selected_at, locale)}</dd>
              </div>
            ) : null}
          </>
        ) : (
          <Alert>
            <AlertTitle>Selection pending</AlertTitle>
            <AlertDescription>
              The snapshot is frozen; the seed and winning position appear here the moment the
              selection runs.
            </AlertDescription>
          </Alert>
        )}
      </dl>

      {(rerolls ?? []).length > 0 ? (
        <Alert variant="warning" className="mt-8">
          <AlertTitle>This draw was re-run under the controlled re-draw procedure</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {(rerolls ?? []).map((reroll) => (
                <li key={reroll.public_id}>
                  Superseded by{" "}
                  <Link
                    href={`/draws/${reroll.public_id}`}
                    className="underline underline-offset-2"
                  >
                    {reroll.public_id}
                  </Link>{" "}
                  — reason: {reroll.reroll_reason ?? "recorded in the audit log"} (dual admin
                  approval required and logged).
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-10 space-y-3 rounded-xl border border-border bg-subtle p-5 text-sm text-muted-foreground">
        <h2 className="font-semibold text-foreground">How to verify</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            The snapshot hash is the SHA-256 of the ordered eligible entry list (
            <code className="font-mono text-xs">position:entry_id</code> lines). It was fixed before
            selection and cannot change afterwards.
          </li>
          <li>
            The winning position equals{" "}
            <code className="font-mono text-xs">
              (first 8 bytes of seed as unsigned int) mod {snapshot?.entries_count ?? "N"} + 1
            </code>
            . Recompute it from the revealed seed above.
          </li>
          <li>
            The seed hash proves the revealed seed is the one recorded at selection time. Winners
            are shown with personal data masked; entrants can match their own entry position from
            their receipts.
          </li>
        </ol>
      </div>
    </div>
  );
}
