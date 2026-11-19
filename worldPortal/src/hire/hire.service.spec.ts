import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HireService } from './hire.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHireBookingDto } from './dto/create-hire-booking.dto';

import { NotificationService } from '../notification/notification.service';

describe('HireService', () => {
  let service: HireService;

  const mockNotificationService = {
    create: jest.fn().mockResolvedValue({ id: 'notif-test' }),
  };

  /** A verified agency as /hire lists it, booked as `agency-<id>`. */
  const verifiedAgency = {
    id: 'ag-1',
    slug: 'sample-guards',
    name: 'Sample Guards',
    about: 'A sample agency used only in tests.',
    summary: 'Event security.',
    logoUrl: null,
    countryCode: 'PT',
    country: 'Portugal',
    cities: ['Lisbon'],
    categories: ['security'],
    verification: 'VERIFIED',
    listingStatus: 'LIVE',
    commissionRate: 0.2,
    offerings: [
      { id: 'off-1', title: 'Day cover', price: 120, currency: 'EUR' },
    ],
  };

  const mockPrismaService = {
    professionalProfile: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      upsert: jest.fn((args: { where: { id: string } }) =>
        Promise.resolve({ id: args.where.id }),
      ),
      update: jest
        .fn()
        .mockImplementation(
          (args: { where: { id: string }; data: { isVerified?: boolean } }) =>
            Promise.resolve({
              id: args.where.id,
              isVerified: args.data.isVerified,
            }),
        ),
    },
    profile: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    agency: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    visaDocumentation: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    agencyAssignment: {
      upsert: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    },
    hireBooking: {
      create: jest
        .fn()
        .mockImplementation((args: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 'booking-123',
            status: 'REQUESTED',
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
    jest.clearAllMocks();
    mockPrismaService.agency.findFirst.mockResolvedValue(null);
    mockPrismaService.professionalProfile.findFirst.mockResolvedValue(null);
    mockPrismaService.visaDocumentation.findFirst.mockResolvedValue(null);
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
    const owner = { clerkUserId: 'user_abc', email: 'john@example.com' };
    const request = (
      overrides: Partial<CreateHireBookingDto> = {},
    ): CreateHireBookingDto => ({
      professionalId: 'agency-ag-1',
      travellerName: 'John Doe',
      travellerEmail: 'john@example.com',
      destinationCity: 'Lisbon',
      startsAt: '2026-10-01T09:00:00.000Z',
      endsAt: '2026-10-04T09:00:00.000Z',
      // Whatever the client claims, the server prices the booking itself.
      totalAmount: 999,
      ...overrides,
    });
    const created = () =>
      (
        mockPrismaService.hireBooking.create.mock.calls[0] as [
          { data: Record<string, unknown> },
        ]
      )[0].data;

    beforeEach(() => {
      mockPrismaService.agency.findFirst.mockResolvedValue(verifiedAgency);
    });

    it('should return booking reference', async () => {
      const result = await service.createBooking(request(), owner);

      expect(result.reference).toContain('HIRE-');
      expect(result.status).toBe('REQUESTED');
    });

    it('files the booking under the signed-in applicant and their verified email', async () => {
      const result = await service.createBooking(
        request({ travellerEmail: 'someone-else@example.com' }),
        owner,
      );

      expect(result.clerkUserId).toBe('user_abc');
      expect(result.travellerEmail).toBe('john@example.com');
    });

    it("prices an agency booking from its listed offering, not the request's amount", async () => {
      await service.createBooking(
        request({ totalAmount: 1, currency: 'USD' }),
        owner,
      );

      expect(created()).toMatchObject({ totalAmount: 120, currency: 'EUR' });
      const [assignment] = mockPrismaService.agencyAssignment.upsert.mock
        .calls[0] as [{ create: Record<string, unknown> }];
      expect(assignment.create).toMatchObject({
        gross: 120,
        platformFee: 24,
        netToAgency: 96,
        currency: 'EUR',
        offeringId: 'off-1',
      });
    });

    it('prices a professional from their hourly rate and the hours booked', async () => {
      mockPrismaService.agency.findFirst.mockResolvedValue(null);
      mockPrismaService.professionalProfile.findFirst.mockResolvedValue({
        id: 'pro-1',
        slug: 'sample-pro',
        hourlyRate: 40,
        currency: 'USD',
        isVerified: true,
      });

      await service.createBooking(
        request({
          professionalId: 'sample-pro',
          startsAt: '2026-10-01T09:00:00.000Z',
          endsAt: '2026-10-01T13:00:00.000Z',
          totalAmount: 1,
        }),
        owner,
      );

      expect(created()).toMatchObject({
        professionalId: 'pro-1',
        totalAmount: 160,
        currency: 'USD',
      });
    });

    it('books an agency through a profile built from its own record, never the request', async () => {
      await service.createBooking(
        request({ professionalId: 'agency-sample-guards' }),
        owner,
      );

      const [profile] = mockPrismaService.professionalProfile.upsert.mock
        .calls[0] as [
        { where: { id: string }; create: Record<string, unknown> },
      ];
      expect(profile.where).toEqual({ id: 'agency-ag-1' });
      expect(profile.create).toMatchObject({ name: 'Sample Guards' });
      expect(
        mockPrismaService.professionalProfile.create,
      ).not.toHaveBeenCalled();
      expect(created()).toMatchObject({ professionalId: 'agency-ag-1' });
    });

    it('ignores a profile id sent by the client', async () => {
      await service.createBooking(
        request({ profileId: 'someone-elses-profile' }),
        owner,
      );

      expect(created().profileId).toBeNull();
    });

    it("attaches the applicant's own visa application", async () => {
      mockPrismaService.visaDocumentation.findFirst.mockResolvedValue({
        id: 'visa-1',
      });

      await service.createBooking(
        request({ visaDocumentationId: 'visa-1' }),
        owner,
      );

      expect(
        mockPrismaService.visaDocumentation.findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'visa-1', clerkUserId: 'user_abc' },
        }),
      );
      expect(created().visaDocumentationId).toBe('visa-1');
    });

    it("refuses someone else's visa application with a 404", async () => {
      await expect(
        service.createBooking(
          request({ visaDocumentationId: 'someone-elses-visa' }),
          owner,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.hireBooking.create).not.toHaveBeenCalled();
    });

    it.each(['agency-no-such-agency', 'made-up-professional'])(
      'refuses an unknown professional (%s) and never creates one',
      async (professionalId) => {
        mockPrismaService.agency.findFirst.mockResolvedValue(null);

        await expect(
          service.createBooking(request({ professionalId }), owner),
        ).rejects.toThrow(NotFoundException);
        expect(
          mockPrismaService.professionalProfile.create,
        ).not.toHaveBeenCalled();
        expect(
          mockPrismaService.professionalProfile.upsert,
        ).not.toHaveBeenCalled();
        expect(mockPrismaService.hireBooking.create).not.toHaveBeenCalled();
      },
    );

    it('refuses an agency the desk has not verified', async () => {
      mockPrismaService.agency.findFirst.mockResolvedValue({
        ...verifiedAgency,
        verification: 'PENDING',
      });

      await expect(service.createBooking(request(), owner)).rejects.toThrow(
        NotFoundException,
      );
      expect(
        mockPrismaService.professionalProfile.upsert,
      ).not.toHaveBeenCalled();
    });

    it('refuses a professional the desk has not verified', async () => {
      mockPrismaService.agency.findFirst.mockResolvedValue(null);
      mockPrismaService.professionalProfile.findFirst.mockResolvedValue({
        id: 'pro-2',
        slug: 'unverified-pro',
        hourlyRate: 40,
        currency: 'USD',
        isVerified: false,
      });

      await expect(
        service.createBooking(request({ professionalId: 'pro-2' }), owner),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses an agency that has not priced what it sells', async () => {
      mockPrismaService.agency.findFirst.mockResolvedValue({
        ...verifiedAgency,
        offerings: [
          { id: 'off-1', title: 'On request', price: null, currency: 'EUR' },
        ],
      });

      await expect(service.createBooking(request(), owner)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.hireBooking.create).not.toHaveBeenCalled();
    });

    it('refuses a booking that ends before it starts', async () => {
      await expect(
        service.createBooking(
          request({
            startsAt: '2026-10-04T09:00:00.000Z',
            endsAt: '2026-10-01T09:00:00.000Z',
          }),
          owner,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.hireBooking.create).not.toHaveBeenCalled();
    });
  });
});
