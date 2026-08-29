import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import {
  IStorageProvider,
  StorageUploadResult,
} from './storage-provider.interface';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly customDomain: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    this.bucketName = this.configService.get<string>(
      'AWS_S3_BUCKET_NAME',
      'world-portal-documents',
    );
    this.customDomain = this.configService.get<string>('AWS_S3_CUSTOM_DOMAIN');

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (
      accessKeyId &&
      secretAccessKey &&
      accessKeyId !== 'your-access-key-id' &&
      secretAccessKey !== 'your-secret-access-key'
    ) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(
        `S3StorageProvider initialized for bucket=${this.bucketName}, region=${this.region}`,
      );
    } else {
      this.logger.warn(
        'AWS S3 credentials not fully configured in environment. Operating in dev mock S3 mode.',
      );
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<StorageUploadResult> {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `documents/${randomUUID()}-${sanitizedFilename}`;

    let url: string;

    if (this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        await this.s3Client.send(command);
        url = this.constructS3Url(key);
        this.logger.log(`Document uploaded to AWS S3: url=${url}`);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown S3 error';
        this.logger.error(`AWS S3 PutObjectCommand failed: ${msg}`);
        throw new InternalServerErrorException(
          `Failed to upload document to AWS S3 storage: ${msg}`,
        );
      }
    } else {
      url = this.constructS3Url(key);
      this.logger.log(
        `[Dev Mode] AWS S3 document upload simulated: url=${url}`,
      );
    }

    return { url, key };
  }

  private constructS3Url(key: string): string {
    if (this.customDomain && this.customDomain.trim().length > 0) {
      const cleanDomain = this.customDomain.replace(/\/$/, '');
      return `${cleanDomain}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
