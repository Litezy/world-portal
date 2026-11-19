import { isIP } from "node:net";

import { type ClientIpHeader, parseClientIpHeader } from "@/config/client-ip";

/**
 * The header that proves a call comes from this website's server.
 *
 * The World Portal API closes the routes this server calls on a visitor's
 * behalf (the agency portal, the console's helpers and the console's token
 * request) to everyone but holders of SERVICE_AUTH_KEY, which is the same
 * value as the API's own. It is read from the server environment on each
 * call and must never reach the browser.
 *
 * Read straight from `process.env` rather than `serverEnv()`: that one refuses
 * to run while a console password is unset, and the agency portal must not go
 * down over the admin console's settings. A key shorter than the API's
 * 32-character minimum would be refused anyway, so it isn't sent.
 */
export function serviceKeyHeaders(): Record<string, string> {
  const key = process.env.SERVICE_AUTH_KEY?.trim();
  return key && key.length >= 32 ? { "x-service-key": key } : {};
}

/**
 * Names the visitor a relayed call is for, so the API's rate limits count it
 * against them instead of against this server's one address (where every
 * visitor's OTP request would share a single bucket). The API only reads it
 * alongside a valid `x-service-key`. The console's sign-in throttle counts
 * failures by the same address.
 *
 * Only a header the deployment's own edge overwrites can be trusted: one it
 * passes through untouched is whatever the client typed, and a forged address
 * would let one visitor spread their attempts across as many buckets as they
 * like (or put someone else's address in the penalty box). So which header is
 * read is configured, with `CLIENT_IP_HEADER`, to the one this deployment's
 * proxy sets:
 *
 * - `x-vercel-forwarded-for` — Vercel's edge sets it.
 * - `cf-connecting-ip` — Cloudflare sets it. Use this whenever Cloudflare
 *   proxies the site (orange cloud), whatever runs behind it: the next proxy
 *   in then only sees Cloudflare's address.
 * - `x-real-ip` — set by nginx or Traefik (Coolify's proxy).
 * - `x-forwarded-for` — its LAST hop, the one the nearest proxy appended;
 *   anything to the left of it is whatever the client sent.
 *
 * Unset, it follows the platform: on Vercel (`VERCEL` set),
 * `x-vercel-forwarded-for` then `x-real-ip`; anywhere else `x-real-ip` then the
 * last `x-forwarded-for` hop, which Traefik behind Coolify both sets. Set, only
 * that one header is read, with no fallback. An unknown value sends nothing
 * (and warns) rather than guessing at a header a client could forge.
 *
 * Only a well-formed IPv4 or IPv6 address is sent. A list, a port or anything
 * else that doesn't parse sends nothing.
 */
export function visitorIpHeaders(request: Request): Record<string, string> {
  for (const header of trustedHeaders()) {
    const ip = readHeader(request, header);
    if (ip) return isIP(ip) ? { "x-visitor-ip": ip } : {};
  }
  return {};
}

/** Each bad setting is reported once, not on every relayed request. */
const warnedSettings = new Set<string>();

function trustedHeaders(): readonly ClientIpHeader[] {
  const configured = process.env.CLIENT_IP_HEADER?.trim();
  if (configured) {
    const header = parseClientIpHeader(configured);
    if (!header) {
      if (warnedSettings.has(configured)) return [];
      warnedSettings.add(configured);
      console.warn(
        `CLIENT_IP_HEADER="${configured}" is not one of x-vercel-forwarded-for, cf-connecting-ip, x-real-ip, x-forwarded-for; no visitor address is sent.`,
      );
      return [];
    }
    return [header];
  }
  return process.env.VERCEL
    ? ["x-vercel-forwarded-for", "x-real-ip"]
    : ["x-real-ip", "x-forwarded-for"];
}

function readHeader(request: Request, header: ClientIpHeader): string {
  const value = request.headers.get(header);
  if (!value) return "";
  return header === "x-forwarded-for"
    ? (value.split(",").pop()?.trim() ?? "")
    : value.trim();
}
