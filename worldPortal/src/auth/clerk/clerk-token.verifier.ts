import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';

/**
 * Verifies WorldStreet session tokens.
 *
 * E-Embassy never signs anyone in: the WorldStreet hub does, through the
 * shared Clerk instance, and the browser forwards the resulting session JWT as
 * `Authorization: Bearer <token>`. This class checks the signature, expiry and
 * authorized party of that JWT and returns the subject — the Clerk user id,
 * which is the only person key E-Embassy stores.
 *
 * Networkless when `CLERK_JWT_KEY` is set; otherwise the SDK fetches and
 * caches the instance's JWKS using `CLERK_SECRET_KEY`.
 */
@Injectable()
export class ClerkTokenVerifier {
  private readonly logger = new Logger(ClerkTokenVerifier.name);

  constructor(private readonly config: ConfigService) {}

  /** True when enough configuration exists to verify a token at all. */
  isConfigured(): boolean {
    return Boolean(this.secretKey() || this.jwtKey());
  }

  /** Throws on a missing, expired, forged or wrong-audience token. */
  async verify(token: string): Promise<{ clerkUserId: string }> {
    if (!this.isConfigured()) {
      // Fail closed, loudly: without keys every applicant request is refused,
      // and this line is the only place that says why.
      this.logger.error(
        'Clerk is not configured (CLERK_SECRET_KEY / CLERK_JWT_KEY unset) — every applicant request will be rejected',
      );
      throw new Error('Clerk verification is not configured');
    }

    const authorizedParties = this.authorizedParties();
    // Only `sub` is read, so the SDK's claim type is narrowed to just that.
    const claims = (await verifyToken(token, {
      secretKey: this.secretKey(),
      jwtKey: this.jwtKey(),
      ...(authorizedParties.length ? { authorizedParties } : {}),
    })) as unknown as { sub?: unknown };

    if (typeof claims.sub !== 'string' || !claims.sub) {
      throw new Error('Clerk token is missing a subject');
    }
    return { clerkUserId: claims.sub };
  }

  private secretKey(): string | undefined {
    return this.config.get<string>('CLERK_SECRET_KEY') || undefined;
  }

  private jwtKey(): string | undefined {
    return this.config.get<string>('CLERK_JWT_KEY') || undefined;
  }

  /** Origins allowed to have minted the token, e.g. the E-Embassy site. */
  private authorizedParties(): string[] {
    return (this.config.get<string>('CLERK_AUTHORIZED_PARTIES') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
}
