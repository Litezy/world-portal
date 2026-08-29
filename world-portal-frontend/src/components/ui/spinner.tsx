import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin text-current", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-4",
      md: "size-5",
      lg: "size-8",
      xl: "size-12",
    },
  },
  defaultVariants: { size: "md" },
});

export type SpinnerProps = React.ComponentProps<"svg"> &
  VariantProps<typeof spinnerVariants> & {
    /** Announced to screen readers; pass `null` when a visible label already exists. */
    label?: string | null;
  };

export function Spinner({
  className,
  size,
  label = "Loading",
  ...props
}: SpinnerProps) {
  return (
    <>
      <Loader2
        aria-hidden="true"
        className={cn(spinnerVariants({ size }), className)}
        {...props}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}

/** Centered spinner for route-level `loading.tsx` files and suspense fallbacks. */
export function FullPageSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[50vh] w-full items-center justify-center">
      <Spinner size="lg" className="text-primary" label={label} />
    </div>
  );
}
