import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Recipient user ID or agency ID or email' })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ description: 'Recipient type: APPLICANT, AGENCY, or ADMIN', example: 'APPLICANT' })
  @IsString()
  @IsNotEmpty()
  recipientType: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification message body' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Notification type code', example: 'STAFF_ASSIGNED' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'Additional structured metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
