import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('ProfileController', () => {
  let controller: ProfileController;

  const mockProfile = {
    id: 'profile-uuid-001',
    email: 'manager@loveworld.com',
    firstName: 'System',
    lastName: 'Manager',
    role: UserRole.MANAGER,
    externalAuthId: 'external-auth-manager-001',
    isActive: true,
  };

  const mockProfileService = {
    createProfile: jest.fn(),
    findAllProfiles: jest.fn(),
    findProfileById: jest.fn(),
    findProfileByEmail: jest.fn(),
    findProfileByExternalAuthId: jest.fn(),
    updateProfile: jest.fn(),
    deactivateProfile: jest.fn(),
  };

  const mockPrismaService = {};
  const mockJwtService = { decode: jest.fn() };
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProfile', () => {
    it('should delegate creation to ProfileService', async () => {
      mockProfileService.createProfile.mockResolvedValue(mockProfile);

      const dto = {
        email: 'manager@loveworld.com',
        firstName: 'System',
        lastName: 'Manager',
        role: UserRole.MANAGER,
      };

      const result = await controller.createProfile(dto);
      expect(result).toEqual(mockProfile);
      expect(mockProfileService.createProfile).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return list of profiles', async () => {
      mockProfileService.findAllProfiles.mockResolvedValue([mockProfile]);

      const result = await controller.findAll({});
      expect(result).toEqual([mockProfile]);
    });
  });

  describe('findOne', () => {
    it('should return profile by ID', async () => {
      mockProfileService.findProfileById.mockResolvedValue(mockProfile);

      const result = await controller.findOne('profile-uuid-001');
      expect(result).toEqual(mockProfile);
    });
  });
});
