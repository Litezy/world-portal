/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import { randomUUID } from 'crypto';
import {
  IStorageProvider,
  StorageUploadResult,
} from './storage-provider.interface';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);
  private readonly isConfigured: boolean = false;
  private readonly folder: string;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    this.folder = this.configService.get<string>(
      'CLOUDINARY_FOLDER',
      'world-portal-documents',
    );

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(
        `CloudinaryStorageProvider initialized for cloudName=${cloudName}, folder=${this.folder}`,
      );
    } else {
      this.logger.warn(
        'Cloudinary credentials not fully configured in environment. Operating in dev mock Cloudinary mode.',
      );
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<StorageUploadResult> {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `documents/${randomUUID()}-${sanitizedFilename}`;

    if (!this.isConfigured) {
      const mockUrl = `https://res.cloudinary.com/demo/raw/upload/${this.folder}/${key}`;
      this.logger.log(
        `[Dev Mode] Cloudinary document upload simulated: url=${mockUrl}`,
      );
      return { url: mockUrl, key };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: key,
          resource_type: 'auto',
        },
        (error, result: Record<string, any> | undefined) => {
          if (error || !result) {
            const msg = error ? error.message : 'No result from Cloudinary API';
            this.logger.error(`Cloudinary upload_stream failed: ${msg}`);
            return reject(
              new InternalServerErrorException(
                `Failed to upload document to Cloudinary storage: ${msg}`,
              ),
            );
          }
          this.logger.log(
            `Document uploaded to Cloudinary: url=${result.secure_url}`,
          );
          resolve({
            url: result.secure_url,
            key: result.public_id,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }
}
