import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VisaCheckQueryDto {
  @ApiProperty({
    description: 'ISO alpha-2 or alpha-3 code of the passport country',
    example: 'CN',
  })
  @IsString()
  @IsNotEmpty()
  passport: string;

  @ApiProperty({
    description: 'ISO alpha-2 or alpha-3 code of the destination country',
    example: 'ID',
  })
  @IsString()
  @IsNotEmpty()
  destination: string;
}

export class PassportInfoDto {
  @ApiProperty({ description: 'Passport ISO country code', example: 'CN' })
  code: string;

  @ApiProperty({ description: 'Passport country name', example: 'China' })
  name: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'CNY' })
  currency_code?: string;
}

export class DestinationInfoDto {
  @ApiProperty({ description: 'Destination ISO country code', example: 'ID' })
  code: string;

  @ApiProperty({
    description: 'Destination country name',
    example: 'Indonesia',
  })
  name: string;

  @ApiPropertyOptional({ description: 'Continent name', example: 'Asia' })
  continent?: string;

  @ApiPropertyOptional({ description: 'Capital city', example: 'Jakarta' })
  capital?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'IDR' })
  currency_code?: string;

  @ApiPropertyOptional({
    description: 'Currency name',
    example: 'Indonesian Rupiah',
  })
  currency?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: '0.000425' })
  exchange?: string;

  @ApiPropertyOptional({
    description: 'Passport validity requirement',
    example: '6 months',
  })
  passport_validity?: string;

  @ApiPropertyOptional({
    description: 'International dial code',
    example: '+62',
  })
  phone_code?: string;

  @ApiPropertyOptional({ description: 'Timezone offset', example: '+08:00' })
  timezone?: string;

  @ApiPropertyOptional({ description: 'Population count', example: 277329163 })
  population?: number;

  @ApiPropertyOptional({ description: 'Land area in km2', example: 1916907 })
  area_km2?: number;

  @ApiPropertyOptional({
    description: 'Embassy info link',
    example: 'https://www.embassypages.com/china#titlePlaceholder2',
  })
  embassy_url?: string;
}

export class MandatoryRegistrationDto {
  @ApiProperty({ description: 'Registration form name', example: 'e-Arrival' })
  name: string;

  @ApiPropertyOptional({
    description: 'Badge color indicator',
    example: 'yellow',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Direct registration link',
    example: 'https://link.travel-buddy.ai/?link=76E321T3',
  })
  link?: string;
}

export class VisaRuleItemDto {
  @ApiProperty({
    description: 'Visa rule status name',
    example: 'Visa on arrival',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Allowed stay duration',
    example: '30 days',
  })
  duration?: string;

  @ApiPropertyOptional({
    description: 'Badge color indicator',
    example: 'blue',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Application link if applicable',
    example: 'https://link.travel-buddy.ai/?link=76E323T2',
  })
  link?: string;
}

export class VisaRulesDto {
  @ApiProperty({ type: VisaRuleItemDto, description: 'Primary visa rule' })
  primary_rule: VisaRuleItemDto;

  @ApiPropertyOptional({
    type: VisaRuleItemDto,
    description: 'Secondary visa rule',
  })
  secondary_rule?: VisaRuleItemDto;
}

export class VisaCheckDataDto {
  @ApiProperty({ type: PassportInfoDto, description: 'Passport information' })
  passport: PassportInfoDto;

  @ApiProperty({
    type: DestinationInfoDto,
    description: 'Destination information',
  })
  destination: DestinationInfoDto;

  @ApiPropertyOptional({
    type: MandatoryRegistrationDto,
    description: 'Mandatory entry registration requirements',
  })
  mandatory_registration?: MandatoryRegistrationDto;

  @ApiProperty({ type: VisaRulesDto, description: 'Visa requirement rules' })
  visa_rules: VisaRulesDto;
}

export class VisaCheckMetaDto {
  @ApiProperty({ description: 'API version', example: '2.0' })
  version: string;

  @ApiProperty({ description: 'Language code', example: 'en' })
  language: string;

  @ApiProperty({
    description: 'Generation timestamp',
    example: '2025-11-19T12:06:31+00:00',
  })
  generated_at: string;
}

export class VisaCheckResponseDto {
  @ApiProperty({
    type: VisaCheckDataDto,
    description: 'Detailed visa check result',
  })
  data: VisaCheckDataDto;

  @ApiPropertyOptional({
    type: VisaCheckMetaDto,
    description: 'Response metadata',
  })
  meta?: VisaCheckMetaDto;
}
