import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PassportApplicationService } from './passport-application.service';
import { CreatePassportApplicationDto } from './dto/create-passport-application.dto';
import { UpdatePassportStatusDto } from './dto/update-passport-status.dto';
import { QueryPassportApplicationDto } from './dto/query-passport-application.dto';
import { InviteApplicantDto } from '../visa-documentation/dto/invite-applicant.dto';
import { EvaluateVisaCostDto } from '../visa-documentation/dto/evaluate-visa-cost.dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExternalAuthGuard } from '../auth/guards/external-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Passport Application')
@Controller('passport-application')
export class PassportApplicationController {
  private readonly logger = new Logger(PassportApplicationController.name);

  constructor(
    private readonly passportApplicationService: PassportApplicationService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Submit a new passport application (Public Guest & Registered Applicants)',
    description:
      'Submits a Nigeria Immigration Service e-Passport data form application with personal information, next of kin details, and uploaded document URLs (birth certificate, NIN, white background passport photo). Accessible by guest applicants, partners, and staff.',
  })
  @ApiResponse({
    status: 201,
    description: 'Passport application submitted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed for required fields or document URLs.',
  })
  async createApplication(@Body() dto: CreatePassportApplicationDto) {
    this.logger.log(
      `Public POST /passport-application called by email=${dto.email}`,
    );
    return this.passportApplicationService.createApplication(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF, UserRole.PARTNER)
  @ApiOperation({
    summary: 'List and search passport applications',
    description:
      'Search and list passport applications filtered by review status, passport category, or search term.',
  })
  @ApiResponse({ status: 200, description: 'List of passport applications.' })
  async findAll(@Query() query: QueryPassportApplicationDto) {
    return this.passportApplicationService.findAllApplications(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get detailed passport application by ID or applicationNo',
  })
  @ApiParam({
    name: 'id',
    description:
      'Application ID or tracking applicationNo (e.g. PASSPORT-2026-8941)',
  })
  @ApiResponse({ status: 200, description: 'Passport application details.' })
  @ApiResponse({ status: 404, description: 'Application record not found.' })
  async findOne(@Param('id') id: string, @Query('email') email?: string) {
    return this.passportApplicationService.findApplicationById(id, email);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Update application review status (APPROVED / REJECTED)',
    description:
      'Updates the final review decision for a passport application.',
  })
  @ApiParam({ name: 'id', description: 'Passport application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application review status updated.',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePassportStatusDto,
    @CurrentUser() user: { email?: string } | undefined,
  ) {
    const reviewer =
      typeof user?.email === 'string' ? user.email : 'staff@worldportal.com';
    return this.passportApplicationService.updateStatus(id, dto, reviewer);
  }

  @Patch(':id/evaluate')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Evaluate processing fees for a passport application',
    description:
      'Sets total processing cost, currency, installment allowance, and updates status to EVALUATED with paymentStatus AWAITING_PAYMENT.',
  })
  @ApiParam({ name: 'id', description: 'Passport application ID' })
  @ApiResponse({
    status: 200,
    description: 'Passport application cost evaluated successfully.',
  })
  async evaluateCost(
    @Param('id') id: string,
    @Body() dto: EvaluateVisaCostDto,
    @CurrentUser() user: { email?: string } | undefined,
  ) {
    const evaluator =
      typeof user?.email === 'string' ? user.email : 'staff@worldportal.com';
    return this.passportApplicationService.evaluateCost(id, dto, evaluator);
  }

  @Post(':id/invite')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Invite applicant for appointment / biometrics / interview',
    description:
      'Dispatches an appointment invitation email to applicant with purpose, date, time, location, and optional instructions. Requires UNDER_REVIEW status or later.',
  })
  @ApiParam({ name: 'id', description: 'Passport application ID' })
  @ApiResponse({
    status: 200,
    description: 'Applicant invitation email dispatched and notes updated.',
  })
  async inviteApplicant(
    @Param('id') id: string,
    @Body() dto: InviteApplicantDto,
    @CurrentUser() user: { email?: string } | undefined,
  ) {
    const inviter =
      typeof user?.email === 'string' ? user.email : 'admin@worldportal.com';
    return this.passportApplicationService.inviteApplicant(id, dto, inviter);
  }
}
