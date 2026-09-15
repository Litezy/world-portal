import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { QueryProfessionalsDto } from './dto/query-professionals.dto';
import { CreateHireBookingDto } from './dto/create-hire-booking.dto';

@Injectable()
export class HireService {
  private readonly logger = new Logger(HireService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Query paginated professionals directory
   */
  async findProfessionals(dto: QueryProfessionalsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isVerified: true };
    if (dto.category) {
      where.category = dto.category;
    }

    const [data, total] = await Promise.all([
      this.prisma.professionalProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      this.prisma.professionalProfile.count({ where }),
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
   * Get single professional profile by ID or slug
   */
  async getProfessionalById(idOrSlug: string) {
    const pro = await this.prisma.professionalProfile.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        ratings: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!pro) {
      throw new NotFoundException(`Professional "${idOrSlug}" not found`);
    }

    return pro;
  }

  /**
   * Create a hire booking request for a professional tied to an applicant profile / email
   */
  async createBooking(dto: CreateHireBookingDto) {
    const reference = `HIRE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Resolve profileId if email matches an existing applicant Profile
    let resolvedProfileId = dto.profileId;
    const normalizedEmail = dto.travellerEmail
      ? dto.travellerEmail.toLowerCase().trim()
      : 'applicant@example.com';

    if (!resolvedProfileId && dto.travellerEmail) {
      const existingProfile = await this.prisma.profile.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingProfile) {
        resolvedProfileId = existingProfile.id;
      }
    }

    // Resolve professionalId & matched agency
    let resolvedProId = dto.professionalId;
    const cleanSlug = resolvedProId.toLowerCase().trim();
    const rawAgencyId = cleanSlug.replace(/^agency-/, '');

    const matchedAgency = await this.prisma.agency.findFirst({
      where: { OR: [{ id: rawAgencyId }, { slug: rawAgencyId }, { id: cleanSlug }] },
      include: { offerings: true },
    }).catch(() => null);

    const existingPro = await this.prisma.professionalProfile.findFirst({
      where: { OR: [{ id: resolvedProId }, { slug: resolvedProId }] },
    });

    if (existingPro) {
      resolvedProId = existingPro.id;
    } else if (typeof this.prisma.professionalProfile?.create === 'function') {
      let agencyName = '';
      let agencyBio = '';
      let avatarUrl: string | undefined = undefined;

      if (matchedAgency) {
        agencyName = matchedAgency.name;
        agencyBio = matchedAgency.about || matchedAgency.summary || `Verified agency listing for ${matchedAgency.name}.`;
        avatarUrl = matchedAgency.logoUrl || undefined;
      } else {
        agencyName = cleanSlug
          .replace(/^agency-/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        agencyBio = `Verified destination specialist available for booking in ${dto.destinationCity || 'destination city'}.`;
      }

      const category = cleanSlug.includes('driver')
        ? 'driver'
        : cleanSlug.includes('security')
          ? 'security'
          : cleanSlug.includes('guide')
            ? 'tour_guide'
            : cleanSlug.includes('interpreter')
              ? 'interpreter'
              : 'driver';

      try {
        const createdPro = await this.prisma.professionalProfile.create({
          data: {
            id: resolvedProId,
            slug: cleanSlug,
            name: agencyName,
            title: `${category.replace('_', ' ').toUpperCase()} Specialist`,
            category,
            bio: agencyBio,
            avatarUrl: avatarUrl || null,
            countryCode: matchedAgency?.countryCode || 'US',
            country: matchedAgency?.country || 'Destination Service',
            hourlyRate: 75.0,
            isVerified: true,
          },
        });
        resolvedProId = createdPro.id;
      } catch {
        try {
          const updatedPro = await this.prisma.professionalProfile.update({
            where: { id: resolvedProId },
            data: {
              name: agencyName,
              bio: agencyBio,
              avatarUrl: avatarUrl || null,
            },
          });
          resolvedProId = updatedPro.id;
        } catch {
          const fallbackPro = await this.prisma.professionalProfile.findFirst();
          if (fallbackPro) {
            resolvedProId = fallbackPro.id;
          }
        }
      }
    }

    const booking = await this.prisma.hireBooking.create({
      data: {
        reference,
        professionalId: resolvedProId,
        profileId: resolvedProfileId || null,
        visaDocumentationId: dto.visaDocumentationId || null,
        travellerName: dto.travellerName || 'Applicant',
        travellerEmail: normalizedEmail,
        travellerPhone: dto.travellerPhone || null,
        destinationCity: dto.destinationCity,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        totalAmount: dto.totalAmount,
        currency: dto.currency || 'USD',
        status: 'REQUESTED',
      },
    });

    if (matchedAgency) {
      const grossAmount = Number(dto.totalAmount) || 150;
      const commissionRate = matchedAgency.commissionRate ? Number(matchedAgency.commissionRate) : 0.15;
      const platformFee = grossAmount * commissionRate;
      const netToAgency = grossAmount - platformFee;

      try {
        await this.prisma.agencyAssignment.upsert({
          where: { reference },
          update: {},
          create: {
            reference,
            agencyId: matchedAgency.id,
            category: matchedAgency.categories?.[0] || 'freelancer',
            offeringId: matchedAgency.offerings?.[0]?.id || `offering-${matchedAgency.id}`,
            offeringTitle: matchedAgency.offerings?.[0]?.title || `${matchedAgency.name} Service Package`,
            travellerName: dto.travellerName || 'Applicant',
            travellerEmail: normalizedEmail,
            travellerPhone: dto.travellerPhone || null,
            partySize: 1,
            destinationCity: dto.destinationCity || matchedAgency.cities?.[0] || 'Destination City',
            destinationCountry: matchedAgency.country || 'Destination Country',
            destinationCountryCode: matchedAgency.countryCode || 'US',
            startsAt: new Date(dto.startsAt),
            endsAt: new Date(dto.endsAt),
            status: 'REQUESTED',
            assignedStaffIds: [],
            staffRequired: 1,
            notes: dto.notes || null,
            gross: grossAmount,
            currency: dto.currency || 'USD',
            platformFee,
            netToAgency,
          },
        });
        this.logger.log(`Created matching AgencyAssignment ref=${reference} agencyId=${matchedAgency.id}`);

        await this.notificationService.create({
          recipientId: matchedAgency.id,
          recipientType: 'AGENCY',
          title: 'New Booking Request',
          message: `New booking request #${reference} for ${dto.destinationCity || 'your service'}. Staff assignment required.`,
          type: 'BOOKING_REQUESTED',
          metadata: { reference, totalAmount: dto.totalAmount, currency: dto.currency || 'USD' },
        }).catch(() => null);
      } catch (err: any) {
        this.logger.warn(`Could not create matching AgencyAssignment ref=${reference}: ${err?.message || err}`);
      }
    }

    // Notify applicant that booking request has been submitted
    await this.notificationService.create({
      recipientId: normalizedEmail,
      recipientType: 'APPLICANT',
      title: 'Booking Placed',
      message: `Your booking request #${reference} has been placed. We have notified the agency to assign your specialist.`,
      type: 'BOOKING_REQUESTED',
      metadata: { reference, totalAmount: dto.totalAmount, currency: dto.currency || 'USD' },
    }).catch(() => null);

    this.logger.log(`Created hire booking ref=${reference} profileId=${resolvedProfileId ?? 'GUEST'} pro=${resolvedProId}`);
    return booking;
  }

  /**
   * Query all hire bookings for a specific applicant profile ID or email
   */
  async findBookingsByApplicant(profileIdOrEmail: string) {
    const identifier = profileIdOrEmail.toLowerCase().trim();

    const bookings = await this.prisma.hireBooking.findMany({
      where: {
        OR: [
          { profileId: identifier },
          { travellerEmail: identifier },
        ],
      },
      include: {
        professional: true,
        visaDocumentation: {
          select: {
            applicationNo: true,
            status: true,
            targetCountry: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const b of bookings) {
      if (b.professional && (b.professional.name.startsWith('Agency ') || b.professional.name.includes('-'))) {
        const rawAgencyId = b.professional.slug.replace(/^agency-/, '');
        const matchedAgency = await this.prisma.agency.findFirst({
          where: { OR: [{ id: rawAgencyId }, { slug: rawAgencyId }, { id: b.professional.slug }] },
        }).catch(() => null);

        if (matchedAgency) {
          b.professional.name = matchedAgency.name;
          b.professional.bio = matchedAgency.about || matchedAgency.summary || b.professional.bio;
          if (matchedAgency.logoUrl) {
            b.professional.avatarUrl = matchedAgency.logoUrl;
          }
          this.prisma.professionalProfile.update({
            where: { id: b.professional.id },
            data: {
              name: matchedAgency.name,
              bio: matchedAgency.about || matchedAgency.summary || b.professional.bio,
              avatarUrl: matchedAgency.logoUrl || null,
            },
          }).catch(() => null);
        }
      }

      // Check corresponding agency assignment to sync status and assigned staff
      const assignment = await this.prisma.agencyAssignment.findUnique({
        where: { reference: b.reference },
      }).catch(() => null);

      if (assignment) {
        const sUpper = (assignment.status || '').toUpperCase();
        if (sUpper === 'ASSIGNED' || (assignment.assignedStaffIds && assignment.assignedStaffIds.length > 0)) {
          b.status = 'CONFIRMED';
          this.prisma.hireBooking.update({
            where: { id: b.id },
            data: { status: 'CONFIRMED' },
          }).catch(() => null);
        } else if (sUpper === 'COMPLETED') {
          b.status = 'COMPLETED';
          this.prisma.hireBooking.update({
            where: { id: b.id },
            data: { status: 'COMPLETED' },
          }).catch(() => null);
        }

        if (assignment.assignedStaffIds && assignment.assignedStaffIds.length > 0) {
          const staffMembers = await this.prisma.agencyStaff.findMany({
            where: { id: { in: assignment.assignedStaffIds } },
            select: {
              id: true,
              name: true,
              role: true,
              category: true,
              photoUrl: true,
              phone: true,
              experienceYears: true,
            },
          }).catch(() => []);
          (b as any).assignedStaff = staffMembers;
        }
      }
    }

    return bookings;
  }

  /**
   * List all professionals for administrative management
   */
  async findAllProfessionalsAdmin(dto: QueryProfessionalsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.professionalProfile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.professionalProfile.count(),
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
   * Toggle professional verification status
   */
  async toggleVerification(id: string, isVerified?: boolean) {
    return this.prisma.professionalProfile.update({
      where: { id },
      data: { isVerified: isVerified ?? true },
    });
  }
}
