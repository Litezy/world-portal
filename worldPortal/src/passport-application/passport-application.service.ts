import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializable } from '../prisma/serializable';
import { CreatePassportApplicationDto } from './dto/create-passport-application.dto';
import { UpdatePassportStatusDto } from './dto/update-passport-status.dto';
import { QueryPassportApplicationDto } from './dto/query-passport-application.dto';
import {
  PassportApplication,
  PassportApplicationStatus,
  PassportValidity,
  BookletType,
  PaymentStatus,
  PaymentOption,
  Prisma,
} from '@prisma/client';
import { randomInt } from 'crypto';
import { SendGridService } from '../mail/sendgrid.service';
import { OtpService } from '../otp/otp.service';
import { ApplicationOwner } from '../applicant/applicant.service';
import { InviteApplicantDto } from '../visa-documentation/dto/invite-applicant.dto';
import { EvaluateVisaCostDto } from '../visa-documentation/dto/evaluate-visa-cost.dto';

@Injectable()
export class PassportApplicationService {
  private readonly logger = new Logger(PassportApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendGridService: SendGridService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * `owner` is the signed-in WorldStreet applicant; see
   * `VisaDocumentationService.createVisaApplication` for why their verified
   * email replaces the one on the form, and why `dto.profileId` is ignored.
   */
  async createApplication(
    dto: CreatePassportApplicationDto,
    owner?: ApplicationOwner,
  ) {
    if (owner) {
      dto = { ...dto, email: owner.email };
    } else if (!this.otpService.isEmailVerified(dto.email)) {
      this.logger.warn(
        `Attempted passport application submission with unverified email=${dto.email}`,
      );
      throw new BadRequestException(
        `Email address '${dto.email}' has not been verified via OTP. Please verify your email before submitting.`,
      );
    }

    const maskedNin = dto.ninNumber
      ? dto.ninNumber.replace(/^(.{2}).*(.{2})$/, '$1****$2')
      : 'N/A';

    this.logger.log(
      `Creating passport application for applicant email=${dto.email}, category=${dto.passportCategory}, nin=${maskedNin}`,
    );

    let applicationNo = `PASSPORT-2026-${randomInt(1000, 9999)}`;
    let exists = await this.prisma.passportApplication.findUnique({
      where: { applicationNo },
    });

    while (exists) {
      applicationNo = `PASSPORT-2026-${randomInt(1000, 9999)}`;
      exists = await this.prisma.passportApplication.findUnique({
        where: { applicationNo },
      });
    }

    const createdBy = dto.email;

    const record = await this.prisma.passportApplication.create({
      data: {
        applicationNo,
        // Never the form's: see the comment on this method.
        profileId: null,
        clerkUserId: owner?.clerkUserId ?? null,
        passportCategory: dto.passportCategory,
        surname: dto.surname,
        firstName: dto.firstName,
        middleName: dto.middleName || null,
        sex: dto.sex,
        ninNumber: dto.ninNumber,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(),
        placeOfBirth: dto.placeOfBirth || '',
        existingPassportNumber: dto.existingPassportNumber || null,
        homeTown: dto.homeTown || '',
        stateOfOrigin: dto.stateOfOrigin || '',
        permanentAddress: dto.permanentAddress || '',
        occupation: dto.occupation || '',
        contactPhone: dto.contactPhone || '',
        email: dto.email,
        maritalStatus: dto.maritalStatus || '',
        colourOfEyes: dto.colourOfEyes || '',
        colourOfHair: dto.colourOfHair || '',
        height: dto.height || '',
        maidenName: dto.maidenName || null,
        nextOfKinName: dto.nextOfKinName || '',
        nextOfKinPhone: dto.nextOfKinPhone || '',
        nextOfKinRelationship: dto.nextOfKinRelationship || '',
        nextOfKinAddress: dto.nextOfKinAddress || '',
        validity: dto.validity || PassportValidity.FIVE_YEARS,
        bookletType: dto.bookletType || BookletType.THIRTY_TWO_PAGES,
        birthCertificateUrl: dto.birthCertificateUrl || '',
        ninDocumentUrl: dto.ninDocumentUrl || '',
        passportPhotoUrl: dto.passportPhotoUrl || '',
        status: PassportApplicationStatus.SUBMITTED,
        createdBy,
      },
    });

    this.logger.log(
      `Passport application created successfully: applicationNo=${record.applicationNo}, id=${record.id}`,
    );

    try {
      await this.sendGridService.sendApplicationConfirmationEmail({
        to: record.email,
        recipientName: `${record.firstName} ${record.surname}`.trim(),
        applicationNo: record.applicationNo,
        targetCountry: 'Nigeria (Passport Renewal)',
        visaCategory: record.passportCategory,
      });
    } catch (err: any) {
      this.logger.error(
        `SendGrid passport confirmation email error for applicationNo=${record.applicationNo}: ${err?.message}`,
      );
    }

    return record;
  }

  private async resolveReviewerDisplayName(
    emailOrName: string,
  ): Promise<string> {
    if (!emailOrName) return 'Admin Consultant';
    if (!emailOrName.includes('@')) return emailOrName;

    const profile = await this.prisma.profile
      .findUnique({ where: { email: emailOrName } })
      .catch(() => null);

    if (profile && (profile.firstName || profile.lastName)) {
      return `${profile.firstName} ${profile.lastName}`.trim();
    }

    const handle = emailOrName.split('@')[0];
    const parts = handle.split(/[._\-+]/).filter(Boolean);
    if (parts.length === 0) return 'Admin Consultant';
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }

  async updateStatus(
    id: string,
    dto: UpdatePassportStatusDto,
    reviewerEmail: string,
  ) {
    const record = await this.findApplicationById(id);
    const reviewerName = await this.resolveReviewerDisplayName(reviewerEmail);

    this.logger.log(
      `Updating review status for passport application id=${id}, from=${record.status} to=${dto.status} by reviewer=${reviewerEmail} (${reviewerName})`,
    );

    const updated = await this.prisma.passportApplication.update({
      where: { id: record.id },
      data: {
        status: dto.status,
        verificationNotes: dto.verificationNotes || record.verificationNotes,
        rejectionReason:
          dto.status === PassportApplicationStatus.REJECTED
            ? dto.rejectionReason
            : record.rejectionReason,
        reviewedBy: reviewerName,
      },
    });

    // Send status update email via SendGrid
    if (updated.status === PassportApplicationStatus.APPROVED) {
      this.sendGridService
        .sendApplicationApprovedEmail({
          to: updated.email,
          recipientName: `${updated.firstName} ${updated.surname}`,
          applicationNo: updated.applicationNo,
          targetCountry: 'Nigeria (Passport)',
          reviewerEmail,
          reviewerName,
        })
        .catch((err) => {
          this.logger.error(
            `SendGrid passport approval email error: ${err?.message}`,
          );
        });
    } else if (updated.status === PassportApplicationStatus.REJECTED) {
      this.sendGridService
        .sendApplicationRejectedEmail({
          to: updated.email,
          recipientName: `${updated.firstName} ${updated.surname}`,
          applicationNo: updated.applicationNo,
          targetCountry: 'Nigeria (Passport)',
          reviewerEmail,
          reviewerName,
          rejectionReason: updated.rejectionReason || undefined,
        })
        .catch((err) => {
          this.logger.error(
            `SendGrid passport rejection email error: ${err?.message}`,
          );
        });
    }

    return updated;
  }

  async inviteApplicant(
    id: string,
    dto: InviteApplicantDto,
    inviterEmail: string,
  ) {
    const record = await this.findApplicationById(id);
    const inviterName = await this.resolveReviewerDisplayName(inviterEmail);

    if (
      record.status !== PassportApplicationStatus.UNDER_REVIEW &&
      record.status !== PassportApplicationStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Appointment invitations can only be issued for applications under review or approved. Current status is ${record.status}.`,
      );
    }

    const updated = await this.prisma.passportApplication.update({
      where: { id: record.id },
      data: {
        verificationNotes: `[INVITATION SENT ${new Date().toISOString().split('T')[0]}] Purpose: ${dto.purpose} on ${dto.date} at ${dto.time} (${dto.location})${dto.note ? ` - Note: ${dto.note}` : ''}${record.verificationNotes ? `\n\n${record.verificationNotes}` : ''}`,
      },
    });

    this.sendGridService
      .sendApplicantInvitationEmail({
        to: record.email,
        recipientName: `${record.firstName} ${record.surname}`,
        applicationNo: record.applicationNo,
        targetCountry: 'Nigeria (Passport)',
        purpose: dto.purpose,
        date: dto.date,
        time: dto.time,
        location: dto.location,
        note: dto.note,
        inviterEmail,
        inviterName,
      })
      .catch((err) => {
        this.logger.error(
          `SendGrid passport applicant invitation email error: ${err?.message}`,
        );
      });

    return updated;
  }

  async evaluateCost(
    id: string,
    dto: EvaluateVisaCostDto,
    evaluatorEmail: string,
  ) {
    const record = await this.findApplicationById(id);
    const evaluatorName = await this.resolveReviewerDisplayName(evaluatorEmail);

    // Same rule as visas (ADR 0016): priced while no money is held and no
    // decision has been made, including a review started before pricing or
    // a payment that was refunded.
    if (
      record.status === PassportApplicationStatus.APPROVED ||
      record.status === PassportApplicationStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cost evaluation is closed once an application is approved or rejected. Current status is ${record.status}.`,
      );
    }
    if (
      record.paymentStatus === PaymentStatus.PARTIALLY_PAID ||
      record.paymentStatus === PaymentStatus.FULLY_PAID
    ) {
      throw new ConflictException(
        'The applicant has already paid against this price. Refund the payment before changing it.',
      );
    }

    const totalAmount = new Prisma.Decimal(dto.totalAmount);
    const currentAmountPaid = record.amountPaid || new Prisma.Decimal(0);
    const balanceDue = Prisma.Decimal.max(
      new Prisma.Decimal(0),
      totalAmount.sub(currentAmountPaid),
    );

    let paymentStatus: PaymentStatus = PaymentStatus.AWAITING_PAYMENT;
    if (currentAmountPaid.gte(totalAmount)) {
      paymentStatus = PaymentStatus.FULLY_PAID;
    } else if (currentAmountPaid.gt(0)) {
      paymentStatus = PaymentStatus.PARTIALLY_PAID;
    }

    this.logger.log(
      `Evaluating cost for passport application id=${id}, totalAmount=${dto.totalAmount}, currency=${dto.currency || 'USD'}, allowInstallment=${dto.allowInstallment ?? false} by evaluator=${evaluatorEmail} (${evaluatorName})`,
    );

    const updated = await this.prisma.passportApplication.update({
      where: { id: record.id },
      data: {
        totalAmount,
        currency: dto.currency || 'USD',
        balanceDue,
        allowInstallment: dto.allowInstallment ?? false,
        paymentStatus,
        // A review already under way stays under way.
        status:
          record.status === PassportApplicationStatus.UNDER_REVIEW
            ? PassportApplicationStatus.UNDER_REVIEW
            : PassportApplicationStatus.EVALUATED,
        evaluatedBy: evaluatorName,
        evaluatedAt: new Date(),
      },
    });

    try {
      await this.sendGridService.sendCostEvaluatedEmail({
        to: updated.email,
        recipientName: `${updated.firstName} ${updated.surname}`,
        applicationNo: updated.applicationNo,
        targetCountry: 'Nigeria (Passport)',
        totalAmount: Number(updated.totalAmount),
        currency: updated.currency,
        allowInstallment: updated.allowInstallment,
        evaluatorEmail,
        evaluatorName,
        bankAccounts: [],
      });
    } catch (err: any) {
      this.logger.error(
        `SendGrid passport cost evaluation email error for applicationNo=${updated.applicationNo}: ${err?.message}`,
      );
    }

    return updated;
  }

