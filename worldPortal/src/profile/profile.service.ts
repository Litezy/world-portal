import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryProfileDto } from './dto/query-profile.dto';
import { SendGridService } from '../mail/sendgrid.service';
import { Profile, Prisma } from '@prisma/client';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendGridService: SendGridService,
  ) {}

  private async resolveReviewerDisplayName(emailOrName: string): Promise<string> {
    if (!emailOrName) return 'Admin Consultant';
    if (!emailOrName.includes('@')) return emailOrName;

    const profile = await this.prisma.profile
      .findUnique({ where: { email: emailOrName } })
      .catch(() => null);

    if (profile && (profile.firstName || profile.lastName)) {
      return `${profile.firstName} ${profile.lastName}`.trim();
    }

    const handle = emailOrName.split('@')[0];
    const parts = handle.split(/[._\-+]/).filter(Boolean);
    if (parts.length === 0) return 'Admin Consultant';
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }

  async createProfile(
    dto: CreateProfileDto,
    inviterEmail = 'manager@yopmail.com',
  ): Promise<Profile> {
    this.logger.log(
      `Creating profile for email=${dto.email}, role=${dto.role}, externalAuthId=${dto.externalAuthId ?? 'N/A'} by inviter=${inviterEmail}`,
    );

    const existingEmail = await this.prisma.profile.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      this.logger.warn(
        `Profile creation conflict for existing email=${dto.email}`,
      );
      throw new ConflictException(
        `Profile with email ${dto.email} already exists`,
      );
    }

    if (dto.externalAuthId) {
      const existingExtId = await this.prisma.profile.findUnique({
        where: { externalAuthId: dto.externalAuthId },
      });

      if (existingExtId) {
        this.logger.warn(
          `Profile creation conflict for existing externalAuthId=${dto.externalAuthId}`,
        );
        throw new ConflictException(
          `Profile with externalAuthId ${dto.externalAuthId} already exists`,
        );
      }
    }

    const profile = await this.prisma.profile.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        externalAuthId: dto.externalAuthId,
        isActive: true,
      },
    });

    // Send team invitation email via SendGrid for admin console roles
    if (['MANAGER', 'STAFF', 'PARTNER'].includes(profile.role)) {
      const inviterName = await this.resolveReviewerDisplayName(inviterEmail);
      this.sendGridService
        .sendTeamInviteEmail({
          to: profile.email,
          recipientName: `${profile.firstName} ${profile.lastName}`.trim(),
          role: profile.role,
          inviterEmail,
          inviterName,
        })
        .catch((err) => {
          this.logger.error(`SendGrid team invite email error: ${err?.message}`);
        });
    }

    this.logger.log(`Profile created successfully with ID=${profile.id}`);
    return profile;
  }


  async findAllProfiles(query?: QueryProfileDto): Promise<Profile[]> {
    this.logger.log(
      `Fetching all profiles with filter=${JSON.stringify(query ?? {})}`,
    );
    const where: Prisma.ProfileWhereInput = {};

    if (query?.role) {
      where.role = query.role;
    }

    if (query?.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.profile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProfileById(id: string): Promise<Profile> {
    this.logger.log(`Fetching profile by ID=${id}`);
    const profile = await this.prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      this.logger.warn(`Profile not found for ID=${id}`);
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    return profile;
  }

  async findProfileByEmail(email: string): Promise<Profile | null> {
    this.logger.log(`Fetching profile by email=${email}`);
    return this.prisma.profile.findUnique({
      where: { email },
    });
  }

  async findProfileByExternalAuthId(
    externalAuthId: string,
  ): Promise<Profile | null> {
    this.logger.log(`Fetching profile by externalAuthId=${externalAuthId}`);
    return this.prisma.profile.findUnique({
      where: { externalAuthId },
    });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<Profile> {
    this.logger.log(`Updating profile ID=${id}`);
    await this.findProfileById(id);

    if (dto.email) {
      const existing = await this.prisma.profile.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Email ${dto.email} is already in use`);
      }
    }

    if (dto.externalAuthId) {
      const existingExt = await this.prisma.profile.findUnique({
        where: { externalAuthId: dto.externalAuthId },
      });
      if (existingExt && existingExt.id !== id) {
        throw new ConflictException(
          `External Auth ID ${dto.externalAuthId} is already linked to another profile`,
        );
      }
    }

    const updated = await this.prisma.profile.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Profile ID=${id} updated successfully`);
    return updated;
  }

  async deactivateProfile(id: string): Promise<Profile> {
    this.logger.log(`Deactivating profile ID=${id}`);
    await this.findProfileById(id);

    const deactivated = await this.prisma.profile.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Profile ID=${id} deactivated successfully`);
    return deactivated;
  }
}
