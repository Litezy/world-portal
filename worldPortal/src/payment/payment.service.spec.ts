import { Test, TestingModule } from '@nestjs/testing';
import { balancesAfterRefund, PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendGridService } from '../mail/sendgrid.service';
import { VisaDocumentationService } from '../visa-documentation/visa-documentation.service';
import { PassportApplicationService } from '../passport-application/passport-application.service';
import {
  PaymentOption,
  PaymentStatus,
  PaymentTransactionStatus,
  RefundStatus,
  Prisma,
} from '@prisma/client';
import { BadRequestException, ConflictException } from '@nestjs/common';

/** A mock's first-call argument, typed: `mock.calls` is `any` in jest's own types. */
type CallArgs = { where?: unknown; data: Record<string, unknown> };
function firstArg(mock: jest.Mock): CallArgs {
  return (mock.mock.calls as unknown as CallArgs[][])[0][0];
}

describe('PaymentService', () => {
  let service: PaymentService;

  const mockVisaDoc = {
    id: 'visa-001',
    applicationNo: 'VISA-2026-8812',
    profileId: 'profile-001',
    email: 'test@gmail.com',
    totalAmount: new Prisma.Decimal(1000.0),
    amountPaid: new Prisma.Decimal(0.0),
    balanceDue: new Prisma.Decimal(1000.0),
    allowInstallment: true,
  };

  const mockTransaction = {
    id: 'txn-001',
    transactionRef: 'TXN-PAY-123456',
    visaDocumentationId: 'visa-001',
    profileId: 'profile-001',
    amount: new Prisma.Decimal(500.0),
    paymentOption: PaymentOption.HALF_INSTALLMENT,
    status: PaymentTransactionStatus.INITIATED,
    initiatedBy: 'test@gmail.com',
    createdAt: new Date(),
  };

  const mockConfig = {
    id: 'config-001',
    partnerMarkupPercentage: new Prisma.Decimal(10.0),
    serviceFeePercentage: new Prisma.Decimal(5.0),
    refundSurchargePercentage: new Prisma.Decimal(15.0),
    updatedBy: 'system-default',
  };

  const mockFindVisaApplicationById = jest.fn();
  const mockHandlePaymentConfirmed = jest.fn();
  const mockApplyVisaPayment = jest.fn();
  const mockNotifyVisaPayment = jest.fn();
  const mockFindPassportApplicationById = jest.fn();
  const mockApplyPassportPayment = jest.fn();
  const mockNotifyPassportPayment = jest.fn();

  const mockPassportAppService: Partial<PassportApplicationService> = {
    findApplicationById: mockFindPassportApplicationById,
    handlePaymentConfirmed: jest.fn(),
    applyPayment: mockApplyPassportPayment,
    notifyPaymentConfirmed: mockNotifyPassportPayment,
  };

  const mockPaymentTransactionCreate = jest.fn();
  const mockPaymentTransactionFindUnique = jest.fn();
  const mockPaymentTransactionUpdate = jest.fn();
  const mockPaymentConfigFindFirst = jest.fn();
  const mockPaymentRefundCreate = jest.fn();
  const mockPaymentRefundCount = jest.fn();
  const mockPaymentRefundFindMany = jest.fn();
  const mockVisaDocumentationUpdate = jest.fn();
  const mockVisaDocumentationFindUniqueOrThrow = jest.fn();
  const mockPassportApplicationUpdate = jest.fn();
  const mockPassportApplicationFindUniqueOrThrow = jest.fn();
  const mockPaymentTransactionFindMany = jest.fn();

  const mockVisaDocService: Partial<VisaDocumentationService> = {
    findVisaApplicationById: mockFindVisaApplicationById,
    handlePaymentConfirmed: mockHandlePaymentConfirmed,
    applyPayment: mockApplyVisaPayment,
    notifyPaymentConfirmed: mockNotifyVisaPayment,
  };

  const mockPrismaService: Partial<PrismaService> = {
    paymentConfig: {
      findFirst: mockPaymentConfigFindFirst,
      create: jest.fn(),
      update: jest.fn(),
    } as never,
    paymentTransaction: {
      create: mockPaymentTransactionCreate,
      findUnique: mockPaymentTransactionFindUnique,
      update: mockPaymentTransactionUpdate,
      findMany: mockPaymentTransactionFindMany,
    } as never,
    paymentRefund: {
      create: mockPaymentRefundCreate,
      count: mockPaymentRefundCount,
      findMany: mockPaymentRefundFindMany,
    } as never,
    visaDocumentation: {
      update: mockVisaDocumentationUpdate,
      findUniqueOrThrow: mockVisaDocumentationFindUniqueOrThrow,
    } as never,
    passportApplication: {
      update: mockPassportApplicationUpdate,
      findUniqueOrThrow: mockPassportApplicationFindUniqueOrThrow,
    } as never,
    // Callback form runs against the same mocks; array form resolves each query.
    $transaction: jest.fn(async (arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (tx: unknown) => Promise<unknown>)(mockPrismaService)
        : Promise.all(arg as Promise<unknown>[]),
    ) as never,
  };

  const mockSendRefundProcessedEmail = jest.fn();
  const mockSendGridService: Partial<SendGridService> = {
    sendRefundProcessedEmail: mockSendRefundProcessedEmail,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: VisaDocumentationService, useValue: mockVisaDocService },
        {
          provide: PassportApplicationService,
          useValue: mockPassportAppService,
        },
        { provide: SendGridService, useValue: mockSendGridService },
      ],
    }).compile();

    service = module.get(PaymentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiatePaymentTransaction', () => {
    it('should successfully initiate a payment transaction record', async () => {
      mockFindVisaApplicationById.mockResolvedValue(mockVisaDoc);
      mockPaymentTransactionCreate.mockResolvedValue(mockTransaction);

      const result = await service.initiatePaymentTransaction(
        {
          visaDocumentationId: 'visa-001',
          paymentOption: PaymentOption.HALF_INSTALLMENT,
        },
        'test@gmail.com',
      );

      expect(result.transactionRef).toBeDefined();
      expect(result.paymentOption).toBe(PaymentOption.HALF_INSTALLMENT);
      expect(result.amount).toBe(500.0);
    });

    it('should throw BadRequestException if custom amount for FULL payment is less than remaining balance', async () => {
      mockFindVisaApplicationById.mockResolvedValue(mockVisaDoc);

      await expect(
        service.initiatePaymentTransaction(
          {
            visaDocumentationId: 'visa-001',
            paymentOption: PaymentOption.FULL,
            amount: 500, // Balance is 1000
          },
          'test@gmail.com',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if custom amount exceeds balance due', async () => {
      mockFindVisaApplicationById.mockResolvedValue(mockVisaDoc);

      await expect(
        service.initiatePaymentTransaction(
          {
            visaDocumentationId: 'visa-001',
            paymentOption: PaymentOption.FULL,
            amount: 1500, // Balance is 1000
          },
          'test@gmail.com',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if visaDocumentationId is missing', async () => {
      await expect(
        service.initiatePaymentTransaction(
          { paymentOption: PaymentOption.FULL },
          'test@gmail.com',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPaymentTransaction (Direct Service Injection)', () => {
    it('should confirm transaction and directly invoke visaDocService.handlePaymentConfirmed', async () => {
      mockPaymentTransactionFindUnique.mockResolvedValue(mockTransaction);
      mockHandlePaymentConfirmed.mockResolvedValue({
        ...mockVisaDoc,
        status: 'UNDER_REVIEW',
      });
      mockPaymentTransactionUpdate.mockResolvedValue({
        ...mockTransaction,
        status: PaymentTransactionStatus.CONFIRMED,
      });

      const result = await service.confirmPaymentTransaction({
        transactionRef: 'TXN-PAY-123456',
      });

      expect(mockHandlePaymentConfirmed).toHaveBeenCalledWith(
        'visa-001',
        mockTransaction.amount,
        PaymentOption.HALF_INSTALLMENT,
      );
      expect(result.status).toBe(PaymentTransactionStatus.CONFIRMED);
    });
  });

  describe('initiateRefund', () => {
    it('should process surcharged refund calculation and create refund record', async () => {
      const confirmedTxn = {
        ...mockTransaction,
        status: PaymentTransactionStatus.CONFIRMED,
      };

      mockPaymentTransactionFindUnique.mockResolvedValue(confirmedTxn);
      mockPaymentConfigFindFirst.mockResolvedValue(mockConfig);
      mockPaymentRefundCreate.mockResolvedValue({
        id: 'refund-001',
        refundRef: 'RFD-123456',
        originalAmount: new Prisma.Decimal(500.0),
        surchargeAmount: new Prisma.Decimal(75.0),
        netRefundAmount: new Prisma.Decimal(425.0),
        status: RefundStatus.PROCESSED,
      });

      const refund = await service.initiateRefund(
        {
          transactionRef: 'TXN-PAY-123456',
          reason: 'Customer requested cancellation',
        },
        'admin@loveworld.com',
      );

      expect(refund.id).toBe('refund-001');
      expect(refund.status).toBe(RefundStatus.PROCESSED);
    });

    // ADR 0016
    const linkedVisa = {
      id: 'visa-001',
      applicationNo: 'VISA-2026-8812',
      email: 'test@gmail.com',
      firstName: 'Ada',
      lastName: 'Okafor',
      currency: 'USD',
      totalAmount: new Prisma.Decimal(1000),
      amountPaid: new Prisma.Decimal(500),
      allowInstallment: true,
    };

    function refundSetup() {
      mockPaymentTransactionFindUnique.mockResolvedValue({
        ...mockTransaction,
        status: PaymentTransactionStatus.CONFIRMED,
        visaDocumentation: linkedVisa,
        passportApplication: null,
      });
      mockPaymentConfigFindFirst.mockResolvedValue(mockConfig);
      mockPaymentRefundCreate.mockResolvedValue({
        id: 'refund-002',
        refundRef: 'RFD-1',
      });
      mockSendRefundProcessedEmail.mockResolvedValue(true);
    }

    it('updates the linked application in the same transaction', async () => {
      refundSetup();

      await service.initiateRefund(
        { transactionRef: 'TXN-PAY-123456', reason: 'Trip cancelled' },
        'admin@loveworld.com',
      );

      // The whole 500 paid comes back off the file: nothing is held any more,
      // and nothing is owed until staff price the file again.
      const { where, data } = firstArg(mockVisaDocumentationUpdate);
      expect(where).toEqual({ id: 'visa-001' });
      expect(Number(data.amountPaid)).toBe(0);
      expect(Number(data.balanceDue)).toBe(0);
      expect(data.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(data).not.toHaveProperty('status');
    });

    it('emails the applicant what they get back after the surcharge', async () => {
      refundSetup();

      await service.initiateRefund(
        { transactionRef: 'TXN-PAY-123456', reason: 'Trip cancelled' },
        'admin@loveworld.com',
      );

      expect(mockSendRefundProcessedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@gmail.com',
          recipientName: 'Ada Okafor',
          applicationNo: 'VISA-2026-8812',
          originalAmount: 500,
          surchargeAmount: 75,
          netRefundAmount: 425,
          currency: 'USD',
        }),
      );
    });

    it('keeps the refund when the email fails', async () => {
      refundSetup();
      mockSendRefundProcessedEmail.mockRejectedValue(
        new Error('SendGrid down'),
      );

      await expect(
        service.initiateRefund(
          { transactionRef: 'TXN-PAY-123456', reason: 'Trip cancelled' },
          'admin@loveworld.com',
        ),
      ).resolves.toMatchObject({ id: 'refund-002' });
    });

    it('refuses a transaction that is not confirmed', async () => {
      mockPaymentTransactionFindUnique.mockResolvedValue(mockTransaction);

      await expect(
        service.initiateRefund(
          { transactionRef: 'TXN-PAY-123456', reason: 'x' },
          'admin@loveworld.com',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockPaymentRefundCreate).not.toHaveBeenCalled();
    });

    it('refuses a payment that was already refunded with 409', async () => {
      refundSetup();
      mockPaymentTransactionFindUnique.mockResolvedValue({
        ...mockTransaction,
        status: PaymentTransactionStatus.REFUNDED,
        visaDocumentation: linkedVisa,
        passportApplication: null,
      });

      await expect(
        service.initiateRefund(
          { transactionRef: 'TXN-PAY-123456', reason: 'Trip cancelled' },
          'admin@loveworld.com',
        ),
      ).rejects.toThrow(ConflictException);
      expect(mockPaymentRefundCreate).not.toHaveBeenCalled();
    });

    it('reads the payment inside one serializable transaction', async () => {
      refundSetup();
      const order: string[] = [];
      (
        mockPrismaService.$transaction as unknown as jest.Mock
      ).mockImplementationOnce(
        async (work: (tx: unknown) => Promise<unknown>, options: unknown) => {
          order.push('begin');
          expect(options).toEqual({
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          });
          const result = await work(mockPrismaService);
          order.push('commit');
          return result;
        },
      );
      mockPaymentTransactionFindUnique.mockImplementationOnce(() => {
        order.push('read');
        return Promise.resolve({
          ...mockTransaction,
          status: PaymentTransactionStatus.CONFIRMED,
          visaDocumentation: linkedVisa,
          passportApplication: null,
        });
      });

      await service.initiateRefund(
        { transactionRef: 'TXN-PAY-123456', reason: 'Trip cancelled' },
        'admin@loveworld.com',
      );

      // The status is read after the transaction begins, not before it.
      expect(order).toEqual(['begin', 'read', 'commit']);
    });
  });

  describe('balancesAfterRefund', () => {
    const app = {
      id: 'a',
      totalAmount: new Prisma.Decimal(1000),
      amountPaid: new Prisma.Decimal(1000),
      allowInstallment: true,
    };

    it('leaves a partly paid file when only one of two payments is refunded', () => {
      const after = balancesAfterRefund(app, 500);
      expect(Number(after.amountPaid)).toBe(500);
      expect(Number(after.balanceDue)).toBe(500);
      expect(after.paymentStatus).toBe(PaymentStatus.PARTIALLY_PAID);
    });

    it('owes nothing once the whole payment is refunded', () => {
      const after = balancesAfterRefund(app, 1000);
      expect(Number(after.amountPaid)).toBe(0);
      expect(Number(after.balanceDue)).toBe(0);
      expect(after.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('never goes below zero paid', () => {
      const after = balancesAfterRefund(
        { ...app, amountPaid: new Prisma.Decimal(200) },
        500,
      );
      expect(Number(after.amountPaid)).toBe(0);
      expect(after.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });
  });

  describe('confirmBankTransferPayment', () => {
    const evaluatedVisa = {
      ...mockVisaDoc,
      totalAmount: new Prisma.Decimal(1000),
      amountPaid: new Prisma.Decimal(0),
      allowInstallment: false,
    };

    it('records the staff notes on the transaction', async () => {
      mockFindVisaApplicationById.mockResolvedValue(evaluatedVisa);
      mockVisaDocumentationFindUniqueOrThrow.mockResolvedValue(evaluatedVisa);
      mockPaymentTransactionCreate.mockResolvedValue({ id: 'txn-9' });

      await service.confirmBankTransferPayment(
        {
          visaDocumentationId: 'visa-001',
          amount: 1000,
          paymentOption: PaymentOption.FULL,
          bankReference: 'gtb-7781',
          notes: '  Paid at the Ikeja branch  ',
        },
        'staff@loveworld.com',
      );

      const { data } = firstArg(mockPaymentTransactionCreate);
      expect(data.notes).toBe('Paid at the Ikeja branch');
      expect(data.transactionRef).toBe('BANK-GTB-7781');
      expect(mockApplyVisaPayment).toHaveBeenCalledWith(
        mockPrismaService,
        evaluatedVisa,
        new Prisma.Decimal(1000),
        PaymentOption.FULL,
      );
      expect(mockNotifyVisaPayment).toHaveBeenCalled();
    });

    it('checks the balance read inside the transaction, not a stale one', async () => {
      // Read before the transaction: nothing paid. Read inside it: a colleague
      // has just recorded the full amount.
      mockFindVisaApplicationById.mockResolvedValue(evaluatedVisa);
      mockVisaDocumentationFindUniqueOrThrow.mockResolvedValue({
        ...evaluatedVisa,
        amountPaid: new Prisma.Decimal(1000),
      });

      await expect(
        service.confirmBankTransferPayment(
          {
            visaDocumentationId: 'visa-001',
            amount: 1000,
            paymentOption: PaymentOption.FULL,
          },
          'staff@loveworld.com',
        ),
      ).rejects.toThrow(ConflictException);
      expect(mockPaymentTransactionCreate).not.toHaveBeenCalled();
      expect(mockApplyVisaPayment).not.toHaveBeenCalled();
    });

    it('records a passport payment in the same transaction and emails after', async () => {
      const passport = {
        id: 'pp-001',
        profileId: null,
        totalAmount: new Prisma.Decimal(150),
        amountPaid: new Prisma.Decimal(0),
        allowInstallment: false,
      };
      mockFindPassportApplicationById.mockResolvedValue(passport);
      mockPassportApplicationFindUniqueOrThrow.mockResolvedValue(passport);
      mockPaymentTransactionCreate.mockResolvedValue({ id: 'txn-10' });
      mockApplyPassportPayment.mockResolvedValue({
        ...passport,
        amountPaid: new Prisma.Decimal(150),
      });

      await service.confirmBankTransferPayment(
        {
          passportApplicationId: 'pp-001',
          amount: 150,
          paymentOption: PaymentOption.FULL,
        },
        'staff@loveworld.com',
      );

      expect(
        firstArg(mockPaymentTransactionCreate).data.passportApplicationId,
      ).toBe('pp-001');
      expect(mockApplyPassportPayment).toHaveBeenCalledWith(
        mockPrismaService,
        passport,
        new Prisma.Decimal(150),
        PaymentOption.FULL,
      );
      expect(mockNotifyPassportPayment).toHaveBeenCalled();
    });

    it('refuses a half payment on a file that does not allow instalments', async () => {
      mockFindVisaApplicationById.mockResolvedValue(evaluatedVisa);
      mockVisaDocumentationFindUniqueOrThrow.mockResolvedValue(evaluatedVisa);

      await expect(
        service.confirmBankTransferPayment(
          {
            visaDocumentationId: 'visa-001',
            amount: 500,
            paymentOption: PaymentOption.HALF_INSTALLMENT,
          },
          'staff@loveworld.com',
        ),
      ).rejects.toThrow(ConflictException);
      expect(mockPaymentTransactionCreate).not.toHaveBeenCalled();
    });

    it('refuses more than the balance due', async () => {
      mockFindVisaApplicationById.mockResolvedValue(evaluatedVisa);
      mockVisaDocumentationFindUniqueOrThrow.mockResolvedValue(evaluatedVisa);

      await expect(
        service.confirmBankTransferPayment(
          {
            visaDocumentationId: 'visa-001',
            amount: 1500,
            paymentOption: PaymentOption.FULL,
          },
          'staff@loveworld.com',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('answers a reused bank reference with 409, not a server error', async () => {
      mockFindVisaApplicationById.mockResolvedValue(evaluatedVisa);
      mockVisaDocumentationFindUniqueOrThrow.mockResolvedValue(evaluatedVisa);
      mockPaymentTransactionCreate.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.confirmBankTransferPayment(
          {
            visaDocumentationId: 'visa-001',
            amount: 1000,
            paymentOption: PaymentOption.FULL,
            bankReference: 'GTB-7781',
          },
          'staff@loveworld.com',
        ),
      ).rejects.toThrow(ConflictException);
      expect(mockApplyVisaPayment).not.toHaveBeenCalled();
      expect(mockNotifyVisaPayment).not.toHaveBeenCalled();
    });
  });

  describe('findAllTransactions', () => {
    it('reports a passport payment in its own currency, not NGN', async () => {
      mockPaymentTransactionFindMany.mockResolvedValue([
        {
          id: 't1',
          visaDocumentation: null,
          passportApplication: { currency: 'USD' },
        },
        {
          id: 't2',
          visaDocumentation: { currency: 'GBP' },
          passportApplication: null,
        },
        { id: 't3', visaDocumentation: null, passportApplication: null },
      ]);

      const rows = await service.findAllTransactions({});

      expect(rows.map((r) => r.currency)).toEqual(['USD', 'GBP', 'NGN']);
      const [[query]] = mockPaymentTransactionFindMany.mock
        .calls as unknown as Array<[{ include: Record<string, unknown> }]>;
      expect(query.include).toHaveProperty('passportApplication');
    });
  });

  describe('findAllRefunds', () => {
    it('pages refunds and flattens their transaction reference and currency', async () => {
      mockPaymentRefundCount.mockResolvedValue(21);
      mockPaymentRefundFindMany.mockResolvedValue([
        {
          id: 'r1',
          refundRef: 'RFD-1',
          transaction: {
            transactionRef: 'BANK-1',
            visaDocumentation: null,
            passportApplication: {
              currency: 'NGN',
              applicationNo: 'PASSPORT-2026-0001',
            },
          },
        },
      ]);

      const result = await service.findAllRefunds({
        page: 2,
        limit: 10,
        search: 'BANK',
      });

      expect(mockPaymentRefundFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.meta).toEqual({ total: 21, page: 2, limit: 10, pages: 3 });
      expect(result.data[0]).toEqual({
        id: 'r1',
        refundRef: 'RFD-1',
        transactionRef: 'BANK-1',
        applicationNo: 'PASSPORT-2026-0001',
        currency: 'NGN',
      });
    });
  });
});
