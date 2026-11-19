import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AgencyService } from './agency.service';
import { UpdateAgencyListingDto } from './dto/update-agency-listing.dto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AgencyVerificationStatus,
  AgencyListingStatus,
  AgencyStaffStatus,
  AssignmentStatus,
} from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

describe('AgencyService', () => {
  let service: AgencyService;

  const mockAgency = {
    id: 'agency-123',
    slug: 'apex-security-services',
    name: 'Apex Security Services',
    legalName: 'Apex Security Nigeria Limited',
    registrationNumber: 'RC-1048291',
    countryCode: 'NG',
    country: 'Nigeria',
    cities: ['Lagos', 'Abuja'],
    categories: ['security'],
    summary: 'Premium close-protection and event security agency.',
    about: 'Providing armed and unarmed security guards.',
    logoUrl: 'https://example.com/logo.png',
    email: 'contact@apexsecurity.ng',
    phone: '+2348012345678',
    website: 'https://apexsecurity.ng',
    yearFounded: 2018,
    staffCount: 45,
    languages: ['English', 'Yoruba'],
    verification: AgencyVerificationStatus.VERIFIED,
    listingStatus: AgencyListingStatus.LIVE,
    rating: 4.8,
    completedJobs: 142,
    commissionRate: 0.15,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStaff = {
    id: 'stf-123',
    agencyId: 'agency-123',
    name: 'John Doe',
    role: 'Lead Security Officer',
    category: 'security',
    phone: '+2348011112222',
    languages: ['English'],
    experienceYears: 5,
    backgroundChecked: true,
    status: AgencyStaffStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    agency: {
      create: jest.fn().mockResolvedValue(mockAgency),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    agencyStaff: {
      create: jest.fn().mockResolvedValue(mockStaff),
      findMany: jest.fn().mockResolvedValue([mockStaff]),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn().mockResolvedValue(10),
    },
    agencyDocument: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
    },
    agencyAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn().mockResolvedValue(3),
      aggregate: jest.fn().mockResolvedValue({ _sum: { netToAgency: 4500.0 } }),
    },
    hireBooking: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    agencyPayout: {
      findMany: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _sum: { net: 1200.0 } }),
    },
  };

  const mockNotificationService = {
    create: jest.fn().mockResolvedValue({ id: 'notif-test' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgencyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AgencyService>(AgencyService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAgency', () => {
    it('should create an agency with a slugified name', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue(null);
      mockPrismaService.agency.create.mockResolvedValue(mockAgency);

      const dto = {
        name: 'Apex Security Services',
        legalName: 'Apex Security Nigeria Limited',
        registrationNumber: 'RC-1048291',
        countryCode: 'NG',
        country: 'Nigeria',
        cities: ['Lagos'],
        categories: ['security'],
        summary: 'Headline summary',
        about: 'About agency',
        email: 'contact@apexsecurity.ng',
        phone: '+2348012345678',
        yearFounded: 2018,
        staffCount: 45,
        languages: ['English'],
      };

      const result = await service.createAgency(dto);
      expect(result).toEqual(mockAgency);
      expect(mockPrismaService.agency.create).toHaveBeenCalled();
    });

    // Agencies sign in with an emailed code. A password nobody uses, set to a
    // published default, is only a liability; and the hash must never come back.
    it('creates the owner with no password and never reads one back', async () => {
      mockPrismaService.agency.findFirst.mockResolvedValue(null);
      mockPrismaService.agency.findUnique.mockResolvedValue(null);

      await service.createAgency({
        name: 'Sample Agency',
        legalName: 'Sample Agency Ltd',
        countryCode: 'PT',
        country: 'Portugal',
        cities: ['Lisbon'],
        categories: ['security'],
        summary: 'Sample.',
        about: 'A sample agency.',
        email: 'owner@example.com',
        phone: '+10000000000',
        yearFounded: 2020,
        staffCount: 3,
        languages: ['English'],
      });

      const [args] = mockPrismaService.agency.create.mock.calls[0] as [
        {
          data: { users: { create: Record<string, unknown> } };
          include: { users: { select?: Record<string, unknown> } };
        },
      ];
      expect(args.data.users.create).not.toHaveProperty('passwordHash');
      expect(args.include.users.select).toBeDefined();
      expect(args.include.users.select).not.toHaveProperty('passwordHash');
    });
  });

  /**
   * LIVE, IN_REVIEW and REJECTED are the desk's verdicts, reached through
   * PATCH /agency/:id/verify. The listing route is how an agency edits its own
   * listing, so it may draft, submit or pause, and nothing else.
   */
  describe('updateAgencyListing status', () => {
    beforeEach(() => {
      mockPrismaService.agency.findFirst.mockResolvedValue(mockAgency);
      mockPrismaService.agency.update.mockResolvedValue(mockAgency);
    });

    it.each([
      AgencyListingStatus.LIVE,
      AgencyListingStatus.IN_REVIEW,
      AgencyListingStatus.REJECTED,
    ])('refuses %s, which only the desk sets', async (listingStatus) => {
      await expect(
        service.updateAgencyListing('agency-123', { listingStatus }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.agency.update).not.toHaveBeenCalled();
    });

    it.each([
      AgencyListingStatus.DRAFT,
      AgencyListingStatus.SUBMITTED,
      AgencyListingStatus.PAUSED,
    ])('lets the agency set %s', async (listingStatus) => {
      await service.updateAgencyListing('agency-123', { listingStatus });
      const [args] = mockPrismaService.agency.update.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(args.data.listingStatus).toBe(listingStatus);
    });

    it('still makes a listing LIVE when the desk verifies the agency', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        ...mockAgency,
        verification: AgencyVerificationStatus.PENDING,
        listingStatus: AgencyListingStatus.SUBMITTED,
      });

      await service.updateVerification('agency-123', 'VERIFIED');

      expect(mockPrismaService.agency.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            verification: AgencyVerificationStatus.VERIFIED,
            listingStatus: AgencyListingStatus.LIVE,
          },
        }),
      );
    });
  });

  /**
   * The agency's email is how it signs in (and how `findAgency` finds it).
   * The listing route is an autosave the portal calls with the whole form,
   * so it must never move that identity: changing it needs a verified flow,
   * which doesn't exist yet.
   */
  describe('updateAgencyListing email', () => {
    beforeEach(() => {
      mockPrismaService.agency.findFirst.mockResolvedValue(mockAgency);
      mockPrismaService.agency.update.mockResolvedValue(mockAgency);
    });

    it('never changes the sign-in email, whatever the form sends', async () => {
      await service.updateAgencyListing('agency-123', {
        email: 'someone-else@example.com',
        summary: 'Updated summary',
      });

      const [args] = mockPrismaService.agency.update.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(args.data).not.toHaveProperty('email');
      expect(args.data.summary).toBe('Updated summary');
    });

    it("still accepts the field, so the portal's autosave isn't refused", async () => {
      const errors = await validate(
        plainToInstance(UpdateAgencyListingDto, {
          email: 'contact@apexsecurity.ng',
          summary: 'Updated summary',
        }),
        { whitelist: true, forbidNonWhitelisted: true },
      );
      expect(errors).toEqual([]);
    });
  });

  describe('UpdateAgencyListingDto', () => {
    const errorsFor = async (listingStatus: string) =>
      (
        await validate(
          plainToInstance(UpdateAgencyListingDto, { listingStatus }),
        )
      ).map((error) => error.property);

    it.each(['LIVE', 'IN_REVIEW', 'REJECTED'])(
      'refuses listingStatus %s before it reaches the service',
      async (listingStatus) => {
        expect(await errorsFor(listingStatus)).toContain('listingStatus');
      },
    );

    it.each(['DRAFT', 'SUBMITTED', 'PAUSED'])(
      'accepts listingStatus %s',
      async (listingStatus) => {
        expect(await errorsFor(listingStatus)).toEqual([]);
      },
    );
  });

  describe('getAgencyById', () => {
    it('should return agency if found', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue(mockAgency);
      mockPrismaService.agency.findFirst.mockResolvedValue(mockAgency);

      const result = await service.getAgencyById('agency-123');
      expect(result).toEqual(mockAgency);
    });

    it('should throw NotFoundException if agency is missing', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue(null);
      mockPrismaService.agency.findFirst.mockResolvedValue(null);

      await expect(service.getAgencyById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addStaff & listStaff', () => {
    it('should create a staff member and add to agency roster', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue(mockAgency);
      mockPrismaService.agency.findFirst.mockResolvedValue(mockAgency);
      mockPrismaService.agencyStaff.create.mockResolvedValue(mockStaff);

      const dto = {
        name: 'John Doe',
        role: 'Lead Security Officer',
        category: 'security',
        phone: '+2348011112222',
        languages: ['English'],
        experienceYears: 5,
        backgroundChecked: true,
      };

      const created = await service.addStaff('agency-123', dto);
      expect(created).toEqual(mockStaff);
      expect(mockPrismaService.agencyStaff.create).toHaveBeenCalled();
    });

    it('should list staff members for an agency', async () => {
      mockPrismaService.agencyStaff.findMany.mockResolvedValue([mockStaff]);

      const staffList = await service.listStaff('agency-123');
      expect(staffList).toEqual([mockStaff]);
      expect(mockPrismaService.agencyStaff.findMany).toHaveBeenCalledWith({
        where: { agencyId: 'agency-123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getOverview', () => {
    it('should aggregate overview statistics correctly', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue(mockAgency);
      mockPrismaService.agency.findFirst.mockResolvedValue(mockAgency);
      mockPrismaService.agencyAssignment.count
        .mockResolvedValueOnce(2) // openAssignments
        .mockResolvedValueOnce(5); // completedThisMonth

      mockPrismaService.agencyStaff.count
        .mockResolvedValueOnce(10) // staffTotal
        .mockResolvedValueOnce(3); // staffOnDuty;

      const overview = await service.getOverview('agency-123');

      expect(overview).toEqual({
        openAssignments: 2,
        staffOnDuty: 3,
        staffTotal: 10,
        completedThisMonth: 5,
        earnedThisMonth: 4500.0,
        pendingPayout: 1200.0,
        currency: 'USD',
        outstandingDocuments: 1,
        verification: AgencyVerificationStatus.VERIFIED,
        listingStatus: AgencyListingStatus.LIVE,
      });
    });
  });
  /**
   * Completing a job releases its staff, tells the traveller it is done and
   * credits the agency's pending payout. Only a job that is actually under
   * way may get there: a requested one has nobody on it, and a completed or
   * cancelled one must not be credited (or announced) again.
   */
  describe('completeAssignment', () => {
    const assignment = {
      id: 'as-1',
      reference: 'HIRE-REF-1',
      agencyId: 'agency-123',
      assignedStaffIds: ['stf-123'],
      travellerEmail: 'traveller@example.com',
      netToAgency: 127.5,
    };

    beforeEach(() => {
      mockPrismaService.agency.findFirst.mockResolvedValue(mockAgency);
      mockPrismaService.agencyAssignment.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.agencyAssignment.findUniqueOrThrow.mockResolvedValue({
        ...assignment,
        status: AssignmentStatus.COMPLETED,
      });
    });

    it.each([AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS])(
      'completes an %s job, only while it is still under way',
      async (status) => {
        mockPrismaService.agencyAssignment.findFirst.mockResolvedValue({
          ...assignment,
          status,
        });

        const result = await service.completeAssignment('agency-123', 'as-1');

        expect(
          mockPrismaService.agencyAssignment.updateMany,
        ).toHaveBeenCalledWith({
          where: {
            id: 'as-1',
            status: {
              in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS],
            },
          },
          data: { status: AssignmentStatus.COMPLETED },
        });
        expect(result.status).toBe(AssignmentStatus.COMPLETED);
        expect(mockPrismaService.agencyStaff.updateMany).toHaveBeenCalled();
        expect(mockNotificationService.create).toHaveBeenCalled();
      },
    );

    it.each([
      AssignmentStatus.REQUESTED,
      AssignmentStatus.COMPLETED,
      AssignmentStatus.CANCELLED,
    ])('refuses to complete a %s job with 409', async (status) => {
      mockPrismaService.agencyAssignment.findFirst.mockResolvedValue({
        ...assignment,
        status,
      });

      await expect(
        service.completeAssignment('agency-123', 'as-1'),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.agencyAssignment.update).not.toHaveBeenCalled();
      expect(
        mockPrismaService.agencyAssignment.updateMany,
      ).not.toHaveBeenCalled();
      expect(mockPrismaService.agencyStaff.updateMany).not.toHaveBeenCalled();
      expect(mockNotificationService.create).not.toHaveBeenCalled();
    });

    it('lets only one of two racing completes credit the job', async () => {
      mockPrismaService.agencyAssignment.findFirst.mockResolvedValue({
        ...assignment,
        status: AssignmentStatus.ASSIGNED,
      });
      // Another request completed it between the read and the update.
      mockPrismaService.agencyAssignment.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(
        service.completeAssignment('agency-123', 'as-1'),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.agencyStaff.updateMany).not.toHaveBeenCalled();
      expect(mockNotificationService.create).not.toHaveBeenCalled();
    });
  });
});
