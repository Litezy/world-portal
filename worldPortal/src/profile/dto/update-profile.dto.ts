import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Updated email address',
    example: 'john.doe.updated@loveworld.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Updated first name',
    example: 'Johnny',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Updated last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Optional unique ID from external authentication service',
    example: '',
  })
  @IsString()
  @IsOptional()
  externalAuthId?: string;

  @ApiPropertyOptional({
    description: 'Updated phone number',
    example: '',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Updated user role (MANAGER, PARTNER, STAFF)',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Activation status flag',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
