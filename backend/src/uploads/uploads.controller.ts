import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { Request } from 'express';

import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { UPLOADS_DIR } from './uploads.constants';

// Deliberately not using the ambient `Express.Multer.File` type here —
// it depends on @types/multer being resolved globally, which varies
// across environments/package managers. This local shape covers every
// field this controller actually reads.
type UploadedDiskFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
};

// Only what the admin panel actually needs to upload: images for
// covers/thumbnails, and video files for the video library.
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200MB — comfortably covers short video clips.

function safeFilename(originalName: string) {
  const ext = extname(originalName || '').toLowerCase();
  const unique = randomBytes(16).toString('hex');
  return `${Date.now()}-${unique}${ext}`;
}

@Controller('admin/uploads')
export class UploadsController {
  // Admin only — the public site never uploads anything directly.
  @Post()
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, callback) => {
          callback(null, safeFilename(file.originalname));
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Unsupported file type. Please upload a JPEG, PNG, WEBP, GIF image or an MP4, WEBM, MOV video.',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: UploadedDiskFile, @Req() request: Request) {
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }

    return {
      success: true,
      url: this.buildPublicUrl(request, file.filename),
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  private buildPublicUrl(request: Request, filename: string): string {
    const configuredBase = process.env.PUBLIC_BACKEND_URL?.replace(/\/$/, '');
    const base = configuredBase || `${request.protocol}://${request.get('host')}`;
    return `${base}/uploads/${filename}`;
  }
}
