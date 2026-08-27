import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full", {
  variants: {
    size: {
      /** Text-width column, e.g. centred section intros. */
      prose: "max-w-2xl",
      /** Default page gutter — cards, grids, headings. */
      content: "max-w-[1200px]",
      /** Inset rounded panels (Why Us, Journey) sit slightly wider. */
      panel: "max-w-[1420px]",
      full: "max-w-none",
    },
    gutter: {
      none: "",
      sm: "px-4 sm:px-5",
      md: "px-5 sm:px-8",
      lg: "px-5 sm:px-10 lg:px-14",
    },
  },
  defaultVariants: { size: "content", gutter: "md" },
});

export type ContainerProps = React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants> & { as?: React.ElementType };

export function Container({
  className,
  size,
  gutter,
  as: Comp = "div",
  ...props
}: ContainerProps) {
  return (
    <Comp
      data-slot="container"
      className={cn(containerVariants({ size, gutter }), className)}
      {...props}
    />
  );
}

export { containerVariants };
