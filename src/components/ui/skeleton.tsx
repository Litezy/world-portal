import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const skeletonVariants = cva("animate-pulse bg-muted", {
  variants: {
    shape: {
      block: "rounded-md",
      text: "h-4 rounded",
      circle: "rounded-full",
      pill: "rounded-full",
    },
  },
  defaultVariants: { shape: "block" },
});

export type SkeletonProps = React.ComponentProps<"div"> &
  VariantProps<typeof skeletonVariants>;

export function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
      {...props}
    />
  );
}

/** Multi-line paragraph placeholder; the last line is short so it reads as text. */
export function SkeletonText({
  lines = 3,
  className,
  ...props
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shape="text"
          className={i === lines - 1 ? "w-3/5" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-4 rounded-xl border border-border bg-card p-5", className)}
    >
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton shape="text" className="h-5 w-2/3" />
        <SkeletonText lines={2} />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" className="size-9" />
        <Skeleton shape="text" className="w-24" />
      </div>
    </div>
  );
}

export function SkeletonList({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton shape="circle" className="size-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton shape="text" className="w-1/3" />
            <Skeleton shape="text" className="w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
