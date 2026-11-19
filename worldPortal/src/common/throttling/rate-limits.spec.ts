import { AuthController } from '../../auth/auth.controller';
import { OtpController } from '../../otp/otp.controller';
import { PaymentController } from '../../payment/payment.controller';
import { UploadController } from '../../upload/upload.controller';
import { VisaRequirementController } from '../../visa-requirement/visa-requirement.controller';
import { ROUTE_LIMITS, resolveRateLimits } from './rate-limits';
import { routeKeysOfController } from './route-key';

const MINUTE = 60_000;

function config(values: Record<string, unknown>) {
  return (key: string) => values[key];
}

describe('rate limits', () => {
  it('defaults to 300 a minute per client, with stricter abuse-prone routes', () => {
    const limits = resolveRateLimits(config({}));

    expect(limits.global).toEqual({ limit: 300, ttlMs: MINUTE });
    expect(Object.fromEntries(limits.routes)).toEqual({
      'POST /otp/send': { limit: 5, ttlMs: 15 * MINUTE },
      'POST /otp/verify': { limit: 10, ttlMs: 15 * MINUTE },
      'POST /auth/test-token': { limit: 20, ttlMs: MINUTE },
      'POST /upload': { limit: 30, ttlMs: 10 * MINUTE },
      'POST /payments/initiate': { limit: 20, ttlMs: 10 * MINUTE },
      'POST /payments/checkout-package': { limit: 20, ttlMs: 10 * MINUTE },
      'POST /visa-requirement/check': { limit: 60, ttlMs: MINUTE },
    });
  });

  it('names only routes that exist, so a renamed route cannot silently lose its limit', () => {
    const routes = new Set(
      [
        AuthController,
        OtpController,
        PaymentController,
        UploadController,
        VisaRequirementController,
      ].flatMap((controller) => routeKeysOfController(controller)),
    );

    for (const key of Object.keys(ROUTE_LIMITS)) {
      expect(routes).toContain(key);
    }
  });

  it('takes the global limit and window from config', () => {
    const limits = resolveRateLimits(
      config({ THROTTLE_GLOBAL_LIMIT: '50', THROTTLE_GLOBAL_TTL_SECONDS: 10 }),
    );

    expect(limits.global).toEqual({ limit: 50, ttlMs: 10_000 });
  });

  it('lets config override a route limit or add one', () => {
    const limits = resolveRateLimits(
      config({
        THROTTLE_ROUTE_LIMITS: JSON.stringify({
          'POST /otp/send': { limit: 50, ttlSeconds: 900 },
          'GET /visa-documentation/:id': { limit: 30, ttlSeconds: 60 },
        }),
      }),
    );

    expect(limits.routes.get('POST /otp/send')).toEqual({
      limit: 50,
      ttlMs: 15 * MINUTE,
    });
    expect(limits.routes.get('GET /visa-documentation/:id')).toEqual({
      limit: 30,
      ttlMs: MINUTE,
    });
    expect(limits.routes.get('POST /otp/verify')).toEqual({
      limit: 10,
      ttlMs: 15 * MINUTE,
    });
  });

  it.each([
    ['a zero global limit', { THROTTLE_GLOBAL_LIMIT: '0' }],
    ['a non-numeric window', { THROTTLE_GLOBAL_TTL_SECONDS: 'soon' }],
    ['route limits that are not JSON', { THROTTLE_ROUTE_LIMITS: '{nope' }],
    [
      'a route key without a method',
      { THROTTLE_ROUTE_LIMITS: '{"/otp/send":{"limit":1,"ttlSeconds":1}}' },
    ],
    [
      'a route limit missing its window',
      { THROTTLE_ROUTE_LIMITS: '{"POST /otp/send":{"limit":1}}' },
    ],
  ])('refuses to start with %s', (_label, values) => {
    expect(() => resolveRateLimits(config(values))).toThrow(/THROTTLE_/);
  });
});
