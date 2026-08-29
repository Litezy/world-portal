import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPaymentTransactionDto {
  @ApiProperty({
    description: 'Transaction reference generated during payment initiation',
    example: 'TXN-PAY-894120',
  })
  @IsString()
  @IsNotEmpty()
  transactionRef: string;
}
