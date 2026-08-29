import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { VisaDocumentationService } from '../visa-documentation/visa-documentation.service';
import {
  PaymentOption,
  PaymentTransactionStatus,
  RefundStatus,
  Prisma,
} from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

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

  const mockPaymentTransactionCreate = jest.fn();
  const mockPaymentTransactionFindUnique = jest.fn();
  const mockPaymentTransactionUpdate = jest.fn();
  const mockPaymentConfigFindFirst = jest.fn();
  const mockPaymentRefundCreate = jest.fn();

  const mockVisaDocService: Partial<VisaDocumentationService> = {
    findVisaApplicationById: mockFindVisaApplicationById,
    handlePaymentConfirmed: mockHandlePaymentConfirmed,
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
      findMany: jest.fn(),
    } as never,
    paymentRefund: {
      create: mockPaymentRefundCreate,
    } as never,
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      typeof cb === 'function' ? cb(mockPrismaService) : Promise.resolve(cb),
    ) as never,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: VisaDocumentationService, useValue: mockVisaDocService },
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
  });
});
