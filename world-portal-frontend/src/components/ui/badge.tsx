import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full font-medium",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  ],
  {
    variants: {
      variant: {
        /** White pill with a dot — the eyebrow used above every section heading. */
        eyebrow: "bg-card text-foreground border border-border/60 shadow-[0_2px_10px_-4px_rgba(12,14,18,0.30)] dark:shadow-none",
        glass: "glass text-foreground",
        glassDark: "glass-dark text-white",
        solid: "bg-primary text-primary-foreground",
        outline: "border border-border text-foreground",
        muted: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-success-foreground",
        /**
         * Tinted status tones for dense surfaces (the console tables), where a
         * solid fill on every row would shout. Always pair with `dot` and a
         * word, so the colour is never the only signal.
         */
        softSuccess: "bg-success-wash text-success-text font-medium",
        softWarning: "bg-warning-wash text-warning-text font-medium",
        softDestructive: "bg-destructive-wash text-destructive-text font-medium",
        softInfo: "bg-info-wash text-info-text font-medium",
        softNeutral: "bg-muted text-muted-foreground font-medium",
      },
      size: {
        sm: "h-6 px-2.5 text-[11px]",
        md: "h-8 px-3.5 text-xs",
        lg: "h-9 px-4 text-[13px]",
      },
    },
    defaultVariants: { variant: "eyebrow", size: "md" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    /** Leading dot, as in "• Destinations". */
    dot?: boolean;
    dotClassName?: string;
  };

export function Badge({
  className,
  variant,
  size,
  asChild = false,
  dot = false,
  dotClassName,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full bg-current", dotClassName)}
        />
      ) : null}
      {children}
    </Comp>
  );
}

export { badgeVariants };
