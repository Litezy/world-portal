import { resolveJwtSecret } from './jwt-secret';

// Every desk token is now checked against JWT_SECRET, so the secret is the
// whole defence: an empty, short or published one lets anyone sign a
// manager token. Production refuses to start with one.
describe('resolveJwtSecret', () => {
  const strong = 'x'.repeat(48);

  it('returns a strong secret in production', () => {
    expect(
      resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: strong }),
    ).toBe(strong);
  });

  it('refuses a missing secret in production', () => {
    expect(() => resolveJwtSecret({ NODE_ENV: 'production' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('refuses a secret shorter than 32 characters in production', () => {
    expect(() =>
      resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'short-secret' }),
    ).toThrow(/JWT_SECRET/);
  });

  it('refuses the value published in .env.example in production', () => {
    expect(() =>
      resolveJwtSecret({
        NODE_ENV: 'production',
        JWT_SECRET: 'world-portal-secret-key-2026',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('lets local development run with the example value', () => {
    expect(
      resolveJwtSecret({
        NODE_ENV: 'development',
        JWT_SECRET: 'world-portal-secret-key-2026',
      }),
    ).toBe('world-portal-secret-key-2026');
  });
});
