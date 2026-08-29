import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdatePaymentConfigDto {
  @ApiPropertyOptional({
    description: 'Partner cost markup percentage (e.g., 10.00 for 10%)',
    example: 10.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  partnerMarkupPercentage?: number;

  @ApiPropertyOptional({
    description: 'Platform service fee percentage (e.g., 5.00 for 5%)',
    example: 5.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  serviceFeePercentage?: number;

  @ApiPropertyOptional({
    description:
      'Refund surcharge percentage retained on refunds (e.g., 15.00 for 15%)',
    example: 15.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  refundSurchargePercentage?: number;
}
