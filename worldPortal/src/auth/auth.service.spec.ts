import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
        }),
      ],
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a valid signed JWT test token for manager', () => {
    const result = service.generateTestToken({
      email: 'manager@loveworld.com',
    });

    expect(result).toHaveProperty('accessToken');
    expect(typeof result.accessToken).toBe('string');
    expect(result.user.externalAuthId).toBe('external-auth-manager-001');
  });

  // The console keeps a signed-in desk for up to 7 days and carries this
  // token for all of it. The guard now enforces `exp`, so a shorter token
  // would sign staff out mid-session.
  it('issues tokens that last 7 days, as long as the longest console session', () => {
    const result = service.generateTestToken({ email: 'staff@example.com' });
    const { iat, exp } = JSON.parse(
      Buffer.from(result.accessToken.split('.')[1], 'base64url').toString(),
    ) as { iat: number; exp: number };

    expect(exp - iat).toBe(7 * 24 * 60 * 60);
    expect(result.expiresIn).toBe('7d');
  });
});
