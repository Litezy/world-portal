import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
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
  };

  const mockPrismaService = {};
  const mockJwtService = { decode: jest.fn() };
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('initiateTransaction', () => {
    it('should delegate payment initiation to PaymentService', async () => {
      const dto = {
        visaDocumentationId: 'visa-001',
        paymentOption: PaymentOption.FULL,
      };
      mockPaymentService.initiatePaymentTransaction.mockResolvedValue({
        transactionRef: 'TXN-PAY-1001',
      });

      const result = await controller.initiateTransaction(
        dto,
        'user@gmail.com',
      );

      expect(
        mockPaymentService.initiatePaymentTransaction,
      ).toHaveBeenCalledWith(dto, 'user@gmail.com');
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
});
