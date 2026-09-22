import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendGridService } from '../mail/sendgrid.service';
import { UserRole } from '@prisma/client';

import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ProfileService', () => {
  let service: ProfileService;

  const mockProfile = {
    id: 'profile-uuid-001',
    email: 'manager@loveworld.com',
    firstName: 'System',
    lastName: 'Manager',
    phone: '+1234567890',
    role: UserRole.MANAGER,
    externalAuthId: 'external-auth-manager-001',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const mockSendGridService = {
      sendTeamInviteEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SendGridService,
          useValue: mockSendGridService,
        },
      ],
    }).compile();


    service = module.get<ProfileService>(ProfileService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProfile', () => {
    it('should successfully create a new profile', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);
      mockPrismaService.profile.create.mockResolvedValue(mockProfile);

      const dto = {
        email: 'manager@loveworld.com',
        firstName: 'System',
        lastName: 'Manager',
        role: UserRole.MANAGER,
        externalAuthId: 'external-auth-manager-001',
      };

      const result = await service.createProfile(dto);
      expect(result).toEqual(mockProfile);
      expect(mockPrismaService.profile.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const dto = {
        email: 'manager@loveworld.com',
        firstName: 'System',
        lastName: 'Manager',
        role: UserRole.MANAGER,
      };

      await expect(service.createProfile(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findProfileById', () => {
    it('should return profile if found', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findProfileById('profile-uuid-001');
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.findProfileById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllProfiles', () => {
    it('should return an array of profiles', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue([mockProfile]);

      const result = await service.findAllProfiles();
      expect(result).toEqual([mockProfile]);
    });
  });
});
