import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PassportCategory,
  PassportValidity,
  BookletType,
  Gender,
} from '@prisma/client';

export class CreatePassportApplicationDto {
  @ApiProperty({
    enum: PassportCategory,
    example: PassportCategory.FRESH,
    description: 'Passport application category',
  })
  @IsEnum(PassportCategory)
  @IsNotEmpty()
  passportCategory: PassportCategory;

  @ApiProperty({ example: 'Okafor', description: 'Applicant surname' })
  @IsString()
  @IsNotEmpty()
  surname: string;

  @ApiProperty({ example: 'Chinedu', description: 'Applicant first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({
    example: 'Emeka',
    description: 'Applicant middle name',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  middleName?: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Applicant sex',
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  sex: Gender;

  @ApiProperty({
    example: '12345678901',
    description: 'National Identification Number (NIN)',
  })
  @IsString()
  @IsNotEmpty()
  ninNumber: string;

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
    example: 'Enugu',
    description: 'Place of birth',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  placeOfBirth?: string;

  @ApiPropertyOptional({
    example: 'A12345678',
    description:
      'Existing passport number (for RENEWAL, DAMAGE, MARRIAGE, DIVORCE categories)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  existingPassportNumber?: string;

  @ApiPropertyOptional({
    example: 'Nsukka',
    description: 'Home town',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  homeTown?: string;

  @ApiPropertyOptional({
    example: 'Enugu State',
    description: 'State of origin',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  stateOfOrigin?: string;

  @ApiPropertyOptional({
    example: '123 Loveworld Street, Lagos',
    description: 'Permanent address',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  permanentAddress?: string;

  @ApiPropertyOptional({
    example: 'Software Engineer',
    description: 'Occupation',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Contact phone number',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  contactPhone?: string;

  @ApiProperty({
    example: 'chinedu.okafor@gmail.com',
    description: 'Applicant contact email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    example: 'Single',
    description: 'Marital status',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  maritalStatus?: string;

  @ApiPropertyOptional({
    example: 'Brown',
    description: 'Colour of eyes',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  colourOfEyes?: string;

  @ApiPropertyOptional({
    example: 'Black',
    description: 'Colour of hair',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  colourOfHair?: string;

  @ApiPropertyOptional({
    example: `5'8"`,
    description: 'Height',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  height?: string;

  @ApiPropertyOptional({
    example: '',
    description: 'Maiden name (if applicable)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  maidenName?: string;

  @ApiPropertyOptional({
    example: 'Ifeoma Okafor',
    description: 'Next of kin full name',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  nextOfKinName?: string;

  @ApiPropertyOptional({
    example: '+2348098765432',
    description: 'Next of kin phone number',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  nextOfKinPhone?: string;

  @ApiPropertyOptional({
    example: 'Spouse',
    description: 'Relationship to next of kin',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  nextOfKinRelationship?: string;

  @ApiPropertyOptional({
    example: '123 Loveworld Street, Lagos',
    description: 'Address of next of kin',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  nextOfKinAddress?: string;

  @ApiPropertyOptional({
    enum: PassportValidity,
    default: PassportValidity.FIVE_YEARS,
    description: 'Passport booklet validity period',
    required: false,
  })
  @IsOptional()
  @IsEnum(PassportValidity)
  validity?: PassportValidity;

  @ApiPropertyOptional({
    enum: BookletType,
    default: BookletType.THIRTY_TWO_PAGES,
    description: 'Passport booklet page count',
    required: false,
  })
  @IsOptional()
  @IsEnum(BookletType)
  bookletType?: BookletType;

  @ApiPropertyOptional({
    example: 'https://.../birth-certificate.pdf',
    description: 'Birth certificate document URL',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsUrl()
  birthCertificateUrl?: string;

  @ApiPropertyOptional({
    example: 'https://.../nin-slip.pdf',
    description: 'NIN document/slip URL',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsUrl()
  ninDocumentUrl?: string;

  @ApiPropertyOptional({
    example: 'https://.../passport-photo.jpg',
    description: 'White background passport photograph URL',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsUrl()
  passportPhotoUrl?: string;

  @ApiPropertyOptional({
    example: '',
    description:
      'Optional profile ID if submitted by an authenticated user/partner',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  profileId?: string;
}
