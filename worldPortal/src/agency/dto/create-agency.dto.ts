import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty({ description: 'Display name of the agency' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Legal registered company name' })
  @IsString()
  @IsNotEmpty()
  legalName: string;

  @ApiProperty({ description: 'Business registration / CAC number' })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiProperty({ description: 'ISO 2-character country code (e.g. NG, US)' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ description: 'Full country name' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Cities where agency operates', type: [String] })
  @IsArray()
  @IsString({ each: true })
  cities: string[];

  @ApiProperty({
    description: 'Categories offered (e.g. security, driving, catering)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiProperty({ description: 'Short summary headline' })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiProperty({ description: 'Detailed about section' })
  @IsString()
  @IsNotEmpty()
  about: string;

  @ApiPropertyOptional({ description: 'Logo image URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ description: 'Primary contact email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ description: 'Company website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Year company was founded' })
  @IsNumber()
  @Min(1800)
  yearFounded: number;

  @ApiProperty({ description: 'Number of staff' })
  @IsNumber()
  @Min(1)
  staffCount: number;

  @ApiProperty({ description: 'Languages spoken by staff', type: [String] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];
}
