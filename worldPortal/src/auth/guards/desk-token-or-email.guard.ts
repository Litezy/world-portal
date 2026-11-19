import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LOOKUP_TOKEN_HEADER, lookupTokenEmail } from '../lookup-token';
import { ExternalAuthGuard } from './external-auth.guard';
import { RequestWithProfile, RolesGuard } from './roles.guard';

/** Everyone who may read the application lists may open a file. */
const DESK_READ_ROLES: UserRole[] = [
  UserRole.MANAGER,
  UserRole.STAFF,
  UserRole.PARTNER,
];

/**
 * For the public "track my application" lookups (`GET /visa-documentation/:id`,
 * `GET /passport-application/:id`).
 *
 * - With an Authorization header, the caller is the admin console: the token
 *   must verify and belong to an active desk profile, exactly as on the list
 *   routes (401 / 403 otherwise). No email is needed.
 * - Without one, the caller is a visitor on /track, who must give the email on
 *   the file (400 without it) AND the lookup token `POST /otp/verify` minted
 *   for that email, in `x-lookup-token` (401 without a valid one, 403 when it
 *   is for another email). The services filter by the email, so a file under
 *   another email is a 404.
 *
 * Application numbers are 4 random digits and an email is often public, so
 * the proof of control is what stops anyone from walking every number and
 * reading an applicant's passport details.
 */
@Injectable()
export class DeskTokenOrEmailGuard implements CanActivate {
  private readonly tokenGuard: ExternalAuthGuard;
  private readonly roleGuard: RolesGuard;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
    prisma: PrismaService,
  ) {
    this.tokenGuard = new ExternalAuthGuard(jwtService, configService);
    // Same profile lookup and active check as RolesGuard, with fixed roles.
    const fixedRoles = {
      getAllAndOverride: () => DESK_READ_ROLES,
    } as unknown as Reflector;
    this.roleGuard = new RolesGuard(fixedRoles, prisma);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithProfile & { query?: Record<string, unknown> }>();

    if (request.headers['authorization']) {
      this.tokenGuard.canActivate(context);
      return this.roleGuard.canActivate(context);
    }

    const email = request.query?.email;
    if (typeof email !== 'string' || !email.trim()) {
      throw new BadRequestException(
        'Give the email address used on the application to look it up.',
      );
    }

    // Naming the email is not enough (it is often public): the visitor must
    // have proved they control it with a one-time code, which minted this.
    const token = request.headers[LOOKUP_TOKEN_HEADER];
    let verifiedEmail: string;
    try {
      if (typeof token !== 'string' || !token) throw new Error('missing');
      verifiedEmail = lookupTokenEmail(this.jwtService, token);
    } catch {
      throw new UnauthorizedException(
        'Verify your email to view this application.',
      );
    }

    if (verifiedEmail !== email.trim().toLowerCase()) {
      throw new ForbiddenException(
        'That verification is for a different email address. Verify the email on the application.',
      );
    }
    return true;
  }
}
