import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePassportApplicationDto } from './dto/create-passport-application.dto';
import { UpdatePassportStatusDto } from './dto/update-passport-status.dto';
import { QueryPassportApplicationDto } from './dto/query-passport-application.dto';
import {
  PassportApplicationStatus,
  PassportValidity,
  BookletType,
  Prisma,
} from '@prisma/client';
import { randomInt } from 'crypto';
import { SendGridService } from 'src/mail/sendgrid.service';

@Injectable()
export class PassportApplicationService {
  private readonly logger = new Logger(PassportApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendGridService: SendGridService,
  ) {}


  async createApplication(
    dto: CreatePassportApplicationDto,
    creatorIdentifier?: string,
  ) {
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

    if (dto.profileId) {
      const profile = await this.prisma.profile.findUnique({
        where: { id: dto.profileId },
      });
      if (!profile) {
        this.logger.warn(
          `Attempted to create passport application with non-existent profileId=${dto.profileId}`,
        );
        throw new BadRequestException(
          `Profile with ID '${dto.profileId}' does not exist.`,
        );
      }
    }

    const createdBy = creatorIdentifier || dto.email;

    try {
      const record = await this.prisma.passportApplication.create({
        data: {
          applicationNo,
          profileId: dto.profileId || null,
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

  async updateStatus(
    id: string,
    dto: UpdatePassportStatusDto,
    reviewerEmail: string,
  ) {
    const record = await this.findApplicationById(id);

    this.logger.log(
      `Updating review status for passport application id=${id}, from=${record.status} to=${dto.status} by reviewer=${reviewerEmail}`,
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
        reviewedBy: reviewerEmail,
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
        })
        .catch((err) => {
          this.logger.error(`SendGrid passport approval email error: ${err?.message}`);
        });
    } else if (updated.status === PassportApplicationStatus.REJECTED) {
      this.sendGridService
        .sendApplicationRejectedEmail({
          to: updated.email,
          recipientName: `${updated.firstName} ${updated.surname}`,
          applicationNo: updated.applicationNo,
          targetCountry: 'Nigeria (Passport)',
          reviewerEmail,
          rejectionReason: updated.rejectionReason || undefined,
        })
        .catch((err) => {
          this.logger.error(`SendGrid passport rejection email error: ${err?.message}`);
        });
    }

    return updated;
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

  async findApplicationById(idOrAppNo: string) {
    const record = await this.prisma.passportApplication.findFirst({
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
        `Passport application not found for identifier=${idOrAppNo}`,
      );
      throw new NotFoundException(
        `Passport application record with identifier '${idOrAppNo}' not found.`,
      );
    }

    return record;
  }
}
