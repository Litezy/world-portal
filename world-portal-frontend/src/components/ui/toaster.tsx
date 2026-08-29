"use client";

import { useTheme } from "next-themes";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Mounted once in the root provider tree; call `toast()` from anywhere. */
export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "system"}
      position="top-right"
      richColors
      closeButton
      duration={5000}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { toast } from "sonner";
