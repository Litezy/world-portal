import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { HireService } from './hire.service';
import { QueryProfessionalsDto } from './dto/query-professionals.dto';
import { CreateHireBookingDto } from './dto/create-hire-booking.dto';

@ApiTags('Hire & Professionals')
@Controller('hire')
export class HireController {
  private readonly logger = new Logger(HireController.name);

  constructor(private readonly hireService: HireService) {}

  @Get('professionals')
  @ApiOperation({ summary: 'Browse professionals directory with filtering' })
  async findProfessionals(@Query() query: QueryProfessionalsDto) {
    return this.hireService.findProfessionals(query);
  }

  @Get('professionals/admin')
  @ApiOperation({ summary: 'List all professionals for admin management' })
  async findAllProfessionalsAdmin(@Query() query: QueryProfessionalsDto) {
    return this.hireService.findAllProfessionalsAdmin(query);
  }

  @Get('professionals/:id')
  @ApiOperation({ summary: 'Get single professional profile by ID or slug' })
  @ApiParam({ name: 'id', description: 'Professional ID or Slug' })
  async getProfessional(@Param('id') id: string) {
    return this.hireService.getProfessionalById(id);
  }

  @Patch('professionals/:id/verify')
  @ApiOperation({ summary: 'Toggle professional verification status' })
  @ApiParam({ name: 'id', description: 'Professional ID' })
  async toggleVerification(
    @Param('id') id: string,
    @Body('isVerified') isVerified?: boolean,
  ) {
    return this.hireService.toggleVerification(id, isVerified);
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Submit a hire booking request' })
  @ApiResponse({ status: 201, description: 'Hire booking created successfully' })
  async createBooking(@Body() dto: CreateHireBookingDto) {
    this.logger.log(`POST /hire/bookings called for proId=${dto.professionalId}`);
    return this.hireService.createBooking(dto);
  }
}
