import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description:
      'Direct public or custom domain S3 URL of the uploaded document',
    example:
      'https://world-portal-documents.s3.us-east-1.amazonaws.com/documents/b7a9f1e0-passport-scan.pdf',
  })
  url: string;

  @ApiProperty({
    description: 'S3 object key path inside the bucket',
    example: 'documents/b7a9f1e0-passport-scan.pdf',
  })
  key: string;

  @ApiProperty({
    description: 'Original uploaded file name',
    example: 'passport-scan.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type of the uploaded file',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Size of the uploaded file in bytes',
    example: 1048576,
  })
  size: number;
}
