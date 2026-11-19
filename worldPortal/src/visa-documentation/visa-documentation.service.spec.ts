import { Test, TestingModule } from '@nestjs/testing';
import { VisaDocumentationService } from './visa-documentation.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendGridService } from '../mail/sendgrid.service';
import { BankAccountService } from '../bank-account/bank-account.service';
import { OtpService } from '../otp/otp.service';
import {
  VisaDocumentStatus,
  PaymentStatus,
  PaymentOption,
  VisaCategory,
  Gender,
  Prisma,
} from '@prisma/client';
import { ConflictException } from '@nestjs/common';

/** A mock's first-call argument, typed: `mock.calls` is `any` in jest's own types. */
type CallArgs = { where?: unknown; data: Record<string, unknown> };
function firstArg(mock: jest.Mock): CallArgs {
  return (mock.mock.calls as unknown as CallArgs[][])[0][0];
}

describe('VisaDocumentationService', () => {
  let service: VisaDocumentationService;

  const mockVisaRecord = {
    id: 'visa-uuid-001',
    applicationNo: 'VISA-2026-8941',
    profileId: null,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@gmail.com',
    phone: '+2348012345678',
    dateOfBirth: new Date('1992-05-15'),
    gender: Gender.MALE,
    nationality: 'Nigerian',
    residenceAddress: '123 Loveworld Street, Lagos',
    passportNumber: 'A12345678',
    passportIssueDate: new Date('2022-01-10'),
    passportExpiryDate: new Date('2032-01-09'),
    passportIssuingAuthority: 'NIS',
    targetCountry: 'Canada',
    visaCategory: VisaCategory.TOURIST,
    intendedArrivalDate: new Date('2026-10-01'),
    intendedDepartureDate: new Date('2026-10-21'),
    purposeOfVisit: 'Vacation',
    passportDataPageUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
    passportPhotoWhiteBgUrl: 'https://s3.amazonaws.com/bucket/photo.jpg',
    proofOfFunds6MonthsUrl: 'https://s3.amazonaws.com/bucket/pof.pdf',
    businessRegistrationCertUrl: null,
    taxCertificateUrl: null,
    marriageCertificateUrl: null,
    childrenBirthCertUrls: [],
    landedPropertyDocUrls: [],
    previousVisasScanUrls: [],
    supportingDocUrls: [],
    totalAmount: new Prisma.Decimal(500.0),
    amountPaid: new Prisma.Decimal(0.0),
    balanceDue: new Prisma.Decimal(500.0),
    allowInstallment: true,
    selectedPaymentOption: null,
    paymentStatus: PaymentStatus.AWAITING_PAYMENT,
    status: VisaDocumentStatus.EVALUATED,
    evaluatedBy: 'admin@loveworld.com',
    evaluatedAt: new Date(),
    createdBy: 'john.doe@gmail.com',
    reviewedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const findFirst = jest.fn();
  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
    },
    visaDocumentation: {
      findUnique: jest.fn(),
      findFirst,
      // Reads the same canned record as findFirst (findVisaApplicationById).
      findUniqueOrThrow: jest.fn(
        (args: unknown) => findFirst(args) as Promise<unknown>,
      ),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn<
      Promise<unknown>,
      [(tx: unknown) => Promise<unknown>]
    >(),
  };
  // The transaction client is the same mock.
  mockPrismaService.$transaction.mockImplementation((work) =>
    work(mockPrismaService),
  );

  beforeEach(async () => {
    const mockOtpService = {
      isEmailVerified: jest.fn().mockReturnValue(true),
    };
    const mockSendGridService = {
      sendApplicationConfirmationEmail: jest.fn().mockResolvedValue(true),
      sendCostEvaluatedEmail: jest.fn().mockResolvedValue(true),
      sendPaymentConfirmedEmail: jest.fn().mockResolvedValue(true),
      sendApplicationApprovedEmail: jest.fn().mockResolvedValue(true),
      sendApplicationRejectedEmail: jest.fn().mockResolvedValue(true),
      sendApplicantInvitationEmail: jest.fn().mockResolvedValue(true),
    };
    const mockBankAccountService = {
      findActive: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisaDocumentationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SendGridService, useValue: mockSendGridService },
        { provide: BankAccountService, useValue: mockBankAccountService },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    service = module.get<VisaDocumentationService>(VisaDocumentationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVisaApplication', () => {
    it('should create visa application with SUBMITTED status & PENDING_EVALUATION paymentStatus', async () => {
      mockPrismaService.visaDocumentation.findUnique.mockResolvedValue(null);
      mockPrismaService.visaDocumentation.create.mockResolvedValue({
        ...mockVisaRecord,
        status: VisaDocumentStatus.SUBMITTED,
        paymentStatus: PaymentStatus.PENDING_EVALUATION,
      });

      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@gmail.com',
        phone: '+2348012345678',
        dateOfBirth: '1992-05-15',
        nationality: 'Nigerian',
        residenceAddress: '123 Loveworld Street, Lagos',
        passportNumber: 'A12345678',
        passportIssueDate: '2022-01-10',
        passportExpiryDate: '2032-01-09',
        targetCountry: 'Canada',
        visaCategory: VisaCategory.TOURIST,
        intendedArrivalDate: '2026-10-01',
        intendedDepartureDate: '2026-10-21',
        purposeOfVisit: 'Vacation',
        passportDataPageUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
        passportPhotoWhiteBgUrl: 'https://s3.amazonaws.com/bucket/photo.jpg',
        proofOfFunds6MonthsUrl: 'https://s3.amazonaws.com/bucket/pof.pdf',
      };

      const result = await service.createVisaApplication(dto);
      expect(result.status).toBe(VisaDocumentStatus.SUBMITTED);
      expect(result.paymentStatus).toBe(PaymentStatus.PENDING_EVALUATION);
    });

    it('files a signed-in applicant’s application under their account and verified email', async () => {
      const otp = (
        service as unknown as { otpService: { isEmailVerified: jest.Mock } }
      ).otpService;
      otp.isEmailVerified.mockReturnValue(false);
      mockPrismaService.visaDocumentation.findUnique.mockResolvedValue(null);
      mockPrismaService.visaDocumentation.create.mockResolvedValue(
        mockVisaRecord,
      );

      await service.createVisaApplication(
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'typed-by-hand@example.com',
          targetCountry: 'Canada',
        },
        { clerkUserId: 'user_abc', email: 'john.doe@gmail.com' },
      );

      // The email-code check is for guests; a WorldStreet session replaces it.
      expect(otp.isEmailVerified).not.toHaveBeenCalled();
      expect(mockPrismaService.visaDocumentation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clerkUserId: 'user_abc',
          email: 'john.doe@gmail.com',
        }) as unknown,
      });
    });
  });

  /**
   * The only route that creates an application is the signed-in applicant's.
   * A `profileId` in their form would link their file to any desk member's
   * profile (and a 400 for an unknown one told them which ids exist), so it
   * is ignored, as on hire bookings.
   */
  describe('createVisaApplication profileId', () => {
    const owner = { clerkUserId: 'user_abc', email: 'john.doe@gmail.com' };
    const form = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@gmail.com',
      targetCountry: 'Canada',
    };

    beforeEach(() => {
      mockPrismaService.visaDocumentation.findUnique.mockResolvedValue(null);
      mockPrismaService.visaDocumentation.create.mockResolvedValue(
        mockVisaRecord,
      );
    });

    it('never links the file to a desk profile the applicant names', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: 'desk-profile-1',
        email: 'partner@example.com',
      });

      await service.createVisaApplication(
        { ...form, profileId: 'desk-profile-1' },
        owner,
      );

      expect(mockPrismaService.visaDocumentation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ profileId: null }) as unknown,
      });
      expect(mockPrismaService.profile.findUnique).not.toHaveBeenCalled();
    });

    it('does not say whether a named profile id exists', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.createVisaApplication(
          { ...form, profileId: 'no-such-profile' },
          owner,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('evaluateVisaCost', () => {
    it('should allocate total cost and update status to EVALUATED', async () => {
      mockPrismaService.visaDocumentation.findFirst.mockResolvedValue(
        mockVisaRecord,
      );
      mockPrismaService.visaDocumentation.update.mockResolvedValue({
        ...mockVisaRecord,
        totalAmount: new Prisma.Decimal(500.0),
        status: VisaDocumentStatus.EVALUATED,
        paymentStatus: PaymentStatus.AWAITING_PAYMENT,
      });

      const result = await service.evaluateVisaCost(
        'visa-uuid-001',
        { totalAmount: 500, allowInstallment: true },
        'manager@loveworld.com',
      );

      expect(result.status).toBe(VisaDocumentStatus.EVALUATED);
      expect(result.paymentStatus).toBe(PaymentStatus.AWAITING_PAYMENT);
    });

    // ADR 0016
    it('keeps a payment already recorded when the price changes', async () => {
      mockPrismaService.visaDocumentation.findFirst.mockResolvedValue({
        ...mockVisaRecord,
        amountPaid: new Prisma.Decimal(100),
        paymentStatus: PaymentStatus.AWAITING_PAYMENT,
      });
      mockPrismaService.visaDocumentation.update.mockResolvedValue(
        mockVisaRecord,
      );

      await service.evaluateVisaCost(
        'visa-uuid-001',
        { totalAmount: 600 },
        'manager@loveworld.com',
      );

      const { data } = firstArg(mockPrismaService.visaDocumentation.update);
      expect(Number(data.amountPaid)).toBe(100);
      expect(Number(data.balanceDue)).toBe(500);
    });

    it.each([PaymentStatus.PARTIALLY_PAID, PaymentStatus.FULLY_PAID])(
      'refuses to re-price once the applicant has paid (%s)',
      async (paymentStatus) => {
        mockPrismaService.visaDocumentation.findFirst.mockResolvedValue({
          ...mockVisaRecord,
          paymentStatus,
        });

        await expect(
          service.evaluateVisaCost(
            'visa-uuid-001',
            { totalAmount: 600 },
            'manager@loveworld.com',
          ),
        ).rejects.toThrow(ConflictException);
        expect(
          mockPrismaService.visaDocumentation.update,
        ).not.toHaveBeenCalled();
      },
    );

    it.each([VisaDocumentStatus.APPROVED, VisaDocumentStatus.REJECTED])(
      'refuses to re-price a file that is %s',
      async (status) => {
        mockPrismaService.visaDocumentation.findFirst.mockResolvedValue({
          ...mockVisaRecord,
          status,
        });

        await expect(
          service.evaluateVisaCost(
            'visa-uuid-001',
            { totalAmount: 600 },
            'manager@loveworld.com',
          ),
        ).rejects.toThrow(ConflictException);
      },
    );

    it.each([
      [
        'its review was started before it was priced',
        PaymentStatus.PENDING_EVALUATION,
      ],
      ['its payment was refunded', PaymentStatus.REFUNDED],
    ])(
      'prices a file under review with nothing held (%s), keeping it under review',
      async (_case, paymentStatus) => {
        mockPrismaService.visaDocumentation.findFirst.mockResolvedValue({
          ...mockVisaRecord,
          status: VisaDocumentStatus.UNDER_REVIEW,
          paymentStatus,
          totalAmount: null,
          amountPaid: new Prisma.Decimal(0),
        });
        mockPrismaService.visaDocumentation.update.mockResolvedValue(
          mockVisaRecord,
        );

        await service.evaluateVisaCost(
          'visa-uuid-001',
          { totalAmount: 600 },
          'manager@loveworld.com',
        );

        const { data } = firstArg(mockPrismaService.visaDocumentation.update);
        expect(data.status).toBe(VisaDocumentStatus.UNDER_REVIEW);
        expect(data.paymentStatus).toBe(PaymentStatus.AWAITING_PAYMENT);
        expect(Number(data.balanceDue)).toBe(600);
      },
    );

    it('refuses to re-price a file under review while money is held', async () => {
      mockPrismaService.visaDocumentation.findFirst.mockResolvedValue({
        ...mockVisaRecord,
        status: VisaDocumentStatus.UNDER_REVIEW,
        paymentStatus: PaymentStatus.FULLY_PAID,
      });

      await expect(
        service.evaluateVisaCost(
          'visa-uuid-001',
          { totalAmount: 600 },
          'manager@loveworld.com',
        ),
      ).rejects.toThrow(/Refund the payment/);
    });
  });

  describe('handlePaymentConfirmed', () => {
    it('moves an evaluated file into review', async () => {
      mockPrismaService.visaDocumentation.findFirst.mockResolvedValue(
        mockVisaRecord,
      );
      mockPrismaService.visaDocumentation.update.mockResolvedValue(
        mockVisaRecord,
      );

      await service.handlePaymentConfirmed(
        'visa-uuid-001',
        new Prisma.Decimal(500),
        PaymentOption.FULL,
      );

      const { data } = firstArg(mockPrismaService.visaDocumentation.update);
      expect(data.status).toBe(VisaDocumentStatus.UNDER_REVIEW);
      expect(data.paymentStatus).toBe(PaymentStatus.FULLY_PAID);
    });

    // ADR 0016
    it('never drags an approved file back into review', async () => {
      mockPrismaService.visaDocumentation.findFirst.mockResolvedValue({
        ...mockVisaRecord,
        status: VisaDocumentStatus.APPROVED,
        amountPaid: new Prisma.Decimal(250),
      });
      mockPrismaService.visaDocumentation.update.mockResolvedValue(
        mockVisaRecord,
      );

      await service.handlePaymentConfirmed(
        'visa-uuid-001',
        new Prisma.Decimal(250),
        PaymentOption.HALF_INSTALLMENT,
      );

      const { data } = firstArg(mockPrismaService.visaDocumentation.update);
      expect(data.status).toBe(VisaDocumentStatus.APPROVED);
    });
  });

  describe('inviteApplicant', () => {
    it('should throw BadRequestException if application is in SUBMITTED status', async () => {
      mockPrismaService.visaDocumentation.findFirst.mockResolvedValue({
        ...mockVisaRecord,
        status: VisaDocumentStatus.SUBMITTED,
      });

      const dto = {
        purpose: 'Biometric Data Capture',
        date: '2026-09-15',
        time: '10:00 AM',
        location: 'Embassy Room 302',
      };

      await expect(
        service.inviteApplicant('visa-uuid-001', dto, 'staff@worldportal.com'),
      ).rejects.toThrow(
        'Invitations can only be issued starting from UNDER_REVIEW status',
      );
    });

    it('should update notes and trigger email when in UNDER_REVIEW status', async () => {
      mockPrismaService.visaDocumentation.findFirst.mockResolvedValue({
        ...mockVisaRecord,
        status: VisaDocumentStatus.UNDER_REVIEW,
      });
      mockPrismaService.visaDocumentation.update.mockResolvedValue({
        ...mockVisaRecord,
        status: VisaDocumentStatus.UNDER_REVIEW,
        verificationNotes: '[Invitation Sent - Biometric Data Capture]',
      });

      const dto = {
        purpose: 'Biometric Data Capture',
        date: '2026-09-15',
        time: '10:00 AM',
        location: 'Embassy Room 302',
        note: 'Bring physical passport',
      };

      const result = await service.inviteApplicant(
        'visa-uuid-001',
        dto,
        'staff@worldportal.com',
      );

      expect(result.verificationNotes).toContain('Invitation Sent');
      expect(mockPrismaService.visaDocumentation.update).toHaveBeenCalled();
    });
  });
});
