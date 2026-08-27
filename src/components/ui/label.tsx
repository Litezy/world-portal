"use client";

import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { required?: boolean }) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-px text-[13px] leading-none font-semibold tracking-tight select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    >
      {props.children}
      {required ? (
        <span aria-hidden="true" className="text-ink-900">
          *
        </span>
      ) : null}
    </LabelPrimitive.Root>
  );
}
