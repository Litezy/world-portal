import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  RequestWithUser,
  CurrentUserPayload,
} from '../decorators/current-user.decorator';

@Injectable()
export class ExternalAuthGuard implements CanActivate {
  private readonly logger = new Logger(ExternalAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const authHeader = request.headers['authorization'];

    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      this.logger.warn('Authorization header missing or invalid format');
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.substring(7);

    try {
      const userPayload = this.validateExternalToken(token);
      request.user = userPayload;
      this.logger.log(
        `External identity validated successfully for externalAuthId=${userPayload.externalAuthId}, email=${userPayload.email}`,
      );
      return true;
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Unknown token error';
      this.logger.error(`External token validation failed: ${msg}`);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private validateExternalToken(token: string): CurrentUserPayload {
    if (!token) {
      throw new Error('Token payload is empty');
    }

    const defaultManagerEmail = this.configService.get<string>(
      'DEFAULT_MANAGER_EMAIL',
      'manager@loveworld.com',
    );

    const defaultManagerAuthId = this.configService.get<string>(
      'DEFAULT_MANAGER_EXTERNAL_AUTH_ID',
      'external-auth-manager-001',
    );

    // Off unless explicitly switched on: a deploy that forgets the variable
    // must not fall back to accepting hand-written tokens.
    const isMockAuthEnabled =
      this.configService.get<string>('ENABLE_MOCK_AUTH', 'false') === 'true';

    // Anything shaped like a JWT must carry a valid signature (and an
    // unexpired `exp`) made with JWT_SECRET. Reading the payload without
    // verifying it would let anyone claim any email, so a bad token is
    // refused outright and never falls through to the mock path below.
    if (token.split('.').length === 3) {
      const payloadObj = this.jwtService.verify<Record<string, unknown>>(token);
      const email =
        typeof payloadObj.email === 'string'
          ? payloadObj.email
          : 'user@loveworld.com';

      let externalAuthId: string;
      if (typeof payloadObj.externalAuthId === 'string') {
        externalAuthId = payloadObj.externalAuthId;
      } else if (typeof payloadObj.sub === 'string') {
        externalAuthId = payloadObj.sub;
      } else if (email === defaultManagerEmail) {
        externalAuthId = defaultManagerAuthId;
      } else {
        externalAuthId = `ext-id-${email}`;
      }

      return {
        externalAuthId,
        email,
        token,
      };
    }

    // Dev / Mock auth string fallback (only when ENABLE_MOCK_AUTH=true)
    if (!isMockAuthEnabled) {
      throw new Error(
        'Unrecognized JWT token format and mock authentication is disabled',
      );
    }

    const isManagerToken = token.toLowerCase().startsWith('manager');
    const email = token.includes('@')
      ? token
      : isManagerToken
        ? defaultManagerEmail
        : `${token}@loveworld.com`;
    const externalAuthId = isManagerToken
      ? defaultManagerAuthId
      : `ext-id-${token}`;

    return {
      externalAuthId,
      email,
      token,
    };
  }
}
