import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { AppThrottlerGuard } from './app-throttler.guard';
import { ClientIdentity } from './client-identity';
import { RateLimit, RateLimitConfig, resolveRateLimits } from './rate-limits';
import { routeKeysFor } from './route-key';

/**
 * Two throttlers run on every request:
 *
 * - `global`: one bucket per client across all routes (300 a minute by
 *   default), so a single client cannot flood the API as a whole;
 * - `route`: one bucket per client per route, only on routes in ROUTE_LIMITS.
 *
 * Counts are kept in this process's memory, so each API instance limits on
 * its own and a restart clears them.
 */
export function throttlerOptions(
  limits: RateLimitConfig,
): ThrottlerModuleOptions {
  const byHandler = new WeakMap<object, RateLimit | null>();
  const routeLimit = (context: ExecutionContext): RateLimit | null => {
    const handler = context.getHandler();
    let limit = byHandler.get(handler);
    if (limit === undefined) {
      limit =
        routeKeysFor(context.getClass(), handler)
          .map((key) => limits.routes.get(key))
          .find((found) => found !== undefined) ?? null;
      byHandler.set(handler, limit);
    }
    return limit;
  };
  const routeKey = (context: ExecutionContext) =>
    routeKeysFor(context.getClass(), context.getHandler())[0];

  return {
    errorMessage: 'Too many requests. Please wait a moment and try again.',
    throttlers: [
      {
        name: 'global',
        limit: limits.global.limit,
        ttl: limits.global.ttlMs,
        generateKey: (_context, tracker) => `global:${tracker}`,
      },
      {
        name: 'route',
        skipIf: (context) => routeLimit(context) === null,
        limit: (context) => routeLimit(context)!.limit,
        ttl: (context) => routeLimit(context)!.ttlMs,
        generateKey: (context, tracker) =>
          `route:${routeKey(context)}:${tracker}`,
      },
    ],
  };
}

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        throttlerOptions(resolveRateLimits((key) => config.get(key))),
    }),
  ],
  providers: [
    ClientIdentity,
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
})
export class RateLimitModule {}
