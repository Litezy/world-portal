import { z } from "zod";

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

export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment = process.env.NODE_ENV === "development";
