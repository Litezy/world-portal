import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
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
 * - Without one, the caller is an applicant on /track, who must give the email
 *   on the file. The services already filter by it, so a wrong email is a 404.
 *
 * Application numbers are 4 random digits, so the email is what stops anyone
 * from walking every number and reading applicants' passport details.
 */
@Injectable()
export class DeskTokenOrEmailGuard implements CanActivate {
  private readonly tokenGuard: ExternalAuthGuard;
  private readonly roleGuard: RolesGuard;

  constructor(
    jwtService: JwtService,
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
    return true;
  }
}
