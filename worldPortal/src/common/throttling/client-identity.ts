import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { normalizeIp } from '@nestjs/throttler';
import { createHash } from 'crypto';
import { isIP } from 'net';
import { ClerkTokenVerifier } from '../../auth/clerk/clerk-token.verifier';
import { isTrustedServiceKey } from '../../auth/service-key';

export interface ThrottledRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}

/**
 * Decides who a request counts against.
 *
 * - The website server, proving itself with SERVICE_AUTH_KEY, acts for many
 *   visitors at once. When it relays a visitor's request (OTP, checkout) it
 *   names that visitor in `x-visitor-ip`, and the request counts against the
 *   visitor. Without that header it is the server's own call and isn't limited.
 *   The header is ignored without a valid key, so nobody else can pick an IP.
 * - A caller with a Bearer token is counted by a hash of the token. Every
 *   console request reaches us from the website server's one IP, so counting
 *   by IP would make all staff share one bucket.
 * - Everyone else is counted by IP (`req.ip`, which TRUST_PROXY governs).
 *
 * A token is only used once it verifies, and only by a check that needs no
 * network. Otherwise anyone could send a fresh made-up token with each request
 * and never meet a limit. A desk token is checked against JWT_SECRET, and
 * must carry no audience: the applicant lookup token is signed with the same
 * secret but anyone can mint one, so it is counted by IP. A
 * WorldStreet (Clerk) token is checked only when CLERK_JWT_KEY is set: without
 * it the Clerk SDK fetches signing keys from Clerk for any unknown key id, so
 * checking here would let a stream of forged tokens trigger a fetch each,
 * before any limit applies. Without CLERK_JWT_KEY, applicant requests are
 * counted by IP.
 */
@Injectable()
export class ClientIdentity {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly clerk: ClerkTokenVerifier,
  ) {}

  /** The website server's own call, not relayed for a visitor: no limit. */
  isUnlimitedServiceCall(req: ThrottledRequest): boolean {
    return this.isServiceCaller(req) && !this.relayedVisitorIp(req);
  }

  isServiceCaller(req: ThrottledRequest): boolean {
    const sent = req.headers['x-service-key'];
    return (
      typeof sent === 'string' &&
      isTrustedServiceKey(this.config.get<string>('SERVICE_AUTH_KEY'), sent)
    );
  }

  async trackerFor(req: ThrottledRequest): Promise<string> {
    const token = bearerToken(req);
    if (token && (await this.verifies(token))) {
      return `token:${createHash('sha256').update(token).digest('hex')}`;
    }
    const visitorIp = this.isServiceCaller(req)
      ? this.relayedVisitorIp(req)
      : undefined;
    if (visitorIp) return `ip:${normalizeIp(visitorIp)}`;
    return `ip:${normalizeIp(req.ip ?? '')}`;
  }

  /** `x-visitor-ip` when it is a well-formed IPv4 or IPv6 address. */
  private relayedVisitorIp(req: ThrottledRequest): string | undefined {
    const sent = req.headers['x-visitor-ip'];
    const ip = typeof sent === 'string' ? sent.trim() : '';
    return isIP(ip) ? ip : undefined;
  }

  private async verifies(token: string): Promise<boolean> {
    if (token.split('.').length !== 3) return false;
    let signedByUs: Record<string, unknown> | undefined;
    try {
      signedByUs = this.jwt.verify<Record<string, unknown>>(token);
    } catch {
      // Not a desk token; it may still be a WorldStreet one.
    }
    if (signedByUs) {
      // Only a desk token earns its own bucket. Desk tokens carry no audience;
      // anything else JWT_SECRET signs does (the 30-minute applicant lookup
      // token, auth/lookup-token.ts), and anyone can mint one by verifying a
      // mailbox they control, so it is counted by IP like any visitor.
      return signedByUs.aud === undefined;
    }
    if (!this.config.get<string>('CLERK_JWT_KEY')) return false;
    try {
      await this.clerk.verify(token);
      return true;
    } catch {
      return false;
    }
  }
}

function bearerToken(req: ThrottledRequest): string | undefined {
  const header = req.headers['authorization'];
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return undefined;
  }
  return header.slice('Bearer '.length).trim() || undefined;
}
