"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      // Light-only, matching the reference. Without this a stale `theme` in
      // localStorage — `localhost:3000` is shared with every other local
      // project — puts the app into a theme no screen was designed against.
      // Remove it in the same change that mounts a toggle.
      forcedTheme="light"
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
