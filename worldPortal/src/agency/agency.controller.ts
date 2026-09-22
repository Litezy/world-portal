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
import { AgencyService } from './agency.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyListingDto } from './dto/update-agency-listing.dto';
import { AddAgencyStaffDto, UpdateAgencyStaffDto } from './dto/add-agency-staff.dto';
import { UploadAgencyDocumentDto, UpdateDocumentStatusDto } from './dto/upload-agency-document.dto';
import { AssignStaffDto } from './dto/assign-staff.dto';

@ApiTags('Agency Portal')
@Controller('agency')
export class AgencyController {
  private readonly logger = new Logger(AgencyController.name);

  constructor(private readonly agencyService: AgencyService) { }

  @Post()
  @ApiOperation({ summary: 'Register a new agency listing' })
  @ApiResponse({ status: 201, description: 'Agency listing created successfully' })
  async createAgency(@Body() dto: CreateAgencyDto) {
    this.logger.log(`POST /agency called to create agency name=${dto.name}`);
    return this.agencyService.createAgency(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all agencies for admin management (with search & filters)' })
  async findAllAgencies(
    @Query('status') status?: string,
    @Query('verification') verification?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.agencyService.findAllAgencies({ status, verification, search, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency details by ID' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async getAgency(@Param('id') id: string) {
    return this.agencyService.getAgencyById(id);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Update agency verification status (admin action)' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async updateVerification(
    @Param('id') id: string,
    @Body('verification') verification: string,
  ) {
    return this.agencyService.updateVerification(id, verification);
  }

  @Get(':id/overview')
  @ApiOperation({ summary: 'Get headline overview metrics for agency dashboard' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async getOverview(@Param('id') id: string) {
    return this.agencyService.getOverview(id);
  }

  @Patch(':id/listing')
  @ApiOperation({ summary: 'Update agency profile and listing status' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async updateListing(
    @Param('id') id: string,
    @Body() dto: UpdateAgencyListingDto,
  ) {
    return this.agencyService.updateAgencyListing(id, dto);
  }

  @Get(':id/staff')
  @ApiOperation({ summary: 'List agency staff roster' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async listStaff(@Param('id') id: string) {
    return this.agencyService.listStaff(id);
  }

  @Post(':id/staff')
  @ApiOperation({ summary: 'Add a new staff member to the agency roster' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async addStaff(
    @Param('id') id: string,
    @Body() dto: AddAgencyStaffDto,
  ) {
    return this.agencyService.addStaff(id, dto);
  }

  @Patch(':id/staff/:staffId')
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
  @ApiOperation({ summary: 'List agency compliance documents' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async listDocuments(@Param('id') id: string) {
    return this.agencyService.listDocuments(id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload or update a compliance document' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async uploadDocument(
    @Param('id') id: string,
    @Body() dto: UploadAgencyDocumentDto,
  ) {
    return this.agencyService.uploadDocument(id, dto);
  }

  @Patch(':id/documents/:docId')
  @ApiOperation({ summary: 'Update compliance document verification status and note' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  @ApiParam({ name: 'docId', description: 'Document ID or Kind' })
  async updateDocumentStatus(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: UpdateDocumentStatusDto,
  ) {
    return this.agencyService.updateDocumentStatus(id, docId, dto.status, dto.note);
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'List booking assignments for an agency' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async listAssignments(@Param('id') id: string) {
    return this.agencyService.listAssignments(id);
  }

  @Post(':id/assignments/:assignmentId/assign')
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
  @ApiOperation({ summary: 'Mark booking assignment as completed' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment Reference ID' })
  async completeAssignment(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.agencyService.completeAssignment(id, assignmentId);
  }

  @Get(':id/payouts')
  @ApiOperation({ summary: 'List payout history and settlement batches' })
  @ApiParam({ name: 'id', description: 'Agency ID' })
  async listPayouts(@Param('id') id: string) {
    return this.agencyService.listPayouts(id);
  }
}
