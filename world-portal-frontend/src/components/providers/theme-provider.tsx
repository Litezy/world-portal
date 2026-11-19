"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
      // Our own key: localhost:3000 is shared with other local projects, and a
      // generic `theme` one of them wrote used to flip this app's mode.
      storageKey="e-embassy-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
