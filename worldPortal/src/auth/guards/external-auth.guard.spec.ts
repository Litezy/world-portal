import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ExternalAuthGuard } from './external-auth.guard';
import { RequestWithUser } from '../decorators/current-user.decorator';
import { signLookupToken } from '../lookup-token';

const SECRET = 'test-secret-for-external-auth-guard';

function makeGuard(env: Record<string, string | undefined> = {}) {
  const config = {
    get: (key: string, fallback?: string) => env[key] ?? fallback,
  } as unknown as ConfigService;
  return new ExternalAuthGuard(new JwtService({ secret: SECRET }), config);
}

function contextFor(url: string, authorization?: string) {
  const request = {
    url,
    headers: authorization ? { authorization } : {},
  } as unknown as RequestWithUser;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

function base64url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** A token anyone can write by hand: right shape, made-up signature. */
function forgedToken(payload: object) {
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.made-up-signature`;
}

describe('ExternalAuthGuard', () => {
  it('rejects a token whose signature was not made with JWT_SECRET', () => {
    const guard = makeGuard({ ENABLE_MOCK_AUTH: 'false' });
    const { context } = contextFor(
      '/api/profiles',
      `Bearer ${forgedToken({ email: 'manager@loveworld.com' })}`,
    );

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects a forged token even when mock sign-in is on', () => {
    const guard = makeGuard({ ENABLE_MOCK_AUTH: 'true' });
    const { context, request } = contextFor(
      '/api/profiles',
      `Bearer ${forgedToken({ email: 'manager@loveworld.com' })}`,
    );

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(request.user).toBeUndefined();
  });

  it('rejects a token signed with a different secret', () => {
    const guard = makeGuard({ ENABLE_MOCK_AUTH: 'false' });
    const other = new JwtService({ secret: 'someone-elses-secret' }).sign({
      email: 'manager@loveworld.com',
    });
    const { context } = contextFor('/api/profiles', `Bearer ${other}`);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('accepts a token signed with JWT_SECRET and reads who it is for', () => {
    const guard = makeGuard({ ENABLE_MOCK_AUTH: 'false' });
    const token = new JwtService({ secret: SECRET }).sign({
      sub: 'ext-1',
      externalAuthId: 'ext-1',
      email: 'staff@example.com',
    });
    const { context, request } = contextFor('/api/profiles', `Bearer ${token}`);

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual({
      externalAuthId: 'ext-1',
      email: 'staff@example.com',
      token,
    });
  });

  it('rejects an applicant lookup token, though JWT_SECRET signed it', () => {
    const guard = makeGuard({ ENABLE_MOCK_AUTH: 'false' });
    const lookup = signLookupToken(
      new JwtService({ secret: SECRET }),
      'staff@example.com',
    );
    const { context, request } = contextFor(
      '/api/profiles',
      `Bearer ${lookup}`,
    );

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(request.user).toBeUndefined();
  });

  it('rejects a signed token that has expired', () => {
    const guard = makeGuard({ ENABLE_MOCK_AUTH: 'false' });
    const expired = new JwtService({ secret: SECRET }).sign({
      email: 'staff@example.com',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const { context } = contextFor('/api/profiles', `Bearer ${expired}`);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('treats mock sign-in as off when ENABLE_MOCK_AUTH is not set', () => {
    const guard = makeGuard({});
    const { context } = contextFor('/api/profiles', 'Bearer manager');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('still accepts plain mock tokens when ENABLE_MOCK_AUTH is true (local dev)', () => {
    const guard = makeGuard({ ENABLE_MOCK_AUTH: 'true' });
    const { context, request } = contextFor('/api/profiles', 'Bearer manager');

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user?.email).toBe('manager@loveworld.com');
  });

  it('does not wave through a URL just because it mentions /auth/test-token', () => {
    const guard = makeGuard({ ENABLE_MOCK_AUTH: 'false' });
    const { context } = contextFor('/api/profiles?next=/auth/test-token');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
