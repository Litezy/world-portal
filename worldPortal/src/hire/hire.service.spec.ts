import { Test, TestingModule } from '@nestjs/testing';
import { HireService } from './hire.service';
import { PrismaService } from '../prisma/prisma.service';

import { NotificationService } from '../notification/notification.service';

describe('HireService', () => {
  let service: HireService;

  const mockNotificationService = {
    create: jest.fn().mockResolvedValue({ id: 'notif-test' }),
  };

  const mockPrismaService = {
    professionalProfile: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, isVerified: args.data.isVerified })),
    },
    profile: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    agency: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    agencyAssignment: {
      upsert: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    },
    hireBooking: {
      create: jest.fn().mockImplementation((args) =>
        Promise.resolve({
          id: 'booking-123',
          reference: args.data.reference,
          status: 'REQUESTED',
          totalAmount: args.data.totalAmount,
          currency: args.data.currency,
          ...args.data,
        }),
      ),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HireService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<HireService>(HireService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findProfessionals', () => {
    it('should return paginated structure', async () => {
      const result = await service.findProfessionals({ page: 1, limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('createBooking', () => {
    it('should return booking reference', async () => {
      const result = await service.createBooking({
        professionalId: 'agency-001',
        travellerName: 'John Doe',
        travellerEmail: 'john@example.com',
        destinationCity: 'Lagos',
        startsAt: '2026-10-01',
        endsAt: '2026-10-05',
        totalAmount: 500,
      });

      expect(result.reference).toContain('HIRE-');
      expect(result.status).toBe('REQUESTED');
    });

    it('files the booking under the signed-in applicant and their verified email', async () => {
      const result = await service.createBooking(
        {
          professionalId: 'agency-001',
          travellerName: 'John Doe',
          travellerEmail: 'someone-else@example.com',
          destinationCity: 'Lagos',
          startsAt: '2026-10-01',
          endsAt: '2026-10-05',
          totalAmount: 500,
        },
        { clerkUserId: 'user_abc', email: 'john@example.com' },
      );

      expect(result.clerkUserId).toBe('user_abc');
      expect(result.travellerEmail).toBe('john@example.com');
    });
  });
});
