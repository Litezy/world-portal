import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    generateTestToken: jest.fn().mockReturnValue({
      accessToken: 'mock-jwt-token',
      tokenType: 'Bearer',
      expiresIn: '1h',
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
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

  it('should generate test token', () => {
    const result = controller.getTestToken({ email: 'manager@loveworld.com' });
    expect(result).toHaveProperty('accessToken');
    expect(mockAuthService.generateTestToken).toHaveBeenCalledWith({
      email: 'manager@loveworld.com',
    });
  });
});
