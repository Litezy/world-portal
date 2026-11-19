import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializable } from '../prisma/serializable';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryProfileDto } from './dto/query-profile.dto';
import { SendGridService } from '../mail/sendgrid.service';
import { Profile, Prisma, UserRole } from '@prisma/client';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendGridService: SendGridService,
  ) {}

  private async resolveReviewerDisplayName(
    emailOrName: string,
  ): Promise<string> {
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
          this.logger.error(
            `SendGrid team invite email error: ${err instanceof Error ? err.message : String(err)}`,
          );
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

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
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

  /**
   * ADR 0016 — the console must never lock itself out. Refuses (409) when the
   * change would take a manager's own role or access away from themselves,
   * or leave no active manager at all.
   *
   * Runs in the same serializable transaction as the change it guards (see
   * `updateProfile` / `deactivateProfile`). Counted outside it, two managers
   * removing each other at the same moment both saw two managers and both
   * went through, leaving none.
   */
  private async assertTeamChangeAllowed(
    tx: Prisma.TransactionClient,
    target: Profile,
    change: { role?: Profile['role']; isActive?: boolean },
    actorEmail?: string,
  ) {
    const losesRole = change.role !== undefined && change.role !== target.role;
    const losesAccess = change.isActive === false && target.isActive;
    if (!losesRole && !losesAccess) return;

    if (actorEmail && actorEmail.toLowerCase() === target.email.toLowerCase()) {
      throw new ConflictException(
        "You can't change your own role or deactivate yourself. Ask another manager to do it.",
      );
    }

    const stopsBeingManager =
      target.role === UserRole.MANAGER &&
      target.isActive &&
      (losesAccess || (losesRole && change.role !== UserRole.MANAGER));
    if (stopsBeingManager) {
      const activeManagers = await tx.profile.count({
        where: { role: UserRole.MANAGER, isActive: true },
      });
      if (activeManagers <= 1) {
        throw new ConflictException(
          'This is the only active manager. Make someone else a manager first.',
        );
      }
    }
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
    actorEmail?: string,
  ): Promise<Profile> {
    this.logger.log(`Updating profile ID=${id}`);
    await this.findProfileById(id);

    const updated = await serializable(this.prisma, async (tx) => {
      const target = await tx.profile.findUniqueOrThrow({ where: { id } });
      await this.assertTeamChangeAllowed(tx, target, dto, actorEmail);

      if (dto.email) {
        const existing = await tx.profile.findUnique({
          where: { email: dto.email },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException(`Email ${dto.email} is already in use`);
        }
      }

      if (dto.externalAuthId) {
        const existingExt = await tx.profile.findUnique({
          where: { externalAuthId: dto.externalAuthId },
        });
        if (existingExt && existingExt.id !== id) {
          throw new ConflictException(
            `External Auth ID ${dto.externalAuthId} is already linked to another profile`,
          );
        }
      }

      return tx.profile.update({ where: { id }, data: dto });
    });

    this.logger.log(`Profile ID=${id} updated successfully`);
    return updated;
  }

  async deactivateProfile(id: string, actorEmail?: string): Promise<Profile> {
    this.logger.log(`Deactivating profile ID=${id}`);
    await this.findProfileById(id);

    const deactivated = await serializable(this.prisma, async (tx) => {
      const target = await tx.profile.findUniqueOrThrow({ where: { id } });
      await this.assertTeamChangeAllowed(
        tx,
        target,
        { isActive: false },
        actorEmail,
      );
      return tx.profile.update({ where: { id }, data: { isActive: false } });
    });

    this.logger.log(`Profile ID=${id} deactivated successfully`);
    return deactivated;
  }

  /** ADR 0016 — re-send the team invitation to an active member. */
  async resendInvite(
    id: string,
    inviterEmail: string,
  ): Promise<{ sent: boolean }> {
    const profile = await this.findProfileById(id);
    if (!profile.isActive) {
      throw new ConflictException(
        'This account is deactivated. Reactivate it before sending an invite.',
      );
    }

    const inviterName = await this.resolveReviewerDisplayName(inviterEmail);
    const sent = await this.sendGridService.sendTeamInviteEmail({
      to: profile.email,
      recipientName: `${profile.firstName} ${profile.lastName}`.trim(),
      role: profile.role,
      inviterEmail,
      inviterName,
    });

    this.logger.log(
      `Team invite re-sent for profile ID=${id} by inviter=${inviterEmail}, sent=${sent}`,
    );
    return { sent };
  }
}
