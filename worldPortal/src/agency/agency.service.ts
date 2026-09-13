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
import { AgencyDocumentKind, AgencyDocumentStatus, AgencyStaffStatus, AssignmentStatus, AgencyPayoutStatus } from '@prisma/client';

@Injectable()
export class AgencyService {
  private readonly logger = new Logger(AgencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Create slug from agency name */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Register a new agency listing
   */
  async createAgency(dto: CreateAgencyDto) {
    let slug = this.slugify(dto.name);
    const existingSlug = await this.prisma.agency.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

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
      },
      include: {
        documents: true,
        staff: true,
        offerings: true,
      },
    });

    this.logger.log(`Created new agency id=${agency.id} slug=${agency.slug}`);
    return agency;
  }

  /**
   * Get agency details by ID
   */
  async getAgencyById(id: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
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

    if (!agency) {
      throw new NotFoundException(`Agency with ID "${id}" not found`);
    }

    return agency;
  }

  /**
   * Update agency listing / profile
   */
  async updateAgencyListing(id: string, dto: UpdateAgencyListingDto) {
    await this.getAgencyById(id);

    const updated = await this.prisma.agency.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.legalName && { legalName: dto.legalName }),
        ...(dto.summary && { summary: dto.summary }),
        ...(dto.about && { about: dto.about }),
        ...(dto.logoUrl && { logoUrl: dto.logoUrl }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.website && { website: dto.website }),
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

    this.logger.log(`Updated agency listing id=${id}`);
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
}
