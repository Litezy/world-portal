import {
  Controller,
  Post,
  UseGuards,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadService } from './upload.service';
import { UploadAccessGuard } from './upload-access.guard';
import { MAX_UPLOAD_BYTES } from './document-type';
import { FileUploadDto } from './dto/file-upload.dto';
import { UploadResponseDto } from './dto/upload-response.dto';

@ApiTags('Document Upload')
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiBearerAuth()
  // The guard runs before the file is read, so a refused caller costs nothing.
  @UseGuards(UploadAccessGuard)
  // Roles for the desk-token path; applicants and the website server are
  // admitted by their own credentials (see UploadAccessGuard).
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  // Multer stops reading at the limit (413) instead of buffering any size.
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  )
  @ApiOperation({
    summary: 'Document upload (PDF, JPEG, PNG, WEBP max 10MB)',
    description:
      'For a signed-in applicant (WorldStreet session token), desk staff, or the E-Embassy website server (x-service-key). The type is read from the file content; the stored name is generated.',
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
      'Validation failed (file missing, or not a PDF, JPEG, PNG or WEBP by content).',
  })
  @ApiResponse({ status: 401, description: 'Not signed in.' })
  @ApiResponse({ status: 413, description: 'File larger than 10MB.' })
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_UPLOAD_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    this.logger.log(`POST /upload: ${file?.size ?? 0} bytes`);
    return this.uploadService.uploadDocument(file);
  }
}
