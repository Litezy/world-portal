import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VisaDocumentationService } from '../visa-documentation/visa-documentation.service';
import { InitiatePaymentTransactionDto } from './dto/initiate-payment-transaction.dto';
import { ConfirmPaymentTransactionDto } from './dto/confirm-payment-transaction.dto';
import { ConfirmBankTransferDto } from './dto/confirm-bank-transfer.dto';
import { InitiateRefundDto } from './dto/initiate-refund.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { QueryPaymentTransactionDto } from './dto/query-payment-transaction.dto';
import {
  PaymentTransactionStatus,
  RefundStatus,
  PaymentOption,
  Prisma,
} from '@prisma/client';
import { randomInt } from 'crypto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => VisaDocumentationService))
    private readonly visaDocService: VisaDocumentationService,
  ) {}

  async getOrCreatePaymentConfig() {
    let config = await this.prisma.paymentConfig.findFirst();
    if (!config) {
      config = await this.prisma.paymentConfig.create({
        data: {
          partnerMarkupPercentage: new Prisma.Decimal(10.0),
          serviceFeePercentage: new Prisma.Decimal(5.0),
          refundSurchargePercentage: new Prisma.Decimal(15.0),
          updatedBy: 'system-default',
        },
      });
    }
    return config;
  }

  async getPaymentConfig() {
    return this.getOrCreatePaymentConfig();
  }

  async updatePaymentConfig(dto: UpdatePaymentConfigDto, adminEmail: string) {
    const config = await this.getOrCreatePaymentConfig();

    const updated = await this.prisma.paymentConfig.update({
      where: { id: config.id },
      data: {
        partnerMarkupPercentage:
          dto.partnerMarkupPercentage !== undefined
            ? new Prisma.Decimal(dto.partnerMarkupPercentage)
            : config.partnerMarkupPercentage,
        serviceFeePercentage:
          dto.serviceFeePercentage !== undefined
            ? new Prisma.Decimal(dto.serviceFeePercentage)
            : config.serviceFeePercentage,
        refundSurchargePercentage:
          dto.refundSurchargePercentage !== undefined
            ? new Prisma.Decimal(dto.refundSurchargePercentage)
            : config.refundSurchargePercentage,
        updatedBy: adminEmail,
      },
    });

    this.logger.log(
      `Payment config updated by admin=${adminEmail}: markup=${updated.partnerMarkupPercentage.toString()}%, refundSurcharge=${updated.refundSurchargePercentage.toString()}%`,
    );

    return updated;
  }

  async initiatePaymentTransaction(
    dto: InitiatePaymentTransactionDto,
    initiatorEmail: string,
  ) {
    if (!dto.visaDocumentationId) {
      throw new BadRequestException(
        'visaDocumentationId is required to initiate payment.',
      );
    }

    const visaDoc = await this.visaDocService.findVisaApplicationById(
      dto.visaDocumentationId,
    );

    if (!visaDoc.totalAmount) {
      throw new BadRequestException(
        'Visa application cost has not been evaluated by an admin yet.',
      );
    }

    if (
      dto.paymentOption === PaymentOption.HALF_INSTALLMENT &&
      !visaDoc.allowInstallment
    ) {
      throw new BadRequestException(
        'Installment payment is not allowed for this visa application. Full payment required.',
      );
    }

    const total = Number(visaDoc.totalAmount);
    const paid = Number(visaDoc.amountPaid || 0);
    const balance = Math.max(0, total - paid);

    if (balance <= 0) {
      throw new ConflictException('Visa application is already fully paid.');
    }

    let calculatedAmount: number;
    if (dto.paymentOption === PaymentOption.HALF_INSTALLMENT) {
      calculatedAmount = total * 0.5;
      if (paid > 0) {
        calculatedAmount = balance;
      }
    } else {
      calculatedAmount = balance;
    }

    let finalAmount = calculatedAmount;
    if (dto.amount !== undefined && dto.amount !== null) {
      if (dto.amount > balance) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) cannot exceed the remaining balance due of ${balance}.`,
        );
      }
      if (dto.paymentOption === PaymentOption.FULL && dto.amount < balance) {
        throw new BadRequestException(
          `FULL payment option requires paying the exact remaining balance of ${balance}. Got ${dto.amount}.`,
        );
      }
      if (
        dto.paymentOption === PaymentOption.HALF_INSTALLMENT &&
        dto.amount < calculatedAmount
      ) {
        throw new BadRequestException(
          `HALF_INSTALLMENT payment option requires paying at least ${calculatedAmount}. Got ${dto.amount}.`,
        );
      }
      finalAmount = dto.amount;
    }

    const transactionRef = `TXN-PAY-${randomInt(100000, 999999)}`;

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        transactionRef,
        visaDocumentationId: visaDoc.id,
        profileId: dto.profileId || visaDoc.profileId || null,
        amount: new Prisma.Decimal(finalAmount),
        paymentOption: dto.paymentOption,
        status: PaymentTransactionStatus.INITIATED,
        initiatedBy: initiatorEmail || visaDoc.email,
      },
    });

    this.logger.log(
      `Payment transaction initiated: transactionRef=${transactionRef}, visaDocId=${visaDoc.id}, amount=${finalAmount}`,
    );

    return {
      transactionRef,
      transactionId: transaction.id,
      visaDocumentationId: visaDoc.id,
      applicationNo: visaDoc.applicationNo,
      paymentOption: dto.paymentOption,
      amount: finalAmount,
      status: transaction.status,
      checkoutUrl: null,
      message: 'Payment transaction initiated. Proceed to confirm payment.',
    };
  }

  async confirmPaymentTransaction(dto: ConfirmPaymentTransactionDto) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { transactionRef: dto.transactionRef },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Payment transaction with reference '${dto.transactionRef}' not found.`,
      );
    }

    if (transaction.status === PaymentTransactionStatus.CONFIRMED) {
      throw new ConflictException(
        `Payment transaction '${dto.transactionRef}' is already confirmed.`,
      );
    }

    // Direct Service Call (Option 1): Immediately invoke VisaDocumentationService to update visa application status to UNDER_REVIEW
    if (transaction.visaDocumentationId) {
      await this.visaDocService.handlePaymentConfirmed(
        transaction.visaDocumentationId,
        transaction.amount,
        transaction.paymentOption,
      );
    }

    const updatedTxn = await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentTransactionStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    this.logger.log(
      `Payment transaction CONFIRMED via Direct Service Call: transactionRef=${transaction.transactionRef}, amount=${transaction.amount.toString()}`,
    );

    return updatedTxn;
  }

  async confirmBankTransferPayment(dto: ConfirmBankTransferDto, adminEmail: string) {
    const visaDoc = await this.visaDocService.findVisaApplicationById(dto.visaDocumentationId);

    if (!visaDoc.totalAmount) {
      throw new BadRequestException('Visa application cost has not been evaluated by an admin yet.');
    }

    const total = Number(visaDoc.totalAmount);
    const paid = Number(visaDoc.amountPaid || 0);
    const balance = Math.max(0, total - paid);

    if (balance <= 0) {
      throw new ConflictException('Visa application is already fully paid.');
    }

    if (dto.amount > balance) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) cannot exceed the remaining balance due of ${balance}.`,
      );
    }

    const transactionRef = dto.bankReference?.trim()
      ? `BANK-${dto.bankReference.trim().toUpperCase()}`
      : `TXN-BANK-${randomInt(100000, 999999)}`;

    // Create confirmed PaymentTransaction record
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        transactionRef,
        visaDocumentationId: visaDoc.id,
        profileId: visaDoc.profileId || null,
        amount: new Prisma.Decimal(dto.amount),
        paymentOption: dto.paymentOption,
        status: PaymentTransactionStatus.CONFIRMED,
        paymentMethod: 'BANK_TRANSFER',
        initiatedBy: adminEmail || 'admin-manual',
        confirmedAt: new Date(),
      },
    });

    // Invoke VisaDocumentationService to update amountPaid, balanceDue, paymentStatus, and advance to UNDER_REVIEW + send receipt email
    await this.visaDocService.handlePaymentConfirmed(
      visaDoc.id,
      new Prisma.Decimal(dto.amount),
      dto.paymentOption,
    );

    this.logger.log(
      `Manual Bank Transfer CONFIRMED by admin=${adminEmail}: transactionRef=${transactionRef}, visaDocId=${visaDoc.id}, amount=${dto.amount}`,
    );

    return {
      success: true,
      transactionRef,
      transactionId: transaction.id,
      amount: dto.amount,
      message: 'Bank transfer payment confirmed successfully. Application advanced to Under Review.',
    };
  }

  async initiateRefund(dto: InitiateRefundDto, adminEmail: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { transactionRef: dto.transactionRef },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Payment transaction with reference '${dto.transactionRef}' not found.`,
      );
    }

    if (transaction.status !== PaymentTransactionStatus.CONFIRMED) {
      throw new BadRequestException(
        'Only CONFIRMED payment transactions can be refunded.',
      );
    }

    const config = await this.getOrCreatePaymentConfig();
    const surchargeRate = Number(config.refundSurchargePercentage) / 100;
    const originalAmount = Number(transaction.amount);
    const surchargeAmount = originalAmount * surchargeRate;
    const netRefundAmount = originalAmount - surchargeAmount;

    const refundRef = `RFD-${randomInt(100000, 999999)}`;

    const refund = await this.prisma.$transaction(async (tx) => {
      const createdRefund = await tx.paymentRefund.create({
        data: {
          refundRef,
          transactionId: transaction.id,
          originalAmount: new Prisma.Decimal(originalAmount),
          surchargeAmount: new Prisma.Decimal(surchargeAmount),
          netRefundAmount: new Prisma.Decimal(netRefundAmount),
          reason: dto.reason,
          status: RefundStatus.PROCESSED,
          processedBy: adminEmail,
        },
      });

      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.REFUNDED,
          refundedAt: new Date(),
        },
      });

      return createdRefund;
    });

    this.logger.log(
      `Refund processed by admin=${adminEmail}: refundRef=${refundRef}, transactionRef=${dto.transactionRef}, originalAmount=${originalAmount}, surcharge=${surchargeAmount}, netRefund=${netRefundAmount}`,
    );

    return refund;
  }

  async findAllTransactions(query: QueryPaymentTransactionDto) {
    const where: Prisma.PaymentTransactionWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.visaDocumentationId) {
      where.visaDocumentationId = query.visaDocumentationId;
    }
    if (query.search) {
      where.OR = [
        { transactionRef: { contains: query.search, mode: 'insensitive' } },
        { initiatedBy: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.paymentTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        refunds: true,
      },
    });
  }
}
