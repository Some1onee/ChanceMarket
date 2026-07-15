import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-soft text-primary",
        accent: "border-transparent bg-accent-soft text-accent",
        neutral: "border-border bg-subtle text-muted-foreground",
        success: "border-transparent bg-success/12 text-success dark:bg-success/15",
        warning: "border-transparent bg-warning/12 text-warning dark:bg-warning/15",
        destructive: "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/15",
        info: "border-transparent bg-info/10 text-info dark:bg-info/15",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
