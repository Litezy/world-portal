import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { SendGridService } from '../mail/sendgrid.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

describe('OtpService', () => {
  let service: OtpService;

  const mockSendGridService = {
    sendOtpEmail: jest
      .fn<Promise<boolean>, [string, string]>()
      .mockResolvedValue(true),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('preserves intentional bypass for an email without an account pending parent auth', async () => {
    mockPrismaService.profile.findUnique.mockResolvedValue(null);
    mockPrismaService.agencyUser.findUnique.mockResolvedValue(null);
    mockPrismaService.agency.findFirst.mockResolvedValue(null);
    mockPrismaService.visaDocumentation.findFirst.mockResolvedValue(null);
    mockPrismaService.passportApplication.findFirst.mockResolvedValue(null);
    mockPrismaService.hireBooking.findFirst.mockResolvedValue(null);

    await expect(
      service.verifyOtp({ email: 'nonexistent@example.com', code: '000000' }),
    ).resolves.toMatchObject({ verified: true, profileId: null });
  });

  it('bypasses SendGrid delivery when ENABLE_OTP_DEV_BYPASS is true', async () => {
    const originalEnv = process.env.ENABLE_OTP_DEV_BYPASS;
    try {
      process.env.ENABLE_OTP_DEV_BYPASS = 'true';
      const result = await service.sendOtp({ email: 'bypass@example.com' });
      expect(result.success).toBe(true);
      expect(mockSendGridService.sendOtpEmail).not.toHaveBeenCalled();

      await expect(
        service.verifyOtp({ email: 'bypass@example.com', code: '000000' }),
      ).resolves.toMatchObject({ verified: true });
    } finally {
      if (originalEnv !== undefined) {
        process.env.ENABLE_OTP_DEV_BYPASS = originalEnv;
      } else {
        delete process.env.ENABLE_OTP_DEV_BYPASS;
      }
    }
  });

  describe('when dev bypass is disabled', () => {
    const originalEnv = process.env.ENABLE_OTP_DEV_BYPASS;

    beforeEach(() => {
      process.env.ENABLE_OTP_DEV_BYPASS = 'false';
    });

    afterAll(() => {
      if (originalEnv !== undefined) {
        process.env.ENABLE_OTP_DEV_BYPASS = originalEnv;
      } else {
        delete process.env.ENABLE_OTP_DEV_BYPASS;
      }
    });

    it('delivers the generated code and accepts it only once', async () => {
      await service.sendOtp({ email: ' Mailbox@Example.com ' });
      const [email, code] = mockSendGridService.sendOtpEmail.mock.calls.at(-1)!;
      expect(email).toBe('mailbox@example.com');
      expect(code).toMatch(/^\d{6}$/);
      await expect(service.verifyOtp({ email, code })).resolves.toMatchObject({
        verified: true,
      });
      await expect(service.verifyOtp({ email, code })).rejects.toThrow(
        BadRequestException,
      );
    });

    it.each(['false', 'throw'])(
      'rejects failed delivery (%s) and invalidates the unsent code',
      async (failure) => {
        if (failure === 'false')
          mockSendGridService.sendOtpEmail.mockResolvedValueOnce(false);
        else
          mockSendGridService.sendOtpEmail.mockRejectedValueOnce(
            new Error('provider failure'),
          );
        await expect(
          service.sendOtp({ email: 'failure@example.com' }),
        ).rejects.toThrow(ServiceUnavailableException);
        const [email, code] = mockSendGridService.sendOtpEmail.mock.calls.at(-1)!;
        await expect(service.verifyOtp({ email, code })).rejects.toThrow(
          BadRequestException,
        );
      },
    );
  });

  it('should verify successfully if email account exists in DB', async () => {
    mockPrismaService.profile.findUnique.mockResolvedValue({
      id: 'prof-1',
      email: 'registered@example.com',
    });

    const result = await service.verifyOtp({
      email: 'registered@example.com',
      code: '000000',
    });

    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.profileId).toBe('prof-1');
  });
});
