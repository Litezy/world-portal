import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClerkTokenVerifier } from '../../auth/clerk/clerk-token.verifier';
import { ClientIdentity, ThrottledRequest } from './client-identity';
import { signLookupToken } from '../../auth/lookup-token';

const SECRET = 'client-identity-spec-secret';
const SERVICE_KEY = 'client-identity-spec-service-key-0123456789';
const jwt = new JwtService({ secret: SECRET });

function identity(
  values: Record<string, unknown> = {},
  clerkVerify: ClerkTokenVerifier['verify'] = () =>
    Promise.reject(new Error('not a Clerk token')),
) {
  const clerk = { verify: jest.fn(clerkVerify) };
  const subject = new ClientIdentity(
    new ConfigService(values),
    jwt,
    clerk as unknown as ClerkTokenVerifier,
  );
  return { subject, clerk };
}

function req(
  headers: Record<string, string> = {},
  ip = '198.51.100.7',
): ThrottledRequest {
  return { headers, ip };
}

describe('ClientIdentity', () => {
  describe('isServiceCaller', () => {
    it('is true only for the configured service key', () => {
      const { subject } = identity({ SERVICE_AUTH_KEY: SERVICE_KEY });

      expect(
        subject.isServiceCaller(req({ 'x-service-key': SERVICE_KEY })),
      ).toBe(true);
      expect(
        subject.isServiceCaller(req({ 'x-service-key': `${SERVICE_KEY}x` })),
      ).toBe(false);
      expect(subject.isServiceCaller(req())).toBe(false);
    });

    it('trusts nobody when no service key is configured', () => {
      const { subject } = identity();

      expect(subject.isServiceCaller(req({ 'x-service-key': '' }))).toBe(false);
    });
  });

  describe('trackerFor', () => {
    it('tracks a verified desk token by its hash, never the raw token', async () => {
      const { subject } = identity();
      const token = jwt.sign({ sub: 'staff-1' });
      const other = jwt.sign({ sub: 'staff-2' });

      const tracker = await subject.trackerFor(
        req({ authorization: `Bearer ${token}` }),
      );

      expect(tracker).toMatch(/^token:[0-9a-f]{64}$/);
      expect(tracker).not.toContain(token);
      expect(
        await subject.trackerFor(
          req({ authorization: `Bearer ${token}` }, '203.0.113.9'),
        ),
      ).toBe(tracker);
      expect(
        await subject.trackerFor(req({ authorization: `Bearer ${other}` })),
      ).not.toBe(tracker);
    });

    it('falls back to the IP for a token it cannot verify', async () => {
      const { subject } = identity();
      const forged = jwt.sign({ sub: 'x' }, { secret: 'not-ours' });

      expect(
        await subject.trackerFor(req({ authorization: `Bearer ${forged}` })),
      ).toBe('ip:198.51.100.7');
      expect(
        await subject.trackerFor(req({ authorization: 'Bearer manager' })),
      ).toBe('ip:198.51.100.7');
      expect(await subject.trackerFor(req())).toBe('ip:198.51.100.7');
    });

    /**
     * POST /otp/verify hands a 30-minute lookup token to anyone who verifies
     * any mailbox they control. Were it its own bucket, one person could mint
     * a fresh one per mailbox and step around the per-IP limits on OTP.
     */
    it('counts a lookup token by IP: only a desk token earns its own bucket', async () => {
      const { subject } = identity();
      const lookup = signLookupToken(jwt, 'visitor@example.com');
      const otherAudience = jwt.sign(
        { sub: 'staff-1' },
        { audience: 'something-else' },
      );

      expect(
        await subject.trackerFor(req({ authorization: `Bearer ${lookup}` })),
      ).toBe('ip:198.51.100.7');
      expect(
        await subject.trackerFor(
          req({ authorization: `Bearer ${otherAudience}` }),
        ),
      ).toBe('ip:198.51.100.7');
    });

    it('does not hand a lookup token to the Clerk check either', async () => {
      const { subject, clerk } = identity({ CLERK_JWT_KEY: 'pem' });
      const lookup = signLookupToken(jwt, 'visitor@example.com');

      expect(
        await subject.trackerFor(req({ authorization: `Bearer ${lookup}` })),
      ).toBe('ip:198.51.100.7');
      expect(clerk.verify).not.toHaveBeenCalled();
    });

    it('verifies a WorldStreet token only when it can do so without the network', async () => {
      const clerkToken = jwt.sign({ sub: 'user_1' }, { secret: 'clerk-side' });
      const header = { authorization: `Bearer ${clerkToken}` };

      // Without CLERK_JWT_KEY the SDK would fetch keys from Clerk for every
      // made-up token, before any limit applies: never ask it.
      const remote = identity({ CLERK_SECRET_KEY: 'sk_test_x' }, () =>
        Promise.resolve({ clerkUserId: 'user_1' }),
      );
      expect(await remote.subject.trackerFor(req(header))).toBe(
        'ip:198.51.100.7',
      );
      expect(remote.clerk.verify).not.toHaveBeenCalled();

      const local = identity({ CLERK_JWT_KEY: 'pem' }, () =>
        Promise.resolve({ clerkUserId: 'user_1' }),
      );
      expect(await local.subject.trackerFor(req(header))).toMatch(
        /^token:[0-9a-f]{64}$/,
      );
      expect(local.clerk.verify).toHaveBeenCalledWith(clerkToken);
    });

    it('groups an IPv6 client by its /64, as one household or phone is', async () => {
      const { subject } = identity();

      expect(await subject.trackerFor(req({}, '2001:db8:1:2:aaaa::1'))).toBe(
        await subject.trackerFor(req({}, '2001:db8:1:2:bbbb::2')),
      );
    });
  });
});
