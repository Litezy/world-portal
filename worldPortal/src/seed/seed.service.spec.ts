import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('SeedService', () => {
  let service: SeedService;

  const mockPrismaService = {
    profile: { upsert: jest.fn().mockResolvedValue({ email: 'manager@loveworld.com' }) },
    bankAccount: { upsert: jest.fn().mockResolvedValue({}) },
    agency: { upsert: jest.fn().mockResolvedValue({ id: 'agency-01' }) },
    agencyUser: { upsert: jest.fn().mockResolvedValue({}) },
    agencyStaff: { upsert: jest.fn().mockResolvedValue({ id: 'staff-01' }) },
    agencyDocument: { upsert: jest.fn().mockResolvedValue({}) },
    agencyAssignment: { upsert: jest.fn().mockResolvedValue({}) },
    professionalProfile: { upsert: jest.fn().mockResolvedValue({}) },
    visaDocumentation: { upsert: jest.fn().mockResolvedValue({}) },
    passportApplication: { upsert: jest.fn().mockResolvedValue({}) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw UnauthorizedException if secret code is invalid', async () => {
    await expect(service.runSeed({ secretCode: 'INVALID_CODE' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should execute seed successfully when correct secret code is provided', async () => {
    const res = await service.runSeed({ secretCode: 'WORLD_PORTAL_SEED_2026_SECURE' });
    expect(res.success).toBe(true);
    expect(res.defaultPassword).toBe('Password@2');
    expect(mockPrismaService.profile.upsert).toHaveBeenCalled();
  });
});