  /** Records a confirmed payment on the file, then emails the applicant. */
  async handlePaymentConfirmed(
    passportId: string,
    amount: Prisma.Decimal,
    paymentOption: PaymentOption,
  ) {
    const { id } = await this.findApplicationById(passportId);
    const updated = await serializable(this.prisma, async (tx) => {
      const record = await tx.passportApplication.findUniqueOrThrow({
        where: { id },
      });
      return this.applyPayment(tx, record, amount, paymentOption);
    });
    await this.notifyPaymentConfirmed(updated, amount, paymentOption);
    return updated;
  }

  /**
   * Adds `amount` to `record` inside the caller's transaction, and moves a
   * file waiting for payment into review. `record` must have been read in the
   * same transaction, so the amount is added to the balance that was checked.
   * Sends nothing: call `notifyPaymentConfirmed` once the transaction commits.
   */
  async applyPayment(
    tx: Prisma.TransactionClient,
    record: PassportApplication,
    amount: Prisma.Decimal,
    paymentOption: PaymentOption,
  ) {
    const currentTotal = Number(record.totalAmount || 0);
    const currentPaid = Number(record.amountPaid || 0);
    const addedAmount = Number(amount);

    const newAmountPaid = currentPaid + addedAmount;
    const newBalanceDue = Math.max(0, currentTotal - newAmountPaid);

    let newPaymentStatus: PaymentStatus;
    if (newBalanceDue === 0 || newAmountPaid >= currentTotal) {
      newPaymentStatus = PaymentStatus.FULLY_PAID;
    } else {
      newPaymentStatus = PaymentStatus.PARTIALLY_PAID;
    }

    let newStatus = record.status;
    if (
      record.status === PassportApplicationStatus.SUBMITTED ||
      record.status === PassportApplicationStatus.EVALUATED
    ) {
      newStatus = PassportApplicationStatus.UNDER_REVIEW;
    }

    return tx.passportApplication.update({
      where: { id: record.id },
      data: {
        amountPaid: new Prisma.Decimal(newAmountPaid),
        balanceDue: new Prisma.Decimal(newBalanceDue),
        paymentStatus: newPaymentStatus,
        status: newStatus,
        selectedPaymentOption: paymentOption,
      },
    });
  }

