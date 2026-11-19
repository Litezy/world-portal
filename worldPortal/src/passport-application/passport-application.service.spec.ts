import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  PassportApplicationStatus,
  PaymentOption,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PassportApplicationService } from './passport-application.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendGridService } from '../mail/sendgrid.service';
import { OtpService } from '../otp/otp.service';

type CallArgs = { where?: unknown; data: Record<string, unknown> };
function firstArg(mock: jest.Mock): CallArgs {
  return (mock.mock.calls as unknown as CallArgs[][])[0][0];
}

describe('PassportApplicationService', () => {
  const record = {
    id: 'pp-001',
    applicationNo: 'PASSPORT-2026-0001',
    email: 'ada@example.com',
    firstName: 'Ada',
    surname: 'Okafor',
    status: PassportApplicationStatus.SUBMITTED,
    paymentStatus: PaymentStatus.PENDING_EVALUATION,
    totalAmount: null as Prisma.Decimal | null,
    amountPaid: new Prisma.Decimal(0),
    balanceDue: new Prisma.Decimal(0),
    currency: 'USD',
    allowInstallment: false,
  };

  const passportApplication = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const prisma = {
    passportApplication,
    profile: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn<
      Promise<unknown>,
      [(tx: unknown) => Promise<unknown>]
    >(),
  };
  // The transaction client is the same mock.
  prisma.$transaction.mockImplementation((work) => work(prisma));
  const sendGrid = {
    sendApplicationConfirmationEmail: jest.fn().mockResolvedValue(true),
    sendCostEvaluatedEmail: jest.fn().mockResolvedValue(true),
    sendPaymentConfirmedEmail: jest.fn().mockResolvedValue(true),
  };

  let service: PassportApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    passportApplication.update.mockImplementation(
      ({ data }: { data: object }) => Promise.resolve({ ...record, ...data }),
    );
    service = new PassportApplicationService(
      prisma as unknown as PrismaService,
      sendGrid as unknown as SendGridService,
      {} as OtpService,
    );
  });

  /**
   * Only the signed-in applicant's route creates an application, so a
   * `profileId` in the form is theirs to make up: it is ignored, never used
   * to link the file to a desk member's profile.
   */
  describe('createApplication profileId', () => {
    const owner = { clerkUserId: 'user_abc', email: 'ada@example.com' };
    const form = {
      passportCategory: 'FRESH' as const,
      surname: 'Okafor',
      firstName: 'Ada',
      sex: 'FEMALE' as const,
      ninNumber: '12345678901',
      email: 'ada@example.com',
    };

    beforeEach(() => {
      passportApplication.findUnique.mockResolvedValue(null);
      passportApplication.create.mockResolvedValue(record);
    });

    it('never links the file to a desk profile the applicant names', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        id: 'desk-profile-1',
        email: 'partner@example.com',
      });

      await service.createApplication(
        { ...form, profileId: 'desk-profile-1' },
        owner,
      );

      expect(firstArg(passportApplication.create).data.profileId).toBeNull();
      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
    });

    it('does not say whether a named profile id exists', async () => {
      await expect(
        service.createApplication(
          { ...form, profileId: 'no-such-profile' },
          owner,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('evaluateCost', () => {
    it.each([
      PassportApplicationStatus.APPROVED,
      PassportApplicationStatus.REJECTED,
    ])('refuses to price a file that is %s', async (status) => {
      passportApplication.findFirst.mockResolvedValue({ ...record, status });

      await expect(
        service.evaluateCost(
          'pp-001',
          { totalAmount: 150 },
          'staff@example.com',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(passportApplication.update).not.toHaveBeenCalled();
    });

    it('refuses to re-price while the applicant has money paid in', async () => {
      passportApplication.findFirst.mockResolvedValue({
        ...record,
        status: PassportApplicationStatus.UNDER_REVIEW,
        paymentStatus: PaymentStatus.FULLY_PAID,
      });

      await expect(
        service.evaluateCost(
          'pp-001',
          { totalAmount: 150 },
          'staff@example.com',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('prices a file whose review started before it was priced, keeping it under review', async () => {
      passportApplication.findFirst.mockResolvedValue({
        ...record,
        status: PassportApplicationStatus.UNDER_REVIEW,
      });

      await service.evaluateCost(
        'pp-001',
        { totalAmount: 150, currency: 'USD' },
        'staff@example.com',
      );

      const { data } = firstArg(passportApplication.update);
      expect(data.status).toBe(PassportApplicationStatus.UNDER_REVIEW);
      expect(data.paymentStatus).toBe(PaymentStatus.AWAITING_PAYMENT);
      expect(Number(data.balanceDue)).toBe(150);
    });

    it('moves a submitted file to evaluated', async () => {
      passportApplication.findFirst.mockResolvedValue(record);

      await service.evaluateCost(
        'pp-001',
        { totalAmount: 150 },
        'staff@example.com',
      );

      expect(firstArg(passportApplication.update).data.status).toBe(
        PassportApplicationStatus.EVALUATED,
      );
    });
  });

  describe('handlePaymentConfirmed', () => {
    it('adds the payment to the balance read inside the transaction, then emails', async () => {
      const evaluated = {
        ...record,
        status: PassportApplicationStatus.EVALUATED,
        paymentStatus: PaymentStatus.AWAITING_PAYMENT,
        totalAmount: new Prisma.Decimal(150),
      };
      passportApplication.findFirst.mockResolvedValue(evaluated);
      // Inside the transaction a colleague's half payment is already there.
      passportApplication.findUniqueOrThrow.mockResolvedValue({
        ...evaluated,
        amountPaid: new Prisma.Decimal(75),
      });

      await service.handlePaymentConfirmed(
        'pp-001',
        new Prisma.Decimal(75),
        PaymentOption.HALF_INSTALLMENT,
      );

      const { data } = firstArg(passportApplication.update);
      expect(Number(data.amountPaid)).toBe(150);
      expect(Number(data.balanceDue)).toBe(0);
      expect(data.paymentStatus).toBe(PaymentStatus.FULLY_PAID);
      expect(data.status).toBe(PassportApplicationStatus.UNDER_REVIEW);
      expect(sendGrid.sendPaymentConfirmedEmail).toHaveBeenCalledTimes(1);
    });
  });
});
