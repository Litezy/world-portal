import { createHash, timingSafeEqual } from 'crypto';

/**
 * The value `.env.example` ships for local development, so a fresh clone's
 * admin console and agency portal can talk to a local API. It is public, so
 * production refuses it.
 */
export const LOCAL_DEV_SERVICE_KEY = 'local-dev-service-key-not-for-production';

const MIN_LENGTH = 32;

/**
 * True when `provided` is the configured SERVICE_AUTH_KEY. A missing or short
 * configured key matches nothing, so a deploy that forgets it fails closed.
 * Compared as SHA-256 digests in constant time, so neither the length nor the
 * contents leak through timing.
 */
export function isTrustedServiceKey(
  expected: string | undefined,
  provided: string | undefined,
): boolean {
  if (!expected || expected.length < MIN_LENGTH || !provided) return false;
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

/**
 * Production start-up check. With mock auth off, SERVICE_AUTH_KEY is the only
 * way the admin console signs anyone in and the only way the agency portal
 * reaches its routes, so a missing, short or published key is refused at boot
 * instead of failing later as unexplained 401s. A mock-auth deployment (local,
 * or a sample-data staging) may run without one.
 */
export function resolveServiceKey(
  env: Record<string, string | undefined>,
): string | undefined {
  const key = env.SERVICE_AUTH_KEY?.trim() || undefined;
  if (env.NODE_ENV !== 'production' || env.ENABLE_MOCK_AUTH === 'true') {
    return key;
  }
  if (!key || key.length < MIN_LENGTH || key === LOCAL_DEV_SERVICE_KEY) {
    throw new Error(
      'SERVICE_AUTH_KEY must be a private random value of at least 32 characters in production, shared with the admin console and agency portal servers.',
    );
  }
  return key;
}
