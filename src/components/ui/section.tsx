import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sectionVariants = cva("relative w-full", {
  variants: {
    spacing: {
      none: "",
      sm: "py-14 sm:py-16",
      md: "py-16 sm:py-20 lg:py-24",
      lg: "py-20 sm:py-28 lg:py-32",
    },
    tone: {
      default: "bg-background",
      /** The soft grey behind Testimonials and FAQ. */
      muted: "bg-ink-100",
      ink: "bg-ink-950 text-white",
      none: "",
    },
  },
  defaultVariants: { spacing: "md", tone: "default" },
});

export type SectionProps = React.ComponentProps<"section"> &
  VariantProps<typeof sectionVariants>;

export function Section({ className, spacing, tone, ...props }: SectionProps) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ spacing, tone }), className)}
      {...props}
    />
  );
}

export { sectionVariants };
