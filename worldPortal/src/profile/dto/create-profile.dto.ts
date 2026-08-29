import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({
    description: 'Email address of the user profile',
    example: 'partner.agency@loveworld.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Optional unique ID from external authentication service',
    example: '',
  })
  @IsString()
  @IsOptional()
  externalAuthId?: string;

  @ApiPropertyOptional({
    description: 'Optional phone number',
    example: '',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Assigned role (MANAGER, PARTNER, STAFF)',
    enum: UserRole,
    example: UserRole.STAFF,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
