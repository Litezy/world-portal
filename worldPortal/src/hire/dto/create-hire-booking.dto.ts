import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, Min } from 'class-validator';

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

  @ApiProperty({ description: 'Calculated total booking amount' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Optional applicant profile ID' })
  @IsOptional()
  @IsString()
  profileId?: string;

  @ApiPropertyOptional({ description: 'Optional visa documentation ID' })
  @IsOptional()
  @IsString()
  visaDocumentationId?: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @ApiPropertyOptional({ description: 'Optional booking notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
