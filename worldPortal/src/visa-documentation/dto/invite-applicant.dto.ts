import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteApplicantDto {
  @ApiProperty({
    example: 'Biometric Data Capture',
    description: 'Purpose of the appointment invitation',
  })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({
    example: '2026-09-15',
    description: 'Scheduled date for the invitation',
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: '10:30 AM',
    description: 'Scheduled time for the invitation',
  })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({
    example: 'Embassy Headquarters, Room 302',
    description: 'Location or venue for the appointment',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({
    example: 'Please bring your original passport and proof of address.',
    description: 'Optional note or instructions for the applicant',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
