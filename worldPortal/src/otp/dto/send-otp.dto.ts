import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    example: 'applicant@example.com',
    description: 'Target email address for OTP verification',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    example: 'APPLICATION_SUBMISSION',
    description: 'Purpose of the OTP code',
  })
  @IsOptional()
  @IsString()
  purpose?: string;
}
