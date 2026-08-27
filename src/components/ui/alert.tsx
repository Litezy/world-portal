import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  [
    "relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-lg border px-4 py-3.5 text-sm",
    "has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] has-[>svg]:gap-x-3",
    "[&>svg]:size-4.5 [&>svg]:translate-y-0.5",
  ],
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-info/25 bg-info/8 text-info [&>svg]:text-info",
        success: "border-success/25 bg-success/8 text-success [&>svg]:text-success",
        warning:
          "border-warning/35 bg-warning/12 text-warning-foreground [&>svg]:text-warning",
        destructive:
          "border-destructive/25 bg-destructive/8 text-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm opacity-90 [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { alertVariants };
