import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Document file scan to upload (PDF, JPEG, PNG, WEBP max 10MB)',
  })
  file: any;
}
