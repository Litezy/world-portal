import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockNotification = {
    id: 'notif-1',
    recipientId: 'test@example.com',
    recipientType: 'APPLICANT',
    title: 'Booking Placed',
    message: 'Your booking has been placed',
    type: 'BOOKING_REQUESTED',
    metadata: {},
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    notification: {
      create: jest.fn().mockResolvedValue(mockNotification),
      findMany: jest.fn().mockResolvedValue([mockNotification]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(mockNotification),
      update: jest.fn().mockResolvedValue({ ...mockNotification, isRead: true }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a notification', async () => {
    const result = await service.create({
      recipientId: 'test@example.com',
      recipientType: 'APPLICANT',
      title: 'Booking Placed',
      message: 'Your booking has been placed',
      type: 'BOOKING_REQUESTED',
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('notif-1');
    expect(mockPrismaService.notification.create).toHaveBeenCalled();
  });

  it('finds notifications and unread count for recipient', async () => {
    const result = await service.findForRecipient('test@example.com');
    expect(result.data).toHaveLength(1);
    expect(result.unreadCount).toBe(1);
  });

  it('marks notification as read', async () => {
    const result = await service.markAsRead('notif-1');
    expect(result.isRead).toBe(true);
  });

  it('marks all notifications as read for recipient', async () => {
    const result = await service.markAllAsRead('test@example.com');
    expect(result.count).toBe(1);
  });
});
