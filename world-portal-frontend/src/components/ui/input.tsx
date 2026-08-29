"use client";

import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  [
    "flex w-full min-w-0 rounded-xl border border-border/70 bg-field/70 text-foreground",
    "placeholder:text-muted-foreground/70",
    "transition-[color,box-shadow,border-color,background-color] outline-none",
    "focus-visible:border-ring/60 focus-visible:bg-field-focus focus-visible:ring-[3px] focus-visible:ring-ring/25",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "aria-invalid:border-destructive/60 aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
  ],
  {
    variants: {
      size: {
        sm: "h-9 px-3 text-[13px]",
        md: "h-11 px-3.5 text-sm",
        lg: "h-12 px-4 text-[15px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants> & {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };

export function Input({
  className,
  type = "text",
  size,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  const input = (
    <input
      data-slot="input"
      type={type}
      className={cn(
        inputVariants({ size }),
        leftIcon && "pl-10",
        rightIcon && "pr-10",
        className,
      )}
      {...props}
    />
  );

  if (!leftIcon && !rightIcon) return input;

  return (
    <div className="relative w-full">
      {leftIcon ? (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted-foreground [&_svg]:size-4">
          {leftIcon}
        </span>
      ) : null}
      {input}
      {rightIcon ? (
        <span className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground [&_svg]:size-4">
          {rightIcon}
        </span>
      ) : null}
    </div>
  );
}

export { inputVariants };
