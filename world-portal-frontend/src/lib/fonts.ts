import { Fraunces, Manrope, Playfair_Display } from "next/font/google";

/**
 * Body + UI: Manrope, the WorldStreet design system's face. It has no ₦, so
 * the root layout loads that single glyph from Noto Sans.
 */
export const fontSans = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans-family",
});

/**
 * Display serif. Only ever used in italic, for the second half of a heading
 * ("Visas, without the *guesswork.*") and the footer's oversized DISCOVER wordmark.
 */
export const fontDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  style: ["italic", "normal"],
  weight: ["400", "500", "600"],
  variable: "--font-display-family",
});

/**
 * The wordmark only. Fraunces' `SOFT` and `WONK` axes give the logo a voice of
 * its own without dragging that personality into headings or body copy.
 */
export const fontLogo = Fraunces({
  subsets: ["latin"],
  display: "swap",
  // Loaded variable (no `weight`) so the SOFT and WONK axes stay addressable —
  // they are what give the wordmark its character. Weight is set in CSS.
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-logo-family",
});

export const fontVariables = `${fontSans.variable} ${fontDisplay.variable} ${fontLogo.variable}`;
