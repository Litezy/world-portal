import {
  IsNumber,
  IsBoolean,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvaluateVisaCostDto {
  @ApiProperty({
    example: 500.0,
    description: 'Total processing cost evaluated by admin',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalAmount: number;

  @ApiPropertyOptional({
    example: 'USD',
    description: 'Billing currency (e.g., USD, NGN, EUR, GBP, CAD, AUD)',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether applicant can pay via 50% half installment',
  })
  @IsBoolean()
  @IsOptional()
  allowInstallment?: boolean;
}
