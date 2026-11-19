import {
  LOCAL_DEV_SERVICE_KEY,
  isTrustedServiceKey,
  resolveServiceKey,
} from './service-key';

// The admin console's server and the agency portal's server prove who they
// are to this API with SERVICE_AUTH_KEY. It guards desk tokens and the agency
// routes, so a short, missing or published key must never be accepted.
describe('isTrustedServiceKey', () => {
  const key = 'k'.repeat(40);

  it('accepts the configured key', () => {
    expect(isTrustedServiceKey(key, key)).toBe(true);
  });

  it('refuses a different key', () => {
    expect(isTrustedServiceKey(key, 'x'.repeat(40))).toBe(false);
  });

  it('refuses when no key is sent', () => {
    expect(isTrustedServiceKey(key, undefined)).toBe(false);
    expect(isTrustedServiceKey(key, '')).toBe(false);
  });

  it('refuses everyone when the configured key is missing or short', () => {
    expect(isTrustedServiceKey(undefined, 'anything')).toBe(false);
    expect(isTrustedServiceKey('', '')).toBe(false);
    expect(isTrustedServiceKey('short-key', 'short-key')).toBe(false);
  });
});

describe('resolveServiceKey', () => {
  const strong = 's'.repeat(48);

  it('returns a strong key in production', () => {
    expect(
      resolveServiceKey({ NODE_ENV: 'production', SERVICE_AUTH_KEY: strong }),
    ).toBe(strong);
  });

  it('refuses to start production without a key', () => {
    expect(() => resolveServiceKey({ NODE_ENV: 'production' })).toThrow(
      /SERVICE_AUTH_KEY/,
    );
  });

  it('refuses a key shorter than 32 characters in production', () => {
    expect(() =>
      resolveServiceKey({ NODE_ENV: 'production', SERVICE_AUTH_KEY: 'short' }),
    ).toThrow(/SERVICE_AUTH_KEY/);
  });

  it('refuses the local development key from .env.example in production', () => {
    expect(() =>
      resolveServiceKey({
        NODE_ENV: 'production',
        SERVICE_AUTH_KEY: LOCAL_DEV_SERVICE_KEY,
      }),
    ).toThrow(/SERVICE_AUTH_KEY/);
  });

  it('lets a mock-auth deployment (local or sample-data staging) run without one', () => {
    expect(
      resolveServiceKey({ NODE_ENV: 'production', ENABLE_MOCK_AUTH: 'true' }),
    ).toBeUndefined();
  });

  it('lets local development use the published development key', () => {
    expect(
      resolveServiceKey({
        NODE_ENV: 'development',
        SERVICE_AUTH_KEY: LOCAL_DEV_SERVICE_KEY,
      }),
    ).toBe(LOCAL_DEV_SERVICE_KEY);
  });
});
