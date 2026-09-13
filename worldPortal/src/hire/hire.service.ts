import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProfessionalsDto } from './dto/query-professionals.dto';
import { CreateHireBookingDto } from './dto/create-hire-booking.dto';

@Injectable()
export class HireService {
  private readonly logger = new Logger(HireService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query paginated professionals list with category and country filters
   */
  async findProfessionals(dto: QueryProfessionalsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (dto.category) {
      where.category = dto.category;
    }
    if (dto.countryCode) {
      where.countryCode = dto.countryCode;
    }
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { title: { contains: dto.search, mode: 'insensitive' } },
        { bio: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.professionalProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      this.prisma.professionalProfile.count({ where }),
    ]);

    return {
      data: items,
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
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pro) {
      throw new NotFoundException(`Professional "${idOrSlug}" not found`);
    }

    return pro;
  }

  /**
   * Create a hire booking request for a professional
   */
  async createBooking(dto: CreateHireBookingDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { id: dto.professionalId },
    });

    if (!pro) {
      throw new NotFoundException(`Professional with ID "${dto.professionalId}" not found`);
    }

    const reference = `HIRE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const booking = await this.prisma.hireBooking.create({
      data: {
        reference,
        professionalId: dto.professionalId,
        travellerName: dto.travellerName,
        travellerEmail: dto.travellerEmail,
        travellerPhone: dto.travellerPhone,
        destinationCity: dto.destinationCity,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        totalAmount: dto.totalAmount,
        currency: dto.currency || 'USD',
      },
      include: {
        professional: true,
      },
    });

    this.logger.log(`Created hire booking ref=${booking.reference} for pro=${dto.professionalId}`);
    return booking;
  }

  /**
   * List all professionals for administrative management
   */
  async findAllProfessionalsAdmin(dto: QueryProfessionalsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (dto.category) {
      where.category = dto.category;
    }
    if (dto.countryCode) {
      where.countryCode = dto.countryCode;
    }
    if (dto.search) {
      const q = dto.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.professionalProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          bookings: true,
          _count: {
            select: {
              ratings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.professionalProfile.count({ where }),
    ]);

    return {
      data: items,
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
    const pro = await this.prisma.professionalProfile.findUnique({ where: { id } });
    if (!pro) {
      throw new NotFoundException(`Professional with ID "${id}" not found`);
    }

    const nextVerified = isVerified !== undefined ? isVerified : !pro.isVerified;

    const updated = await this.prisma.professionalProfile.update({
      where: { id },
      data: { isVerified: nextVerified },
    });

    this.logger.log(`Toggled professional id=${id} isVerified=${nextVerified}`);
    return updated;
  }
}
