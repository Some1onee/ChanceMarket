import { cn } from "@/lib/utils";

/**
 * Deterministic local gradient placeholder for campaigns without photos.
 * No third-party imagery — gradients are derived from the campaign id.
 */
const PALETTES = [
  ["#4338CA", "#0F766E"],
  ["#3730A3", "#0E7490"],
  ["#5B21B6", "#0F766E"],
  ["#1E40AF", "#115E59"],
  ["#4338CA", "#7C3AED"],
  ["#0F766E", "#155E75"],
] as const;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function CampaignPlaceholder({
  seed,
  label,
  className,
}: {
  seed: string;
  label?: string;
  className?: string;
}) {
  const palette = PALETTES[hashString(seed) % PALETTES.length] ?? PALETTES[0];
  const angle = 120 + (hashString(seed) % 120);
  return (
    <div
      role="img"
      aria-label={label ?? "Prize image placeholder"}
      className={cn("flex h-full w-full items-center justify-center", className)}
      style={{
        background: `linear-gradient(${angle}deg, ${palette[0]}cc, ${palette[1]}cc), radial-gradient(80% 80% at 30% 20%, #ffffff22, transparent)`,
      }}
    >
      {label ? (
        <span className="font-display px-4 text-center text-lg font-semibold text-white/85">
          {label}
        </span>
      ) : null}
    </div>
  );
}
