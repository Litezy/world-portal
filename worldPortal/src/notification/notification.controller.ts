import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification' })
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get(':recipientId')
  @ApiOperation({ summary: 'Get notifications and unread count for a recipient' })
  @ApiParam({ name: 'recipientId', description: 'Recipient identifier (email, profileId, or agencyId)' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findForRecipient(
    @Param('recipientId') recipientId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.findForRecipient(recipientId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? Number(limit) : 50,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('recipient/:recipientId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for a recipient' })
  @ApiParam({ name: 'recipientId', description: 'Recipient identifier' })
  async markAllAsRead(@Param('recipientId') recipientId: string) {
    return this.notificationService.markAllAsRead(recipientId);
  }
}
