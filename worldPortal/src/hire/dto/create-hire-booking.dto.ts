import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateHireBookingDto {
  @ApiProperty({ description: 'ID of professional to hire' })
  @IsString()
  @IsNotEmpty()
  professionalId: string;

  @ApiProperty({ description: 'Full name of traveller' })
  @IsString()
  @IsNotEmpty()
  travellerName: string;

  @ApiProperty({ description: 'Contact email of traveller' })
  @IsEmail()
  travellerEmail: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  travellerPhone?: string;

  @ApiProperty({ description: 'Destination city' })
  @IsString()
  @IsNotEmpty()
  destinationCity: string;

  @ApiProperty({ description: 'Start date and time (ISO string)' })
  @IsString()
  @IsNotEmpty()
  startsAt: string;

  @ApiProperty({ description: 'End date and time (ISO string)' })
  @IsString()
  @IsNotEmpty()
  endsAt: string;

  /**
   * Ignored, as are `currency` and `profileId`: the server prices a booking
   * from the professional's own listing and files it under the signed-in
   * applicant. Still accepted so a browser on an older build isn't refused.
   */
  @ApiPropertyOptional({
    deprecated: true,
    description: 'Ignored: the server prices the booking itself.',
  })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({
    deprecated: true,
    description: 'Ignored: the booking is filed under the signed-in applicant.',
  })
  @IsOptional()
  @IsString()
  profileId?: string;

  @ApiPropertyOptional({
    description:
      "One of the signed-in applicant's own visa applications (404 otherwise)",
  })
  @IsOptional()
  @IsString()
  visaDocumentationId?: string;

  @ApiPropertyOptional({
    deprecated: true,
    description: "Ignored: the booking is in the professional's currency.",
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Optional booking notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
