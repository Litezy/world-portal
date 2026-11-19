/**
 * The headers `CLIENT_IP_HEADER` may name — see `visitorIpHeaders()` in
 * `src/server/api/service-key.ts` for what each one means and when to pick it.
 *
 * Its own module, free of Node imports, because both that server helper and
 * `src/config/env.ts` (which the browser bundle also loads) read it.
 */
export const CLIENT_IP_HEADERS = [
  "x-vercel-forwarded-for",
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
] as const;

export type ClientIpHeader = (typeof CLIENT_IP_HEADERS)[number];

/** Lower-cased and trimmed, or `null` when it is not one of the allowed names. */
export function parseClientIpHeader(value: string): ClientIpHeader | null {
  const name = value.trim().toLowerCase();
  return (CLIENT_IP_HEADERS as readonly string[]).includes(name)
    ? (name as ClientIpHeader)
    : null;
}
