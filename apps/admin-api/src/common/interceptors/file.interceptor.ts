import { CallHandler,
         ExecutionContext,
         Injectable,
         mixin,
         NestInterceptor,
         Type } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function ProfileImageInterceptor(): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private interceptor = new (FileInterceptor('file', {
      // eslint-disable-next-line sonarjs/content-length
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const PROFILE_UPLOAD_DIR = './uploads/profile';

          mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });
          callback(null, PROFILE_UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          const fallbackExt = extname(file.originalname).toLowerCase();
          const mimeExt = EXTENSION_BY_MIME_TYPE[file.mimetype];

          callback(
            null,
            `${Date.now()}-${randomUUID()}${
              mimeExt || fallbackExt || '.bin'
            }`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new Error('이미지 파일만 업로드 가능'), false);
        }
        callback(null, true);
      },
    }))();

    intercept(context: ExecutionContext, next: CallHandler) {
      return this.interceptor.intercept(context, next);
    }
  }

  return mixin(MixinInterceptor);
}
