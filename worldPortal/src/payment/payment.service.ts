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
import { SendGridService } from '../mail/sendgrid.service';
import { VisaDocumentationService } from '../visa-documentation/visa-documentation.service';
import { PassportApplicationService } from '../passport-application/passport-application.service';
import { InitiatePaymentTransactionDto } from './dto/initiate-payment-transaction.dto';
import { ConfirmPaymentTransactionDto } from './dto/confirm-payment-transaction.dto';
import { ConfirmBankTransferDto } from './dto/confirm-bank-transfer.dto';
import { InitiateRefundDto } from './dto/initiate-refund.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { QueryPaymentTransactionDto } from './dto/query-payment-transaction.dto';
import { QueryRefundDto } from './dto/query-refund.dto';
import {
  PaymentTransactionStatus,
  PaymentStatus,
  RefundStatus,
  PaymentOption,
  Prisma,
  VisaDocumentation,
} from '@prisma/client';
import { randomInt } from 'crypto';
import { serializable } from '../prisma/serializable';
import { ApplicationOwner } from '../applicant/applicant.service';

/** The money fields every payable application shares (visa and passport). */
type PayableApplication = {
  id: string;
  totalAmount: Prisma.Decimal | null;
  amountPaid: Prisma.Decimal | null;
  allowInstallment: boolean;
};

/**
 * An application's money after `refunded` is taken back off it (ADR 0016).
 * `REFUNDED` once nothing is held any more; otherwise whatever the remaining
 * payment amounts to.
 *
 * A full refund owes nothing: putting the whole fee back as `balanceDue`
 * counted refunded files as money still to collect and offered to record a
 * payment on them. If the file goes ahead, staff price it again (allowed once
 * nothing is held), which sets the balance afresh.
 */
export function balancesAfterRefund(app: PayableApplication, refunded: number) {
  const total = Number(app.totalAmount || 0);
  const paid = Math.max(0, Number(app.amountPaid || 0) - refunded);
  const balance = paid === 0 ? 0 : Math.max(0, total - paid);
  const paymentStatus =
    paid === 0
      ? PaymentStatus.REFUNDED
      : balance === 0
        ? PaymentStatus.FULLY_PAID
        : PaymentStatus.PARTIALLY_PAID;
  return {
    amountPaid: new Prisma.Decimal(paid),
    balanceDue: new Prisma.Decimal(balance),
    paymentStatus,
  };
}

/**
 * Only an INITIATED payment may be confirmed. Anything else is a 409 that
 * says why, so a double click, or a confirm after a refund, can never credit
 * the application a second time.
 */
