import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "font-medium outline-none select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:ring-[3px] focus-visible:ring-ring/60",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /** Yellow water glass — the headline action. */
        primary: "glass-primary glass-3d text-primary-foreground",
        /** Near-black extruded pill, as used for "Explore All Locations". */
        ink: "glass-ink glass-3d text-white",
        /** Clear water glass over photography. */
        glass: "glass glass-3d text-foreground",
        /** Glass tinted dark, for pills sitting on bright imagery. */
        glassDark: "glass-dark glass-3d text-white",
        /** Flat white pill (the hero "Book Now" in the reference). */
        solid:
          "glass-3d bg-white text-ink-900 shadow-[0_1px_2px_rgba(12,14,18,0.10),0_10px_24px_-12px_rgba(12,14,18,0.45)]",
        outline:
          "border border-border bg-transparent transition-colors hover:bg-secondary",
        ghost: "transition-colors hover:bg-secondary",
        link: "text-foreground underline decoration-current underline-offset-4",
      },
      size: {
        sm: "h-9 rounded-full px-4 text-[13px]",
        md: "h-11 rounded-full px-5 text-sm",
        lg: "h-[52px] rounded-full px-7 text-[15px]",
        xl: "h-14 rounded-full px-9 text-base",
        icon: "size-11 rounded-full",
        "icon-sm": "size-9 rounded-full",
        "icon-lg": "size-[52px] rounded-full",
        /** Square-ish block button used inside cards and forms. */
        block: "h-[54px] w-full rounded-2xl px-6 text-[15px]",
      },
      fullWidth: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", fullWidth: false },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element instead of a <button> — e.g. wrap a next/link. */
    asChild?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  // `asChild` forwards to a single child, so a spinner + text would break it.
  const content = asChild ? (
    children
  ) : (
    <>
      {isLoading ? <Spinner size="sm" label={null} /> : leftIcon}
      {isLoading && loadingText ? loadingText : children}
      {!isLoading && rightIcon}
    </>
  );

  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={asChild ? undefined : disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { buttonVariants };
