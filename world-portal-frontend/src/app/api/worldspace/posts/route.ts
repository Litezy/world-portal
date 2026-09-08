import { NextResponse } from "next/server";

import { z } from "zod";

import { getWorldSpaceFeed } from "@/server/worldspace/client";

/**
 * GET /api/worldspace/posts — the same-origin seam for the WorldSpace feed.
 *
 * **This is not dead code, and the landing section not calling it is the
 * point.** That section is a Server Component and calls `getWorldSpaceFeed()`
 * directly, which is faster and needs no round trip. This handler exists so
 * anything that has to fetch from the *browser* later — "load more", a refresh
 * button, a client carousel — has a server-side endpoint to call, keeping the
 * WorldSpace API origin and any key it eventually requires off the client.
 * Delete it only alongside whatever replaces that guarantee.
 */

/**
 * A bad `?limit=` is ignored, never a 500: this endpoint feeds decoration, and
 * an unparseable query string should still return posts.
 */
const limitSchema = z.coerce.number().int().min(1).max(24);

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("limit");
  const parsed = raw === null ? null : limitSchema.safeParse(raw);
  const limit = parsed?.success ? parsed.data : undefined;

  const feed = await getWorldSpaceFeed(limit);

  return NextResponse.json({ data: feed });
}
