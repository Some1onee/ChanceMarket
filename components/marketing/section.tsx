import { cn } from "@/lib/utils";

export function Section({
  eyebrow,
  title,
  description,
  children,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20", className)}>
      {(eyebrow || title || description) && (
        <div
          className={cn("mb-10 max-w-2xl space-y-3", align === "center" && "mx-auto text-center")}
        >
          {eyebrow ? (
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">{eyebrow}</p>
          ) : null}
          {title ? (
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          ) : null}
          {description ? <p className="text-base text-muted-foreground">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  );
}
