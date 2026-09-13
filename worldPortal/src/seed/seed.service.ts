import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunSeedDto } from './dto/run-seed.dto';
import {
  UserRole,
  AgencyVerificationStatus,
  AgencyListingStatus,
  AgencyUserRole,
  AgencyStaffStatus,
  AgencyDocumentKind,
  AgencyDocumentStatus,
  AssignmentStatus,
  VisaDocumentStatus,
  PassportCategory,
  PassportValidity,
  BookletType,
  PassportApplicationStatus,
  Gender,
  Prisma,
} from '@prisma/client';
import { createHash } from 'crypto';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private readonly DEFAULT_SECRET_CODE = 'WORLD_PORTAL_SEED_2026_SECURE';
  private readonly DEFAULT_PASSWORD = 'Password@2';

  constructor(private readonly prisma: PrismaService) {}

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  /**
   * Remote database seeding triggered via REST API with secret code authorization
   */
  async runSeed(dto: RunSeedDto) {
    const requiredCode = process.env.SEED_SECRET_CODE || this.DEFAULT_SECRET_CODE;

    if (dto.secretCode !== requiredCode) {
      this.logger.warn(`Unauthorized seeding attempt with code=${dto.secretCode}`);
      throw new UnauthorizedException('Invalid seeding secret code');
    }

    this.logger.log('Seeding database with presentation demo dataset...');
    const defaultPasswordHash = this.hashPassword(this.DEFAULT_PASSWORD);

    // 1. Manager Profile
    const manager = await this.prisma.profile.upsert({
      where: { email: 'manager@loveworld.com' },
      update: {},
      create: {
        email: 'manager@loveworld.com',
        firstName: 'System',
        lastName: 'Manager',
        role: UserRole.MANAGER,
        externalAuthId: 'external-auth-manager-001',
        isActive: true,
      },
    });

    // 2. Bank Accounts
    await this.prisma.bankAccount.upsert({
      where: { id: 'bank-usd-001' },
      update: {},
      create: {
        id: 'bank-usd-001',
        bankName: 'Zenith Bank',
        accountName: 'World Portal Global Ltd',
        accountNumber: '5070192834',
        swiftCode: 'ZEIBNGLA',
        currency: 'USD',
        instructions: 'Please include transaction reference in payment remarks.',
        isActive: true,
      },
    });

    await this.prisma.bankAccount.upsert({
      where: { id: 'bank-ngn-001' },
      update: {},
      create: {
        id: 'bank-ngn-001',
        bankName: 'GTBank',
        accountName: 'World Portal Services Nigeria',
        accountNumber: '0129485763',
        currency: 'NGN',
        instructions: 'Transfer to GTBank NGN Account.',
        isActive: true,
      },
    });

    // 3. Agency 1: Apex Security Services
    const apex = await this.prisma.agency.upsert({
      where: { slug: 'apex-security-services' },
      update: {
        verification: AgencyVerificationStatus.VERIFIED,
        listingStatus: AgencyListingStatus.LIVE,
      },
      create: {
        slug: 'apex-security-services',
        name: 'Apex Security Services',
        legalName: 'Apex Security Nigeria Limited',
        registrationNumber: 'RC-1048291',
        countryCode: 'NG',
        country: 'Nigeria',
        cities: ['Lagos', 'Abuja'],
        categories: ['security'],
        summary: 'Premium close-protection and event security agency.',
        about: 'Apex Security provides vetted close protection bodyguards and event security.',
        logoUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
        email: 'owner@apexsecurity.ng',
        phone: '+2348012345678',
        website: 'https://apexsecurity.ng',
        yearFounded: 2018,
        staffCount: 45,
        languages: ['English', 'Yoruba'],
        verification: AgencyVerificationStatus.VERIFIED,
        listingStatus: AgencyListingStatus.LIVE,
        rating: new Prisma.Decimal(4.9),
        completedJobs: 42,
        commissionRate: new Prisma.Decimal(0.15),
      },
    });

    // Agency 1 User Account
    await this.prisma.agencyUser.upsert({
      where: { email: 'owner@apexsecurity.ng' },
      update: { passwordHash: defaultPasswordHash },
      create: {
        name: 'Raphael Etta',
        email: 'owner@apexsecurity.ng',
        passwordHash: defaultPasswordHash,
        role: AgencyUserRole.OWNER,
        agencyId: apex.id,
      },
    });

    // Agency 1 Staff Roster
    const staff1 = await this.prisma.agencyStaff.upsert({
      where: { id: 'staff-apex-001' },
      update: {},
      create: {
        id: 'staff-apex-001',
        agencyId: apex.id,
        name: 'Emmanuel Adebayo',
        role: 'Senior Close Protection Officer',
        category: 'security',
        phone: '+2348021112233',
        languages: ['English', 'Yoruba'],
        experienceYears: 8,
        status: AgencyStaffStatus.ASSIGNED,
        backgroundChecked: true,
        rating: new Prisma.Decimal(4.9),
      },
    });

    await this.prisma.agencyStaff.upsert({
      where: { id: 'staff-apex-002' },
      update: {},
      create: {
        id: 'staff-apex-002',
        agencyId: apex.id,
        name: 'Chidi Okafor',
        role: 'Event Security Guard',
        category: 'security',
        phone: '+2348034445566',
        languages: ['English', 'Igbo'],
        experienceYears: 5,
        status: AgencyStaffStatus.AVAILABLE,
        backgroundChecked: true,
        rating: new Prisma.Decimal(4.7),
      },
    });

    // Agency 1 Documents
    await this.prisma.agencyDocument.upsert({
      where: { id: 'doc-apex-001' },
      update: {},
      create: {
        id: 'doc-apex-001',
        agencyId: apex.id,
        kind: AgencyDocumentKind.BUSINESS_REGISTRATION,
        status: AgencyDocumentStatus.APPROVED,
        fileName: 'cac_certificate.pdf',
        fileUrl: 'https://storage.worldportal.com/docs/cac_apex.pdf',
        uploadedAt: new Date(),
      },
    });

    // Agency 1 Assignment
    await this.prisma.agencyAssignment.upsert({
      where: { reference: 'ASG-APEX-001' },
      update: {},
      create: {
        reference: 'ASG-APEX-001',
        agencyId: apex.id,
        category: 'security',
        offeringId: 'offering-sec-01',
        offeringTitle: 'Executive Close Protection',
        travellerName: 'John Doe Delegation',
        travellerEmail: 'john.doe@example.com',
        travellerPhone: '+14155552671',
        partySize: 4,
        destinationCity: 'Lagos',
        destinationCountry: 'Nigeria',
        destinationCountryCode: 'NG',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000 * 3),
        status: AssignmentStatus.IN_PROGRESS,
        assignedStaffIds: [staff1.id],
        staffRequired: 1,
        notes: 'Requires 24/7 armed escort from airport to hotel.',
        gross: new Prisma.Decimal(2500.0),
        currency: 'USD',
        platformFee: new Prisma.Decimal(375.0),
        netToAgency: new Prisma.Decimal(2125.0),
      },
    });

    // 4. Agency 2: Vanguard Executive Transit
    const vanguard = await this.prisma.agency.upsert({
      where: { slug: 'vanguard-executive-transit' },
      update: {},
      create: {
        slug: 'vanguard-executive-transit',
        name: 'Vanguard Executive Transit',
        legalName: 'Vanguard Mobility Services Ltd',
        registrationNumber: 'RC-993821',
        countryCode: 'NG',
        country: 'Nigeria',
        cities: ['Abuja'],
        categories: ['driving'],
        summary: 'Armored SUVs and executive chauffeur services.',
        about: 'Chauffeured transportation for corporate executives and diplomats.',
        email: 'manager@vanguardtransit.ng',
        phone: '+2348098765432',
        yearFounded: 2020,
        staffCount: 18,
        languages: ['English', 'Hausa'],
        verification: AgencyVerificationStatus.PENDING,
        listingStatus: AgencyListingStatus.IN_REVIEW,
      },
    });

    await this.prisma.agencyUser.upsert({
      where: { email: 'manager@vanguardtransit.ng' },
      update: { passwordHash: defaultPasswordHash },
      create: {
        name: 'Ibrahim Musa',
        email: 'manager@vanguardtransit.ng',
        passwordHash: defaultPasswordHash,
        role: AgencyUserRole.MANAGER,
        agencyId: vanguard.id,
      },
    });

    // 5. Professionals Directory Profiles
    await this.prisma.professionalProfile.upsert({
      where: { slug: 'aya-kobayashi' },
      update: {},
      create: {
        slug: 'aya-kobayashi',
        name: 'Aya Kobayashi',
        title: 'Senior Private Guide & Translator',
        category: 'interpreting',
        bio: 'Licensed bilingual tour guide and interpreter with 10 years experience.',
        avatarUrl: '/images/pros/aya-kobayashi.jpg',
        countryCode: 'JP',
        country: 'Japan',
        city: 'Tokyo',
        hourlyRate: new Prisma.Decimal(65.0),
        currency: 'USD',
        languages: ['English', 'Japanese'],
        rating: new Prisma.Decimal(4.9),
        completedJobs: 38,
        isVerified: true,
      },
    });

    await this.prisma.professionalProfile.upsert({
      where: { slug: 'bruno-ferreira' },
      update: {},
      create: {
        slug: 'bruno-ferreira',
        name: 'Bruno Ferreira',
        title: 'Executive Chauffeur & Security Driver',
        category: 'driving',
        bio: 'Professional evasive-driving trained chauffeur specializing in VIP transport.',
        avatarUrl: '/images/pros/bruno-ferreira.jpg',
        countryCode: 'BR',
        country: 'Brazil',
        city: 'Rio de Janeiro',
        hourlyRate: new Prisma.Decimal(50.0),
        currency: 'USD',
        languages: ['English', 'Portuguese', 'Spanish'],
        rating: new Prisma.Decimal(4.8),
        completedJobs: 52,
        isVerified: true,
      },
    });

    // 6. Visa Application
    await this.prisma.visaDocumentation.upsert({
      where: { applicationNo: 'VISA-2026-8812' },
      update: {},
      create: {
        applicationNo: 'VISA-2026-8812',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+14155552671',
        dateOfBirth: new Date('1988-03-12'),
        gender: Gender.MALE,
        nationality: 'United States',
        residenceAddress: '742 Evergreen Terrace, Springfield, US',
        passportNumber: 'A09182736',
        passportIssueDate: new Date('2020-01-10'),
        passportExpiryDate: new Date(Date.now() + 86400000 * 365),
        targetCountry: 'United Kingdom',
        visaCategory: 'TOURIST',
        intendedArrivalDate: new Date(Date.now() + 86400000 * 30),
        intendedDepartureDate: new Date(Date.now() + 86400000 * 45),
        purposeOfVisit: 'Vacation and tourism',
        passportDataPageUrl: 'https://storage.worldportal.com/visas/passport_john.pdf',
        passportPhotoWhiteBgUrl: 'https://storage.worldportal.com/visas/photo_john.jpg',
        proofOfFunds6MonthsUrl: 'https://storage.worldportal.com/visas/funds_john.pdf',
        status: VisaDocumentStatus.EVALUATED,
        totalAmount: new Prisma.Decimal(850.0),
        amountPaid: new Prisma.Decimal(0.0),
        balanceDue: new Prisma.Decimal(850.0),
        currency: 'USD',
        createdBy: 'system-seed',
      },
    });

    // 7. Passport Application
    await this.prisma.passportApplication.upsert({
      where: { applicationNo: 'PASS-2026-4410' },
      update: {},
      create: {
        applicationNo: 'PASS-2026-4410',
        surname: 'Ojukwu',
        firstName: 'David',
        email: 'david@example.com',
        contactPhone: '+2348055511223',
        sex: Gender.MALE,
        dateOfBirth: new Date('1994-06-15'),
        placeOfBirth: 'Enugu',
        homeTown: 'Nnewi',
        stateOfOrigin: 'Anambra',
        permanentAddress: '12 Marina Road, Lagos',
        occupation: 'Software Engineer',
        maritalStatus: 'Single',
        colourOfEyes: 'Brown',
        colourOfHair: 'Black',
        height: '1.82m',
        ninNumber: '12345678901',
        nextOfKinName: 'Mary Ojukwu',
        nextOfKinPhone: '+2348033344556',
        nextOfKinRelationship: 'Sister',
        nextOfKinAddress: '12 Marina Road, Lagos',
        passportCategory: PassportCategory.FRESH,
        validity: PassportValidity.TEN_YEARS,
        bookletType: BookletType.SIXTY_FOUR_PAGES,
        status: PassportApplicationStatus.EVALUATED,
        totalAmount: new Prisma.Decimal(120000.0),
        currency: 'NGN',
        ninDocumentUrl: 'https://storage.worldportal.com/passports/nin_david.jpg',
        birthCertificateUrl: 'https://storage.worldportal.com/passports/birth_david.jpg',
        passportPhotoUrl: 'https://storage.worldportal.com/passports/photo_david.jpg',
        createdBy: 'system-seed',
      },
    });

    this.logger.log('Database presentation seed completed successfully!');

    return {
      success: true,
      message: 'Database presentation seed executed successfully',
      defaultPassword: this.DEFAULT_PASSWORD,
      summary: {
        managerProfile: manager.email,
        bankAccounts: 2,
        agencies: 2,
        agencyUsers: 2,
        agencyStaff: 2,
        agencyDocuments: 1,
        agencyAssignments: 1,
        professionals: 2,
        visaApplications: 1,
        passportApplications: 1,
      },
    };
  }
}
