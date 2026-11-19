import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkNotificationReadDto } from './dto/mark-notification-read.dto';

/**
 * Notifications by recipient, for the website server only.
 *
 * A recipient id is an applicant's email or an agency id, both guessable, so
 * nobody else may name one: the website server (SERVICE_AUTH_KEY) reads the
 * recipient from the visitor's own session (the agency's `agencyId`, the
 * console member's email) and passes it here. Applicants read their own inbox
 * through `/me/notifications` instead. The API's own services create
 * notifications in code, not over HTTP.
 */
@ApiTags('Notifications')
@ApiHeader({ name: 'x-service-key', required: true })
@ApiResponse({ status: 401, description: 'Not the E-Embassy website server.' })
@UseGuards(ServiceKeyGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification (website server)' })
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get(':recipientId')
  @ApiOperation({
    summary: 'Get notifications and unread count for a recipient',
  })
  @ApiParam({
    name: 'recipientId',
    description: 'Recipient identifier (email, profileId, or agencyId)',
  })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findForRecipient(
    @Param('recipientId') recipientId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationService.findForRecipient(recipientId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: "Mark one of the recipient's notifications as read",
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 404,
    description: 'No such notification for this recipient.',
  })
  async markAsRead(
    @Param('id') id: string,
    @Body() dto: MarkNotificationReadDto,
  ) {
    return this.notificationService.markAsRead(id, dto.recipientId);
  }

  @Patch('recipient/:recipientId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for a recipient' })
  @ApiParam({ name: 'recipientId', description: 'Recipient identifier' })
  async markAllAsRead(@Param('recipientId') recipientId: string) {
    return this.notificationService.markAllAsRead(recipientId);
  }
}
