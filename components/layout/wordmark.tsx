import Link from "next/link";
import { brand } from "@/lib/config/brand";
import { cn } from "@/lib/utils";

export function Wordmark({ className, asLink = true }: { className?: string; asLink?: boolean }) {
  const mark = (
    <span
      className={cn(
        "font-display inline-flex items-baseline text-xl font-bold tracking-tight select-none",
        className,
      )}
    >
      <span aria-hidden className="mr-1.5 inline-block size-2.5 translate-y-[-1px] rounded-full bg-accent" />
      {brand.wordmark.primary}
      <span className="text-primary">{brand.wordmark.secondary}</span>
    </span>
  );
  if (!asLink) return mark;
  return (
    <Link href="/" aria-label={`${brand.name} home`} className="rounded-md focus-visible:outline-2 focus-visible:outline-ring">
      {mark}
    </Link>
  );
}
