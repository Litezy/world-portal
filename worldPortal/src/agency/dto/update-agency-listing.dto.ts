import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  IsEnum,
} from 'class-validator';
import { AgencyListingStatus } from '@prisma/client';

export class UpdateAgencyListingDto {
  @ApiPropertyOptional({ description: 'Display name of the agency' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Legal registered company name' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Business registration / CAC number' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'ISO 2-character country code (e.g. NG, US)' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Full country name' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Short summary headline' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Detailed about section' })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ description: 'Logo image URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Primary contact email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Year founded' })
  @IsOptional()
  @IsNumber()
  yearFounded?: number;

  @ApiPropertyOptional({ description: 'Number of staff' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  staffCount?: number;

  @ApiPropertyOptional({
    description: 'Categories offered',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Cities operated in',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cities?: string[];

  @ApiPropertyOptional({
    description: 'Languages spoken',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    enum: AgencyListingStatus,
    description: 'Listing draft or publication status',
  })
  @IsOptional()
  @IsEnum(AgencyListingStatus)
  listingStatus?: AgencyListingStatus;

  @ApiPropertyOptional({
    description: 'Service offerings',
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  offerings?: any[];
}
