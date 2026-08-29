import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import { BadRequestException } from '@nestjs/common';

describe('UploadService', () => {
  let service: UploadService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'STORAGE_PROVIDER') return 's3';
      if (key === 'AWS_REGION') return 'us-east-1';
      if (key === 'AWS_S3_BUCKET_NAME') return 'world-portal-documents';
      return defaultValue;
    }),
  };

  const mockS3Provider = {
    uploadFile: jest.fn().mockResolvedValue({
      url: 'https://world-portal-documents.s3.us-east-1.amazonaws.com/documents/test.pdf',
      key: 'documents/test.pdf',
    }),
  };

  const mockCloudinaryProvider = {
    uploadFile: jest.fn().mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/raw/upload/documents/test.pdf',
      key: 'documents/test.pdf',
    }),
  };

  const mockFile = {
    fieldname: 'file',
    originalname: 'passport-scan.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('mock-file-content'),
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: S3StorageProvider, useValue: mockS3Provider },
        {
          provide: CloudinaryStorageProvider,
          useValue: mockCloudinaryProvider,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should successfully process upload using active S3 provider', async () => {
      const result = await service.uploadDocument(mockFile);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result.originalName).toBe('passport-scan.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.size).toBe(1024);
      expect(mockS3Provider.uploadFile).toHaveBeenCalledWith(mockFile);
    });

    it('should throw BadRequestException if file buffer is missing', async () => {
      const invalidFile = {} as Express.Multer.File;
      await expect(service.uploadDocument(invalidFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
