export interface RateLimit {
  /** Requests one client may make in each window. */
  limit: number;
  /** The window, in milliseconds. */
  ttlMs: number;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/** Every route, per client, unless THROTTLE_GLOBAL_* says otherwise. */
export const DEFAULT_GLOBAL_LIMIT: RateLimit = { limit: 300, ttlMs: MINUTE };

/**
 * The stricter limits for public routes that cost money or invite abuse,
 * keyed by method and path as the controller declares it (no `api` prefix).
 * They live here, in one map, rather than as decorators spread across other
 * modules' controllers. A route here is limited by both its own entry and the
 * global limit. `rate-limits.spec.ts` fails if a key stops naming a real
 * route, so renaming a route cannot quietly drop its limit.
 */
export const ROUTE_LIMITS: Readonly<Record<string, RateLimit>> = {
  // Each send emails a code through SendGrid, to any address typed in.
  'POST /otp/send': { limit: 5, ttlMs: 15 * MINUTE },
  // A six-digit code falls to guessing if attempts are not capped.
  'POST /otp/verify': { limit: 10, ttlMs: 15 * MINUTE },
  // Signs desk tokens; the website server's own calls carry the service key
  // and are not limited.
  'POST /auth/test-token': { limit: 20, ttlMs: MINUTE },
  // Each upload writes up to 10MB to storage we pay for.
  'POST /upload': { limit: 30, ttlMs: 10 * MINUTE },
  // Each one creates a payment record.
  'POST /payments/initiate': { limit: 20, ttlMs: 10 * MINUTE },
  'POST /payments/checkout-package': { limit: 20, ttlMs: 10 * MINUTE },
  // Answered from a paid third-party API (RapidAPI).
  'POST /visa-requirement/check': { limit: 60, ttlMs: MINUTE },
};

export interface RateLimitConfig {
  global: RateLimit;
  routes: ReadonlyMap<string, RateLimit>;
}

const ROUTE_KEY = /^(GET|POST|PUT|PATCH|DELETE) \/\S*$/;

/**
 * The limits in force: the defaults above, adjusted by config.
 *
 * - THROTTLE_GLOBAL_LIMIT / THROTTLE_GLOBAL_TTL_SECONDS replace the global
 *   limit and its window.
 * - THROTTLE_ROUTE_LIMITS is a JSON object that overrides or adds route
 *   entries, e.g. `{"POST /otp/send":{"limit":10,"ttlSeconds":900}}`.
 *
 * A malformed value throws, so a typo fails the boot instead of quietly
 * leaving a route unlimited.
 */
export function resolveRateLimits(
  read: (key: string) => unknown,
): RateLimitConfig {
  const global: RateLimit = {
    limit: positiveInteger(
      read('THROTTLE_GLOBAL_LIMIT'),
      DEFAULT_GLOBAL_LIMIT.limit,
      'THROTTLE_GLOBAL_LIMIT',
    ),
    ttlMs:
      positiveInteger(
        read('THROTTLE_GLOBAL_TTL_SECONDS'),
        DEFAULT_GLOBAL_LIMIT.ttlMs / SECOND,
        'THROTTLE_GLOBAL_TTL_SECONDS',
      ) * SECOND,
  };

  const routes = new Map(Object.entries(ROUTE_LIMITS));
  for (const [key, limit] of routeOverrides(read('THROTTLE_ROUTE_LIMITS'))) {
    routes.set(key, limit);
  }
  return { global, routes };
}

function routeOverrides(raw: unknown): Array<[string, RateLimit]> {
  if (raw === undefined || raw === null || raw === '') return [];

  let parsed: unknown;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    throw new Error('THROTTLE_ROUTE_LIMITS must be a JSON object.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('THROTTLE_ROUTE_LIMITS must be a JSON object.');
  }

  return Object.entries(parsed as Record<string, unknown>).map(
    ([key, value]) => {
      const label = `THROTTLE_ROUTE_LIMITS["${key}"]`;
      if (!ROUTE_KEY.test(key)) {
        throw new Error(
          `${label}: keys are a method and a path, like "POST /otp/send".`,
        );
      }
      const entry = (value ?? {}) as { limit?: unknown; ttlSeconds?: unknown };
      return [
        key,
        {
          limit: positiveInteger(entry.limit, undefined, `${label}.limit`),
          ttlMs:
            positiveInteger(
              entry.ttlSeconds,
              undefined,
              `${label}.ttlSeconds`,
            ) * SECOND,
        },
      ];
    },
  );
}

function positiveInteger(
  raw: unknown,
  fallback: number | undefined,
  label: string,
): number {
  if (raw === undefined || raw === null || raw === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`${label} is required.`);
  }
  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number(raw.trim())
        : NaN;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a whole number above zero.`);
  }
  return value;
}
