import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyListingDto } from './dto/update-agency-listing.dto';
import { AddAgencyStaffDto, UpdateAgencyStaffDto } from './dto/add-agency-staff.dto';
import { UploadAgencyDocumentDto, UpdateDocumentStatusDto } from './dto/upload-agency-document.dto';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { createHash } from 'crypto';
import {
  AgencyDocumentKind,
  AgencyDocumentStatus,
  AgencyStaffStatus,
  AssignmentStatus,
  AgencyPayoutStatus,
  AgencyVerificationStatus,
  AgencyListingStatus,
  AgencyUserRole,
} from '@prisma/client';

@Injectable()
export class AgencyService {
  private readonly logger = new Logger(AgencyService.name);

  constructor(private readonly prisma: PrismaService) { }

  /** Create slug from agency name */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  /**
   * Register a new agency listing
   */
  async createAgency(dto: CreateAgencyDto) {
    if (dto.email) {
      const existingEmail = await this.prisma.agency.findFirst({
        where: { email: { equals: dto.email.trim(), mode: 'insensitive' } },
      });
      if (existingEmail) {
        throw new BadRequestException('An agency is already listed with that email.');
      }
    }

    let slug = this.slugify(dto.name);
    const existingSlug = await this.prisma.agency.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const defaultPasswordHash = this.hashPassword((dto as any).password || 'Password@2');

    const agency = await this.prisma.agency.create({
      data: {
        slug,
        name: dto.name,
        legalName: dto.legalName,
        registrationNumber: dto.registrationNumber,
        countryCode: dto.countryCode,
        country: dto.country,
        cities: dto.cities,
        categories: dto.categories,
        summary: dto.summary,
        about: dto.about,
        logoUrl: dto.logoUrl,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        yearFounded: dto.yearFounded,
        staffCount: dto.staffCount,
        languages: dto.languages,
        users: {
          create: {
            name: `${dto.name} Manager`,
            email: dto.email,
            passwordHash: defaultPasswordHash,
            role: AgencyUserRole.OWNER,
          },
        },
      },
      include: {
        documents: true,
        staff: true,
        offerings: true,
        users: true,
      },
    });

    this.logger.log(`Created new agency id=${agency.id} slug=${agency.slug} with user email=${dto.email}`);
    return agency;
  }

