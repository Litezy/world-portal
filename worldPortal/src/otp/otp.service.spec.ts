import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { SendGridService } from '../mail/sendgrid.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: any;

  const mockSendGridService = {
    sendOtpEmail: jest.fn().mockResolvedValue(true),
  };

  const mockPrismaService = {
    profile: { findUnique: jest.fn() },
    agencyUser: { findUnique: jest.fn() },
    agency: { findFirst: jest.fn() },
    visaDocumentation: { findFirst: jest.fn() },
    passportApplication: { findFirst: jest.fn() },
    hireBooking: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: SendGridService, useValue: mockSendGridService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException if account does not exist in DB', async () => {
    mockPrismaService.profile.findUnique.mockResolvedValue(null);
    mockPrismaService.agencyUser.findUnique.mockResolvedValue(null);
    mockPrismaService.agency.findFirst.mockResolvedValue(null);
    mockPrismaService.visaDocumentation.findFirst.mockResolvedValue(null);
    mockPrismaService.passportApplication.findFirst.mockResolvedValue(null);
    mockPrismaService.hireBooking.findFirst.mockResolvedValue(null);

    await expect(
      service.verifyOtp({ email: 'nonexistent@example.com', code: '000000' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should verify successfully if email account exists in DB', async () => {
    mockPrismaService.profile.findUnique.mockResolvedValue({ id: 'prof-1', email: 'registered@example.com' });

    const result = await service.verifyOtp({
      email: 'registered@example.com',
      code: '000000',
    });

    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.profileId).toBe('prof-1');
  });
});
