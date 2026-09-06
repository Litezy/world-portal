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
import { VisaDocumentationService } from './visa-documentation.service';
import { CreateVisaDocumentationDto } from './dto/create-visa-documentation.dto';
import { EvaluateVisaCostDto } from './dto/evaluate-visa-cost.dto';
import { UpdateVisaStatusDto } from './dto/update-visa-status.dto';
import { QueryVisaDocumentationDto } from './dto/query-visa-documentation.dto';
import { InviteApplicantDto } from './dto/invite-applicant.dto';

import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExternalAuthGuard } from '../auth/guards/external-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Visa Documentation')
@Controller('visa-documentation')
export class VisaDocumentationController {
  private readonly logger = new Logger(VisaDocumentationController.name);

  constructor(
    private readonly visaDocumentationService: VisaDocumentationService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Submit a new visa application (Public Guest & Registered Applicants)',
    description:
      'Submits a traveler visa application with personal information, passport metadata, and uploaded S3 document URLs. Accessible by guest applicants, partners, and staff.',
  })
  @ApiResponse({
    status: 201,
    description: 'Visa application submitted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed for required fields or document URLs.',
  })
  async createVisaApplication(@Body() dto: CreateVisaDocumentationDto) {
    this.logger.log(
      `Public POST /visa-documentation called by email=${dto.email}`,
    );
    return this.visaDocumentationService.createVisaApplication(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF, UserRole.PARTNER)
  @ApiOperation({
    summary: 'List and search visa applications',
    description:
      'Search and list visa applications filtered by review status, payment status, visa category, or search term.',
  })
  @ApiResponse({ status: 200, description: 'List of visa applications.' })
  async findAll(@Query() query: QueryVisaDocumentationDto) {
    return this.visaDocumentationService.findAllVisaApplications(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get detailed visa application by ID or applicationNo',
  })
  @ApiParam({
    name: 'id',
    description:
      'Application ID or tracking applicationNo (e.g. VISA-2026-8941)',
  })
  @ApiResponse({ status: 200, description: 'Visa application details.' })
  @ApiResponse({ status: 404, description: 'Application record not found.' })
  async findOne(@Param('id') id: string, @Query('email') email?: string) {
    return this.visaDocumentationService.findVisaApplicationById(id, email);
  }

  @Post(':id/evaluate')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Admin evaluation and cost allocation',
    description:
      'Evaluates submitted visa application, sets total processing cost, enables optional 50% half installment, updates status to EVALUATED, and queues email notification to applicant.',
  })
  @ApiParam({ name: 'id', description: 'Visa application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application cost evaluated and email queued.',
  })
  async evaluateVisaCost(
    @Param('id') id: string,
    @Body() dto: EvaluateVisaCostDto,
    @CurrentUser() user: { email?: string } | undefined,
  ) {
    const evaluator =
      typeof user?.email === 'string' ? user.email : 'admin@worldportal.com';
    return this.visaDocumentationService.evaluateVisaCost(id, dto, evaluator);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Update application review status (APPROVED / REJECTED)',
    description:
      'Updates final review decision for a visa application in UNDER_REVIEW status.',
  })
  @ApiParam({ name: 'id', description: 'Visa application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application review status updated.',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVisaStatusDto,
    @CurrentUser() user: { email?: string } | undefined,
  ) {
    const reviewer =
      typeof user?.email === 'string' ? user.email : 'staff@worldportal.com';
    return this.visaDocumentationService.updateStatus(id, dto, reviewer);
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
  @ApiParam({ name: 'id', description: 'Visa application ID' })
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
    return this.visaDocumentationService.inviteApplicant(id, dto, inviter);
  }
}

