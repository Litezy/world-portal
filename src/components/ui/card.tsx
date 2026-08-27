import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva("relative flex flex-col", {
  variants: {
    variant: {
      /** Water glass — the default surface across the site. */
      glass: "glass text-card-foreground",
      /** Glass tinted dark, for panels over bright photography. */
      glassDark: "glass-dark text-white",
      /** Opaque white, for surfaces that sit on plain backgrounds. */
      solid:
        "bg-card text-card-foreground shadow-[0_1px_2px_rgba(12,14,18,0.05),0_12px_28px_-16px_rgba(12,14,18,0.22)]",
      outlined: "border border-border bg-card text-card-foreground",
      ghost: "",
    },
    radius: {
      md: "rounded-xl",
      lg: "rounded-2xl",
      xl: "rounded-3xl",
      "2xl": "rounded-[2.25rem]",
    },
    padding: {
      none: "",
      sm: "gap-3 p-4",
      md: "gap-4 p-6",
      lg: "gap-6 p-8",
    },
    /** Lifts on hover. Use for cards that are links. */
    interactive: { true: "glass-3d cursor-pointer", false: "" },
  },
  defaultVariants: {
    variant: "glass",
    radius: "xl",
    padding: "md",
    interactive: false,
  },
});

export type CardProps = React.ComponentProps<"div"> & VariantProps<typeof cardVariants>;

export function Card({
  className,
  variant,
  radius,
  padding,
  interactive,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, radius, padding, interactive }), className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg leading-tight font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-auto flex items-center gap-3", className)}
      {...props}
    />
  );
}

export { cardVariants };
