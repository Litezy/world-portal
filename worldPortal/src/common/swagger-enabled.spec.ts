import { isSwaggerEnabled } from './swagger-enabled';

// /api/docs lists every route, including the ones that need no login. In
// production it is a map for attackers, so it is opt-in there.
describe('isSwaggerEnabled', () => {
  it('serves the docs in development', () => {
    expect(isSwaggerEnabled({ NODE_ENV: 'development' })).toBe(true);
  });

  it('serves the docs when NODE_ENV is not set (local runs)', () => {
    expect(isSwaggerEnabled({})).toBe(true);
  });

  it('hides the docs in production', () => {
    expect(isSwaggerEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('serves them in production only when ENABLE_SWAGGER=true', () => {
    expect(
      isSwaggerEnabled({ NODE_ENV: 'production', ENABLE_SWAGGER: 'true' }),
    ).toBe(true);
    expect(
      isSwaggerEnabled({ NODE_ENV: 'production', ENABLE_SWAGGER: 'yes' }),
    ).toBe(false);
  });
});
