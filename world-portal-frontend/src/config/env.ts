import { z } from "zod";

const DEV_ADMIN_PASSWORD = "worldportal";
const DEV_AGENCY_PASSWORD = "worldportal-agency";
const DEV_SESSION_SECRET = "world-portal-dev-session-secret";

/**
 * A variable that is *declared* but left blank arrives as `""`, not as absent —
 * this is what Vercel and most CI do, and it is the difference between a build
 * that works locally and one that dies on deploy. zod's `.default()` and
 * `.optional()` only fire on `undefined`, so `""` skips the fallback and then
 * fails `z.url()` instead. Normalise blanks to absent before parsing.
 *
 * This is not hypothetical: an empty NEXT_PUBLIC_SITE_URL reached
 * `new URL(siteConfig.url)` in the root layout and failed a Vercel build with
 * ERR_INVALID_URL.
 */
function withoutBlanks(source: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? undefined : value,
    ]),
  );
}

/**
 * Where the site is served from. Explicit configuration wins; on Vercel we can
 * infer the deployment's own origin, so a preview or a first deploy works with
 * nothing set at all; localhost is the last resort.
 *
 * `NEXT_PUBLIC_VERCEL_URL` carries a bare host with no scheme.
 */
function defaultSiteUrl() {
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

/**
 * Fail the build loudly on a missing/invalid env var instead of failing at
 * runtime in front of a user. Add new vars here, not scattered across the app.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so they must be referenced
 * as full literals (`process.env.NEXT_PUBLIC_X`) — never computed.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default(defaultSiteUrl),
  /** World Portal API origin, including its `/api` prefix. */
  NEXT_PUBLIC_API_URL: z.url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  /**
   * WorldSpace — the sister social platform under the same parent (Tsion).
   * Public origin only: it is where a post card sends the visitor.
   *
   * The default is an obvious placeholder, not a guess at the real domain.
   * Set this to the real WorldSpace origin before launch.
   */
  NEXT_PUBLIC_WORLDSPACE_URL: z.url().default("https://worldspace.example"),
  /**
   * WorldStreet — the parent platform, and the only place anyone signs in.
   * E-Embassy has no login of its own: it shares WorldStreet's Clerk instance
   * (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY, read by Clerk
   * directly) and sends signed-out applicants to these pages with a
   * `redirect_url` back to where they were going.
   */
  NEXT_PUBLIC_WORLDSTREET_URL: z.url().default("https://www.worldstreetgold.com"),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z
    .url()
    .default("https://www.worldstreetgold.com/login"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z
    .url()
    .default("https://www.worldstreetgold.com/register"),
});

const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /**
     * The World Portal API, including its `/api` prefix. Server-side only:
     * the console proxies through route handlers so the access token never
     * reaches the browser. Falls back to the public value so one variable is
     * enough in development.
     */
    WORLD_PORTAL_API_URL: z
      .url()
      // Same blank trap as above: a declared-but-empty NEXT_PUBLIC_API_URL
      // would otherwise become an empty default and fail `z.url()`.
      .default(
        () => process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000/api",
      ),
    // Console credentials. The defaults exist so a fresh clone runs, and are
    // refused in production below — shipping them would publish the password.
    ADMIN_EMAIL: z.email().default("admin@worldportal.travel"),
    ADMIN_PASSWORD: z.string().min(8).default(DEV_ADMIN_PASSWORD),
    SESSION_SECRET: z.string().min(16).default(DEV_SESSION_SECRET),
    /**
     * The agency console (/agency). One shared password against the fixture
     * agencies — the same stop-gap as ADMIN_PASSWORD, and refused in
     * production below for the same reason. See src/server/agency/auth.ts.
     */
    AGENCY_PASSWORD: z.string().min(8).default(DEV_AGENCY_PASSWORD),
    /**
     * The future WorldSpace posts API origin. Optional on purpose: absent
     * means the feed falls back to the curated placeholder posts, which is a
     * supported state, not a misconfiguration. Server-side only so any key the
     * API eventually needs never reaches the browser.
     */
    WORLDSPACE_API_URL: z.url().optional(),
    /**
     * Vivid voice — Sira, WorldStreet's voice session broker. The key is the
     * same one the WorldStreet app uses and is read only by
     * `src/server/vivid/sira.ts`; the browser only ever sees a single-use
     * session token. Unset means the orb answers "unavailable", nothing more.
     */
    SIRA_API_KEY: z.string().min(1).optional(),
    SIRA_API_URL: z.url().optional(),
    /**
     * Vivid is free on E-Embassy today. "true" makes it honour WorldStreet's
     * paid Vivid subscription instead — see `src/server/vivid/access.ts`.
     */
    VIVID_REQUIRE_SUBSCRIPTION: z.enum(["true", "false"]).default("false"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;

    if (env.ADMIN_PASSWORD === DEV_ADMIN_PASSWORD) {
      ctx.addIssue({
        code: "custom",
        path: ["ADMIN_PASSWORD"],
        message:
          "Set ADMIN_PASSWORD in production — the development default is public.",
      });
    }
    if (env.AGENCY_PASSWORD === DEV_AGENCY_PASSWORD) {
      ctx.addIssue({
        code: "custom",
        path: ["AGENCY_PASSWORD"],
        message:
          "Set AGENCY_PASSWORD in production — the development default is public.",
      });
    }
    if (env.SESSION_SECRET === DEV_SESSION_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["SESSION_SECRET"],
        message:
          "Set SESSION_SECRET in production — the development default is public.",
      });
    }
  });

const clientEnv = clientSchema.safeParse(
  withoutBlanks({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_WORLDSPACE_URL: process.env.NEXT_PUBLIC_WORLDSPACE_URL,
    NEXT_PUBLIC_WORLDSTREET_URL: process.env.NEXT_PUBLIC_WORLDSTREET_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  }),
);

if (!clientEnv.success) {
  console.error(
    "Invalid public environment variables:",
    z.treeifyError(clientEnv.error),
  );
  throw new Error("Invalid public environment variables");
}

export const env = clientEnv.data;

/** Server-only. Importing this from a client component is a build error. */
export function serverEnv() {
  const parsed = serverSchema.safeParse(withoutBlanks(process.env));
  if (!parsed.success) {
    console.error(
      "Invalid server environment variables:",
      z.treeifyError(parsed.error),
    );
    throw new Error("Invalid server environment variables");
  }
  return parsed.data;
}

export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment = process.env.NODE_ENV === "development";
