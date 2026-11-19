import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  AgencyServiceOffering,
  AgencyVerificationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { QueryProfessionalsDto } from './dto/query-professionals.dto';
import { CreateHireBookingDto } from './dto/create-hire-booking.dto';
import { ApplicationOwner } from '../applicant/applicant.service';

/** How /hire names an agency it lists: `agency-<agency id or slug>`. */
const AGENCY_PREFIX = 'agency-';
const HOUR_MS = 3_600_000;

const round2 = (amount: number) => Math.round(amount * 100) / 100;

type AgencyWithOfferings = Prisma.AgencyGetPayload<{
  include: { offerings: true };
}>;

/** A professional the applicant may book, and the server's price for it. */
type Bookable = {
  professionalId: string;
  totalAmount: number;
  currency: string;
  /** Set when the booking is with an agency, which then gets an assignment. */
  agency: AgencyWithOfferings | null;
  offering: AgencyServiceOffering | null;
};

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

    const where: Prisma.ProfessionalProfileWhereInput = { isVerified: true };
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
   * Places a hire booking for `owner`, the signed-in WorldStreet applicant.
   *
   * Nothing that decides money or ownership is taken from the request:
   * - the professional must already exist and be verified; an unknown one is
   *   a 404, and none is ever made up from the request;
   * - the amount and currency are the professional's own price, so the
   *   request's `totalAmount` and `currency` are ignored;
   * - the booking is filed under `owner` and their verified email. A request
   *   `profileId` is ignored, and a visa application is attached only if it is
   *   the applicant's own (404 otherwise).
   */
  async createBooking(dto: CreateHireBookingDto, owner: ApplicationOwner) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime()) ||
      endsAt <= startsAt
    ) {
      throw new BadRequestException(
        'A booking needs a start and an end, and must end after it starts.',
      );
    }

    const bookable = await this.resolveBookable(
      dto.professionalId,
      startsAt,
      endsAt,
    );
    const visaDocumentationId = dto.visaDocumentationId
      ? await this.ownVisaApplication(dto.visaDocumentationId, owner)
      : null;

    const { professionalId, totalAmount, currency, agency, offering } =
      bookable;
    const reference = `HIRE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const normalizedEmail = owner.email.toLowerCase().trim();

    // A desk Profile with the applicant's verified email, if one exists.
    const existingProfile = await this.prisma.profile.findUnique({
      where: { email: normalizedEmail },
    });
    const resolvedProfileId = existingProfile?.id ?? null;

    const booking = await this.prisma.hireBooking.create({
      data: {
        reference,
        professionalId,
        profileId: resolvedProfileId,
        clerkUserId: owner.clerkUserId,
        visaDocumentationId,
        travellerName: dto.travellerName || 'Applicant',
        travellerEmail: normalizedEmail,
        travellerPhone: dto.travellerPhone || null,
        destinationCity: dto.destinationCity,
        startsAt,
        endsAt,
        totalAmount,
        currency,
        status: 'REQUESTED',
      },
    });

    if (agency && offering) {
      const grossAmount = totalAmount;
      const commissionRate = agency.commissionRate
        ? Number(agency.commissionRate)
        : 0.15;
      // In cents, so the fee and the agency's share always add up to the gross.
      const platformFee = round2(grossAmount * commissionRate);
      const netToAgency = round2(grossAmount - platformFee);
      const matchedAgency = agency;

      try {
        await this.prisma.agencyAssignment.upsert({
          where: { reference },
          update: {},
          create: {
            reference,
            agencyId: matchedAgency.id,
            category: matchedAgency.categories?.[0] || 'freelancer',
            offeringId: offering.id,
            offeringTitle: offering.title,
            travellerName: dto.travellerName || 'Applicant',
            travellerEmail: normalizedEmail,
            travellerPhone: dto.travellerPhone || null,
            partySize: 1,
            destinationCity:
              dto.destinationCity ||
              matchedAgency.cities?.[0] ||
              'Destination City',
            destinationCountry: matchedAgency.country || 'Destination Country',
            destinationCountryCode: matchedAgency.countryCode || 'US',
            startsAt,
            endsAt,
            status: 'REQUESTED',
            assignedStaffIds: [],
            staffRequired: 1,
            notes: dto.notes || null,
            gross: grossAmount,
            currency,
            platformFee,
            netToAgency,
          },
        });
        this.logger.log(
          `Created matching AgencyAssignment ref=${reference} agencyId=${matchedAgency.id}`,
        );

        await this.notificationService
          .create({
            recipientId: matchedAgency.id,
            recipientType: 'AGENCY',
            title: 'New Booking Request',
            message: `New booking request #${reference} for ${dto.destinationCity || 'your service'}. Staff assignment required.`,
            type: 'BOOKING_REQUESTED',
            metadata: { reference, totalAmount, currency },
          })
          .catch(() => null);
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Could not create matching AgencyAssignment ref=${reference}: ${reason}`,
        );
      }
    }

    // Notify applicant that booking request has been submitted
    await this.notificationService
      .create({
        recipientId: normalizedEmail,
        recipientType: 'APPLICANT',
        title: 'Booking Placed',
        message: `Your booking request #${reference} has been placed. We have notified the agency to assign your specialist.`,
        type: 'BOOKING_REQUESTED',
        metadata: { reference, totalAmount, currency },
      })
      .catch(() => null);

    this.logger.log(
      `Created hire booking ref=${reference} clerkUserId=${owner.clerkUserId} pro=${professionalId} total=${currency} ${totalAmount}`,
    );
    return booking;
  }

  /**
   * What `professionalId` names, and what booking it costs.
   *
   * - `agency-<id or slug>`: an agency listed on /hire. The desk must have
   *   verified it. It costs its first offering's price, the price /hire shows,
   *   and an offering priced on request can't be booked online.
   * - otherwise a professional's id or slug. It must be verified, and costs its
   *   hourly rate for the hours booked (at least one).
   */
  private async resolveBookable(
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Bookable> {
    const key = professionalId.trim();
    const notFound = () =>
      new NotFoundException(
        `No bookable professional matches "${professionalId}".`,
      );

    if (key.startsWith(AGENCY_PREFIX)) {
      const agencyKey = key.slice(AGENCY_PREFIX.length);
      const agency = await this.prisma.agency.findFirst({
        where: { OR: [{ id: agencyKey }, { slug: agencyKey }] },
        include: { offerings: true },
      });
      if (
        !agency ||
        agency.verification !== AgencyVerificationStatus.VERIFIED
      ) {
        throw notFound();
      }

      const offering = agency.offerings[0];
      const price =
        offering && offering.price !== null ? Number(offering.price) : NaN;
      if (!offering || !(price > 0)) {
        throw new BadRequestException(
          `${agency.name} prices its services on request, so it can't be booked online yet.`,
        );
      }
      const currency = offering.currency || 'USD';
      const profile = await this.agencyBookingProfile(agency, price, currency);
      return {
        professionalId: profile.id,
        totalAmount: round2(price),
        currency,
        agency,
        offering,
      };
    }

    const pro = await this.prisma.professionalProfile.findFirst({
      where: { OR: [{ id: key }, { slug: key }] },
    });
    if (!pro || !pro.isVerified) throw notFound();

    const hours = Math.max(
      1,
      Math.ceil((endsAt.getTime() - startsAt.getTime()) / HOUR_MS),
    );
    return {
      professionalId: pro.id,
      totalAmount: round2(Number(pro.hourlyRate) * hours),
      currency: pro.currency || 'USD',
      agency: null,
      offering: null,
    };
  }

  /**
   * A HireBooking belongs to a ProfessionalProfile, so an agency is booked
   * through a profile of its own, `agency-<agency id>`. It is written once,
   * from the agency's own record and nothing in the request, and only for an
   * agency the desk has verified (`resolveBookable` checks).
   */
  private agencyBookingProfile(
    agency: AgencyWithOfferings,
    price: number,
    currency: string,
  ) {
    const id = `${AGENCY_PREFIX}${agency.id}`;
    return this.prisma.professionalProfile.upsert({
      where: { id },
      update: {},
      create: {
        id,
        slug: id,
        name: agency.name,
        title: agency.summary || agency.name,
        category: agency.categories?.[0] || 'freelancer',
        bio:
          agency.about ||
          agency.summary ||
          `Verified agency listing for ${agency.name}.`,
        avatarUrl: agency.logoUrl || null,
        countryCode: agency.countryCode,
        country: agency.country,
        hourlyRate: price,
        currency,
        languages: agency.languages ?? [],
        isVerified: true,
      },
    });
  }

  /** The applicant's own visa application, or a 404: never somebody else's. */
  private async ownVisaApplication(
    id: string,
    owner: ApplicationOwner,
  ): Promise<string> {
    const visa = await this.prisma.visaDocumentation.findFirst({
      where: { id, clerkUserId: owner.clerkUserId },
      select: { id: true },
    });
    if (!visa) {
      throw new NotFoundException(
        'None of your visa applications matches that id.',
      );
    }
    return visa.id;
  }

  /**
   * Query all hire bookings for a specific applicant profile ID or email
   */
  /** Every hire booking owned by one WorldStreet user, newest first. */
  async findBookingsByClerkUser(clerkUserId: string) {
    if (!clerkUserId) return [];

    const bookings = await this.prisma.hireBooking.findMany({
      where: { clerkUserId },
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
      if (
        b.professional &&
        (b.professional.name.startsWith('Agency ') ||
          b.professional.name.includes('-'))
      ) {
        const rawAgencyId = b.professional.slug.replace(/^agency-/, '');
        const matchedAgency = await this.prisma.agency
          .findFirst({
            where: {
              OR: [
                { id: rawAgencyId },
                { slug: rawAgencyId },
                { id: b.professional.slug },
              ],
            },
          })
          .catch(() => null);

        if (matchedAgency) {
          b.professional.name = matchedAgency.name;
          b.professional.bio =
            matchedAgency.about || matchedAgency.summary || b.professional.bio;
          if (matchedAgency.logoUrl) {
            b.professional.avatarUrl = matchedAgency.logoUrl;
          }
          this.prisma.professionalProfile
            .update({
              where: { id: b.professional.id },
              data: {
                name: matchedAgency.name,
                bio:
                  matchedAgency.about ||
                  matchedAgency.summary ||
                  b.professional.bio,
                avatarUrl: matchedAgency.logoUrl || null,
              },
            })
            .catch(() => null);
        }
      }

      // Check corresponding agency assignment to sync status and assigned staff
      const assignment = await this.prisma.agencyAssignment
        .findUnique({
          where: { reference: b.reference },
        })
        .catch(() => null);

      let matchedAgencyInfo: object | null = null;
      /** What the applicant's bookings page reads on top of the row. */
      const enriched = b as typeof b & {
        assignedStaff?: object[];
        agency?: object;
      };

      if (assignment) {
        const sUpper = (assignment.status || '').toUpperCase();
        if (
          sUpper === 'ASSIGNED' ||
          (assignment.assignedStaffIds &&
            assignment.assignedStaffIds.length > 0)
        ) {
          b.status = 'CONFIRMED';
          this.prisma.hireBooking
            .update({
              where: { id: b.id },
              data: { status: 'CONFIRMED' },
            })
            .catch(() => null);
        } else if (sUpper === 'COMPLETED') {
          b.status = 'COMPLETED';
          this.prisma.hireBooking
            .update({
              where: { id: b.id },
              data: { status: 'COMPLETED' },
            })
            .catch(() => null);
        }

        if (
          assignment.assignedStaffIds &&
          assignment.assignedStaffIds.length > 0
        ) {
          const staffMembers = await this.prisma.agencyStaff
            .findMany({
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
            })
            .catch(() => []);
          enriched.assignedStaff = staffMembers;
        }

        if (assignment.agencyId) {
          matchedAgencyInfo = await this.prisma.agency
            .findUnique({
              where: { id: assignment.agencyId },
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                website: true,
                logoUrl: true,
                country: true,
                cities: true,
              },
            })
            .catch(() => null);
        }
      }

      if (!matchedAgencyInfo && b.professional) {
        const rawAgencyId = b.professional.slug.replace(/^agency-/, '');
        matchedAgencyInfo = await this.prisma.agency
          .findFirst({
            where: {
              OR: [
                { id: rawAgencyId },
                { slug: rawAgencyId },
                { id: b.professional.slug },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              website: true,
              logoUrl: true,
              country: true,
              cities: true,
            },
          })
          .catch(() => null);
      }

      if (matchedAgencyInfo) {
        enriched.agency = matchedAgencyInfo;
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
