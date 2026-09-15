import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId.trim().toLowerCase(),
        recipientType: dto.recipientType.toUpperCase(),
        title: dto.title,
        message: dto.message,
        type: dto.type,
        metadata: dto.metadata || {},
        isRead: false,
      },
    });

    this.logger.log(
      `Created notification id=${notification.id} for recipient=${dto.recipientId} type=${dto.type}`,
    );
    return notification;
  }

  async findForRecipient(
    recipientId: string,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ) {
    const cleanId = recipientId.trim().toLowerCase();
    const limit = options.limit || 50;

    const [data, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          recipientId: cleanId,
          ...(options.unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.notification.count({
        where: {
          recipientId: cleanId,
          isRead: false,
        },
      }),
    ]);

    return {
      data,
      unreadCount,
    };
  }

  async markAsRead(id: string) {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(recipientId: string) {
    const cleanId = recipientId.trim().toLowerCase();
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientId: cleanId,
        isRead: false,
      },
      data: { isRead: true },
    });

    this.logger.log(`Marked ${result.count} notifications as read for recipient=${cleanId}`);
    return { count: result.count };
  }
}
