"use client";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-xl border border-border/70 bg-field/70 px-3.5 py-3 text-sm text-foreground",
        "placeholder:text-muted-foreground/70",
        "transition-[color,box-shadow,border-color,background-color] outline-none",
        "focus-visible:border-ring/60 focus-visible:bg-field-focus focus-visible:ring-[3px] focus-visible:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-destructive/60 aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}
