import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentOption } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class InitiatePaymentTransactionDto {
  @ApiPropertyOptional({
    description: 'Target visa documentation ID to initiate payment for',
    example: '',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  visaDocumentationId?: string;

  @ApiPropertyOptional({
    description: 'Optional profile ID initiating the payment',
    example: '',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, v) => Boolean(v))
  @IsString()
  profileId?: string;

  @ApiProperty({
    description: 'Payment option selected (FULL or HALF_INSTALLMENT)',
    enum: PaymentOption,
    example: PaymentOption.FULL,
  })
  @IsEnum(PaymentOption)
  @IsNotEmpty()
  paymentOption: PaymentOption;

  @ApiPropertyOptional({
    description:
      'Custom payment amount (defaults to calculated installment/full amount)',
    example: 500.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}
