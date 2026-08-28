import { z } from "zod";

const DEV_ADMIN_PASSWORD = "worldportal";
const DEV_SESSION_SECRET = "world-portal-dev-session-secret";

/**
 * Fail the build loudly on a missing/invalid env var instead of failing at
 * runtime in front of a user. Add new vars here, not scattered across the app.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so they must be referenced
 * as full literals (`process.env.NEXT_PUBLIC_X`) — never computed.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  /** World Portal API origin, including its `/api` prefix. */
  NEXT_PUBLIC_API_URL: z.url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
});

const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // Console credentials. The defaults exist so a fresh clone runs, and are
    // refused in production below — shipping them would publish the password.
    ADMIN_EMAIL: z.email().default("admin@worldportal.travel"),
    ADMIN_PASSWORD: z.string().min(8).default(DEV_ADMIN_PASSWORD),
    SESSION_SECRET: z.string().min(16).default(DEV_SESSION_SECRET),
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
    if (env.SESSION_SECRET === DEV_SESSION_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["SESSION_SECRET"],
        message:
          "Set SESSION_SECRET in production — the development default is public.",
      });
    }
  });

const clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
});

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
  const parsed = serverSchema.safeParse(process.env);
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
