import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentTransactionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export class QueryPaymentTransactionDto {
  @ApiPropertyOptional({
    description:
      'Filter transactions by status (INITIATED, CONFIRMED, FAILED, REFUNDED)',
    enum: PaymentTransactionStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentTransactionStatus)
  status?: PaymentTransactionStatus;

  @ApiPropertyOptional({
    description: 'Filter transactions by visa documentation ID',
    example: '',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  visaDocumentationId?: string;

  @ApiPropertyOptional({
    description: 'Search term for transactionRef or initiatedBy',
    example: '',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  search?: string;
}
