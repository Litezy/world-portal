import { Test, TestingModule } from '@nestjs/testing';
import { VisaDocumentationService } from './visa-documentation.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  VisaDocumentStatus,
  PaymentStatus,
  VisaCategory,
  Gender,
  Prisma,
} from '@prisma/client';

describe('VisaDocumentationService', () => {
  let service: VisaDocumentationService;

  const mockVisaRecord = {
    id: 'visa-uuid-001',
    applicationNo: 'VISA-2026-8941',
    profileId: null,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@gmail.com',
    phone: '+2348012345678',
    dateOfBirth: new Date('1992-05-15'),
    gender: Gender.MALE,
    nationality: 'Nigerian',
    residenceAddress: '123 Loveworld Street, Lagos',
    passportNumber: 'A12345678',
    passportIssueDate: new Date('2022-01-10'),
    passportExpiryDate: new Date('2032-01-09'),
    passportIssuingAuthority: 'NIS',
    targetCountry: 'Canada',
    visaCategory: VisaCategory.TOURIST,
    intendedArrivalDate: new Date('2026-10-01'),
    intendedDepartureDate: new Date('2026-10-21'),
    purposeOfVisit: 'Vacation',
    passportDataPageUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
    passportPhotoWhiteBgUrl: 'https://s3.amazonaws.com/bucket/photo.jpg',
    proofOfFunds6MonthsUrl: 'https://s3.amazonaws.com/bucket/pof.pdf',
    businessRegistrationCertUrl: null,
    taxCertificateUrl: null,
    marriageCertificateUrl: null,
    childrenBirthCertUrls: [],
    landedPropertyDocUrls: [],
    previousVisasScanUrls: [],
    supportingDocUrls: [],
    totalAmount: new Prisma.Decimal(500.0),
    amountPaid: new Prisma.Decimal(0.0),
    balanceDue: new Prisma.Decimal(500.0),
    allowInstallment: true,
    selectedPaymentOption: null,
    paymentStatus: PaymentStatus.AWAITING_PAYMENT,
    status: VisaDocumentStatus.EVALUATED,
    evaluatedBy: 'admin@loveworld.com',
    evaluatedAt: new Date(),
    createdBy: 'john.doe@gmail.com',
    reviewedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
    },
    visaDocumentation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisaDocumentationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VisaDocumentationService>(VisaDocumentationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVisaApplication', () => {
    it('should create visa application with SUBMITTED status & PENDING_EVALUATION paymentStatus', async () => {
      mockPrismaService.visaDocumentation.findUnique.mockResolvedValue(null);
      mockPrismaService.visaDocumentation.create.mockResolvedValue({
        ...mockVisaRecord,
        status: VisaDocumentStatus.SUBMITTED,
        paymentStatus: PaymentStatus.PENDING_EVALUATION,
      });

      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@gmail.com',
        phone: '+2348012345678',
        dateOfBirth: '1992-05-15',
        nationality: 'Nigerian',
        residenceAddress: '123 Loveworld Street, Lagos',
        passportNumber: 'A12345678',
        passportIssueDate: '2022-01-10',
        passportExpiryDate: '2032-01-09',
        targetCountry: 'Canada',
        visaCategory: VisaCategory.TOURIST,
        intendedArrivalDate: '2026-10-01',
        intendedDepartureDate: '2026-10-21',
        purposeOfVisit: 'Vacation',
        passportDataPageUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
        passportPhotoWhiteBgUrl: 'https://s3.amazonaws.com/bucket/photo.jpg',
        proofOfFunds6MonthsUrl: 'https://s3.amazonaws.com/bucket/pof.pdf',
      };

      const result = await service.createVisaApplication(dto);
      expect(result.status).toBe(VisaDocumentStatus.SUBMITTED);
      expect(result.paymentStatus).toBe(PaymentStatus.PENDING_EVALUATION);
    });
  });

  describe('evaluateVisaCost', () => {
    it('should allocate total cost and update status to EVALUATED', async () => {
      mockPrismaService.visaDocumentation.findFirst.mockResolvedValue(
        mockVisaRecord,
      );
      mockPrismaService.visaDocumentation.update.mockResolvedValue({
        ...mockVisaRecord,
        totalAmount: new Prisma.Decimal(500.0),
        status: VisaDocumentStatus.EVALUATED,
        paymentStatus: PaymentStatus.AWAITING_PAYMENT,
      });

      const result = await service.evaluateVisaCost(
        'visa-uuid-001',
        { totalAmount: 500, allowInstallment: true },
        'manager@loveworld.com',
      );

      expect(result.status).toBe(VisaDocumentStatus.EVALUATED);
      expect(result.paymentStatus).toBe(PaymentStatus.AWAITING_PAYMENT);
    });
  });
});
