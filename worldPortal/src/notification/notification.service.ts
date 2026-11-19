import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/** A page size between 1 and MAX_LIMIT; anything unusable is the default. */
function clampLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

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
    const limit = clampLimit(options.limit);

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

  /**
   * Marks one notification read, but only if it belongs to `recipientId` (the
   * caller's own recipient, from their session). Someone else's notification
   * is a 404, exactly like one that does not exist.
   */
  async markAsRead(id: string, recipientId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, recipientId: recipientId.trim().toLowerCase() },
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

    this.logger.log(
      `Marked ${result.count} notifications as read for recipient=${cleanId}`,
    );
    return { count: result.count };
  }
}
