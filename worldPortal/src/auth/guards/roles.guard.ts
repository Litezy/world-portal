import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Profile, Prisma, UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestWithUser } from '../decorators/current-user.decorator';

export interface RequestWithProfile extends RequestWithUser {
  profile?: Profile;
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithProfile>();
    const user = request.user;

    if (!user) {
      this.logger.warn(
        'RolesGuard evaluated without authenticated user context',
      );
      throw new ForbiddenException('User context not found');
    }

    const orConditions: Prisma.ProfileWhereInput[] = [];
    if (user.externalAuthId) {
      orConditions.push({ externalAuthId: user.externalAuthId });
    }
    if (user.email) {
      orConditions.push({ email: user.email });
    }

    if (orConditions.length === 0) {
      throw new ForbiddenException('User identity missing details');
    }

    const profile = await this.prisma.profile.findFirst({
      where: {
        OR: orConditions,
      },
    });

    if (!profile) {
      this.logger.warn(
        `No local Profile record found for user with email=${user.email}, externalAuthId=${user.externalAuthId}`,
      );
      throw new ForbiddenException('User profile not found in local system');
    }

    if (!profile.isActive) {
      this.logger.warn(
        `Inactive profile attempted access: profileId=${profile.id}`,
      );
      throw new ForbiddenException('User profile is deactivated');
    }

    request.profile = profile;

    const hasRole = requiredRoles.includes(profile.role);
    if (!hasRole) {
      this.logger.warn(
        `Access denied for profileId=${profile.id}, role=${profile.role}. Required roles: [${requiredRoles.join(', ')}]`,
      );
      throw new ForbiddenException(
        'Insufficient permissions for this resource',
      );
    }

    return true;
  }
}
