import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MarkNotificationReadDto {
  @ApiProperty({
    description:
      "The caller's own recipient id (from their session). The notification must belong to it.",
    example: 'agency-id',
  })
  @IsString()
  @IsNotEmpty()
  recipientId: string;
}
