import {
  Controller,
  Post,
  Body,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetTestTokenDto } from './dto/get-test-token.dto';

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
  getTestToken(@Body() dto: GetTestTokenDto) {
    const isMockAuthEnabled =
      this.configService.get<string>('ENABLE_MOCK_AUTH', 'true') === 'true';

    if (!isMockAuthEnabled) {
      this.logger.warn(
        'Attempted to call /auth/test-token when ENABLE_MOCK_AUTH=false',
      );
      throw new ForbiddenException(
        'Mock authentication helper is disabled in this environment',
      );
    }

    this.logger.log(`POST /auth/test-token called for email=${dto.email}`);
    return this.authService.generateTestToken(dto);
  }
}
