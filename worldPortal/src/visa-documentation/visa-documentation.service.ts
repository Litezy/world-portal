import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisaDocumentationDto } from './dto/create-visa-documentation.dto';
import { EvaluateVisaCostDto } from './dto/evaluate-visa-cost.dto';
import { UpdateVisaStatusDto } from './dto/update-visa-status.dto';
import { QueryVisaDocumentationDto } from './dto/query-visa-documentation.dto';
import { InviteApplicantDto } from './dto/invite-applicant.dto';

import {
  VisaDocumentStatus,
  PaymentStatus,
  PaymentOption,
  VisaCategory,
  Gender,
  Prisma,
} from '@prisma/client';
import { randomInt } from 'crypto';
import { SendGridService } from '../mail/sendgrid.service';
import { BankAccountService } from '../bank-account/bank-account.service';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class VisaDocumentationService {
  private readonly logger = new Logger(VisaDocumentationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendGridService: SendGridService,
    private readonly bankAccountService: BankAccountService,
    private readonly otpService: OtpService,
  ) {}


  async createVisaApplication(
    dto: CreateVisaDocumentationDto,
    creatorIdentifier?: string,
  ) {
    if (!this.otpService.isEmailVerified(dto.email)) {
      this.logger.warn(
        `Attempted application submission with unverified email=${dto.email}`,
      );
      throw new BadRequestException(
        `Email address '${dto.email}' has not been verified via OTP. Please verify your email before submitting.`,
      );
    }
    const maskedPassport = dto.passportNumber
      ? dto.passportNumber.replace(/^(.{2}).*(.{2})$/, '$1****$2')
      : 'N/A';

    this.logger.log(
      `Creating visa application for applicant email=${dto.email}, passport=${maskedPassport}, targetCountry=${dto.targetCountry}`,
    );

    let applicationNo = `VISA-2026-${randomInt(1000, 9999)}`;
    let exists = await this.prisma.visaDocumentation.findUnique({
      where: { applicationNo },
    });

    while (exists) {
      applicationNo = `VISA-2026-${randomInt(1000, 9999)}`;
      exists = await this.prisma.visaDocumentation.findUnique({
        where: { applicationNo },
      });
    }

    if (dto.profileId) {
      const profile = await this.prisma.profile.findUnique({
        where: { id: dto.profileId },
      });
      if (!profile) {
        this.logger.warn(
          `Attempted to create visa application with non-existent profileId=${dto.profileId}`,
        );
        throw new BadRequestException(
          `Profile with ID '${dto.profileId}' does not exist.`,
        );
      }
    }

    const createdBy = creatorIdentifier || dto.email;

    try {
      const record = await this.prisma.visaDocumentation.create({
        data: {
          applicationNo,
          profileId: dto.profileId || null,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone || '',
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(),
          gender: dto.gender || Gender.MALE,
          nationality: dto.nationality || '',
          residenceAddress: dto.residenceAddress || '',
          passportNumber: dto.passportNumber || '',
          passportIssueDate: dto.passportIssueDate
            ? new Date(dto.passportIssueDate)
            : new Date(),
          passportExpiryDate: dto.passportExpiryDate
            ? new Date(dto.passportExpiryDate)
            : new Date(),
          passportIssuingAuthority: dto.passportIssuingAuthority || null,
          targetCountry: dto.targetCountry,
          visaCategory: dto.visaCategory || VisaCategory.TOURIST,
          intendedArrivalDate: dto.intendedArrivalDate
            ? new Date(dto.intendedArrivalDate)
            : new Date(),
          intendedDepartureDate: dto.intendedDepartureDate
            ? new Date(dto.intendedDepartureDate)
            : new Date(),
          purposeOfVisit: dto.purposeOfVisit || '',
          passportDataPageUrl: dto.passportDataPageUrl || '',
          passportPhotoWhiteBgUrl: dto.passportPhotoWhiteBgUrl || '',
          proofOfFunds6MonthsUrl: dto.proofOfFunds6MonthsUrl || '',
          businessRegistrationCertUrl: dto.businessRegistrationCertUrl || null,
          taxCertificateUrl: dto.taxCertificateUrl || null,
          marriageCertificateUrl: dto.marriageCertificateUrl || null,
          childrenBirthCertUrls: dto.childrenBirthCertUrls || [],
          landedPropertyDocUrls: dto.landedPropertyDocUrls || [],
          previousVisasScanUrls: dto.previousVisasScanUrls || [],
          supportingDocUrls: dto.supportingDocUrls || [],
          status: VisaDocumentStatus.SUBMITTED,
          paymentStatus: PaymentStatus.PENDING_EVALUATION,
          createdBy,
        },
      });

      this.logger.log(
        `Visa application created successfully: applicationNo=${record.applicationNo}, id=${record.id}`,
      );

      try {
        await this.sendGridService.sendApplicationConfirmationEmail({
          to: record.email,
          recipientName: `${record.firstName} ${record.lastName}`.trim(),
          applicationNo: record.applicationNo,
          targetCountry: record.targetCountry,
          visaCategory: record.visaCategory,
        });
      } catch (err: any) {
        this.logger.error(
          `SendGrid confirmation email dispatch error for applicationNo=${record.applicationNo}: ${err?.message}`,
        );
      }

      return record;

    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          `Associated profile with ID '${dto.profileId}' does not exist.`,
        );
      }
      throw error;
    }
  }

  private async resolveReviewerDisplayName(emailOrName: string): Promise<string> {
    if (!emailOrName) return 'Admin Consultant';
    if (!emailOrName.includes('@')) return emailOrName;

    const profile = await Promise.resolve(
      this.prisma.profile?.findUnique({ where: { email: emailOrName } }),
    ).catch(() => null);


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

  async evaluateVisaCost(
    id: string,
    dto: EvaluateVisaCostDto,
    evaluatorEmail: string,
  ) {
    const record = await this.findVisaApplicationById(id);

    const currency = dto.currency?.toUpperCase() || 'USD';
    const evaluatorName = await this.resolveReviewerDisplayName(evaluatorEmail);

    this.logger.log(
      `Admin evaluating cost for visa application id=${id}, totalAmount=${dto.totalAmount}, currency=${currency}, allowInstallment=${dto.allowInstallment ?? false}`,
    );

    const allowInstallment = dto.allowInstallment ?? false;
    const totalAmountDecimal = new Prisma.Decimal(dto.totalAmount);

    const updated = await this.prisma.visaDocumentation.update({
      where: { id: record.id },
      data: {
        totalAmount: totalAmountDecimal,
        currency,
        balanceDue: totalAmountDecimal,
        amountPaid: new Prisma.Decimal(0.0),
        allowInstallment,
        paymentStatus: PaymentStatus.AWAITING_PAYMENT,
        status: VisaDocumentStatus.EVALUATED,
        evaluatedBy: evaluatorName,
        evaluatedAt: new Date(),
      },
    });

    // Fetch active bank accounts to include in payment email
    const activeBankAccounts = await this.bankAccountService.findActive().catch(() => []);

    // Send evaluation email via SendGrid
    this.sendGridService
      .sendCostEvaluatedEmail({
        to: updated.email,
        recipientName: `${updated.firstName} ${updated.lastName}`,
        applicationNo: updated.applicationNo,
        targetCountry: updated.targetCountry,
        totalAmount: Number(updated.totalAmount || 0),
        currency: updated.currency,
        allowInstallment: updated.allowInstallment,
        evaluatorEmail,
        evaluatorName,
        bankAccounts: activeBankAccounts.map((b) => ({
          bankName: b.bankName,
          accountName: b.accountName,
          accountNumber: b.accountNumber,
          swiftCode: b.swiftCode || undefined,
          iban: b.iban || undefined,
          routingNumber: b.routingNumber || undefined,
          currency: b.currency,
          instructions: b.instructions || undefined,
        })),
      })
      .catch((err) => {
        this.logger.error(`SendGrid cost evaluation email error: ${err?.message}`);
      });

    return updated;
  }

  async handlePaymentConfirmed(
    visaDocId: string,
    amount: Prisma.Decimal,
    paymentOption: PaymentOption,
  ) {
    const record = await this.findVisaApplicationById(visaDocId);

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

    this.logger.log(
      `Direct Service Injection: Payment confirmed for applicationNo=${record.applicationNo}, addedAmount=${addedAmount}. Transitioning status to UNDER_REVIEW, paymentStatus=${newPaymentStatus}`,
    );

    const updated = await this.prisma.visaDocumentation.update({
      where: { id: record.id },
      data: {
        amountPaid: new Prisma.Decimal(newAmountPaid),
        balanceDue: new Prisma.Decimal(newBalanceDue),
        paymentStatus: newPaymentStatus,
        selectedPaymentOption: paymentOption,
        status: VisaDocumentStatus.UNDER_REVIEW,
      },
    });

    // Send payment confirmed & under review email via SendGrid
    this.sendGridService
      .sendPaymentConfirmedEmail({
        to: updated.email,
        recipientName: `${updated.firstName} ${updated.lastName}`,
        applicationNo: updated.applicationNo,
        amountPaid: Number(updated.amountPaid),
        balanceDue: Number(updated.balanceDue),
        paymentOption: updated.selectedPaymentOption || paymentOption,
        currency: updated.currency,
      })
      .catch((err) => {
        this.logger.error(`SendGrid payment confirmed email error: ${err?.message}`);
      });

    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateVisaStatusDto,
    reviewerEmail: string,
  ) {
    const record = await this.findVisaApplicationById(id);

    const reviewerName = await this.resolveReviewerDisplayName(reviewerEmail);

    this.logger.log(
      `Updating review status for application id=${id}, from=${record.status} to=${dto.status} by reviewer=${reviewerEmail} (${reviewerName})`,
    );

    const updated = await this.prisma.visaDocumentation.update({
      where: { id: record.id },
      data: {
        status: dto.status,
        verificationNotes: dto.verificationNotes || record.verificationNotes,
        rejectionReason:
          dto.status === VisaDocumentStatus.REJECTED
            ? dto.rejectionReason
            : record.rejectionReason,
        reviewedBy: reviewerName,
      },
    });

    // Send status update email via SendGrid
    if (updated.status === VisaDocumentStatus.APPROVED) {
      this.sendGridService
        .sendApplicationApprovedEmail({
          to: updated.email,
          recipientName: `${updated.firstName} ${updated.lastName}`,
          applicationNo: updated.applicationNo,
          targetCountry: updated.targetCountry,
          reviewerEmail,
          reviewerName,
        })
        .catch((err) => {
          this.logger.error(`SendGrid approval email error: ${err?.message}`);
        });
    } else if (updated.status === VisaDocumentStatus.REJECTED) {
      this.sendGridService
        .sendApplicationRejectedEmail({
          to: updated.email,
          recipientName: `${updated.firstName} ${updated.lastName}`,
          applicationNo: updated.applicationNo,
          targetCountry: updated.targetCountry,
          reviewerEmail,
          reviewerName,
          rejectionReason: updated.rejectionReason || undefined,
        })
        .catch((err) => {
          this.logger.error(`SendGrid rejection email error: ${err?.message}`);
        });
    }

    return updated;
  }

  async inviteApplicant(
    id: string,
    dto: InviteApplicantDto,
    inviterEmail: string,
  ) {
    const record = await this.findVisaApplicationById(id);

    if (
      record.status === VisaDocumentStatus.SUBMITTED ||
      record.status === VisaDocumentStatus.EVALUATED
    ) {
      throw new BadRequestException(
        `Invitations can only be issued starting from UNDER_REVIEW status. Current status is ${record.status}.`,
      );
    }

    const inviterName = await this.resolveReviewerDisplayName(inviterEmail);

    this.logger.log(
      `Inviting applicant for application id=${id}, applicationNo=${record.applicationNo}, purpose=${dto.purpose}, date=${dto.date}, time=${dto.time}, location=${dto.location} by inviter=${inviterEmail} (${inviterName})`,
    );

    const noteLog = `[Invitation Sent - ${dto.purpose}] Date: ${dto.date} at ${dto.time} | Venue: ${dto.location}${dto.note ? ` | Note: ${dto.note}` : ''}`;
    const updatedNotes = record.verificationNotes
      ? `${record.verificationNotes}\n${noteLog}`
      : noteLog;

    const updated = await this.prisma.visaDocumentation.update({
      where: { id: record.id },
      data: {
        verificationNotes: updatedNotes,
      },
    });

    // Dispatch invitation email via SendGrid
    this.sendGridService
      .sendApplicantInvitationEmail({
        to: record.email,
        recipientName: `${record.firstName} ${record.lastName}`,
        applicationNo: record.applicationNo,
        targetCountry: record.targetCountry,
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
          `SendGrid applicant invitation email error: ${err?.message}`,
        );
      });

    return updated;
  }



  async findAllVisaApplications(query: QueryVisaDocumentationDto) {
    const where: Prisma.VisaDocumentationWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.visaCategory) where.visaCategory = query.visaCategory;
    if (query.targetCountry) {
      where.targetCountry = {
        contains: query.targetCountry,
        mode: 'insensitive',
      };
    }
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { passportNumber: { contains: query.search, mode: 'insensitive' } },
        { applicationNo: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.visaDocumentation.findMany({
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

  async findVisaApplicationById(idOrAppNo: string, email?: string) {
    const where: Prisma.VisaDocumentationWhereInput = {
      OR: [{ id: idOrAppNo }, { applicationNo: idOrAppNo }],
    };

    if (email && email.trim()) {
      where.email = { equals: email.trim(), mode: 'insensitive' };
    }

    const record = await this.prisma.visaDocumentation.findFirst({
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
        `Visa application not found for identifier=${idOrAppNo}${email ? ` and email=${email}` : ''}`,
      );
      throw new NotFoundException(
        `Visa application record not found matching identifier '${idOrAppNo}'${email ? ` and email '${email}'` : ''}.`,
      );
    }

    return record;
  }
}
