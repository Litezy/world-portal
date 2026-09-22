import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { AgencyUserRole } from '@prisma/client';

export class AgencyLoginDto {
  @ApiProperty({ description: 'Agency user email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class CreateAgencyUserDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: AgencyUserRole, description: 'Role within agency' })
  @IsOptional()
  @IsEnum(AgencyUserRole)
  role?: AgencyUserRole;

  @ApiProperty({ description: 'Agency ID' })
  @IsString()
  @IsNotEmpty()
  agencyId: string;
}
