import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { isTrustedServiceKey } from '../service-key';
import { ExternalAuthGuard } from './external-auth.guard';
import { RequestWithProfile, RolesGuard } from './roles.guard';

/** Any active desk member, when a route names no roles of its own. */
const DEFAULT_DESK_ROLES: UserRole[] = [
  UserRole.MANAGER,
  UserRole.STAFF,
  UserRole.PARTNER,
];

export interface RequestWithCaller extends RequestWithProfile {
  /** True when the caller is our own website server (SERVICE_AUTH_KEY). */
  serviceCaller?: boolean;
}

/**
 * For routes the website's own server calls on a visitor's behalf: the agency
 * portal (which signs agencies in itself and scopes every call to the signed-in
 * agency) and the admin console's server-side helpers.
 *
 * Two callers get in:
 * - our website server, sending SERVICE_AUTH_KEY as `x-service-key`. It has
 *   already authenticated the visitor, so the route's roles don't apply;
 * - a signed-in desk member: the token must verify and belong to an active
 *   profile holding one of the route's `@Roles` (any desk role if none).
 *
 * Everyone else gets a 401. A wrong key is refused outright rather than falling
 * back to the token, so a misconfigured server fails loudly.
 */
@Injectable()
export class ServiceOrDeskGuard implements CanActivate {
  private readonly tokenGuard: ExternalAuthGuard;
  private readonly roleGuard: RolesGuard;

  constructor(
    jwtService: JwtService,
    private readonly configService: ConfigService,
    prisma: PrismaService,
    reflector: Reflector,
  ) {
    this.tokenGuard = new ExternalAuthGuard(jwtService, configService);
    // An empty or missing @Roles must not mean "any valid token": RolesGuard
    // skips its profile check when it sees no roles, so fall back to the desk.
    const rolesOrDefault = {
      getAllAndOverride: (_key: string, targets: unknown[]) => {
        const roles = reflector.getAllAndOverride<UserRole[] | undefined>(
          ROLES_KEY,
          targets as Parameters<Reflector['getAllAndOverride']>[1],
        );
        return roles?.length ? roles : DEFAULT_DESK_ROLES;
      },
    } as unknown as Reflector;
    this.roleGuard = new RolesGuard(rolesOrDefault, prisma);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCaller>();
    const sentKey = request.headers['x-service-key'];

    if (sentKey !== undefined) {
      const expected = this.configService.get<string>('SERVICE_AUTH_KEY');
      if (
        typeof sentKey !== 'string' ||
        !isTrustedServiceKey(expected, sentKey)
      ) {
        throw new UnauthorizedException('Invalid service key');
      }
      request.serviceCaller = true;
      return true;
    }

    this.tokenGuard.canActivate(context);
    return this.roleGuard.canActivate(context);
  }
}
