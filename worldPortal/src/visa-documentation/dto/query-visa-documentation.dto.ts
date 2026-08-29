import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  VisaDocumentStatus,
  PaymentStatus,
  VisaCategory,
} from '@prisma/client';

export class QueryVisaDocumentationDto {
  @ApiPropertyOptional({
    enum: VisaDocumentStatus,
    description: 'Filter by application review status',
  })
  @IsEnum(VisaDocumentStatus)
  @IsOptional()
  status?: VisaDocumentStatus;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Filter by payment status',
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    enum: VisaCategory,
    description: 'Filter by visa category',
  })
  @IsEnum(VisaCategory)
  @IsOptional()
  visaCategory?: VisaCategory;

  @ApiPropertyOptional({
    example: '',
    description: 'Filter by destination country',
  })
  @IsString()
  @IsOptional()
  targetCountry?: string;

  @ApiPropertyOptional({
    example: '',
    description:
      'Search term for name, email, passport number, or applicationNo',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
