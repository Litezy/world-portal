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
import { UserRole } from '@prisma/client';
import { AgencyService } from './agency.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyListingDto } from './dto/update-agency-listing.dto';
import {
  AddAgencyStaffDto,
  UpdateAgencyStaffDto,
} from './dto/add-agency-staff.dto';
import {
  UploadAgencyDocumentDto,
  UpdateDocumentStatusDto,
} from './dto/upload-agency-document.dto';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { ExternalAuthGuard } from '../auth/guards/external-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ServiceOrDeskGuard } from '../auth/guards/service-or-desk.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Two kinds of caller, and every route names which one it takes:
 *
 * - **Agency portal routes** (`ServiceOrDeskGuard`): the website's server,
 *   which signs agencies in itself and scopes every call to the signed-in
 *   agency, sends SERVICE_AUTH_KEY. Desk staff reading from the admin console
 *   get in with their own token, as MANAGER or STAFF (the roles the console's
 *   Agencies screen allows; partners are outside businesses).
 * - **Desk decisions** (`ExternalAuthGuard` + `RolesGuard`): verifying an
 *   agency or ruling on one of its documents. A desk token only; the service
 *   key is the portal's credential and must not let an agency approve itself.
 */
@ApiTags('Agency Portal')
@Controller('agency')
export class AgencyController {
  private readonly logger = new Logger(AgencyController.name);

  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register a new agency listing (agency portal server)',
  })
  @ApiResponse({
    status: 201,
    description: 'Agency listing created successfully',
  })
  async createAgency(@Body() dto: CreateAgencyDto) {
    this.logger.log(`POST /agency called to create agency name=${dto.name}`);
    return this.agencyService.createAgency(dto);
  }

  @Get()
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all agencies (desk staff, or the website server)',
  })
  async findAllAgencies(
    @Query('status') status?: string,
    @Query('verification') verification?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.agencyService.findAllAgencies({
      status,
      verification,
      search,
      page,
      limit,
    });
  }

  @Get(':id')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get agency details by ID' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async getAgency(@Param('id') id: string) {
    return this.agencyService.getAgencyById(id);
  }

  @Patch(':id/verify')
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update agency verification status (desk staff only)',
  })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async updateVerification(
    @Param('id') id: string,
    @Body('verification') verification: string,
  ) {
    return this.agencyService.updateVerification(id, verification);
  }

  @Get(':id/overview')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get headline overview metrics for agency dashboard',
  })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async getOverview(@Param('id') id: string) {
    return this.agencyService.getOverview(id);
  }

  @Patch(':id/listing')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update agency profile and listing status' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async updateListing(
    @Param('id') id: string,
    @Body() dto: UpdateAgencyListingDto,
  ) {
    return this.agencyService.updateAgencyListing(id, dto);
  }

  @Get(':id/staff')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List agency staff roster' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async listStaff(@Param('id') id: string) {
    return this.agencyService.listStaff(id);
  }

  @Post(':id/staff')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new staff member to the agency roster' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async addStaff(@Param('id') id: string, @Body() dto: AddAgencyStaffDto) {
    return this.agencyService.addStaff(id, dto);
  }

  @Patch(':id/staff/:staffId')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff member details' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  @ApiParam({ name: 'staffId', description: 'Staff Member ID' })
  async updateStaff(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
    @Body() dto: UpdateAgencyStaffDto,
  ) {
    return this.agencyService.updateStaff(id, staffId, dto);
  }

  @Get(':id/documents')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List agency compliance documents' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async listDocuments(@Param('id') id: string) {
    return this.agencyService.listDocuments(id);
  }

  @Post(':id/documents')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload or update a compliance document' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async uploadDocument(
    @Param('id') id: string,
    @Body() dto: UploadAgencyDocumentDto,
  ) {
    return this.agencyService.uploadDocument(id, dto);
  }

  @Patch(':id/documents/:docId')
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve or reject a compliance document (desk staff only)',
  })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  @ApiParam({ name: 'docId', description: 'Document ID or Kind' })
  async updateDocumentStatus(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: UpdateDocumentStatusDto,
  ) {
    return this.agencyService.updateDocumentStatus(
      id,
      docId,
      dto.status,
      dto.note,
    );
  }

  @Get(':id/assignments')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List booking assignments for an agency' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async listAssignments(@Param('id') id: string) {
    return this.agencyService.listAssignments(id);
  }

  @Post(':id/assignments/:assignmentId/assign')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign staff members to a booking assignment' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment Reference ID' })
  async assignStaff(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: AssignStaffDto,
  ) {
    return this.agencyService.assignStaffToAssignment(id, assignmentId, dto);
  }

  @Post(':id/assignments/:assignmentId/complete')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark booking assignment as completed' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment Reference ID' })
  @ApiResponse({
    status: 409,
    description:
      'Only an ASSIGNED or IN_PROGRESS job can be completed (or another request completed it at the same moment).',
  })
  async completeAssignment(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.agencyService.completeAssignment(id, assignmentId);
  }

  @Get(':id/payouts')
  @UseGuards(ServiceOrDeskGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payout history and settlement batches' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async listPayouts(@Param('id') id: string) {
    return this.agencyService.listPayouts(id);
  }
}
