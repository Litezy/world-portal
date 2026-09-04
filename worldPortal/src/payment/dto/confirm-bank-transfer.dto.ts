import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { PaymentOption } from '@prisma/client';

export class ConfirmBankTransferDto {
  @IsString()
  @IsNotEmpty()
  visaDocumentationId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(PaymentOption)
  paymentOption: PaymentOption;

  @IsString()
  @IsOptional()
  bankReference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
