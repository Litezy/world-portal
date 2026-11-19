import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { UploadResponseDto } from './dto/upload-response.dto';
import { IStorageProvider } from './providers/storage-provider.interface';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import { detectDocumentType, MAX_UPLOAD_BYTES } from './document-type';

/**
 * The uploaded file's own name, for display only: no folders, no control
 * characters, bounded length. It never becomes part of a storage path.
 */
function displayName(originalName: string | undefined, fallback: string) {
  const name = (originalName ?? '')
    .split(/[\\/]/)
    .pop()!
    .replace(/[\p{Cc}]/gu, '')
    .trim()
    .slice(0, 200);
  return name || fallback;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly activeProvider: IStorageProvider;
  private readonly providerType: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Provider: S3StorageProvider,
    private readonly cloudinaryProvider: CloudinaryStorageProvider,
  ) {
    this.providerType = this.configService
      .get<string>('STORAGE_PROVIDER', 's3')
      .toLowerCase();

    if (this.providerType === 'cloudinary') {
      this.activeProvider = this.cloudinaryProvider;
      this.logger.log('Active storage provider configured: CLOUDINARY');
    } else {
      this.activeProvider = this.s3Provider;
      this.logger.log('Active storage provider configured: AWS S3');
    }
  }

  /**
   * Stores one applicant document. Enforced here, whoever the caller:
   * at most 10MB; PDF, JPEG, PNG or WEBP as judged by the file's bytes (the
   * client's MIME type is ignored); and a generated storage name, so nothing
   * the client sends decides where the file lands or what type it is served as.
   */
  async uploadDocument(file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file || !file.buffer) {
      this.logger.warn('Upload attempted without file payload');
      throw new BadRequestException('No file uploaded or file buffer is empty');
    }

    if (file.buffer.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('That file is over the 10MB limit.');
    }

    const type = detectDocumentType(file.buffer);
    if (!type) {
      this.logger.warn(
        `Upload refused: content is not PDF/JPEG/PNG/WEBP (claimed ${file.mimetype})`,
      );
      throw new BadRequestException('Use a PDF, JPG, PNG or WEBP file.');
    }

    const key = `documents/${randomUUID()}.${type.extension}`;
    this.logger.log(
      `Uploading via provider=${this.providerType.toUpperCase()}: key=${key}, type=${type.mime}, size=${file.buffer.length} bytes`,
    );

    const result = await this.activeProvider.uploadFile({
      key,
      body: file.buffer,
      contentType: type.mime,
    });

    return {
      url: result.url,
      key: result.key,
      originalName: displayName(
        file.originalname,
        `document.${type.extension}`,
      ),
      mimeType: type.mime,
      size: file.buffer.length,
    };
  }
}
