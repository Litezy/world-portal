import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';

@Module({
  controllers: [UploadController],
  providers: [UploadService, S3StorageProvider, CloudinaryStorageProvider],
  exports: [UploadService],
})
export class UploadModule {}
