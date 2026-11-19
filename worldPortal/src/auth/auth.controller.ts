import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetTestTokenDto } from './dto/get-test-token.dto';
import { isTrustedServiceKey } from './service-key';

@ApiTags('Auth Test Helper')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('test-token')
  @ApiOperation({
    summary: 'Generate a functional JWT Bearer token for Swagger testing',
    description:
      'Generates a signed JWT Bearer token containing user email and externalAuthId. Enabled when ENABLE_MOCK_AUTH=true.',
  })
  @ApiResponse({
    status: 201,
    description: 'Functional test JWT token issued successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Mock authentication helper is disabled in this environment.',
  })
  getTestToken(
    @Body() dto: GetTestTokenDto,
    @Headers('x-service-key') serviceKey?: string,
  ) {
    const isMockAuthEnabled =
      this.configService.get<string>('ENABLE_MOCK_AUTH', 'false') === 'true';

    const isTrustedService = isTrustedServiceKey(
      this.configService.get<string>('SERVICE_AUTH_KEY'),
      serviceKey,
    );

    if (!isMockAuthEnabled && !isTrustedService) {
      this.logger.warn(
        'Refused /auth/test-token: mock auth is off and no valid service key was sent',
      );
      throw new ForbiddenException(
        'Mock authentication helper is disabled in this environment',
      );
    }

    this.logger.log(`POST /auth/test-token called for email=${dto.email}`);
    return this.authService.generateTestToken(dto);
  }
}
