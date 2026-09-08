import { z } from "zod";

import { serverEnv } from "@/config/env";
import { worldSpacePosts } from "@/features/worldspace/fixtures";
import type { WorldSpaceFeed, WorldSpacePost } from "@/features/worldspace/types";

/**
 * The one seam between E-Embassy and WorldSpace.
 *
 * WorldSpace (Tsion's social platform) has no public API yet, so this returns
 * curated placeholder posts today. **Swapping to the live feed is one
 * variable**: set `WORLDSPACE_API_URL` to the API origin and confirm the real
 * payload satisfies `feedResponseSchema` below. Nothing else in the app —
 * not the section, not the cards, not the route handler — changes.
 *
 * If the real payload differs, adapt it *here* (rename fields into the schema,
 * or map after parsing). Never widen `WorldSpacePost`: three other places are
 * written against it.
 */

const DEFAULT_LIMIT = worldSpacePosts.length;
const REVALIDATE_SECONDS = 300;

/** Built from the types in `@/features/worldspace/types` — keep them in step. */
const postSchema = z.object({
  id: z.string().min(1),
  url: z.url(),
  caption: z.string(),
  imageUrl: z.string().min(1),
  imageAlt: z.string(),
  author: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    handle: z.string().min(1),
    avatarUrl: z.string().min(1).nullable(),
    verified: z.boolean(),
  }),
  place: z.object({
    city: z.string(),
    country: z.string(),
    countryCode: z.string(),
  }),
  postedAt: z.iso.datetime(),
  likes: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  tags: z.array(z.string()),
});

/** Accepts a bare array or the `{ data }` envelope most of our services use. */
const feedResponseSchema = z.union([
  z.array(postSchema),
  z.object({ data: z.array(postSchema) }).transform((body) => body.data),
  z.object({ posts: z.array(postSchema) }).transform((body) => body.posts),
]);

function take(posts: WorldSpacePost[], limit?: number): WorldSpacePost[] {
  if (limit === undefined) return posts.slice(0, DEFAULT_LIMIT);
  return posts.slice(0, Math.max(1, Math.min(limit, posts.length)));
}

function placeholderFeed(limit?: number): WorldSpaceFeed {
  return {
    posts: take(worldSpacePosts, limit),
    source: "placeholder",
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * The WorldSpace feed, or the placeholder posts.
 *
 * **This never throws and never returns an empty feed**, deliberately and
 * unconditionally. The landing page renders it at request/build time, so an
 * unreachable WorldSpace, a 500, a malformed payload or a schema change would
 * otherwise take down E-Embassy's home page — a marketing section is never
 * worth that. Every failure path logs a warning and falls back, so the outage
 * is visible in the server log rather than on the page.
 */
export async function getWorldSpaceFeed(limit?: number): Promise<WorldSpaceFeed> {
  let apiUrl: string | undefined;
  try {
    apiUrl = serverEnv().WORLDSPACE_API_URL;
  } catch {
    // serverEnv() throws on an invalid environment. The rest of the app will
    // surface that loudly; this section must not be the thing that does.
    apiUrl = undefined;
  }

  // Unset is the normal state until WorldSpace ships an API — not an error.
  if (!apiUrl) return placeholderFeed(limit);

  try {
    const url = new URL(`${apiUrl.replace(/\/+$/, "")}/posts`);
    url.searchParams.set("limit", String(limit ?? DEFAULT_LIMIT));

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.warn(
        `[worldspace] feed request failed with ${response.status}; using placeholder posts.`,
      );
      return placeholderFeed(limit);
    }

    const parsed = feedResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.warn(
        "[worldspace] feed payload did not match the expected shape; using placeholder posts.",
        z.treeifyError(parsed.error),
      );
      return placeholderFeed(limit);
    }

    // Typed on the way out, so a schema that drifts from the contract is a
    // typecheck error here rather than a runtime surprise in a component.
    const posts: WorldSpacePost[] = parsed.data;
    if (posts.length === 0) {
      console.warn("[worldspace] feed returned no posts; using placeholder posts.");
      return placeholderFeed(limit);
    }

    return {
      posts: take(posts, limit),
      source: "live",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("[worldspace] feed unreachable; using placeholder posts.", error);
    return placeholderFeed(limit);
  }
}
