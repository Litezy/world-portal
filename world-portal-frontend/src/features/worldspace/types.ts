/**
 * The shape of a WorldSpace post as this app consumes it.
 *
 * WorldSpace is the sister platform under the same parent company (Tsion): a
 * social feed where travellers post about trips they have taken. It has no
 * public API yet, so `src/features/worldspace/fixtures.ts` supplies curated
 * placeholder posts in exactly this shape and `src/server/worldspace/client.ts`
 * is the single seam that swaps them for live ones.
 *
 * Everything downstream — the landing section, the cards, the tests — depends
 * only on these types. Widening one is fine; narrowing or renaming a field is a
 * change to the contract three other places are written against.
 */

export type WorldSpaceAuthor = {
  id: string;
  name: string;
  /** Without the leading "@" — the UI adds it. */
  handle: string;
  /** null is normal and supported: the avatar falls back to a monogram. */
  avatarUrl: string | null;
  verified: boolean;
};

export type WorldSpacePost = {
  id: string;
  /** Canonical permalink on WorldSpace. Absolute URL. */
  url: string;
  caption: string;
  imageUrl: string;
  imageAlt: string;
  author: WorldSpaceAuthor;
  place: { city: string; country: string; countryCode: string };
  /** ISO 8601. */
  postedAt: string;
  likes: number;
  comments: number;
  tags: readonly string[];
};

export type WorldSpaceFeed = {
  posts: WorldSpacePost[];
  /** "live" once a real API answers; "placeholder" while we ship fixtures. */
  source: "live" | "placeholder";
  /** ISO 8601. */
  fetchedAt: string;
};