function assertConfirmable(
  status: PaymentTransactionStatus,
  transactionRef: string,
) {
  switch (status) {
    case PaymentTransactionStatus.INITIATED:
      return;
    case PaymentTransactionStatus.CONFIRMED:
      throw new ConflictException(
        `Payment transaction '${transactionRef}' is already confirmed.`,
      );
    case PaymentTransactionStatus.REFUNDED:
      throw new ConflictException(
        `Payment transaction '${transactionRef}' was refunded, so it can't be confirmed again. Start a new payment instead.`,
      );
    case PaymentTransactionStatus.FAILED:
      throw new ConflictException(
        `Payment transaction '${transactionRef}' failed, so it can't be confirmed. Start a new payment instead.`,
      );
    default:
      throw new ConflictException(
        `Payment transaction '${transactionRef}' is ${String(status)}; only an initiated payment can be confirmed.`,
      );
  }
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => VisaDocumentationService))
    private readonly visaDocService: VisaDocumentationService,
    @Inject(forwardRef(() => PassportApplicationService))
    private readonly passportAppService: PassportApplicationService,
    private readonly sendGridService: SendGridService,
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

  /**
   * Opens a payment on the signed-in applicant's own visa application. Any
   * other application is a 404, exactly like one that does not exist, so the
   * guessable application numbers reveal nothing. The payer is recorded as the
   * owner's verified email; `dto.profileId` is not trusted.
   */
  async initiatePaymentTransaction(
    dto: InitiatePaymentTransactionDto,
    owner: ApplicationOwner,
  ) {
    if (!dto.visaDocumentationId) {
      throw new BadRequestException(
        'visaDocumentationId is required to initiate payment.',
      );
    }

    const visaDoc = await this.visaDocService.findVisaApplicationById(
      dto.visaDocumentationId,
    );

    if (visaDoc.clerkUserId !== owner.clerkUserId) {
      throw new NotFoundException(
        `No application '${dto.visaDocumentationId}' was found on your account.`,
      );
    }

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
        profileId: visaDoc.profileId || null,
        amount: new Prisma.Decimal(finalAmount),
        paymentOption: dto.paymentOption,
        status: PaymentTransactionStatus.INITIATED,
        initiatedBy: owner.email,
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

  /**
   * Marks an INITIATED payment CONFIRMED and credits its application, in one
   * serializable transaction (like bank transfers and refunds), so the status
   * and the balance move together or not at all.
   *
   * - Only an INITIATED payment can be confirmed: a confirmed, refunded or
   *   failed one is a 409, so a refunded payment can't be credited again.
   * - The status flips with a conditional update that matches only while it
   *   is still INITIATED; of two confirms racing, only one matches, and the
   *   other is a 409 before any money is credited.
   * - The amount must fit the balance read inside the transaction, exactly as
   *   a bank transfer must (`assertPaymentAllowed`): an overpayment is refused,
   *   never recorded past the price.
   *
   * The receipt email goes out only after the transaction commits.
   */
  async confirmPaymentTransaction(dto: ConfirmPaymentTransactionDto) {
    const { confirmed, visa } = await serializable(this.prisma, async (tx) => {
      const transaction = await tx.paymentTransaction.findUnique({
        where: { transactionRef: dto.transactionRef },
      });

      if (!transaction) {
        throw new NotFoundException(
          `Payment transaction with reference '${dto.transactionRef}' not found.`,
        );
      }
      assertConfirmable(transaction.status, dto.transactionRef);

      const { count } = await tx.paymentTransaction.updateMany({
        where: {
          id: transaction.id,
          status: PaymentTransactionStatus.INITIATED,
        },
        data: {
          status: PaymentTransactionStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      });
      if (count !== 1) {
        throw new ConflictException(
          `Payment transaction '${dto.transactionRef}' was confirmed or changed by someone else at the same moment. Reload it before trying again.`,
        );
      }

      let visa: VisaDocumentation | null = null;
      if (transaction.visaDocumentationId) {
        const visaDoc = await tx.visaDocumentation.findUniqueOrThrow({
          where: { id: transaction.visaDocumentationId },
        });
        this.assertPaymentAllowed(
          visaDoc,
          {
            amount: Number(transaction.amount),
            paymentOption: transaction.paymentOption,
          },
          'Visa application',
        );
        // Updates amountPaid / balanceDue / paymentStatus and moves a
        // SUBMITTED or EVALUATED file to UNDER_REVIEW.
        visa = await this.visaDocService.applyPayment(
          tx,
          visaDoc,
          transaction.amount,
          transaction.paymentOption,
        );
      }

      const confirmed = await tx.paymentTransaction.findUniqueOrThrow({
        where: { id: transaction.id },
      });
      return { confirmed, visa };
    });

    if (visa) {
      this.visaDocService.notifyPaymentConfirmed(visa, confirmed.paymentOption);
    }

    this.logger.log(
      `Payment transaction CONFIRMED: transactionRef=${confirmed.transactionRef}, amount=${confirmed.amount.toString()}`,
    );

    return confirmed;
  }

  /**
   * The checks every payment must pass before it is recorded against a file
   * (ADR 0016), whether staff record a bank transfer or confirm an initiated
   * payment: the file is priced, not already paid, the amount fits the
   * balance, and a half payment is only taken where instalments are on.
   */
  private assertPaymentAllowed(
    app: PayableApplication,
    payment: { amount: number; paymentOption: PaymentOption },
    label: string,
  ) {
    if (!app.totalAmount) {
      throw new BadRequestException(
        `${label} cost has not been evaluated by an admin yet.`,
      );
    }

    const balance = Math.max(
      0,
      Number(app.totalAmount) - Number(app.amountPaid || 0),
    );

    if (balance <= 0) {
      throw new ConflictException(`${label} is already fully paid.`);
    }
    if (payment.amount > balance) {
      throw new ConflictException(
        `Payment amount (${payment.amount}) cannot exceed the remaining balance due of ${balance}.`,
      );
    }
    if (
      payment.paymentOption === PaymentOption.HALF_INSTALLMENT &&
      !app.allowInstallment
    ) {
      throw new ConflictException(
        `${label} does not allow paying in instalments. Record the full amount instead.`,
      );
    }
  }

  /** Writes the confirmed transaction; a reused bank reference is a 409, not a 500. */
  private async createConfirmedBankTransaction(
    tx: Prisma.TransactionClient,
    data: Omit<Prisma.PaymentTransactionUncheckedCreateInput, 'transactionRef'>,
    bankReference: string | undefined,
  ) {
    const transactionRef = bankReference?.trim()
      ? `BANK-${bankReference.trim().toUpperCase()}`
      : `TXN-BANK-${randomInt(100000, 999999)}`;
    try {
      const transaction = await tx.paymentTransaction.create({
        data: { ...data, transactionRef },
      });
      return { transaction, transactionRef };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'That bank reference has already been recorded. Check the statement, or leave the reference blank.',
        );
      }
      throw error;
    }
  }

  async confirmBankTransferPayment(
    dto: ConfirmBankTransferDto,
    adminEmail: string,
  ) {
    const notes = dto.notes?.trim() || null;
    const amount = new Prisma.Decimal(dto.amount);
    // The balance check, the transaction row and the application's new
    // balance commit together or not at all (ADR 0016). Two staff recording
    // the same payment can't both pass the check, and a failure after the row
    // is written can't strand it (its bank reference would then be refused
    // as "already recorded" while the balance never moved).
    const bankTransaction = (
      tx: Prisma.TransactionClient,
      link: { visaDocumentationId: string } | { passportApplicationId: string },
      profileId: string | null,
    ) =>
      this.createConfirmedBankTransaction(
        tx,
        {
          ...link,
          profileId,
          amount,
          paymentOption: dto.paymentOption,
          status: PaymentTransactionStatus.CONFIRMED,
          paymentMethod: 'BANK_TRANSFER',
          notes,
          initiatedBy: adminEmail || 'admin-manual',
          confirmedAt: new Date(),
        },
        dto.bankReference,
      );

    if (dto.passportApplicationId) {
      const { id } = await this.passportAppService.findApplicationById(
        dto.passportApplicationId,
      );
      const { transaction, transactionRef, updated } = await serializable(
        this.prisma,
        async (tx) => {
          const passportApp = await tx.passportApplication.findUniqueOrThrow({
            where: { id },
          });
          this.assertPaymentAllowed(passportApp, dto, 'Passport application');
          const created = await bankTransaction(
            tx,
            { passportApplicationId: id },
            passportApp.profileId || null,
          );
          const updated = await this.passportAppService.applyPayment(
            tx,
            passportApp,
            amount,
            dto.paymentOption,
          );
          return { ...created, updated };
        },
      );
      await this.passportAppService.notifyPaymentConfirmed(
        updated,
        amount,
        dto.paymentOption,
      );

      this.logger.log(
        `Manual Bank Transfer CONFIRMED by admin=${adminEmail}: transactionRef=${transactionRef}, passportAppId=${id}, amount=${dto.amount}`,
      );

      return {
        success: true,
        transactionRef,
        transactionId: transaction.id,
        amount: dto.amount,
        message: 'Bank transfer payment confirmed successfully.',
      };
    }

    if (!dto.visaDocumentationId) {
      throw new BadRequestException(
        'Either visaDocumentationId or passportApplicationId is required.',
      );
    }

    const { id } = await this.visaDocService.findVisaApplicationById(
      dto.visaDocumentationId,
    );
    const { transaction, transactionRef, updated } = await serializable(
      this.prisma,
      async (tx) => {
        const visaDoc = await tx.visaDocumentation.findUniqueOrThrow({
          where: { id },
        });
        this.assertPaymentAllowed(visaDoc, dto, 'Visa application');
        const created = await bankTransaction(
          tx,
          { visaDocumentationId: id },
          visaDoc.profileId || null,
        );
        // Updates amountPaid / balanceDue / paymentStatus and moves a
        // SUBMITTED or EVALUATED file to UNDER_REVIEW.
        const updated = await this.visaDocService.applyPayment(
          tx,
          visaDoc,
          amount,
          dto.paymentOption,
        );
        return { ...created, updated };
      },
    );
    // The receipt email, only once the payment is committed.
    this.visaDocService.notifyPaymentConfirmed(updated, dto.paymentOption);

    this.logger.log(
      `Manual Bank Transfer CONFIRMED by admin=${adminEmail}: transactionRef=${transactionRef}, visaDocId=${id}, amount=${dto.amount}`,
    );

    return {
      success: true,
      transactionRef,
      transactionId: transaction.id,
      amount: dto.amount,
      message: 'Bank transfer payment confirmed successfully.',
    };
  }

  async initiateRefund(dto: InitiateRefundDto, adminEmail: string) {
    const config = await this.getOrCreatePaymentConfig();
    const surchargeRate = Number(config.refundSurchargePercentage) / 100;
    const refundRef = `RFD-${randomInt(100000, 999999)}`;

    // The status check, the refund and the application's new balance happen
    // in one transaction, reading the payment and its application inside it.
    // Checked outside, a double click or two managers could both refund the
    // same payment, and a payment recorded in between was overwritten by a
    // stale amountPaid.
    const {
      refund,
      visa,
      passport,
      originalAmount,
      surchargeAmount,
      netRefundAmount,
    } = await serializable(this.prisma, async (tx) => {
      const transaction = await tx.paymentTransaction.findUnique({
        where: { transactionRef: dto.transactionRef },
        include: { visaDocumentation: true, passportApplication: true },
      });

      if (!transaction) {
        throw new NotFoundException(
          `Payment transaction with reference '${dto.transactionRef}' not found.`,
        );
      }
      if (transaction.status === PaymentTransactionStatus.REFUNDED) {
        throw new ConflictException('This payment has already been refunded.');
      }
      if (transaction.status !== PaymentTransactionStatus.CONFIRMED) {
        throw new BadRequestException(
          'Only CONFIRMED payment transactions can be refunded.',
        );
      }

      const originalAmount = Number(transaction.amount);
      const surchargeAmount = originalAmount * surchargeRate;
      const netRefundAmount = originalAmount - surchargeAmount;
      const visa = transaction.visaDocumentation;
      const passport = transaction.passportApplication;

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

      // The application must stop claiming the money is still held. Its
      // review status is untouched: a refund is a money decision only.
      if (visa) {
        await tx.visaDocumentation.update({
          where: { id: visa.id },
          data: balancesAfterRefund(visa, originalAmount),
        });
      } else if (passport) {
        await tx.passportApplication.update({
          where: { id: passport.id },
          data: balancesAfterRefund(passport, originalAmount),
        });
      }

      return {
        refund: createdRefund,
        visa,
        passport,
        originalAmount,
        surchargeAmount,
        netRefundAmount,
      };
    });

    this.logger.log(
      `Refund processed by admin=${adminEmail}: refundRef=${refundRef}, transactionRef=${dto.transactionRef}, originalAmount=${originalAmount}, surcharge=${surchargeAmount}, netRefund=${netRefundAmount}`,
    );

    // Sent only after the refund is committed; a mail failure never undoes it.
    const recipient = visa
      ? {
          to: visa.email,
          name: `${visa.firstName} ${visa.lastName}`,
          app: visa,
        }
      : passport
        ? {
            to: passport.email,
            name: `${passport.firstName} ${passport.surname}`,
            app: passport,
          }
        : null;
    if (recipient) {
      this.sendGridService
        .sendRefundProcessedEmail({
          to: recipient.to,
          recipientName: recipient.name,
          applicationNo: recipient.app.applicationNo,
          refundRef,
          originalAmount,
          surchargeAmount,
          netRefundAmount,
          reason: dto.reason,
          currency: recipient.app.currency,
        })
        .catch((err: unknown) => {
          this.logger.error(
            `Refund email failed for refundRef=${refundRef}: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }

    return refund;
  }

  /** Paged refunds with their transaction reference and currency (ADR 0016). */
  async findAllRefunds(query: QueryRefundDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const where: Prisma.PaymentRefundWhereInput = search
      ? {
          OR: [
            { refundRef: { contains: search, mode: 'insensitive' } },
            { reason: { contains: search, mode: 'insensitive' } },
            {
              transaction: {
                transactionRef: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        }
      : {};

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.paymentRefund.count({ where }),
      this.prisma.paymentRefund.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          transaction: {
            select: {
              transactionRef: true,
              visaDocumentation: {
                select: { currency: true, applicationNo: true },
              },
              passportApplication: {
                select: { currency: true, applicationNo: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: rows.map(({ transaction, ...refund }) => {
        const app =
          transaction.visaDocumentation ?? transaction.passportApplication;
        return {
          ...refund,
          transactionRef: transaction.transactionRef,
          applicationNo: app?.applicationNo ?? null,
          currency: app?.currency ?? 'NGN',
        };
      }),
      meta: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
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

    const records = await this.prisma.paymentTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        refunds: true,
        visaDocumentation: { select: { currency: true } },
        // Without this every passport payment was reported in NGN.
        passportApplication: { select: { currency: true } },
      },
    });

    return records.map((t) => ({
      ...t,
      currency:
        t.visaDocumentation?.currency ||
        t.passportApplication?.currency ||
        'NGN',
    }));
  }

  /**
   * Multi-item basket checkout transaction creation, for the signed-in
   * applicant: the basket is filed under their verified email, whatever
   * `dto.email` says.
   */
  async createPackageCheckout(
    dto: {
      email?: string;
      items: Array<{
        type: string;
        title: string;
        entityId?: string;
        amount: number;
      }>;
      totalAmount: number;
      currency?: string;
    },
    owner: ApplicationOwner,
  ) {
    const transactionRef = `TXN-PKG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        transactionRef,
        amount: new Prisma.Decimal(dto.totalAmount),
        paymentOption: PaymentOption.FULL,
        status: PaymentTransactionStatus.INITIATED,
        paymentMethod: 'CARD',
        initiatedBy: owner.email,
        packageItemsJson: dto.items,
      },
    });

    this.logger.log(
      `Created package checkout transactionRef=${transactionRef} for clerkUserId=${owner.clerkUserId}`,
    );
    return {
      transactionRef: transaction.transactionRef,
      amount: Number(transaction.amount),
      currency: dto.currency || 'USD',
      status: transaction.status,
      items: dto.items,
    };
  }
}
