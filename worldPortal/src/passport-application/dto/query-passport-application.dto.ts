import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PassportApplicationStatus, PassportCategory } from '@prisma/client';

export class QueryPassportApplicationDto {
  @ApiPropertyOptional({
    enum: PassportApplicationStatus,
    description: 'Filter by application review status',
  })
  @IsEnum(PassportApplicationStatus)
  @IsOptional()
  status?: PassportApplicationStatus;

  @ApiPropertyOptional({
    enum: PassportCategory,
    description: 'Filter by passport category',
  })
  @IsEnum(PassportCategory)
  @IsOptional()
  passportCategory?: PassportCategory;

  @ApiPropertyOptional({
    example: '',
    description: 'Search term for name, email, NIN, or applicationNo',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
