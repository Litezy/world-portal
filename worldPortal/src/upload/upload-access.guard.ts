import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkTokenVerifier } from '../auth/clerk/clerk-token.verifier';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { ServiceOrDeskGuard } from '../auth/guards/service-or-desk.guard';

/**
 * True for a bearer token the desk path should judge: a desk access token
 * (HS256, signed with JWT_SECRET) or, in a mock-auth deployment, a plain
 * string. WorldStreet session tokens are asymmetric (RS256), so they go to
 * Clerk. This only routes the request: each path fully verifies its token.
 */
function isDeskToken(header: string | string[] | undefined): boolean {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return false;
  }
  const parts = header.slice(7).trim().split('.');
  if (parts.length !== 3) return true;
  try {
    const { alg } = JSON.parse(
      Buffer.from(parts[0], 'base64url').toString('utf8'),
    ) as { alg?: unknown };
    return alg === 'HS256';
  } catch {
    return true;
  }
}

/**
 * Who may put a file in our storage (`POST /upload`):
 *
 * - a signed-in applicant, with their WorldStreet session token, uploading a
 *   document for an application they are filling in;
 * - our website server, with SERVICE_AUTH_KEY, uploading for a caller it has
 *   already signed in (the agency portal's compliance documents);
 * - desk staff, with a desk token holding one of the route's `@Roles`.
 *
 * Composed from `ClerkAuthGuard` and `ServiceOrDeskGuard`, so each caller is
 * checked exactly as on its own routes. No credentials is a 401.
 */
@Injectable()
export class UploadAccessGuard implements CanActivate {
  private readonly applicantGuard: ClerkAuthGuard;
  private readonly serviceOrDeskGuard: ServiceOrDeskGuard;

  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    prisma: PrismaService,
    reflector: Reflector,
    verifier: ClerkTokenVerifier,
  ) {
    this.applicantGuard = new ClerkAuthGuard(verifier);
    this.serviceOrDeskGuard = new ServiceOrDeskGuard(
      jwtService,
      configService,
      prisma,
      reflector,
    );
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const { headers } = context.switchToHttp().getRequest<Request>();
    const deskOrService =
      headers['x-service-key'] !== undefined ||
      isDeskToken(headers.authorization);

    return deskOrService
      ? this.serviceOrDeskGuard.canActivate(context)
      : this.applicantGuard.canActivate(context);
  }
}
