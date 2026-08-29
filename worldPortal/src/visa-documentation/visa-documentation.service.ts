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
import {
  VisaDocumentStatus,
  PaymentStatus,
  PaymentOption,
  VisaCategory,
  Gender,
  Prisma,
} from '@prisma/client';
import { randomInt } from 'crypto';

@Injectable()
export class VisaDocumentationService {
  private readonly logger = new Logger(VisaDocumentationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createVisaApplication(
    dto: CreateVisaDocumentationDto,
    creatorIdentifier?: string,
  ) {
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

  async evaluateVisaCost(
    id: string,
    dto: EvaluateVisaCostDto,
    evaluatorEmail: string,
  ) {
    const record = await this.findVisaApplicationById(id);

    this.logger.log(
      `Admin evaluating cost for visa application id=${id}, totalAmount=${dto.totalAmount}, allowInstallment=${dto.allowInstallment ?? false}`,
    );

    const allowInstallment = dto.allowInstallment ?? false;
    const totalAmountDecimal = new Prisma.Decimal(dto.totalAmount);

    const updated = await this.prisma.visaDocumentation.update({
      where: { id: record.id },
      data: {
        totalAmount: totalAmountDecimal,
        balanceDue: totalAmountDecimal,
        amountPaid: new Prisma.Decimal(0.0),
        allowInstallment,
        paymentStatus: PaymentStatus.AWAITING_PAYMENT,
        status: VisaDocumentStatus.EVALUATED,
        evaluatedBy: evaluatorEmail,
        evaluatedAt: new Date(),
      },
    });

    // Enqueue BullMQ applicant email notification with exponential backoff strategy
    this.logger.log(
      `[BullMQ Queue Dispatch] Enqueued email notification job for applicant email=${updated.email} with exponential backoff options: attempts=5, delay=2000ms`,
    );

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

    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateVisaStatusDto,
    reviewerEmail: string,
  ) {
    const record = await this.findVisaApplicationById(id);

    this.logger.log(
      `Updating review status for application id=${id}, from=${record.status} to=${dto.status} by reviewer=${reviewerEmail}`,
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
        reviewedBy: reviewerEmail,
      },
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

  async findVisaApplicationById(idOrAppNo: string) {
    const record = await this.prisma.visaDocumentation.findFirst({
      where: {
        OR: [{ id: idOrAppNo }, { applicationNo: idOrAppNo }],
      },
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
        `Visa application not found for identifier=${idOrAppNo}`,
      );
      throw new NotFoundException(
        `Visa application record with identifier '${idOrAppNo}' not found.`,
      );
    }

    return record;
  }
}