  /**
   * Helper to find an agency by ID, slug, or email.
   */
  async findAgency(idOrSlug: string) {
    if (!idOrSlug) return null;
    const needle = idOrSlug.trim();
    const match = await this.prisma.agency.findFirst({
      where: {
        OR: [
          { id: needle },
          { slug: needle },
          { email: { equals: needle, mode: "insensitive" } },
        ],
      },
      include: {
        documents: true,
        staff: true,
        offerings: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (match) return match;
    return null;
  }

  /**
   * Get agency details by ID
   */
  async getAgencyById(id: string) {
    const agency = await this.findAgency(id);

    if (!agency) {
      throw new NotFoundException(`Agency with ID "${id}" not found`);
    }

    return agency;
  }

  /**
   * Update agency listing / profile
   */
  async updateAgencyListing(id: string, dto: UpdateAgencyListingDto) {
    const agency = await this.getAgencyById(id);
    const realId = agency.id;

    if (Array.isArray(dto.offerings)) {
      await this.prisma.agencyServiceOffering.deleteMany({
        where: { agencyId: realId },
      });
      if (dto.offerings.length > 0) {
        await this.prisma.agencyServiceOffering.createMany({
          data: dto.offerings.map((o: any) => ({
            agencyId: realId,
            category: o.category || "security",
            title: o.title || "Service Offering",
            description: o.description || "",
            price: o.price !== null && o.price !== undefined && !isNaN(Number(o.price)) ? Number(o.price) : null,
            currency: o.currency || "USD",
            unit: o.unit || "day",
            leadTimeHours: o.leadTimeHours ? Number(o.leadTimeHours) : 24,
            capacity: o.capacity ? Number(o.capacity) : 1,
          })),
        });
      }
    }

    const updated = await this.prisma.agency.update({
      where: { id: realId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.legalName && { legalName: dto.legalName }),
        ...(dto.registrationNumber && { registrationNumber: dto.registrationNumber }),
        ...(dto.countryCode && { countryCode: dto.countryCode }),
        ...(dto.country && { country: dto.country }),
        ...(dto.summary && { summary: dto.summary }),
        ...(dto.about && { about: dto.about }),
        ...(dto.logoUrl && { logoUrl: dto.logoUrl }),
        ...(dto.email && { email: dto.email }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.website && { website: dto.website }),
        ...(dto.yearFounded && { yearFounded: dto.yearFounded }),
        ...(dto.staffCount && { staffCount: dto.staffCount }),
        ...(dto.categories && { categories: dto.categories }),
        ...(dto.cities && { cities: dto.cities }),
        ...(dto.languages && { languages: dto.languages }),
        ...(dto.listingStatus && { listingStatus: dto.listingStatus }),
      },
      include: {
        documents: true,
        staff: true,
        offerings: true,
      },
    });

    this.logger.log(`Updated agency listing id=${realId}`);
    return updated;
  }

  /**
   * Compute headline metrics for agency overview dashboard
   */
  async getOverview(agencyId: string) {
    const agency = await this.getAgencyById(agencyId);

    const openAssignmentsCount = await this.prisma.agencyAssignment.count({
      where: {
        agencyId,
        status: { in: [AssignmentStatus.REQUESTED, AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS] },
      },
    });

    const staffTotal = await this.prisma.agencyStaff.count({
      where: { agencyId },
    });

    const staffOnDuty = await this.prisma.agencyStaff.count({
      where: { agencyId, status: AgencyStaffStatus.ASSIGNED },
    });

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedThisMonth = await this.prisma.agencyAssignment.count({
      where: {
        agencyId,
        status: AssignmentStatus.COMPLETED,
        updatedAt: { gte: firstDayOfMonth },
      },
    });

    const monthEarnings = await this.prisma.agencyAssignment.aggregate({
      where: {
        agencyId,
        status: AssignmentStatus.COMPLETED,
        updatedAt: { gte: firstDayOfMonth },
      },
      _sum: {
        netToAgency: true,
      },
    });

    const pendingPayouts = await this.prisma.agencyPayout.aggregate({
      where: {
        agencyId,
        status: { in: [AgencyPayoutStatus.PENDING, AgencyPayoutStatus.PROCESSING] },
      },
      _sum: {
        net: true,
      },
    });

    const outstandingDocuments = await this.prisma.agencyDocument.count({
      where: {
        agencyId,
        status: { in: [AgencyDocumentStatus.MISSING, AgencyDocumentStatus.REJECTED] },
      },
    });

    return {
      openAssignments: openAssignmentsCount,
      staffOnDuty,
      staffTotal,
      completedThisMonth,
      earnedThisMonth: Number(monthEarnings._sum.netToAgency || 0),
      pendingPayout: Number(pendingPayouts._sum.net || 0),
      currency: 'USD',
      outstandingDocuments,
      verification: agency.verification,
      listingStatus: agency.listingStatus,
    };
  }

  /**
   * Manage Staff
   */
  async listStaff(agencyId: string) {
    return this.prisma.agencyStaff.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addStaff(agencyId: string, dto: AddAgencyStaffDto) {
    await this.getAgencyById(agencyId);

    const staff = await this.prisma.agencyStaff.create({
      data: {
        agencyId,
        name: dto.name,
        role: dto.role,
        category: dto.category,
        photoUrl: dto.photoUrl,
        phone: dto.phone,
        languages: dto.languages,
        experienceYears: dto.experienceYears,
        backgroundChecked: dto.backgroundChecked ?? false,
        status: dto.status ?? AgencyStaffStatus.AVAILABLE,
      },
    });

    this.logger.log(`Added staff id=${staff.id} for agencyId=${agencyId}`);
    return staff;
  }

  async updateStaff(agencyId: string, staffId: string, dto: UpdateAgencyStaffDto) {
    const existing = await this.prisma.agencyStaff.findFirst({
      where: { id: staffId, agencyId },
    });

    if (!existing) {
      throw new NotFoundException(`Staff member "${staffId}" not found for this agency`);
    }

    return this.prisma.agencyStaff.update({
      where: { id: staffId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.role && { role: dto.role }),
        ...(dto.category && { category: dto.category }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.languages && { languages: dto.languages }),
        ...(dto.experienceYears !== undefined && { experienceYears: dto.experienceYears }),
        ...(dto.backgroundChecked !== undefined && { backgroundChecked: dto.backgroundChecked }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  /**
   * Documents Management
   */
  async listDocuments(agencyId: string) {
    return this.prisma.agencyDocument.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadDocument(agencyId: string, dto: UploadAgencyDocumentDto) {
    await this.getAgencyById(agencyId);

    const existing = await this.prisma.agencyDocument.findFirst({
      where: { agencyId, kind: dto.kind },
    });

    const uploadedAt = new Date();
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    if (existing) {
      return this.prisma.agencyDocument.update({
        where: { id: existing.id },
        data: {
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          uploadedAt,
          expiresAt,
          status: AgencyDocumentStatus.IN_REVIEW,
          note: null,
        },
      });
    }

    return this.prisma.agencyDocument.create({
      data: {
        agencyId,
        kind: dto.kind,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        uploadedAt,
        expiresAt,
        status: AgencyDocumentStatus.IN_REVIEW,
      },
    });
  }

  async updateDocumentStatus(agencyId: string, docId: string, status: string, note?: string) {
    const agency = await this.getAgencyById(agencyId);
    const realAgencyId = agency.id;

    const sUpper = status.toUpperCase();
    const docStatusEnum =
      sUpper === 'APPROVED' || sUpper === 'VERIFIED'
        ? AgencyDocumentStatus.APPROVED
        : sUpper === 'REJECTED'
          ? AgencyDocumentStatus.REJECTED
          : sUpper === 'IN_REVIEW'
            ? AgencyDocumentStatus.IN_REVIEW
            : AgencyDocumentStatus.UPLOADED;

    const normalizedKindStr = docId.toUpperCase().replace(/-/g, '_');
    const validKinds = Object.values(AgencyDocumentKind);

    const matchedKind = validKinds.find(
      (k) => k === docId || k === normalizedKindStr || k.toLowerCase() === docId.toLowerCase()
    );

    const existing = await this.prisma.agencyDocument.findFirst({
      where: {
        agencyId: realAgencyId,
        OR: [
          { id: docId },
          ...(matchedKind ? [{ kind: matchedKind }] : []),
        ],
      },
    });

    if (existing) {
      const updated = await this.prisma.agencyDocument.update({
        where: { id: existing.id },
        data: {
          status: docStatusEnum,
          note: note !== undefined ? note : (docStatusEnum === AgencyDocumentStatus.APPROVED ? null : existing.note),
        },
      });
      this.logger.log(`Updated document status agencyId=${realAgencyId} docId=${existing.id} kind=${existing.kind} status=${docStatusEnum}`);
      return updated;
    }

    const targetKind = matchedKind || AgencyDocumentKind.BUSINESS_REGISTRATION;

    const created = await this.prisma.agencyDocument.create({
      data: {
        agencyId: realAgencyId,
        kind: targetKind,
        fileName: `${targetKind}.pdf`,
        fileUrl: '',
        status: docStatusEnum,
        note: note || null,
      },
    });
    this.logger.log(`Created document for status change agencyId=${realAgencyId} kind=${targetKind} status=${docStatusEnum}`);
    return created;
  }

  /**
   * Assignments (Bookings) Management
   */
  async listAssignments(agencyId: string) {
    return this.prisma.agencyAssignment.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignStaffToAssignment(agencyId: string, assignmentId: string, dto: AssignStaffDto) {
    const assignment = await this.prisma.agencyAssignment.findFirst({
      where: { id: assignmentId, agencyId },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment "${assignmentId}" not found for this agency`);
    }

    const updated = await this.prisma.agencyAssignment.update({
      where: { id: assignmentId },
      data: {
        assignedStaffIds: dto.assignedStaffIds,
        status: dto.assignedStaffIds.length > 0 ? AssignmentStatus.ASSIGNED : AssignmentStatus.REQUESTED,
      },
    });

    // Update staff status to ASSIGNED if staff members were selected
    if (dto.assignedStaffIds.length > 0) {
      await this.prisma.agencyStaff.updateMany({
        where: {
          id: { in: dto.assignedStaffIds },
          agencyId,
        },
        data: {
          status: AgencyStaffStatus.ASSIGNED,
        },
      });
    }

    this.logger.log(`Assigned staff [${dto.assignedStaffIds.join(', ')}] to assignment id=${assignmentId}`);
    return updated;
  }

  /**
   * Payouts Management
   */
  async listPayouts(agencyId: string) {
    return this.prisma.agencyPayout.findMany({
      where: { agencyId },
      include: {
        assignments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * List all agencies for administrative management (with pagination, filters, and search)
   */
  async findAllAgencies(query: {
    status?: string;
    verification?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.verification) {
      where.verification = query.verification;
    }
    if (query.status) {
      where.listingStatus = query.status;
    }

    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { legalName: { contains: q, mode: 'insensitive' } },
        { registrationNumber: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.agency.count({ where }),
      this.prisma.agency.findMany({
        where,
        skip,
        take: limit,
        include: {
          documents: true,
          staff: true,
          offerings: true,
          _count: {
            select: {
              assignments: true,
              users: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update agency verification status (unverified, pending, verified, suspended)
   */
  async updateVerification(id: string, verification: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    if (!agency) {
      throw new NotFoundException(`Agency with ID "${id}" not found`);
    }

    const vUpper = verification.toUpperCase();
    const verificationEnum =
      vUpper === 'VERIFIED'
        ? AgencyVerificationStatus.VERIFIED
        : vUpper === 'PENDING'
          ? AgencyVerificationStatus.PENDING
          : vUpper === 'SUSPENDED' || vUpper === 'REJECTED'
            ? AgencyVerificationStatus.SUSPENDED
            : AgencyVerificationStatus.UNVERIFIED;

    const listingStatusEnum: AgencyListingStatus =
      verificationEnum === AgencyVerificationStatus.VERIFIED
        ? AgencyListingStatus.LIVE
        : verificationEnum === AgencyVerificationStatus.SUSPENDED
          ? AgencyListingStatus.REJECTED
          : agency.listingStatus;

    const updated = await this.prisma.agency.update({
      where: { id },
      data: {
        verification: verificationEnum,
        listingStatus: listingStatusEnum,
      },
      include: {
        documents: true,
        staff: true,
      },
    });

    this.logger.log(`Updated agency id=${id} verification=${verificationEnum} listingStatus=${listingStatusEnum}`);
    return updated;
  }
}

