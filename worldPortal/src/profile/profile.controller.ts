import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryProfileDto } from './dto/query-profile.dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExternalAuthGuard } from '../auth/guards/external-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(ExternalAuthGuard, RolesGuard)
@Controller('profiles')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new user profile (Manager only)' })
  @ApiResponse({ status: 21, description: 'Profile created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 409,
    description: 'Email or External Auth ID conflict.',
  })
  async createProfile(@Body() dto: CreateProfileDto) {
    this.logger.log(`POST /profiles requested for email=${dto.email}`);
    return this.profileService.createProfile(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Retrieve currently logged in user profile' })
  @ApiResponse({ status: 200, description: 'Current profile retrieved.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async getMyProfile(
    @CurrentUser() user: { email?: string; externalAuthId?: string },
  ) {
    this.logger.log(
      `GET /profiles/me requested for email=${user?.email ?? 'N/A'}`,
    );
    const email = user?.email;
    const externalAuthId = user?.externalAuthId;

    const profile =
      (email ? await this.profileService.findProfileByEmail(email) : null) ||
      (externalAuthId
        ? await this.profileService.findProfileByExternalAuthId(externalAuthId)
        : null);

    if (!profile) {
      throw new NotFoundException('Current user profile not found');
    }

    return profile;
  }

  @Get()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'List and filter user profiles (Manager only)' })
  @ApiResponse({ status: 200, description: 'List of profiles.' })
  async findAll(@Query() query: QueryProfileDto) {
    this.logger.log(`GET /profiles requested`);
    return this.profileService.findAllProfiles(query);
  }

  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.STAFF, UserRole.PARTNER)
  @ApiOperation({ summary: 'Retrieve profile details by ID' })
  @ApiResponse({ status: 200, description: 'Profile details.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`GET /profiles/${id} requested`);
    return this.profileService.findProfileById(id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Update profile details (Manager only)' })
  @ApiResponse({ status: 200, description: 'Profile updated.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    this.logger.log(`PATCH /profiles/${id} requested`);
    return this.profileService.updateProfile(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Deactivate user profile (Manager only)' })
  @ApiResponse({ status: 200, description: 'Profile deactivated.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async deactivate(@Param('id') id: string) {
    this.logger.log(`DELETE /profiles/${id} requested`);
    return this.profileService.deactivateProfile(id);
  }
}
