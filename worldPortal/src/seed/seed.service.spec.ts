import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

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

  // The seed writes demo agencies, applications, a manager and two *active*
  // bank accounts that applicants are shown as places to pay. It must never
  // be reachable on a real database by accident.
  describe('access', () => {
    const saved = { ...process.env };
    const CODE = 'a-long-configured-seed-code-for-tests';

    afterEach(() => {
      process.env = { ...saved };
    });

    it('is switched off unless ENABLE_SEED_ENDPOINT=true, even with the right code', async () => {
      delete process.env.ENABLE_SEED_ENDPOINT;
      process.env.SEED_SECRET_CODE = CODE;

      await expect(service.runSeed({ secretCode: CODE })).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.profile.upsert).not.toHaveBeenCalled();
    });

    it('no longer accepts the built-in code when SEED_SECRET_CODE is not set', async () => {
      process.env.ENABLE_SEED_ENDPOINT = 'true';
      delete process.env.SEED_SECRET_CODE;

      await expect(
        service.runSeed({ secretCode: 'WORLD_PORTAL_SEED_2026_SECURE' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.profile.upsert).not.toHaveBeenCalled();
    });

    it('refuses a wrong code', async () => {
      process.env.ENABLE_SEED_ENDPOINT = 'true';
      process.env.SEED_SECRET_CODE = CODE;

      await expect(service.runSeed({ secretCode: 'INVALID_CODE' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('runs when switched on and given the configured code', async () => {
      process.env.ENABLE_SEED_ENDPOINT = 'true';
      process.env.SEED_SECRET_CODE = CODE;

      const res = await service.runSeed({ secretCode: CODE });
      expect(res.success).toBe(true);
      expect(res.defaultPassword).toBe('Password@2');
      expect(mockPrismaService.profile.upsert).toHaveBeenCalled();
    });
  });
});
