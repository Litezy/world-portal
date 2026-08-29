import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VisaDocumentStatus } from '@prisma/client';

export class UpdateVisaStatusDto {
  @ApiProperty({
    enum: VisaDocumentStatus,
    example: VisaDocumentStatus.APPROVED,
    description:
      'Updated application review status (APPROVED, REJECTED, UNDER_REVIEW)',
  })
  @IsEnum(VisaDocumentStatus)
  @IsNotEmpty()
  status: VisaDocumentStatus;

  @ApiPropertyOptional({
    example: 'All documents verified successfully by staff.',
    description: 'Internal verification notes',
  })
  @IsString()
  @IsOptional()
  verificationNotes?: string;

  @ApiPropertyOptional({
    example: 'Passport scan illegible; please re-upload clear page.',
    description: 'Reason for rejection if status is REJECTED',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
