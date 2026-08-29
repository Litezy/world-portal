import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { FileUploadDto } from './dto/file-upload.dto';
import { UploadResponseDto } from './dto/upload-response.dto';

@ApiTags('Document Upload')
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Public document upload (PDF, JPEG, PNG, WEBP max 10MB)',
    description:
      'Public endpoint allowing applicants to upload passport scans, photos, or proof of funds directly to configured cloud storage (AWS S3 or Cloudinary) and receive direct file URLs.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully.',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed (file missing, file too large >10MB, or unsupported format).',
  })
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(pdf|jpeg|jpg|png|webp)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    this.logger.log(
      `Public POST /upload called with filename=${file?.originalname}`,
    );
    return this.uploadService.uploadDocument(file);
  }
}
