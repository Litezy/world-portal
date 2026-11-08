/**
 * The E-Embassy mark's two wings, redrawn as vector from the original artwork
 * (`public/images/E-EMBASSY_MAIN_AW.svg`, a raster wrapped in an SVG) on an
 * 880 × 406 grid. The one source for every place the mark is drawn: the
 * `Logo` lockup, the social share image, and the app icons in `src/app`
 * (rendered from these paths: a blue tile with a white upper wing and a
 * cyan lower one).
 */
export const LOGO_GRID = { width: 884, height: 406 } as const;

/** The deep blue upper wing (#0050C0), sweeping in from the left. */
export const WING_UPPER = "M0 14 L880 2 C764 54 566 152 362 150 C222 148 112 96 0 22 Z";

/** The cyan lower wing (#00B8F8), sliding out from under the blue one. */
export const WING_LOWER =
  "M880 6 L694 404 C606 356 522 306 522 238 C522 168 596 118 712 76 Z";

/** The thin red edge along the top of the upper wing. */
export const EDGE_UPPER = "M0 14 L880 2 L880 0 L0 6 Z";

/** The thin gold (WorldStreet) edge along the lower wing. */
export const EDGE_LOWER = "M880 6 L694 404 L703 402 L884 10 Z";
