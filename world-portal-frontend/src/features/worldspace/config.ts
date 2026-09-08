import { env } from "@/config/env";

/**
 * Where WorldSpace lives, and how to link into it.
 *
 * The origin is a single env var (`NEXT_PUBLIC_WORLDSPACE_URL`) so pointing the
 * whole feature at staging, or at the real domain on launch day, is one line in
 * `.env.local`. Nothing here should ever be hardcoded in a component.
 */

/** Trailing slashes make `${baseUrl}/explore` into a double slash. Strip once. */
const baseUrl = env.NEXT_PUBLIC_WORLDSPACE_URL.replace(/\/+$/, "");

export const WORLDSPACE: {
  name: string;
  parent: string;
  baseUrl: string;
  exploreUrl: string;
} = {
  name: "WorldSpace",
  parent: "Tsion",
  baseUrl,
  /** Where "see more on WorldSpace" goes — the travel feed, not the home page. */
  exploreUrl: `${baseUrl}/explore/travel`,
};

/**
 * The canonical permalink for a post id.
 *
 * The fixtures build their `url` with this, so a placeholder link and a live
 * one are produced by the same rule and cannot drift apart. If WorldSpace ever
 * changes its permalink shape, change it here and every link follows.
 */
export function worldSpacePostUrl(id: string): string {
  return `${WORLDSPACE.baseUrl}/p/${encodeURIComponent(id)}`;
}
