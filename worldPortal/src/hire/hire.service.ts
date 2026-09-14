import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { QueryProfessionalsDto } from './dto/query-professionals.dto';
import { CreateHireBookingDto } from './dto/create-hire-booking.dto';

@Injectable()
export class HireService {
  private readonly logger = new Logger(HireService.name);

  /**
   * Query paginated professionals list (Delegated to Agency Directory)
   */
  async findProfessionals(dto: QueryProfessionalsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        pages: 0,
      },
    };
  }

  /**
   * Get single professional profile by ID or slug
   */
  async getProfessionalById(idOrSlug: string) {
    throw new NotFoundException(`Professional "${idOrSlug}" not found`);
  }

  /**
   * Create a hire booking request for a professional
   */
  async createBooking(dto: CreateHireBookingDto) {
    const reference = `HIRE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.logger.log(`Created hire booking ref=${reference} for pro=${dto.professionalId}`);
    return {
      id: reference,
      reference,
      status: 'REQUESTED',
      totalAmount: dto.totalAmount,
      currency: dto.currency || 'USD',
    };
  }

  /**
   * List all professionals for administrative management
   */
  async findAllProfessionalsAdmin(dto: QueryProfessionalsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        pages: 0,
      },
    };
  }

  /**
   * Toggle professional verification status
   */
  async toggleVerification(id: string, isVerified?: boolean) {
    return {
      id,
      isVerified: isVerified ?? true,
    };
  }
}
