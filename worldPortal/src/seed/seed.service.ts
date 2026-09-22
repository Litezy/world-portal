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

    this.logger.log('Seeding database with 10+ Agencies and 10+ Professionals...');
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

    // 3. Agencies Dataset (0 Agencies)
    const agenciesData: any[] = [];

    for (const a of agenciesData) {
      const agency = await this.prisma.agency.upsert({
        where: { slug: a.slug },
        update: { verification: a.verification, listingStatus: a.listingStatus },
        create: {
          slug: a.slug,
          name: a.name,
          legalName: a.legalName,
          registrationNumber: a.registrationNumber,
          countryCode: a.countryCode,
          country: a.country,
          cities: a.cities,
          categories: a.categories,
          summary: a.summary,
          about: a.about,
          email: a.email,
          phone: a.phone,
          yearFounded: a.yearFounded,
          staffCount: a.staffCount,
          languages: a.languages,
          verification: a.verification,
          listingStatus: a.listingStatus,
          rating: new Prisma.Decimal(a.rating),
          completedJobs: Math.floor(Math.random() * 50) + 10,
        },
      });

      // Agency User Account
      await this.prisma.agencyUser.upsert({
        where: { email: a.email },
        update: { passwordHash: defaultPasswordHash },
        create: {
          name: `${a.name} Manager`,
          email: a.email,
          passwordHash: defaultPasswordHash,
          role: AgencyUserRole.OWNER,
          agencyId: agency.id,
        },
      });
    }



    // 5. Visa Applications
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

    // 6. Passport Application
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
        agencies: agenciesData.length,
        agencyUsers: agenciesData.length,
        professionals: 0,
        visaApplications: 1,
        passportApplications: 1,
      },
    };
  }
}
