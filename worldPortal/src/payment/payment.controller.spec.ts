import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkTokenVerifier } from '../auth/clerk/clerk-token.verifier';
import { ApplicantService } from '../applicant/applicant.service';
import { PaymentOption } from '@prisma/client';

describe('PaymentController', () => {
  let controller: PaymentController;

  const mockPaymentService = {
    initiatePaymentTransaction: jest.fn(),
    confirmPaymentTransaction: jest.fn(),
    initiateRefund: jest.fn(),
    getPaymentConfig: jest.fn(),
    updatePaymentConfig: jest.fn(),
    findAllTransactions: jest.fn(),
    findAllRefunds: jest.fn(),
  };

  const mockPrismaService = {};
  const mockJwtService = { decode: jest.fn() };
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };
  const mockApplicantService = {
    requireActiveApplicant: jest.fn((clerkUserId: string) =>
      Promise.resolve({ clerkUserId, email: 'user@gmail.com' }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ClerkTokenVerifier, useValue: { verify: jest.fn() } },
        { provide: ApplicantService, useValue: mockApplicantService },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('initiateTransaction', () => {
    it('should delegate payment initiation to PaymentService as the signed-in applicant', async () => {
      const dto = {
        visaDocumentationId: 'visa-001',
        paymentOption: PaymentOption.FULL,
      };
      mockPaymentService.initiatePaymentTransaction.mockResolvedValue({
        transactionRef: 'TXN-PAY-1001',
      });

      const result = await controller.initiateTransaction(dto, {
        clerkUserId: 'user_1',
      });

      expect(mockApplicantService.requireActiveApplicant).toHaveBeenCalledWith(
        'user_1',
      );
      expect(
        mockPaymentService.initiatePaymentTransaction,
      ).toHaveBeenCalledWith(dto, {
        clerkUserId: 'user_1',
        email: 'user@gmail.com',
      });
      expect(result.transactionRef).toBe('TXN-PAY-1001');
    });
  });

  describe('confirmTransaction', () => {
    it('should delegate payment confirmation to PaymentService', async () => {
      const dto = { transactionRef: 'TXN-PAY-1001' };
      mockPaymentService.confirmPaymentTransaction.mockResolvedValue({
        status: 'CONFIRMED',
      });

      const result = await controller.confirmTransaction(dto);

      expect(mockPaymentService.confirmPaymentTransaction).toHaveBeenCalledWith(
        dto,
      );
      expect(result.status).toBe('CONFIRMED');
    });
  });

  // ADR 0016
  describe('findAllRefunds', () => {
    it('delegates the paged refunds query to PaymentService', async () => {
      const page = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, pages: 1 },
      };
      mockPaymentService.findAllRefunds.mockResolvedValue(page);

      await expect(
        controller.findAllRefunds({ search: 'RFD', page: 1 }),
      ).resolves.toEqual(page);
      expect(mockPaymentService.findAllRefunds).toHaveBeenCalledWith({
        search: 'RFD',
        page: 1,
      });
    });
  });
});
