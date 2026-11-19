import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GetTestTokenDto } from './dto/get-test-token.dto';

/**
 * Matches the admin console's longest session ("remember me", 7 days), which
 * carries this token throughout. ExternalAuthGuard enforces `exp`, and
 * RolesGuard re-reads the profile on every request, so deactivating someone
 * still cuts them off at once.
 */
export const ACCESS_TOKEN_TTL = '7d';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTestToken(dto: GetTestTokenDto) {
    this.logger.log(`Generating test JWT for email=${dto.email}`);

    const defaultManagerEmail = this.configService.get<string>(
      'DEFAULT_MANAGER_EMAIL',
      'manager@loveworld.com',
    );

    const defaultManagerAuthId = this.configService.get<string>(
      'DEFAULT_MANAGER_EXTERNAL_AUTH_ID',
      'external-auth-manager-001',
    );

    const externalAuthId =
      dto.externalAuthId ??
      (dto.email === defaultManagerEmail
        ? defaultManagerAuthId
        : `ext-id-${dto.email}`);

    const payload = {
      sub: externalAuthId,
      externalAuthId,
      email: dto.email,
      iss: 'world-portal-auth',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL,
      user: {
        email: dto.email,
        externalAuthId,
      },
    };
  }
}
