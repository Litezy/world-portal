import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ACCESS_TOKEN_TTL, AuthService } from './auth.service';
import { resolveJwtSecret } from './jwt-secret';
import { AuthController } from './auth.controller';
import { ExternalAuthGuard } from './guards/external-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { ClerkTokenVerifier } from './clerk/clerk-token.verifier';
import { ClerkIdentityService } from './clerk/clerk-identity.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: resolveJwtSecret({
          NODE_ENV: configService.get<string>('NODE_ENV'),
          JWT_SECRET: configService.get<string>('JWT_SECRET'),
        }),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ExternalAuthGuard,
    RolesGuard,
    ClerkAuthGuard,
    ClerkTokenVerifier,
    ClerkIdentityService,
  ],
  exports: [
    AuthService,
    JwtModule,
    ExternalAuthGuard,
    RolesGuard,
    ClerkAuthGuard,
    ClerkTokenVerifier,
    ClerkIdentityService,
  ],
})
export class AuthModule {}
