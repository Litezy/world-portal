import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadResponseDto } from './dto/upload-response.dto';
import { IStorageProvider } from './providers/storage-provider.interface';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';

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

  async uploadDocument(file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file || !file.buffer) {
      this.logger.warn('Upload attempted without file payload');
      throw new BadRequestException('No file uploaded or file buffer is empty');
    }

    this.logger.log(
      `Uploading file via provider=${this.providerType.toUpperCase()}: originalName=${file.originalname}, size=${file.size} bytes`,
    );

    const result = await this.activeProvider.uploadFile(file);

    return {
      url: result.url,
      key: result.key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
