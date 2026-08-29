import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UploadController', () => {
  let controller: UploadController;

  const mockUploadResult = {
    url: 'https://world-portal-documents.s3.us-east-1.amazonaws.com/documents/test-key.pdf',
    key: 'documents/test-key.pdf',
    originalName: 'passport.pdf',
    mimeType: 'application/pdf',
    size: 1024,
  };

  const mockUploadService = {
    uploadDocument: jest.fn().mockResolvedValue(mockUploadResult),
  };

  const mockFile = {
    fieldname: 'file',
    originalname: 'passport.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('mock-file-content'),
  } as Express.Multer.File;

  const mockPrismaService = {};
  const mockJwtService = { decode: jest.fn() };
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should delegate upload to UploadService and return S3 response', async () => {
      const result = await controller.uploadDocument(mockFile);
      expect(result).toEqual(mockUploadResult);
      expect(mockUploadService.uploadDocument).toHaveBeenCalledWith(mockFile);
    });
  });
});
