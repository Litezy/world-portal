import { NestExpressApplication } from '@nestjs/platform-express';

/**
 * How many proxies in front of the API may be believed about the client's IP,
 * from TRUST_PROXY.
 *
 * Rate limits count anonymous callers by IP. Behind a proxy, the socket's
 * address is the proxy's, and the real client is in X-Forwarded-For, but any
 * client can send that header with any value. Trusting it blindly would let
 * anyone dodge every limit by making up a new address per request. So:
 *
 * - unset, empty, `0` or `false`: trust no proxy and use the socket address;
 * - a whole number N: trust the N nearest hops, and take the client IP from
 *   the address those proxies appended. Behind Coolify's Traefik that is 1;
 *   with Cloudflare in front of Traefik, 2.
 *
 * Anything else (`true`, subnets, names) is refused at boot rather than
 * guessed at, because `true` would believe every entry in the header.
 */
export function resolveTrustProxy(value: string | undefined): number | false {
  const trimmed = value?.trim() ?? '';
  if (trimmed === '' || trimmed === 'false') return false;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `TRUST_PROXY must be the number of proxies in front of the API (e.g. 1 behind Traefik), or unset for none. Got "${value}".`,
    );
  }
  const hops = Number(trimmed);
  return hops === 0 ? false : hops;
}

/** Applies TRUST_PROXY to Express, which then derives `req.ip` from it. */
export function applyTrustProxy(
  app: NestExpressApplication,
  value: string | undefined,
): void {
  app.set('trust proxy', resolveTrustProxy(value));
}
