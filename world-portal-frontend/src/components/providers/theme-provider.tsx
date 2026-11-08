"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      // `class` drives this app's own `.dark` tokens; `data-theme` drives the
      // design system's (src/ds), which reads data-theme="light|dark".
      attribute={["class", "data-theme"]}
      // Light is the site's face (Owen, 2026-11-08). The toggle still offers
      // dark and system.
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
