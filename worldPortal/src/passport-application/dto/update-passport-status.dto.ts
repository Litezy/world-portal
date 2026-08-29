import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PassportApplicationStatus } from '@prisma/client';

export class UpdatePassportStatusDto {
  @ApiProperty({
    enum: PassportApplicationStatus,
    example: PassportApplicationStatus.APPROVED,
    description:
      'Updated application review status (UNDER_REVIEW, APPROVED, REJECTED)',
  })
  @IsEnum(PassportApplicationStatus)
  @IsNotEmpty()
  status: PassportApplicationStatus;

  @ApiPropertyOptional({
    example: 'All documents verified successfully by staff.',
    description: 'Internal verification notes',
  })
  @IsString()
  @IsOptional()
  verificationNotes?: string;

  @ApiPropertyOptional({
    example: 'NIN slip does not match applicant name.',
    description: 'Reason for rejection if status is REJECTED',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
