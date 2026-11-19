import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HireService } from './hire.service';
import { QueryProfessionalsDto } from './dto/query-professionals.dto';
import { CreateHireBookingDto } from './dto/create-hire-booking.dto';
import { UserRole } from '@prisma/client';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { ExternalAuthGuard } from '../auth/guards/external-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ServiceOrDeskGuard } from '../auth/guards/service-or-desk.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApplicantPrincipal,
  CurrentApplicant,
} from '../auth/decorators/current-applicant.decorator';
import { ApplicantService } from '../applicant/applicant.service';

/**
 * - **Directory reads** (`ServiceOrDeskGuard`): no signed-out page calls these.
 *   The public /hire listing is built by the website's server, which sends
 *   SERVICE_AUTH_KEY; desk staff (MANAGER, STAFF) get in with their own token.
 * - **Desk decisions** (`ExternalAuthGuard` + `RolesGuard`): verifying a
 *   professional, and the admin list that includes unverified ones. A desk
 *   token only; the service key does not unlock them.
 * - **Booking** (`ClerkAuthGuard`): the signed-in WorldStreet applicant.
 */
@ApiTags('Hire & Professionals')
@Controller('hire')
export class HireController {
  private readonly logger = new Logger(HireController.name);

  constructor(
    private readonly hireService: HireService,
    private readonly applicants: ApplicantService,
  ) {}

  @Get('professionals')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Browse verified professionals (website server or desk staff)',
  })
  async findProfessionals(@Query() query: QueryProfessionalsDto) {
    return this.hireService.findProfessionals(query);
  }

  @Get('professionals/admin')
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all professionals for admin management (desk staff only)',
  })
  async findAllProfessionalsAdmin(@Query() query: QueryProfessionalsDto) {
    return this.hireService.findAllProfessionalsAdmin(query);
  }

  @Get('professionals/:id')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get one professional by ID or slug (website server or desk staff)',
  })
  @ApiParam({ name: 'id', description: 'Professional ID or Slug' })
  async getProfessional(@Param('id') id: string) {
    return this.hireService.getProfessionalById(id);
  }

  @Patch('professionals/:id/verify')
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle professional verification status (desk staff only)',
  })
  @ApiParam({ name: 'id', description: 'Professional ID' })
  async toggleVerification(
    @Param('id') id: string,
    @Body('isVerified') isVerified?: boolean,
  ) {
    return this.hireService.toggleVerification(id, isVerified);
  }

  @Post('bookings')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Submit a hire booking request (signed-in WorldStreet applicant)',
  })
  @ApiResponse({
    status: 201,
    description: 'Hire booking created successfully',
  })
  @ApiResponse({ status: 401, description: 'No valid WorldStreet session.' })
  async createBooking(
    @Body() dto: CreateHireBookingDto,
    @CurrentApplicant() principal: ApplicantPrincipal,
  ) {
    const owner = await this.applicants.requireActiveApplicant(
      principal.clerkUserId,
    );
    this.logger.log(
      `POST /hire/bookings called for proId=${dto.professionalId} by clerkUserId=${owner.clerkUserId}`,
    );
    return this.hireService.createBooking(dto, owner);
  }
}
