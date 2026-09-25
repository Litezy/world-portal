import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, type ClerkClient } from '@clerk/backend';

/** What E-Embassy reads about a person from WorldStreet. Never stored locally. */
export interface WorldStreetIdentity {
  clerkUserId: string;
  /** Primary email, or null when the account has none. */
  email: string | null;
  /** True only when WorldStreet has verified `email`. */
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
}

const IDENTITY_TTL_MS = 60_000;

/**
 * Reads a person's name and email from WorldStreet's Clerk instance.
 *
 * Identity belongs to WorldStreet, so it is read per request rather than
 * copied into our tables — a copy goes stale the moment someone edits their
 * profile. A short cache keeps a burst of requests from one person down to a
 * single Clerk call.
 */
@Injectable()
export class ClerkIdentityService {
  private readonly logger = new Logger(ClerkIdentityService.name);
  private client: ClerkClient | null = null;
  private readonly cache = new Map<
    string,
    { identity: WorldStreetIdentity; expires: number }
  >();

  constructor(private readonly config: ConfigService) {}

  /**
   * The identity for a verified Clerk user id, or `null` when Clerk does not
   * know the id (a 404). Any other failure — an outage, a bad key — is
   * rethrown, so it never reads as "this person does not exist".
   */
  async getIdentity(clerkUserId: string): Promise<WorldStreetIdentity | null> {
    const now = Date.now();
    const cached = this.cache.get(clerkUserId);
    if (cached && cached.expires > now) return cached.identity;

    let user: Awaited<ReturnType<ClerkClient['users']['getUser']>>;
    try {
      user = await this.clerk().users.getUser(clerkUserId);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        (error as { status?: number }).status === 404
      ) {
        return null;
      }
      throw error;
    }

    const primary =
      user.primaryEmailAddress ?? user.emailAddresses[0] ?? undefined;
    const identity: WorldStreetIdentity = {
      clerkUserId,
      email: primary?.emailAddress?.toLowerCase().trim() ?? null,
      emailVerified: primary?.verification?.status === 'verified',
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
    };

    this.cache.set(clerkUserId, { identity, expires: now + IDENTITY_TTL_MS });
    return identity;
  }

  private clerk(): ClerkClient {
    if (!this.client) {
      const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
      if (!secretKey) {
        this.logger.error(
          'CLERK_SECRET_KEY is not set — WorldStreet identities cannot be read',
        );
        throw new Error('CLERK_SECRET_KEY is required');
      }
      this.client = createClerkClient({ secretKey });
    }
    return this.client;
  }
}
