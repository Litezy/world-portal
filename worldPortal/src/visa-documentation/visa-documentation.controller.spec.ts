import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VisaDocumentationController } from './visa-documentation.controller';
import { VisaDocumentationService } from './visa-documentation.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  VisaDocumentStatus,
  PaymentStatus,
  VisaCategory,
} from '@prisma/client';

describe('VisaDocumentationController', () => {
  let controller: VisaDocumentationController;

  const mockVisaRecord = {
    id: 'visa-uuid-001',
    applicationNo: 'VISA-2026-8941',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@gmail.com',
    status: VisaDocumentStatus.SUBMITTED,
    paymentStatus: PaymentStatus.PENDING_EVALUATION,
  };

  const mockVisaService = {
    createVisaApplication: jest.fn().mockResolvedValue(mockVisaRecord),
    findAllVisaApplications: jest.fn().mockResolvedValue([mockVisaRecord]),
    findVisaApplicationById: jest.fn().mockResolvedValue(mockVisaRecord),
    evaluateVisaCost: jest.fn().mockResolvedValue({
      ...mockVisaRecord,
      status: VisaDocumentStatus.EVALUATED,
    }),
    updateStatus: jest.fn().mockResolvedValue({
      ...mockVisaRecord,
      status: VisaDocumentStatus.APPROVED,
    }),
    inviteApplicant: jest.fn().mockResolvedValue(mockVisaRecord),
  };

  const mockPrismaService = {};
  const mockJwtService = { decode: jest.fn() };
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisaDocumentationController],
      providers: [
        {
          provide: VisaDocumentationService,
          useValue: mockVisaService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<VisaDocumentationController>(
      VisaDocumentationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createVisaApplication', () => {
    it('should delegate application creation to VisaDocumentationService', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@gmail.com',
        phone: '+2348012345678',
        dateOfBirth: '1992-05-15',
        nationality: 'Nigerian',
        residenceAddress: '123 Street',
        passportNumber: 'A12345678',
        passportIssueDate: '2022-01-10',
        passportExpiryDate: '2032-01-09',
        targetCountry: 'Canada',
        visaCategory: VisaCategory.TOURIST,
        intendedArrivalDate: '2026-10-01',
        intendedDepartureDate: '2026-10-21',
        purposeOfVisit: 'Tourism',
        passportDataPageUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
        passportPhotoWhiteBgUrl: 'https://s3.amazonaws.com/bucket/photo.jpg',
        proofOfFunds6MonthsUrl: 'https://s3.amazonaws.com/bucket/pof.pdf',
      };

      const result = await controller.createVisaApplication(dto);
      expect(result).toEqual(mockVisaRecord);
      expect(mockVisaService.createVisaApplication).toHaveBeenCalledWith(dto);
    });
  });

  describe('findOne', () => {
    it('should return visa application details by ID', async () => {
      const result = await controller.findOne('visa-uuid-001');
      expect(result).toEqual(mockVisaRecord);
      expect(mockVisaService.findVisaApplicationById).toHaveBeenCalledWith(
        'visa-uuid-001',
        undefined,
      );
    });
  });

  describe('inviteApplicant', () => {
    it('should delegate invite applicant call to VisaDocumentationService', async () => {
      const dto = {
        purpose: 'Biometric Data Capture',
        date: '2026-09-15',
        time: '10:00 AM',
        location: 'Embassy Headquarters',
      };
      const user = { email: 'staff@worldportal.com' };

      const result = await controller.inviteApplicant('visa-uuid-001', dto, user);
      expect(result).toEqual(mockVisaRecord);
      expect(mockVisaService.inviteApplicant).toHaveBeenCalledWith(
        'visa-uuid-001',
        dto,
        'staff@worldportal.com',
      );
    });
  });
});

