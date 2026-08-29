import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUrl,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VisaCategory, Gender } from '@prisma/client';

export class CreateVisaDocumentationDto {
  @ApiProperty({ example: 'John', description: 'Applicant first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Applicant last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'john.doe@gmail.com',
    description: 'Applicant contact email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Applicant contact phone number',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '1992-05-15',
    description: 'Date of birth (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    enum: Gender,
    default: Gender.MALE,
    description: 'Applicant gender',
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    example: 'Nigerian',
    description: 'Applicant nationality',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({
    example: '123 Loveworld Street, Lagos',
    description: 'Current residence address',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  residenceAddress?: string;

  @ApiPropertyOptional({
    example: 'A12345678',
    description: 'International passport number',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  passportNumber?: string;

  @ApiPropertyOptional({
    example: '2022-01-10',
    description: 'Passport issue date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsDateString()
  passportIssueDate?: string;

  @ApiPropertyOptional({
    example: '2032-01-09',
    description: 'Passport expiration date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsDateString()
  passportExpiryDate?: string;

  @ApiPropertyOptional({
    example: '',
    description: 'Passport issuing authority',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  passportIssuingAuthority?: string;

  @ApiProperty({
    example: 'Canada',
    description: 'Destination country for visa application',
  })
  @IsString()
  @IsNotEmpty()
  targetCountry: string;

  @ApiPropertyOptional({
    enum: VisaCategory,
    default: VisaCategory.TOURIST,
    description: 'Visa category',
    required: false,
  })
  @IsOptional()
  @IsEnum(VisaCategory)
  visaCategory?: VisaCategory;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Intended arrival date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsDateString()
  intendedArrivalDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-21',
    description: 'Intended departure date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsDateString()
  intendedDepartureDate?: string;

  @ApiPropertyOptional({
    example: 'Annual vacation and tourism',
    description: 'Purpose of travel',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  purposeOfVisit?: string;

  @ApiPropertyOptional({
    example:
      'https://s3.amazonaws.com/world-portal-documents/passport-datapage.pdf',
    description: 'Datapage International Passport S3 URL',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsUrl()
  passportDataPageUrl?: string;

  @ApiPropertyOptional({
    example:
      'https://s3.amazonaws.com/world-portal-documents/passport-photo.jpg',
    description: 'Passport photo on white background S3 URL',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsUrl()
  passportPhotoWhiteBgUrl?: string;

  @ApiPropertyOptional({
    example:
      'https://s3.amazonaws.com/world-portal-documents/proof-of-funds.pdf',
    description: '6 months Proof of Funds S3 URL',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsUrl()
  proofOfFunds6MonthsUrl?: string;

  @ApiPropertyOptional({
    example:
      'https://s3.amazonaws.com/world-portal-documents/business-cert.pdf',
    description: 'Business document and certificate S3 URL',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsUrl()
  businessRegistrationCertUrl?: string;

  @ApiPropertyOptional({
    example: 'https://s3.amazonaws.com/world-portal-documents/tax-cert.pdf',
    description: 'Tax Certificate S3 URL',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsUrl()
  taxCertificateUrl?: string;

  @ApiPropertyOptional({
    example:
      'https://s3.amazonaws.com/world-portal-documents/marriage-cert.pdf',
    description: 'Marriage certificate S3 URL',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsUrl()
  marriageCertificateUrl?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://s3.amazonaws.com/world-portal-documents/child-birth-cert-1.pdf',
    ],
    description: 'Children birth certificate S3 URLs',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  childrenBirthCertUrls?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://s3.amazonaws.com/world-portal-documents/landed-property-doc.pdf',
    ],
    description: 'Landed property document S3 URLs',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  landedPropertyDocUrls?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://s3.amazonaws.com/world-portal-documents/previous-visa-scan.pdf',
    ],
    description: 'Previous visas scans S3 URLs',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previousVisasScanUrls?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://s3.amazonaws.com/world-portal-documents/supporting-doc-1.pdf',
    ],
    description: 'General supporting document S3 URLs',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingDocUrls?: string[];

  @ApiPropertyOptional({
    example: '',
    description:
      'Optional profile ID if submitted by authenticated user/partner',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  profileId?: string;
}
