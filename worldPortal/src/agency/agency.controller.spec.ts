import { Test, TestingModule } from '@nestjs/testing';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { AgencyVerificationStatus, AgencyListingStatus, AgencyDocumentKind, AgencyDocumentStatus } from '@prisma/client';

describe('AgencyController', () => {
  let controller: AgencyController;

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
    verification: AgencyVerificationStatus.VERIFIED,
    listingStatus: AgencyListingStatus.LIVE,
  };

  const mockAgencyService = {
    createAgency: jest.fn().mockResolvedValue(mockAgency),
    findAllAgencies: jest.fn().mockResolvedValue({ data: [mockAgency], meta: { total: 1, page: 1, limit: 20, pages: 1 } }),
    getAgencyById: jest.fn().mockResolvedValue(mockAgency),
    updateVerification: jest.fn().mockResolvedValue({ ...mockAgency, verification: AgencyVerificationStatus.VERIFIED }),
    getOverview: jest.fn().mockResolvedValue({ openAssignments: 2, staffOnDuty: 3, staffTotal: 10 }),
    updateAgencyListing: jest.fn().mockResolvedValue(mockAgency),
    listStaff: jest.fn().mockResolvedValue([{ id: 'staff-1', name: 'John Doe' }]),
    addStaff: jest.fn().mockResolvedValue({ id: 'staff-2', name: 'Jane Smith' }),
    updateStaff: jest.fn().mockResolvedValue({ id: 'staff-1', name: 'John Updated' }),
    listDocuments: jest.fn().mockResolvedValue([{ id: 'doc-1', kind: AgencyDocumentKind.BUSINESS_REGISTRATION, status: AgencyDocumentStatus.APPROVED }]),
    uploadDocument: jest.fn().mockResolvedValue({ id: 'doc-2', kind: AgencyDocumentKind.TAX_CERTIFICATE, status: AgencyDocumentStatus.IN_REVIEW }),
    listAssignments: jest.fn().mockResolvedValue([{ id: 'assign-1', status: 'REQUESTED' }]),
    assignStaffToAssignment: jest.fn().mockResolvedValue({ id: 'assign-1', status: 'ASSIGNED' }),
    listPayouts: jest.fn().mockResolvedValue([{ id: 'payout-1', amount: 1500.0 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgencyController],
      providers: [
        { provide: AgencyService, useValue: mockAgencyService },
      ],
    }).compile();

    controller = module.get<AgencyController>(AgencyController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAgency', () => {
    it('should call agencyService.createAgency and return created agency', async () => {
      const dto: any = { name: 'Apex Security Services' };
      const result = await controller.createAgency(dto);
      expect(result).toEqual(mockAgency);
      expect(mockAgencyService.createAgency).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllAgencies', () => {
    it('should call agencyService.findAllAgencies with search & filters', async () => {
      const result = await controller.findAllAgencies('LIVE', 'VERIFIED', 'Apex', 1, 20);
      expect(result.data).toHaveLength(1);
      expect(mockAgencyService.findAllAgencies).toHaveBeenCalledWith({
        status: 'LIVE',
        verification: 'VERIFIED',
        search: 'Apex',
        page: 1,
        limit: 20,
      });
    });
  });

  describe('getAgency', () => {
    it('should call agencyService.getAgencyById with agency id', async () => {
      const result = await controller.getAgency('agency-123');
      expect(result).toEqual(mockAgency);
      expect(mockAgencyService.getAgencyById).toHaveBeenCalledWith('agency-123');
    });
  });

  describe('updateVerification', () => {
    it('should call agencyService.updateVerification with agency id and status', async () => {
      const result = await controller.updateVerification('agency-123', 'VERIFIED');
      expect(result.verification).toBe(AgencyVerificationStatus.VERIFIED);
      expect(mockAgencyService.updateVerification).toHaveBeenCalledWith('agency-123', 'VERIFIED');
    });
  });

  describe('getOverview', () => {
    it('should call agencyService.getOverview with agency id', async () => {
      const result = await controller.getOverview('agency-123');
      expect(result.openAssignments).toBe(2);
      expect(mockAgencyService.getOverview).toHaveBeenCalledWith('agency-123');
    });
  });

  describe('staff operations', () => {
    it('should list staff members for an agency', async () => {
      const result = await controller.listStaff('agency-123');
      expect(result).toHaveLength(1);
      expect(mockAgencyService.listStaff).toHaveBeenCalledWith('agency-123');
    });

    it('should add staff member to agency roster', async () => {
      const dto: any = { name: 'Jane Smith', role: 'Security Guard' };
      const result = await controller.addStaff('agency-123', dto);
      expect(result.name).toBe('Jane Smith');
      expect(mockAgencyService.addStaff).toHaveBeenCalledWith('agency-123', dto);
    });
  });

  describe('document compliance operations', () => {
    it('should list compliance documents', async () => {
      const result = await controller.listDocuments('agency-123');
      expect(result).toHaveLength(1);
      expect(mockAgencyService.listDocuments).toHaveBeenCalledWith('agency-123');
    });
  });
});
