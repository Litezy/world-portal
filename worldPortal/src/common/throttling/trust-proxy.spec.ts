import { resolveTrustProxy } from './trust-proxy';

describe('resolveTrustProxy', () => {
  it.each([undefined, '', '  ', '0', 'false'])(
    'trusts no proxy for %p',
    (value) => {
      expect(resolveTrustProxy(value)).toBe(false);
    },
  );

  it.each([
    ['1', 1],
    ['2', 2],
    [' 1 ', 1],
  ])('trusts %p hop(s)', (value, hops) => {
    expect(resolveTrustProxy(value)).toBe(hops);
  });

  // `true` would believe every X-Forwarded-For entry, so anyone could pick
  // their own IP. Anything that is not a hop count is refused at boot.
  it.each(['true', 'yes', '-1', '1.5', 'loopback', '10.0.0.0/8'])(
    'refuses %p',
    (value) => {
      expect(() => resolveTrustProxy(value)).toThrow(/TRUST_PROXY/);
    },
  );
});
