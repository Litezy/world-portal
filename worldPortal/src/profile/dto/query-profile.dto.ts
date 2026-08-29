import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryProfileDto {
  @ApiPropertyOptional({
    description: 'Filter profiles by role',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Search term for name or email',
    example: '',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
