import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  IStorageProvider,
  StorageObject,
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
    if (this.customDomain?.trim().toLowerCase().startsWith('http://')) {
      this.logger.warn(
        'AWS_S3_CUSTOM_DOMAIN starts with http://; document links are handed out over https instead.',
      );
    }

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

  async uploadFile(object: StorageObject): Promise<StorageUploadResult> {
    const { key } = object;

    let url: string;

    if (this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: object.body,
          ContentType: object.contentType,
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

  /**
   * Always an https URL: applicants send it back on their application, which
   * accepts only https links. A custom domain written with `http://` or with
   * no scheme is served over https.
   */
  private constructS3Url(key: string): string {
    if (this.customDomain && this.customDomain.trim().length > 0) {
      const host = this.customDomain
        .trim()
        .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
        .replace(/\/+$/, '');
      return `https://${host}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
