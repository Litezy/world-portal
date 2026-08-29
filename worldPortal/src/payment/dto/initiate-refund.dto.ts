import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InitiateRefundDto {
  @ApiProperty({
    description: 'Transaction reference to be refunded',
    example: 'TXN-2026-8941',
  })
  @IsString()
  @IsNotEmpty()
  transactionRef: string;

  @ApiProperty({
    description: 'Reason for processing the refund request',
    example: 'Applicant cancelled application before embassy submission',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
