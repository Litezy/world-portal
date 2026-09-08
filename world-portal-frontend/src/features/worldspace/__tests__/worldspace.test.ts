import { existsSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { WORLDSPACE } from "@/features/worldspace/config";
import { worldSpacePosts } from "@/features/worldspace/fixtures";

/**
 * Load the adapter with a given `WORLDSPACE_API_URL`.
 *
 * The adapter reads the variable per call, through `serverEnv()`, so
 * `vi.stubEnv` alone would do today. It is loaded through `vi.resetModules()`
 * and a dynamic import anyway — the same shape as
 * `src/server/__tests__/env.test.ts` — so that hoisting the read to module
 * scope later does not quietly turn these into tests of nothing.
 */
async function loadFeed(apiUrl?: string) {
  vi.resetModules();
  vi.stubEnv("WORLDSPACE_API_URL", apiUrl);
  const { getWorldSpaceFeed } = await import("@/server/worldspace/client");
  return getWorldSpaceFeed;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("worldspace fixtures", () => {
  it("gives every post a unique id", () => {
    const ids = worldSpacePosts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every photograph at a file that actually exists", () => {
    // A typo in the path renders a broken image with no error anywhere —
    // the section is nothing but photographs, so this is the whole feature.
    for (const post of worldSpacePosts) {
      expect(post.imageUrl, `${post.id} has no imageUrl`).toBeTruthy();
      expect(
        existsSync(join(process.cwd(), "public", post.imageUrl)),
        `${post.id}: missing public${post.imageUrl}`,
      ).toBe(true);
    }
  });

  it("points every avatar it does have at a file that actually exists", () => {
    // null is a supported value — those authors fall back to a monogram.
    for (const post of worldSpacePosts) {
      const avatar = post.author.avatarUrl;
      if (avatar === null) continue;
      expect(
        existsSync(join(process.cwd(), "public", avatar)),
        `${post.id}: missing public${avatar}`,
      ).toBe(true);
    }
  });

  it("describes every photograph, so the wall is not decorative-only", () => {
    for (const post of worldSpacePosts) {
      expect(post.imageAlt.trim(), `${post.id} has no imageAlt`).not.toBe("");
      // An alt that just repeats the caption tells a screen reader nothing new.
      expect(post.imageAlt, post.id).not.toBe(post.caption);
    }
  });

  it("gives every post a caption and between one and three tags", () => {
    for (const post of worldSpacePosts) {
      expect(post.caption.trim(), `${post.id} has no caption`).not.toBe("");
      expect(post.tags.length, `${post.id} tags`).toBeGreaterThanOrEqual(1);
      // More than three and the card's tag row wraps into the image.
      expect(post.tags.length, `${post.id} tags`).toBeLessThanOrEqual(3);
      for (const tag of post.tags) {
        expect(tag.trim(), `${post.id} has an empty tag`).not.toBe("");
      }
    }
  });

  it("keeps every permalink absolute and on the WorldSpace origin", () => {
    // The one failure mode that matters: a permalink quietly pointing back at
    // E-Embassy sends someone to a 404 on our own site instead of the post.
    const expected = new URL(WORLDSPACE.baseUrl).origin;
    for (const post of worldSpacePosts) {
      expect(
        () => new URL(post.url),
        `${post.id}: ${post.url} is not absolute`,
      ).not.toThrow();
      expect(new URL(post.url).origin, `${post.id}: ${post.url}`).toBe(expected);
      expect(post.url.startsWith(WORLDSPACE.baseUrl), `${post.id}: ${post.url}`).toBe(
        true,
      );
    }
  });

  it("names an author with a handle that carries no leading @", () => {
    // The UI adds the "@" — a handle that ships with one renders "@@name".
    for (const post of worldSpacePosts) {
      expect(post.author.name.trim(), `${post.id} has no author name`).not.toBe("");
      expect(post.author.handle.trim(), `${post.id} has no handle`).not.toBe("");
      expect(post.author.handle.startsWith("@"), `${post.id} handle`).toBe(false);
    }
  });

  it("places every post somewhere real, with a two-letter country code", () => {
    for (const post of worldSpacePosts) {
      expect(post.place.city.trim(), `${post.id} has no city`).not.toBe("");
      expect(post.place.country.trim(), `${post.id} has no country`).not.toBe("");
      expect(post.place.countryCode, `${post.id} country code`).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("dates every post in the past", () => {
    // "Posted in 3 days" is the tell that a fixture was written for a demo and
    // never revisited.
    const now = Date.now();
    for (const post of worldSpacePosts) {
      const at = new Date(post.postedAt).getTime();
      expect(Number.isNaN(at), `${post.id}: ${post.postedAt} is not a date`).toBe(
        false,
      );
      expect(at, `${post.id} is dated in the future`).toBeLessThanOrEqual(now);
    }
  });

  it("counts likes and comments as non-negative whole numbers", () => {
    for (const post of worldSpacePosts) {
      expect(Number.isInteger(post.likes), `${post.id} likes`).toBe(true);
      expect(post.likes, `${post.id} likes`).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(post.comments), `${post.id} comments`).toBe(true);
      expect(post.comments, `${post.id} comments`).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("getWorldSpaceFeed", () => {
  it("serves the fixtures, labelled as placeholder, with no API configured", async () => {
    const getWorldSpaceFeed = await loadFeed(undefined);
    const feed = await getWorldSpaceFeed();

    expect(feed.source).toBe("placeholder");
    expect(feed.posts.length).toBeGreaterThan(0);
    expect(Number.isNaN(new Date(feed.fetchedAt).getTime())).toBe(false);
  });

  it("respects the limit it is given", async () => {
    const getWorldSpaceFeed = await loadFeed(undefined);
    const feed = await getWorldSpaceFeed(3);

    expect(feed.posts).toHaveLength(3);
    expect(new Set(feed.posts.map((p) => p.id)).size).toBe(3);
  });

  it("still returns posts when asked for more than it has", async () => {
    const getWorldSpaceFeed = await loadFeed(undefined);
    const feed = await getWorldSpaceFeed(500);

    expect(feed.posts.length).toBeGreaterThan(0);
    expect(feed.posts.length).toBeLessThanOrEqual(worldSpacePosts.length);
  });

  it("falls back to placeholders instead of throwing when the fetch rejects", async () => {
    // This renders on the landing page. A WorldSpace outage must cost us a
    // section of sample photographs, not the home page.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);

    const getWorldSpaceFeed = await loadFeed("https://api.worldspace.example");
    const feed = await getWorldSpaceFeed();

    expect(fetchMock).toHaveBeenCalled();
    expect(feed.source).toBe("placeholder");
    expect(feed.posts.length).toBeGreaterThan(0);
    // The outage belongs in the server log, not on the page.
    expect(warn).toHaveBeenCalled();
  });

  it("falls back to placeholders when the payload is not the shape we expect", async () => {
    // The zod schema in the adapter is the contract with a service nobody has
    // written yet, so the first real payload will very likely not match.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ posts: [{ nope: true }] }),
      text: async () => '{"posts":[{"nope":true}]}',
    });
    vi.stubGlobal("fetch", fetchMock);

    const getWorldSpaceFeed = await loadFeed("https://api.worldspace.example");
    const feed = await getWorldSpaceFeed();

    expect(feed.source).toBe("placeholder");
    expect(feed.posts.length).toBeGreaterThan(0);
    expect(warn).toHaveBeenCalled();
  });
});
