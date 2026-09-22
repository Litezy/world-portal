import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  IsEnum,
} from 'class-validator';
import { AgencyStaffStatus } from '@prisma/client';

export class AddAgencyStaffDto {
  @ApiProperty({ description: 'Full name of staff member' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Role or designation (e.g. Senior Guard, Lead Chef, Driver)' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ description: 'Service category (e.g. security, driving, catering)' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'Photo URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Languages spoken', type: [String] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @ApiProperty({ description: 'Years of experience' })
  @IsNumber()
  @Min(0)
  experienceYears: number;

  @ApiPropertyOptional({ description: 'Whether background check has passed' })
  @IsOptional()
  @IsBoolean()
  backgroundChecked?: boolean;

  @ApiPropertyOptional({ enum: AgencyStaffStatus, description: 'Current status' })
  @IsOptional()
  @IsEnum(AgencyStaffStatus)
  status?: AgencyStaffStatus;
}

export class UpdateAgencyStaffDto {
  @ApiPropertyOptional({ description: 'Full name of staff member' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Role or designation' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Service category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Photo URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Languages spoken', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Years of experience' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ description: 'Whether background check has passed' })
  @IsOptional()
  @IsBoolean()
  backgroundChecked?: boolean;

  @ApiPropertyOptional({ enum: AgencyStaffStatus, description: 'Current status' })
  @IsOptional()
  @IsEnum(AgencyStaffStatus)
  status?: AgencyStaffStatus;
}
