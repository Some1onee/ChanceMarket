"use client";

import * as React from "react";
import { countdownTo } from "@/lib/dates";

/**
 * Honest countdown: derived from the campaign's real end timestamp on every
 * tick. It never resets, never re-anchors, and shows the end date for
 * screen-reader users.
 */
export function CampaignCountdown({ endsAt }: { endsAt: string }) {
  const [parts, setParts] = React.useState(() => countdownTo(endsAt));

  React.useEffect(() => {
    const timer = setInterval(() => setParts(countdownTo(endsAt)), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (parts.isPast) {
    return <p className="text-sm font-medium text-muted-foreground">Entries closed</p>;
  }

  const cells = [
    { label: "days", value: parts.days },
    { label: "hrs", value: parts.hours },
    { label: "min", value: parts.minutes },
    { label: "sec", value: parts.seconds },
  ];

  return (
    <div
      role="timer"
      aria-label={`Closes ${new Date(endsAt).toLocaleString()}`}
      className="flex items-center gap-2"
    >
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex min-w-14 flex-col items-center rounded-lg bg-subtle px-2 py-1.5"
        >
          <span className="font-mono text-lg font-semibold tabular-nums">
            {String(cell.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  );
}