  /** The payment-confirmed email. A mail failure is logged, never thrown. */
  async notifyPaymentConfirmed(
    updated: PassportApplication,
    amount: Prisma.Decimal,
    paymentOption: PaymentOption,
  ) {
    try {
      await this.sendGridService.sendPaymentConfirmedEmail({
        to: updated.email,
        recipientName: `${updated.firstName} ${updated.surname}`,
        applicationNo: updated.applicationNo,
        amountPaid: Number(amount),
        balanceDue: Number(updated.balanceDue),
        paymentOption,
        currency: updated.currency,
      });
    } catch (err: any) {
      this.logger.error(
        `SendGrid passport payment confirmation email error for applicationNo=${updated.applicationNo}: ${err?.message}`,
      );
    }
  }

  async findAllApplications(query: QueryPassportApplicationDto) {
    const where: Prisma.PassportApplicationWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.passportCategory) where.passportCategory = query.passportCategory;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { surname: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { ninNumber: { contains: query.search, mode: 'insensitive' } },
        { applicationNo: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.passportApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async findApplicationById(idOrAppNo: string, email?: string) {
    const where: Prisma.PassportApplicationWhereInput = {
      OR: [{ id: idOrAppNo }, { applicationNo: idOrAppNo }],
    };

    if (email && email.trim()) {
      where.email = { equals: email.trim(), mode: 'insensitive' };
    }

    const record = await this.prisma.passportApplication.findFirst({
      where,
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!record) {
      this.logger.warn(
        `Passport application not found for identifier=${idOrAppNo}${email ? ` and email=${email}` : ''}`,
      );
      throw new NotFoundException(
        `Passport application record with identifier '${idOrAppNo}' not found.`,
      );
    }

    return record;
  }

  /** Every passport application owned by one WorldStreet user, newest first. */
  async findPassportApplicationsByClerkUser(clerkUserId: string) {
    if (!clerkUserId) return [];

    return this.prisma.passportApplication.findMany({
      where: { clerkUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }
}
