import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import {
  ApplicantPrincipal,
  CurrentApplicant,
} from '../auth/decorators/current-applicant.decorator';
import { ClerkIdentityService } from '../auth/clerk/clerk-identity.service';
import { NotificationService } from './notification.service';

/**
 * The signed-in applicant's own inbox.
 *
 * Applicant notifications are filed under their email (the one on the
 * booking), so the recipient here is the email WorldStreet holds for the
 * session's user, and only once WorldStreet has verified it. Nothing the
 * caller sends can name another inbox. An unverified email reads as an empty
 * inbox: anyone can type someone else's address into a new account.
 */
@ApiTags('Me (WorldStreet applicant)')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'No valid WorldStreet session.' })
@UseGuards(ClerkAuthGuard)
@Controller('me/notifications')
export class MeNotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly identities: ClerkIdentityService,
  ) {}

  @Get()
  @ApiOperation({ summary: "The caller's notifications and unread count" })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @CurrentApplicant() principal: ApplicantPrincipal,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    const recipient = await this.recipientFor(principal);
    if (!recipient) return { data: [], unreadCount: 0 };
    return this.notificationService.findForRecipient(recipient, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch('read-all')
  @ApiOperation({ summary: "Mark all of the caller's notifications as read" })
  async markAllAsRead(@CurrentApplicant() principal: ApplicantPrincipal) {
    const recipient = await this.recipientFor(principal);
    if (!recipient) return { count: 0 };
    return this.notificationService.markAllAsRead(recipient);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: "Mark one of the caller's notifications as read" })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 404, description: 'Not one of your notifications.' })
  async markAsRead(
    @CurrentApplicant() principal: ApplicantPrincipal,
    @Param('id') id: string,
  ) {
    const recipient = await this.recipientFor(principal);
    if (!recipient) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }
    return this.notificationService.markAsRead(id, recipient);
  }

  /** The verified email for this WorldStreet user, or null. */
  private async recipientFor(
    principal: ApplicantPrincipal,
  ): Promise<string | null> {
    const identity = await this.identities.getIdentity(principal.clerkUserId);
    return identity?.email && identity.emailVerified ? identity.email : null;
  }
}
