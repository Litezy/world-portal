import { Test, TestingModule } from '@nestjs/testing';
import { AgencyService } from './agency.service';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgencyVerificationStatus, AgencyListingStatus, AgencyStaffStatus, AssignmentStatus } from '@prisma/client';
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
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(3),
      aggregate: jest.fn().mockResolvedValue({ _sum: { netToAgency: 4500.0 } }),
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
});
