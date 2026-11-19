import { JwtService } from '@nestjs/jwt';

/**
 * The applicant lookup token: proof that a /track visitor has just verified,
 * with a one-time code, that they control an email address.
 *
 * `POST /otp/verify` mints it; the public status lookups
 * (`GET /visa-documentation/:id`, `GET /passport-application/:id`) require it
 * in the `x-lookup-token` header alongside `?email=`, which must match its
 * subject. It is signed with JWT_SECRET like a desk token, so it carries its
 * own audience, and `ExternalAuthGuard` refuses any token with an audience:
 * a lookup token can never be used as a desk token.
 */
export const LOOKUP_TOKEN_AUDIENCE = 'applicant-lookup';
export const LOOKUP_TOKEN_HEADER = 'x-lookup-token';
export const LOOKUP_TOKEN_TTL_SECONDS = 30 * 60;

const normalise = (email: string) => email.trim().toLowerCase();

export function signLookupToken(jwt: JwtService, email: string): string {
  return jwt.sign(
    { sub: normalise(email) },
    { audience: LOOKUP_TOKEN_AUDIENCE, expiresIn: LOOKUP_TOKEN_TTL_SECONDS },
  );
}

/**
 * The email a lookup token was minted for. Throws on a bad signature, an
 * expired token, or a token minted for any other purpose (no or wrong
 * audience, which includes every desk token).
 */
export function lookupTokenEmail(jwt: JwtService, token: string): string {
  const payload = jwt.verify<{ sub?: unknown }>(token, {
    audience: LOOKUP_TOKEN_AUDIENCE,
  });
  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Lookup token has no subject');
  }
  return normalise(payload.sub);
}
