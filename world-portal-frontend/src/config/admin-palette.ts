/**
 * The admin's colour choice, on top of light/dark (next-themes):
 * E-Embassy blue, or WorldStreet gold (the `html[data-palette="worldstreet"]`
 * block in globals.css). Kept in a cookie rather than localStorage so the
 * server can paint the right colours on the first frame, with no flash.
 */
export const ADMIN_PALETTES = ["embassy", "worldstreet"] as const;

export type AdminPalette = (typeof ADMIN_PALETTES)[number];

export const ADMIN_PALETTE_COOKIE = "e-embassy-admin-palette";

export const DEFAULT_ADMIN_PALETTE: AdminPalette = "embassy";

/** Anything that isn't a known palette — absent, tampered, stale — is the default. */
export function parseAdminPalette(value: string | null | undefined): AdminPalette {
  return ADMIN_PALETTES.find((palette) => palette === value) ?? DEFAULT_ADMIN_PALETTE;
}

/** The cookie the menu writes: a year, the whole site (the API routes don't read it). */
export function adminPaletteCookie(palette: AdminPalette) {
  return `${ADMIN_PALETTE_COOKIE}=${palette}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * Sets the palette on <html> before the page paints. Inline on purpose: it is
 * the first thing in the admin layouts' markup, so the browser runs it while
 * parsing, ahead of the first frame. The value is from `parseAdminPalette`,
 * never raw input, and is JSON-encoded besides.
 */
export function adminPaletteScript(palette: AdminPalette) {
  return `document.documentElement.dataset.palette=${JSON.stringify(palette)};`;
}
