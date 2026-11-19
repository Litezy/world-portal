import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const SERVICE_KEY = 'k'.repeat(40);

describe('AuthController', () => {
  let controller: AuthController;
  let env: Record<string, string | undefined>;

  const mockAuthService = {
    generateTestToken: jest.fn().mockReturnValue({
      accessToken: 'mock-jwt-token',
      tokenType: 'Bearer',
      expiresIn: '7d',
    }),
  };

  const mockConfigService = {
    get: jest.fn(
      (key: string, defaultValue?: string) => env[key] ?? defaultValue,
    ),
  };

  beforeEach(async () => {
    env = {};
    mockAuthService.generateTestToken.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('issues a token when mock sign-in is switched on (local dev)', () => {
    env.ENABLE_MOCK_AUTH = 'true';

    const result = controller.getTestToken({ email: 'manager@loveworld.com' });

    expect(result).toHaveProperty('accessToken');
    expect(mockAuthService.generateTestToken).toHaveBeenCalledWith({
      email: 'manager@loveworld.com',
    });
  });

  it('refuses when ENABLE_MOCK_AUTH is not set and no service key is sent', () => {
    expect(() =>
      controller.getTestToken({ email: 'manager@loveworld.com' }),
    ).toThrow(ForbiddenException);
    expect(mockAuthService.generateTestToken).not.toHaveBeenCalled();
  });

  it('issues a token to a caller holding the service key, with mock sign-in off', () => {
    env.ENABLE_MOCK_AUTH = 'false';
    env.SERVICE_AUTH_KEY = SERVICE_KEY;

    const result = controller.getTestToken(
      { email: 'manager@loveworld.com' },
      SERVICE_KEY,
    );

    expect(result).toHaveProperty('accessToken');
  });

  it('refuses a wrong service key', () => {
    env.SERVICE_AUTH_KEY = SERVICE_KEY;

    expect(() =>
      controller.getTestToken(
        { email: 'manager@loveworld.com' },
        'k'.repeat(39) + 'x',
      ),
    ).toThrow(ForbiddenException);
  });

  it('refuses every key when SERVICE_AUTH_KEY is not configured', () => {
    expect(() =>
      controller.getTestToken({ email: 'manager@loveworld.com' }, ''),
    ).toThrow(ForbiddenException);
    expect(() =>
      controller.getTestToken({ email: 'manager@loveworld.com' }, 'undefined'),
    ).toThrow(ForbiddenException);
  });

  it('refuses when the configured SERVICE_AUTH_KEY is too short to be a secret', () => {
    env.SERVICE_AUTH_KEY = 'short';

    expect(() =>
      controller.getTestToken({ email: 'manager@loveworld.com' }, 'short'),
    ).toThrow(ForbiddenException);
  });
});
