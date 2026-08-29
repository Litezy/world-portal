import {
  IsNumber,
  IsBoolean,
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
    example: true,
    description: 'Whether applicant can pay via 50% half installment',
  })
  @IsBoolean()
  @IsOptional()
  allowInstallment?: boolean;
}
