import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { AgencyDocumentKind, AgencyDocumentStatus } from '@prisma/client';

export class UploadAgencyDocumentDto {
  @ApiProperty({
    enum: AgencyDocumentKind,
    description: 'Paperwork category / document kind',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(AgencyDocumentKind)
  kind: AgencyDocumentKind;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'Uploaded file URL (e.g. S3 key or URL)' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Expiration date (ISO format string)' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class UpdateDocumentStatusDto {
  @ApiProperty({
    enum: AgencyDocumentStatus,
    description: 'Updated review status of compliance document',
  })
  @IsEnum(AgencyDocumentStatus)
  status: AgencyDocumentStatus;

  @ApiPropertyOptional({ description: 'Reviewer notes or reason for rejection' })
  @IsOptional()
  @IsString()
  note?: string;
}
